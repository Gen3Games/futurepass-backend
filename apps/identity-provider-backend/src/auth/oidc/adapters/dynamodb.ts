/**
 * DynamoDB Adapter for OIDC Provider
 * 
 * This module provides a DynamoDB-based storage adapter for node-oidc-provider.
 * It stores sessions, authorization codes, tokens, and other OIDC entities.
 * 
 * Based on the existing DynamoDBAdapter from identity-provider-backend.
 */

import type { Adapter, AdapterPayload } from 'oidc-provider'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

// ============================================================================
// Types
// ============================================================================

export interface DynamoDBAdapterConfig {
  /** DynamoDB table name */
  tableName: string
  /** Optional DynamoDB endpoint (for local development) */
  endpoint?: string
  /** AWS region */
  region?: string
}

interface StoredPayload {
  modelId: string
  payload: AdapterPayload
  expiresAt?: number
  userCode?: string
  uid?: string
  grantId?: string
}

// ============================================================================
// DynamoDB OIDC Adapter
// ============================================================================

/**
 * DynamoDB adapter for node-oidc-provider
 * 
 * Stores OIDC entities (sessions, tokens, etc.) in DynamoDB with TTL support.
 */
export class DynamoDBOIDCAdapter implements Adapter {
  private readonly client: DynamoDBDocument
  private readonly tableName: string
  private readonly name: string

  constructor(name: string, config: DynamoDBAdapterConfig, client?: DynamoDBDocument) {
    this.name = name
    this.tableName = config.tableName

    if (client) {
      this.client = client
    } else {
      const dynamoClient = new DynamoDBClient({
        endpoint: config.endpoint,
        region: config.region ?? 'ap-southeast-2',
      })
      this.client = DynamoDBDocument.from(dynamoClient)
    }
  }

  /**
   * Generate the primary key for an entity
   */
  private key(id: string): string {
    return `${this.name}:${id}`
  }

  /**
   * Store an entity (upsert)
   */
  async upsert(id: string, payload: AdapterPayload, expiresIn: number): Promise<void> {
    const key = this.key(id)
    
    const item: StoredPayload = {
      modelId: key,
      payload,
    }

    // Set TTL if expiration is provided
    if (expiresIn) {
      item.expiresAt = Math.floor(Date.now() / 1000) + expiresIn
    }

    // Add secondary indices for lookups
    if (payload.userCode) {
      item.userCode = payload.userCode
    }
    if (payload.uid) {
      item.uid = payload.uid
    }
    if (payload.grantId) {
      item.grantId = payload.grantId
    }

    await this.client.put({
      TableName: this.tableName,
      Item: item,
    })
  }

  /**
   * Find an entity by ID
   */
  async find(id: string): Promise<AdapterPayload | undefined> {
    const result = await this.client.get({
      TableName: this.tableName,
      Key: { modelId: this.key(id) },
    })

    if (!result.Item) return undefined

    const stored = result.Item as StoredPayload

    // Check if expired
    if (stored.expiresAt && stored.expiresAt < Math.floor(Date.now() / 1000)) {
      return undefined
    }

    return stored.payload
  }

  /**
   * Find by user code (for device flow)
   */
  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const result = await this.client.query({
      TableName: this.tableName,
      IndexName: 'userCode-index',
      KeyConditionExpression: 'userCode = :userCode',
      ExpressionAttributeValues: {
        ':userCode': userCode,
      },
      Limit: 1,
    })

    if (!result.Items || result.Items.length === 0) return undefined

    const stored = result.Items[0] as StoredPayload

    // Check if expired
    if (stored.expiresAt && stored.expiresAt < Math.floor(Date.now() / 1000)) {
      return undefined
    }

