import { createHash } from 'crypto'

import RateLimiter from 'async-ratelimiter'
import { Redis } from 'ioredis'
import { config as C } from '../../serverConfig'
import {
  GenerateOtpResponse,
  IOtpRateLimiter,
  SendOtpResponse,
  VerifyOtpResponse,
} from './IOtpRateLimiter'
import { IOtpStorage } from './IOtpStorage'

// These can be overriden in the constructor if needed.
const DEFAULT_SEND_RETRY_TIMEOUTS = Object.freeze({
  1: 60,
  2: 90,
  3: 120,
  4: 300,
  5: 600,
  6: 60 * 60 * 24,
} as const)

const DEFAULT_VERIFY_RETRY_TIMEOUTS = Object.freeze({
  1: 0,
  2: 15,
  3: 30,
  4: 60,
  5: 300,
  6: 60 * 60 * 24,
} as const)

const TIMESTAMP_OF_NEXT_RETRY_REDIS_KEY = 'otp:timestampOfNextRetry'

type Action = 'sendOtp' | 'verifyOtp'

export abstract class OtpRateLimiter implements IOtpRateLimiter {
  abstract _otpStorage: IOtpStorage

  readonly #_redisClient: Redis
  readonly #_rateLimiter: RateLimiter
  readonly #rateLimiterNamespace: string
  readonly #sendRetryTimeouts: Record<number, number>
  readonly #verifyRetryTimeouts: Record<number, number>

  constructor(
    namespace: string,
    maxRetry: number,
    duration: number,
    customSendRetryTimeouts?: Record<number, number>,
    customVerifyRetryTimeouts?: Record<number, number>
  ) {
    this.#_redisClient = C.redisClient
    this.#_rateLimiter = new RateLimiter({
      db: C.redisClient,
      max: maxRetry,
      duration,
      namespace,
    })
    this.#rateLimiterNamespace = namespace
    this.#sendRetryTimeouts =
      customSendRetryTimeouts ?? DEFAULT_SEND_RETRY_TIMEOUTS
    this.#verifyRetryTimeouts =
      customVerifyRetryTimeouts ?? DEFAULT_VERIFY_RETRY_TIMEOUTS
  }

  abstract sendOtp(
    sendOtpTo: string,
    clientIp: string | null
  ): Promise<SendOtpResponse | GenerateOtpResponse>
  abstract verifyOtp(
    sendOtpTo: string,
    otp: string,
    options?: unknown
  ): Promise<string | null | VerifyOtpResponse>

  /**
   * Hashes the identifier with action to obscure Redis keys.
   */
  #hashIdentifier(identifier: string, action?: string): string {
    return createHash('sha256')
      .update(action != null ? `${identifier}:${action}` : identifier)
      .digest('hex')
  }

  /**
   * Retrieves the retry timeout from the configured mapping.
   * @param retryTimeoutKey if out of bounds, the function will return the value of largest key
   * @param action the type of action (e.g. sendOtp or verifyOtp)
   */
  protected getRetryTimeout(retryTimeoutKey: number, action: Action): number {
    const timeoutsMapping =
      action === 'sendOtp' ? this.#sendRetryTimeouts : this.#verifyRetryTimeouts

    const maxMappingKey = parseInt(
      Object.keys(timeoutsMapping).sort().slice(-1).at(0) ?? '6'
    )

    if (retryTimeoutKey > maxMappingKey || retryTimeoutKey === 0) {
      return timeoutsMapping[maxMappingKey]
    }

    return timeoutsMapping[retryTimeoutKey]
  }

  /**
   * Sets the timestamp of the next retry. Use this after sending a code.
   * @param identifier of the record (email or phone number)
   * @param action the type of action (sendOtp or verifyOtp)
   * @returns the newly set timestamp of the next retry.
   */
  protected async setTimestampOfNextRetry(
    identifier: string,
    action: Action
  ): Promise<number> {
    const hashedIdentifier = this.#hashIdentifier(identifier, action)

    const rateLimit = await this.#_rateLimiter.get({
      id: hashedIdentifier,
    })

    const nextRetryTimeout = this.getRetryTimeout(
      rateLimit.remaining > 0 ? rateLimit.total - rateLimit.remaining + 1 : 0,
      action
    )

    const timestampOfNextRetry = Date.now() + nextRetryTimeout * 1000

    /**
     * No need to clear the previous timestamp first as the keys in Redis are overwritten on new set.
     */
    await this.#_redisClient.hset(
      TIMESTAMP_OF_NEXT_RETRY_REDIS_KEY,
      hashedIdentifier,
      timestampOfNextRetry
    )

    return timestampOfNextRetry
  }

  /**
   * Use this to retrieve the currently set timestamp of the next retry.
   * @param identifier of the record (email or phone number)
   * @param action the type of action (sendOtp or verifyOtp)
   * @returns the newly set timestamp of the next retry and a canRetry flag indicating whether a new code can be sent.
   */
  protected async getTimestampOfNextRetry(
    identifier: string,
    action: Action
  ): Promise<{ timestampOfNextRetry: number; canRetry: boolean }> {
    const hashedIdentifier = this.#hashIdentifier(identifier, action)
    const timestampOfNextRetry = parseInt(
      (await this.#_redisClient.hget(
        TIMESTAMP_OF_NEXT_RETRY_REDIS_KEY,
        hashedIdentifier
      )) ?? '0'
    )

    return {
      timestampOfNextRetry,
      canRetry: Date.now() >= timestampOfNextRetry,
    }
  }

  /**
   * Clears the OTP timestamp and rate limiter entry of the next retry.
   * @param identifier of the record (email or phone number)
   * @param action the type of action (sendOtp or verifyOtp)
   */
  protected async clearTimestampOfNextRetry(
    identifier: string,
    action: Action
  ) {
    const hashedIdentifier = this.#hashIdentifier(identifier, action)
    await this.#_redisClient.hdel(
      TIMESTAMP_OF_NEXT_RETRY_REDIS_KEY,
      hashedIdentifier
    )

    await this.#_redisClient.del(
      `${this.#rateLimiterNamespace}:${hashedIdentifier}`
    )
  }
}
