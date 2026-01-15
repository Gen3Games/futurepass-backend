import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import * as E from 'fp-ts/Either'
import Redis from 'ioredis'
import { FVSub, FVUserData, FVUserProfile, UserDB } from './types'

abstract class FVUserStorage implements UserDB {
  protected key(sub: FVSub) {
    return `USER:${FVSub.encode(sub).toLowerCase()}`
  }
  protected profileKey(sub: FVSub) {
    return `USER_PROFILE:${FVSub.encode(sub).toLowerCase()}`
  }

  abstract updateUserData(sub: FVSub, user: FVUserData): Promise<void> | void
  abstract findUserDataBySub(
    sub: FVSub
  ): Promise<FVUserData | null> | FVUserData | null
  abstract removeUserDataBySub(sub: FVSub): Promise<void> | void
  abstract updateUserProfile(
    sub: FVSub,
    profile: FVUserProfile
  ): Promise<void> | void
  abstract findUserProfileBySub(
    sub: FVSub
  ): Promise<FVUserProfile | null> | FVUserProfile | null
}

export class RedisFVUserStorage extends FVUserStorage {
  private readonly redisClient: Redis
  constructor(redisClient: Redis) {
    super()
    this.redisClient = redisClient
  }

  public async updateUserData(sub: FVSub, user: FVUserData): Promise<void> {
    await this.redisClient.set(
      this.key(user.sub),
      JSON.stringify(FVUserData.encode(user))
    )
  }
  public async findUserDataBySub(sub: FVSub): Promise<FVUserData | null> {
    const user = (await this.redisClient.get(this.key(sub))) ?? null
    if (user == null) {
      return null
    }
    const userR = FVUserData.decode(JSON.parse(user))
    if (E.isRight(userR)) {
      return userR.right
    }
    return null
  }
  public async removeUserDataBySub(sub: FVSub): Promise<void> {
    await this.redisClient.del(this.key(sub))
  }

  public async updateUserProfile(
    sub: FVSub,
    profile: FVUserProfile
  ): Promise<void> {
    await this.redisClient.set(
      this.profileKey(sub),
      JSON.stringify(FVUserProfile.encode(profile))
    )
  }
  public async findUserProfileBySub(sub: FVSub): Promise<FVUserProfile | null> {
    const user = (await this.redisClient.get(this.profileKey(sub))) ?? null
    if (user == null) {
      return null
    }
    const userR = FVUserProfile.decode(JSON.parse(user))
    if (E.isRight(userR)) {
      return userR.right
    }
    return null
  }
}

export class DynamodbFVUserStorage extends FVUserStorage {
  private readonly futureverseUserTableName = 'futureverse-user'
  private readonly dynamodbClient: DynamoDBDocument
  constructor(dynamodbClient: DynamoDBDocument) {
    super()
    this.dynamodbClient = dynamodbClient
  }

  public async updateUserData(sub: FVSub, user: FVUserData): Promise<void> {
    await this.dynamodbClient.put({
      TableName: this.futureverseUserTableName,
      Item: {
        id: this.key(sub),
        ...user,
      },
    })
  }
  public async findUserDataBySub(sub: FVSub): Promise<FVUserData | null> {
    const user = await this.dynamodbClient.get({
      TableName: this.futureverseUserTableName,
      Key: {
        id: this.key(sub),
      },
    })

    if (!user.Item) {
      return null
    }
    const userR = FVUserData.decode(user.Item)
    if (E.isRight(userR)) {
      return userR.right
    }

    return null
  }
  public async removeUserDataBySub(sub: FVSub): Promise<void> {
    await this.dynamodbClient.delete({
      TableName: this.futureverseUserTableName,
      Key: {
        id: this.key(sub),
      },
    })
  }

  public async updateUserProfile(
    sub: FVSub,
    profile: FVUserProfile
  ): Promise<void> {
    await this.dynamodbClient.put({
      TableName: this.futureverseUserTableName,
      Item: {
        id: this.profileKey(sub),
        ...profile,
      },
    })
  }
  public async findUserProfileBySub(sub: FVSub): Promise<FVUserProfile | null> {
    const user = await this.dynamodbClient.get({
      TableName: this.futureverseUserTableName,
      Key: {
        id: this.profileKey(sub),
      },
    })

    if (!user.Item) {
      return null
    }
    const userR = FVUserProfile.decode(user.Item)
    if (E.isRight(userR)) {
      return userR.right
    }

    return null
  }
}

export class MemoryFVUserStorage extends FVUserStorage {
  private _users: Record<string, FVUserData> = {}
  private _profile: Record<string, FVUserProfile> = {}

  public updateUserData(sub: FVSub, user: FVUserData): void {
    this._users[FVSub.encode(sub)] = user
  }
  public findUserDataBySub(sub: FVSub): FVUserData | null {
    return this._users[FVSub.encode(sub)]
  }

  public removeUserDataBySub(sub: FVSub): void {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- it is safe to delete since we know FVSub.encode(sub) is the key of this._users
    delete this._users[FVSub.encode(sub)]
  }

  public updateUserProfile(sub: FVSub, profile: FVUserProfile): void {
    this._profile[FVSub.encode(sub)] = profile
  }
  public findUserProfileBySub(sub: FVSub): FVUserProfile | null {
    return this._profile[FVSub.encode(sub)]
  }
}
