/**
 * User Storage Service
 * 
 * This module provides abstracted user data persistence across different storage backends.
 * Supports DynamoDB for production and Redis for caching/development.
 */

import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import Redis from 'ioredis'
import { either as E } from 'fp-ts'
import {
  FVSub,
  FVUser,
  FVUserData,
  FVUserProfile,
  userStorageKey,
  userProfileStorageKey,
  encodeSub,
} from '../types'

// ============================================================================
// Interfaces
// ============================================================================

/**
 * User storage interface
 * All storage implementations must implement this interface
 */
export interface UserStorage {
  /**
   * Find a user by their subject identifier
   */
  findUserBySub(sub: FVSub): Promise<FVUser | null>

  /**
   * Find user data (without EOA resolution)
   */
  findUserDataBySub(sub: FVSub): Promise<FVUserData | null>

  /**
   * Create or update user data
   */
  saveUserData(sub: FVSub, data: FVUserData): Promise<void>

  /**
   * Delete user data
   */
  deleteUserData(sub: FVSub): Promise<void>

  /**
   * Find user profile
   */
  findUserProfile(sub: FVSub): Promise<FVUserProfile | null>

  /**
   * Save user profile
   */
  saveUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void>
}

/**
 * Full FV adapter interface for OIDC integration
 */
export interface FVAdapter {
  findOrCreateCustodialAccount(sub: FVSub): Promise<string>
  requestFuturepassCreation(eoa: string): Promise<void>
  findUserBySub(sub: FVSub): Promise<FVUser | null>
  updateUserData(user: FVUser): Promise<void>
  updateUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void>
  findUserProfileBySub(sub: FVSub): Promise<FVUserProfile | null>
}

// ============================================================================
// DynamoDB Implementation
// ============================================================================

export interface DynamoDBStorageConfig {
  /** DynamoDB table name for user data */
  tableName: string
  /** Optional DynamoDB endpoint (for local development) */
  endpoint?: string
  /** AWS region */
  region?: string
}

export class DynamoDBUserStorage implements UserStorage {
  private readonly client: DynamoDBDocument
  private readonly tableName: string

  constructor(config: DynamoDBStorageConfig) {
    this.tableName = config.tableName

    const dynamoClient = new DynamoDBClient({
      endpoint: config.endpoint,
      region: config.region ?? 'ap-southeast-2',
    })

    this.client = DynamoDBDocument.from(dynamoClient)
  }

  /**
   * Create from an existing DynamoDB Document client
   */
  static fromClient(
    client: DynamoDBDocument,
    tableName: string = 'futureverse-user'
  ): DynamoDBUserStorage {
    const instance = Object.create(DynamoDBUserStorage.prototype)
    instance.client = client
    instance.tableName = tableName
    return instance
  }

  async findUserBySub(sub: FVSub): Promise<FVUser | null> {
    const userData = await this.findUserDataBySub(sub)
    if (!userData) return null

    // For self-custody, EOA is derived from the sub
    const eoa = this.deriveEoaFromSub(sub)
    if (!eoa) return null

    return {
      sub: userData.sub,
      eoa,
      hasAcceptedTerms: userData.hasAcceptedTerms,
    }
  }

  async findUserDataBySub(sub: FVSub): Promise<FVUserData | null> {
    const result = await this.client.get({
      TableName: this.tableName,
      Key: { id: userStorageKey(sub) },
    })

    if (!result.Item) return null

    const decoded = FVUserData.decode(result.Item)
    return E.isRight(decoded) ? decoded.right : null
  }

  async saveUserData(sub: FVSub, data: FVUserData): Promise<void> {
    await this.client.put({
      TableName: this.tableName,
      Item: {
        id: userStorageKey(sub),
        ...data,
        updatedAt: Date.now(),
      },
    })
  }

  async deleteUserData(sub: FVSub): Promise<void> {
    await this.client.delete({
      TableName: this.tableName,
      Key: { id: userStorageKey(sub) },
    })
  }

  async findUserProfile(sub: FVSub): Promise<FVUserProfile | null> {
    const result = await this.client.get({
      TableName: this.tableName,
      Key: { id: userProfileStorageKey(sub) },
    })

    if (!result.Item) return null

    const decoded = FVUserProfile.decode(result.Item)
    return E.isRight(decoded) ? decoded.right : null
  }

  async saveUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void> {
    await this.client.put({
      TableName: this.tableName,
      Item: {
        id: userProfileStorageKey(sub),
        ...profile,
        updatedAt: Date.now(),
      },
    })
  }

  private deriveEoaFromSub(sub: FVSub): string | null {
    switch (sub.type) {
      case 'eoa':
        return sub.eoa
      case 'xrpl':
        return sub.eoa
      case 'email':
      case 'idp':
        // Custodial accounts need EOA lookup from foundation API
        return null
    }
  }
}

// ============================================================================
// Redis Implementation (Caching Layer)
// ============================================================================

export interface RedisStorageConfig {
  /** Redis connection URL or client */
  redis: Redis | string
  /** Key prefix */
  prefix?: string
  /** TTL for cached data in seconds (default: 3600 = 1 hour) */
  ttl?: number
}

export class RedisUserStorage implements UserStorage {
  private readonly client: Redis
  private readonly prefix: string
  private readonly ttl: number

  constructor(config: RedisStorageConfig) {
    this.client = typeof config.redis === 'string' 
      ? new Redis(config.redis)
      : config.redis
    this.prefix = config.prefix ?? ''
    this.ttl = config.ttl ?? 3600
  }

