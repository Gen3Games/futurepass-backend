import { DynamoDB } from 'aws-sdk'
import { Adapter, AdapterPayload } from 'oidc-provider'

export class DynamoDBAdapter implements Adapter {
  private readonly name: string
  private readonly dynamoClient: DynamoDB.DocumentClient
  private readonly oauthTableName: string

  constructor(
    name: string,
    dynamoClient: DynamoDB.DocumentClient,
    oauthTableName: string
  ) {
    this.name = name
    this.dynamoClient = dynamoClient
    this.oauthTableName = oauthTableName
  }

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn?: number
  ): Promise<void> {
    // DynamoDB can recognise TTL values only in seconds
    const expiresAt = expiresIn
      ? Math.floor(Date.now() / 1000) + expiresIn
      : null

    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.oauthTableName,
      Key: { modelId: this.name + '-' + id },
      UpdateExpression:
        'SET payload = :payload' +
        (expiresAt ? ', expiresAt = :expiresAt' : '') +
        (payload.userCode ? ', userCode = :userCode' : '') +
        (payload.uid ? ', uid = :uid' : '') +
        (payload.grantId ? ', grantId = :grantId' : ''),
      ExpressionAttributeValues: {
        ':payload': payload,
        ...(expiresAt ? { ':expiresAt': expiresAt } : {}),
        ...(payload.userCode ? { ':userCode': payload.userCode } : {}),
        ...(payload.uid ? { ':uid': payload.uid } : {}),
        ...(payload.grantId ? { ':grantId': payload.grantId } : {}),
      },
    }

    await this.dynamoClient.update(params).promise()
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const params: DynamoDB.DocumentClient.GetItemInput = {
      TableName: this.oauthTableName,
      Key: { modelId: this.name + '-' + id },
      ProjectionExpression: 'payload, expiresAt',
      ConsistentRead: true,
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- this adapter is coming from https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/example/adapters/contributed/dynamodb-gsi.ts*/
    const result = <
      { payload: AdapterPayload; expiresAt?: number } | undefined
    >(await this.dynamoClient.get(params).promise()).Item

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || (result.expiresAt && Date.now() > result.expiresAt * 1000)) {
      return undefined
    }

    return result.payload
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.oauthTableName,
      IndexName: 'userCodeIndex',
      KeyConditionExpression: 'userCode = :userCode',
      ExpressionAttributeValues: {
        ':userCode': userCode,
      },
      Limit: 1,
      ProjectionExpression: 'payload, expiresAt',
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- this adapter is coming from https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/example/adapters/contributed/dynamodb-gsi.ts*/
    const result = <
      { payload: AdapterPayload; expiresAt?: number } | undefined
    >(await this.dynamoClient.query(params).promise()).Items?.[0]

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || (result.expiresAt && Date.now() > result.expiresAt * 1000)) {
      return undefined
    }

    return result.payload
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: this.oauthTableName,
      IndexName: 'uidIndex',
      KeyConditionExpression: 'uid = :uid',
      ExpressionAttributeValues: {
        ':uid': uid,
      },
      Limit: 1,
      ProjectionExpression: 'payload, expiresAt',
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- this adapter is coming from https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/example/adapters/contributed/dynamodb-gsi.ts*/
    const result = <
      { payload: AdapterPayload; expiresAt?: number } | undefined
    >(await this.dynamoClient.query(params).promise()).Items?.[0]

    // DynamoDB can take upto 48 hours to drop expired items, so a check is required
    if (!result || (result.expiresAt && Date.now() > result.expiresAt * 1000)) {
      return undefined
    }

    return result.payload
  }

  async consume(id: string): Promise<void> {
    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: this.oauthTableName,
      Key: { modelId: this.name + '-' + id },
      UpdateExpression: 'SET #payload.#consumed = :value',
      ExpressionAttributeNames: {
        '#payload': 'payload',
        '#consumed': 'consumed',
      },
      ExpressionAttributeValues: {
        ':value': Math.floor(Date.now() / 1000),
      },
      ConditionExpression: 'attribute_exists(modelId)',
    }

    await this.dynamoClient.update(params).promise()
  }

  async destroy(id: string): Promise<void> {
    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: this.oauthTableName,
      Key: { modelId: this.name + '-' + id },
    }

    await this.dynamoClient.delete(params).promise()
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    let ExclusiveStartKey: DynamoDB.DocumentClient.Key | undefined = undefined

    do {
      const params: DynamoDB.DocumentClient.QueryInput = {
        TableName: this.oauthTableName,
        IndexName: 'grantIdIndex',
        KeyConditionExpression: 'grantId = :grantId',
        ExpressionAttributeValues: {
          ':grantId': grantId,
        },
        ProjectionExpression: 'modelId',
        Limit: 25,
        ExclusiveStartKey,
      }

      const queryResult = await this.dynamoClient.query(params).promise()
      ExclusiveStartKey = queryResult.LastEvaluatedKey

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- this adapter is coming from https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/example/adapters/contributed/dynamodb-gsi.ts*/
      const items = <{ modelId: string }[] | undefined>queryResult.Items

      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- this adapter is coming from https://github.com/panva/node-oidc-provider/blob/cf2069cbb31a6a855876e95157372d25dde2511c/example/adapters/contributed/dynamodb-gsi.ts*/
      if (!items || !items.length) {
        return
      }

      const batchWriteParams: DynamoDB.DocumentClient.BatchWriteItemInput = {
        RequestItems: {
          [this.oauthTableName]:
            items.reduce<DynamoDB.DocumentClient.WriteRequests>(
              (acc, item) => [
                ...acc,
                { DeleteRequest: { Key: { modelId: item.modelId } } },
              ],
              []
            ),
        },
      }

      await this.dynamoClient.batchWrite(batchWriteParams).promise()
    } while (ExclusiveStartKey)
  }
}
