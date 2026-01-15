import Redis from 'ioredis'
import { isEmpty } from 'lodash'
import { Adapter, AdapterPayload } from 'oidc-provider'

const grantable = new Set([
  'AccessToken',
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
])

const consumable = new Set([
  'AuthorizationCode',
  'RefreshToken',
  'DeviceCode',
  'BackchannelAuthenticationRequest',
])

function grantKeyFor(id: string) {
  return `grant:${id}`
}

function userCodeKeyFor(userCode: string) {
  return `userCode:${userCode}`
}

function uidKeyFor(uid: string) {
  return `uid:${uid}`
}

class RedisAdapter implements Adapter {
  private readonly name: string
  private readonly client: Redis
  constructor(name: string, client: Redis) {
    this.name = name
    this.client = client
  }

  async upsert(
    id: string,
    payload: AdapterPayload,
    expiresIn: number
  ): Promise<void> {
    const key = this.key(id)

    const multi = this.client.multi()
    if (consumable.has(this.name)) {
      multi.hmset(key, { payload: JSON.stringify(payload) })
    } else {
      multi.set(key, JSON.stringify(payload))
    }

    if (expiresIn) {
      multi.expire(key, expiresIn)
    }

    if (grantable.has(this.name) && payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId)
      multi.rpush(grantKey, key)
      // if you're seeing grant key lists growing out of acceptable proportions consider using LTRIM
      // here to trim the list to an appropriate length
      const ttl = await this.client.ttl(grantKey)
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn)
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode)
      multi.set(userCodeKey, id)
      multi.expire(userCodeKey, expiresIn)
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid)
      multi.set(uidKey, id)
      multi.expire(uidKey, expiresIn)
    }

    await multi.exec()
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const data = consumable.has(this.name)
      ? await this.client.hgetall(this.key(id))
      : await this.client.get(this.key(id))

    if (isEmpty(data) || data === null) {
      return undefined
    }

    if (typeof data === 'string') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we know the data is AdapterPayload
      return JSON.parse(data)
    }
    const { payload, ...rest } = data

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- we know the data is AdapterPayload
    return {
      ...rest,
      ...JSON.parse(payload),
    }
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const id = await this.client.get(uidKeyFor(uid))
    if (!id) return
    return this.find(id)
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const id = await this.client.get(userCodeKeyFor(userCode))
    if (!id) return
    return this.find(id)
  }

  async destroy(id: string): Promise<void> {
    const key = this.key(id)
    await this.client.del(key)
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const multi = this.client.multi()
    const tokens = await this.client.lrange(grantKeyFor(grantId), 0, -1)
    tokens.forEach((token) => multi.del(token))
    multi.del(grantKeyFor(grantId))
    await multi.exec()
  }

  async consume(id: string) {
    await this.client.hset(
      this.key(id),
      'consumed',
      Math.floor(Date.now() / 1000)
    )
  }

  key(id: string) {
    return `${this.name}:${id}`
  }
}

export default RedisAdapter
