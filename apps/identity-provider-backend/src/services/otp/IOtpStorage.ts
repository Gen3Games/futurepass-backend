import Redis from 'ioredis'

type OtpType = 'email' | 'sms'

export interface IOtpStorage {
  setOtp(key: string, otp: string, type: OtpType): Promise<void>
  getOtp(key: string, type: OtpType): Promise<string | null>
  deleteOtp(key: string, type: OtpType): Promise<void>
}

export const OTP_EXPIRES_IN = 5 * 60 // 5 minutes

export class RedisOtpStorage implements IOtpStorage {
  readonly #redisClient: Redis
  constructor(redisClient: Redis) {
    this.#redisClient = redisClient
  }

  #key(key: string, type: OtpType) {
    return `otp:${type}:${key}`
  }

  public async setOtp(key: string, otp: string, type: OtpType) {
    await this.#redisClient.set(this.#key(key, type), otp, 'EX', OTP_EXPIRES_IN)
  }

  public async getOtp(key: string, type: OtpType): Promise<string | null> {
    return await this.#redisClient.get(this.#key(key, type))
  }

  public async deleteOtp(key: string, type: OtpType): Promise<void> {
    await this.#redisClient.del(this.#key(key, type))
  }
}

export class MemoryOtpStorage implements IOtpStorage {
  readonly #store: Map<string, string> = new Map()

  public async setOtp(email: string, otp: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.#store.has(email)) {
        this.#store.set(email, otp)

        setTimeout(() => {
          this.#store.delete(email)
          resolve()
        }, OTP_EXPIRES_IN * 1000)
      } else {
        resolve()
      }
    })
  }

  public async getOtp(email: string): Promise<string | null> {
    return Promise.resolve(this.#store.get(email) ?? null)
  }

  public async deleteOtp(email: string): Promise<void> {
    this.#store.delete(email)
    return Promise.resolve()
  }
}