    return stored.payload
  }

  /**
   * Find by UID (for interactions)
   */
  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const result = await this.client.query({
      TableName: this.tableName,
      IndexName: 'uid-index',
      KeyConditionExpression: 'uid = :uid',
      ExpressionAttributeValues: {
        ':uid': uid,
      },
      Limit: 1,
    })

    if (!result.Items || result.Items.length === 0) return undefined

    const stored = result.Items[0] as StoredPayload

    // Check if expired
    if (stored.expiresAt && stored.expiresAt < Math.floor(Date.now() / 1000)) {
      return undefined
    }

    return stored.payload
  }

  /**
   * Mark an entity as consumed (e.g., authorization code)
   */
  async consume(id: string): Promise<void> {
    await this.client.update({
      TableName: this.tableName,
      Key: { modelId: this.key(id) },
      UpdateExpression: 'SET payload.consumed = :consumed',
      ExpressionAttributeValues: {
        ':consumed': Math.floor(Date.now() / 1000),
      },
    })
  }

  /**
   * Delete an entity
   */
  async destroy(id: string): Promise<void> {
    await this.client.delete({
      TableName: this.tableName,
      Key: { modelId: this.key(id) },
    })
  }

  /**
   * Revoke all tokens for a grant
   */
  async revokeByGrantId(grantId: string): Promise<void> {
    // Query all items with this grantId
    const result = await this.client.query({
      TableName: this.tableName,
      IndexName: 'grantId-index',
      KeyConditionExpression: 'grantId = :grantId',
      ExpressionAttributeValues: {
        ':grantId': grantId,
      },
    })

    if (!result.Items || result.Items.length === 0) return

    // Delete all found items
    const deletePromises = result.Items.map((item) =>
      this.client.delete({
        TableName: this.tableName,
        Key: { modelId: (item as StoredPayload).modelId },
      })
    )

    await Promise.all(deletePromises)
  }
}

// ============================================================================
// Adapter Factory
// ============================================================================

/**
 * Creates an adapter factory function for node-oidc-provider
 * 
 * @param config - DynamoDB configuration
 * @returns Adapter factory function
 */
export function createDynamoDBAdapterFactory(
  config: DynamoDBAdapterConfig
): (name: string) => Adapter {
  // Create shared DynamoDB client
  const dynamoClient = new DynamoDBClient({
    endpoint: config.endpoint,
    region: config.region ?? 'ap-southeast-2',
  })
  const client = DynamoDBDocument.from(dynamoClient)

  return (name: string) => new DynamoDBOIDCAdapter(name, config, client)
}

/**
 * Creates an adapter factory from environment variables
 */
export function createDynamoDBAdapterFactoryFromEnv(): (name: string) => Adapter {
  return createDynamoDBAdapterFactory({
    tableName: process.env.DYNAMODB_OIDC_TABLE ?? 'oidc-sessions',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION ?? 'ap-southeast-2',
  })
}

// ============================================================================
// DynamoDB Table Definition (for Terraform/CDK)
// ============================================================================

/**
 * CloudFormation/Terraform schema for the OIDC sessions table
 * 
 * ```hcl
 * resource "aws_dynamodb_table" "oidc_sessions" {
 *   name         = "oidc-sessions"
 *   billing_mode = "PAY_PER_REQUEST"
 *   hash_key     = "modelId"
 * 
 *   attribute {
 *     name = "modelId"
 *     type = "S"
 *   }
 * 
 *   attribute {
 *     name = "userCode"
 *     type = "S"
 *   }
 * 
 *   attribute {
 *     name = "uid"
 *     type = "S"
 *   }
 * 
 *   attribute {
 *     name = "grantId"
 *     type = "S"
 *   }
 * 
 *   global_secondary_index {
 *     name            = "userCode-index"
 *     hash_key        = "userCode"
 *     projection_type = "ALL"
 *   }
 * 
 *   global_secondary_index {
 *     name            = "uid-index"
 *     hash_key        = "uid"
 *     projection_type = "ALL"
 *   }
 * 
 *   global_secondary_index {
 *     name            = "grantId-index"
 *     hash_key        = "grantId"
 *     projection_type = "ALL"
 *   }
 * 
 *   ttl {
 *     attribute_name = "expiresAt"
 *     enabled        = true
 *   }
 * }
 * ```
 */
export const DYNAMODB_TABLE_SCHEMA = {
  tableName: 'oidc-sessions',
  keyAttributes: {
    modelId: 'S',
  },
  gsiAttributes: {
    userCode: 'S',
    uid: 'S',
    grantId: 'S',
  },
  ttlAttribute: 'expiresAt',
}