  private key(sub: FVSub): string {
    return `${this.prefix}${userStorageKey(sub)}`
  }

  private profileKey(sub: FVSub): string {
    return `${this.prefix}${userProfileStorageKey(sub)}`
  }

  async findUserBySub(sub: FVSub): Promise<FVUser | null> {
    const userData = await this.findUserDataBySub(sub)
    if (!userData) return null

    const eoa = this.deriveEoaFromSub(sub)
    if (!eoa) return null

    return {
      sub: userData.sub,
      eoa,
      hasAcceptedTerms: userData.hasAcceptedTerms,
    }
  }

  async findUserDataBySub(sub: FVSub): Promise<FVUserData | null> {
    const data = await this.client.get(this.key(sub))
    if (!data) return null

    try {
      const parsed = JSON.parse(data)
      const decoded = FVUserData.decode(parsed)
      return E.isRight(decoded) ? decoded.right : null
    } catch {
      return null
    }
  }

  async saveUserData(sub: FVSub, data: FVUserData): Promise<void> {
    await this.client.setex(
      this.key(sub),
      this.ttl,
      JSON.stringify(FVUserData.encode(data))
    )
  }

  async deleteUserData(sub: FVSub): Promise<void> {
    await this.client.del(this.key(sub))
  }

  async findUserProfile(sub: FVSub): Promise<FVUserProfile | null> {
    const data = await this.client.get(this.profileKey(sub))
    if (!data) return null

    try {
      const parsed = JSON.parse(data)
      const decoded = FVUserProfile.decode(parsed)
      return E.isRight(decoded) ? decoded.right : null
    } catch {
      return null
    }
  }

  async saveUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void> {
    await this.client.setex(
      this.profileKey(sub),
      this.ttl,
      JSON.stringify(FVUserProfile.encode(profile))
    )
  }

  private deriveEoaFromSub(sub: FVSub): string | null {
    switch (sub.type) {
      case 'eoa':
        return sub.eoa
      case 'xrpl':
        return sub.eoa
      case 'email':
      case 'idp':
        return null
    }
  }
}

// ============================================================================
// Composite Storage (Cache + Persistent)
// ============================================================================

/**
 * Composite storage that uses Redis as a cache layer over DynamoDB
 */
export class CompositeUserStorage implements UserStorage {
  private readonly cache: RedisUserStorage
  private readonly persistent: DynamoDBUserStorage

  constructor(cache: RedisUserStorage, persistent: DynamoDBUserStorage) {
    this.cache = cache
    this.persistent = persistent
  }

  async findUserBySub(sub: FVSub): Promise<FVUser | null> {
    // Try cache first
    const cached = await this.cache.findUserBySub(sub)
    if (cached) return cached

    // Fall back to persistent storage
    const user = await this.persistent.findUserBySub(sub)
    if (user) {
      // Populate cache
      await this.cache.saveUserData(sub, {
        sub: user.sub,
        hasAcceptedTerms: user.hasAcceptedTerms,
      })
    }

    return user
  }

  async findUserDataBySub(sub: FVSub): Promise<FVUserData | null> {
    const cached = await this.cache.findUserDataBySub(sub)
    if (cached) return cached

    const data = await this.persistent.findUserDataBySub(sub)
    if (data) {
      await this.cache.saveUserData(sub, data)
    }

    return data
  }

  async saveUserData(sub: FVSub, data: FVUserData): Promise<void> {
    // Write to both
    await Promise.all([
      this.persistent.saveUserData(sub, data),
      this.cache.saveUserData(sub, data),
    ])
  }

  async deleteUserData(sub: FVSub): Promise<void> {
    await Promise.all([
      this.persistent.deleteUserData(sub),
      this.cache.deleteUserData(sub),
    ])
  }

  async findUserProfile(sub: FVSub): Promise<FVUserProfile | null> {
    const cached = await this.cache.findUserProfile(sub)
    if (cached) return cached

    const profile = await this.persistent.findUserProfile(sub)
    if (profile) {
      await this.cache.saveUserProfile(sub, profile)
    }

    return profile
  }

  async saveUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void> {
    await Promise.all([
      this.persistent.saveUserProfile(sub, profile),
      this.cache.saveUserProfile(sub, profile),
    ])
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a DynamoDB user storage from environment variables
 */
export function createDynamoDBStorageFromEnv(): DynamoDBUserStorage {
  return new DynamoDBUserStorage({
    tableName: process.env.DYNAMODB_USER_TABLE ?? 'futureverse-user',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    region: process.env.AWS_REGION ?? 'ap-southeast-2',
  })
}

/**
 * Create a Redis user storage from environment variables
 */
export function createRedisStorageFromEnv(): RedisUserStorage {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is required')
  }

  return new RedisUserStorage({
    redis: redisUrl,
    prefix: process.env.REDIS_KEY_PREFIX ?? '',
    ttl: process.env.REDIS_CACHE_TTL ? parseInt(process.env.REDIS_CACHE_TTL, 10) : 3600,
  })
}

/**
 * Create a composite storage (cache + persistent) from environment variables
 */
export function createCompositeStorageFromEnv(): CompositeUserStorage {
  const cache = createRedisStorageFromEnv()
  const persistent = createDynamoDBStorageFromEnv()
  return new CompositeUserStorage(cache, persistent)
}
