import { createHash } from 'crypto'

import { Address } from '@futureverse/experience-sdk'
import * as t from 'io-ts'
import TwilioSDK from 'twilio'
import * as TwilioClient from 'twilio/lib/rest/Twilio'
import { hush } from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { SendOtpResponse } from './IOtpRateLimiter'
import { IOtpStorage } from './IOtpStorage'
import { OtpRateLimiter } from './OtpRateLimiter'

const RATELIMITER_NAMESPACE = 'rateLimiter:sms:otp'
const RATELIMITER_MAX_RETRY = 5
const RATELIMITER_DURATION = 1000 * 60 * 60 * 24

const TWILIO_RATE_LIMIT_UNIQUE_NAME = 'user_ip_address_and_ph_number_hash'
const TWILIO_RATE_LIMIT_INTERVAL_SECONDS = 24 * 60 * 60
const TWILIO_RATE_LIMIT_MAX_PER_INTERVAL = 20

export const VerifyOtpOptions = t.type(
  {
    eoa: Address,
  },
  'VerifyOtpOptions'
)
export type VerifyOtpOptions = t.TypeOf<typeof VerifyOtpOptions>

/**
 * Custom Error which complies with the errors thrown from the Twilio service.
 */
class SmsOtpRateLimiterError extends Error {
  code: number
  constructor(code: number, message: string) {
    super(message)
    this.code = code
    Object.setPrototypeOf(this, SmsOtpRateLimiterError.prototype)
  }
}

export const SmsOtpServiceErrorType = t.type({
  message: t.string,
  code: t.number,
})
export type SmsOtpServiceErrorType = t.TypeOf<typeof SmsOtpServiceErrorType>

export class SmsOtpRateLimiter extends OtpRateLimiter {
  _otpStorage: IOtpStorage
  #_twilioClient: TwilioClient
  #_twilioSmsServiceId: string
  #_twilioRateLimitSid: string | undefined

  constructor(
    otpStorage: IOtpStorage,
    twilioAccountId: string,
    twilioAuthToken: string,
    twilioSmsServiceId: string
  ) {
    super(RATELIMITER_NAMESPACE, RATELIMITER_MAX_RETRY, RATELIMITER_DURATION)
    this._otpStorage = otpStorage
    this.#_twilioClient = TwilioSDK(twilioAccountId, twilioAuthToken)
    this.#_twilioSmsServiceId = twilioSmsServiceId
    void this.#initTwilioRateLimiter()
  }

  async #initTwilioRateLimiter() {
    try {
      identityProviderBackendLogger.info('started: init rate limit for Twilio')
      const allRateLimits = await this.#_twilioClient.verify.v2
        .services(this.#_twilioSmsServiceId)
        .rateLimits.list({ limit: 100 })

      const existingRateLimit = allRateLimits.find(
        (r) => r.uniqueName === TWILIO_RATE_LIMIT_UNIQUE_NAME
      )

      if (existingRateLimit == null) {
        identityProviderBackendLogger.info('Creating rate limit for Twilio')
        const newRateLimit = await this.#_twilioClient.verify.v2
          .services(this.#_twilioSmsServiceId)
          .rateLimits.create({
            description: 'Futurepass SMS 2FA Rate Limit',
            uniqueName: TWILIO_RATE_LIMIT_UNIQUE_NAME,
          })
        this.#_twilioRateLimitSid = newRateLimit.sid
      } else {
        this.#_twilioRateLimitSid = existingRateLimit.sid
      }

      const existingBuckets = await this.#_twilioClient.verify.v2
        .services(this.#_twilioSmsServiceId)
        .rateLimits(this.#_twilioRateLimitSid)
        .buckets.list({ limit: 1 })

      const bucket = existingBuckets.length > 0 ? existingBuckets[0] : null
      if (bucket == null) {
        identityProviderBackendLogger.info(
          'creating rate bucket limit bucket for Twilio'
        )
        await this.#_twilioClient.verify.v2
          .services(this.#_twilioSmsServiceId)
          .rateLimits(this.#_twilioRateLimitSid)
          .buckets.create({
            max: TWILIO_RATE_LIMIT_MAX_PER_INTERVAL,
            interval: TWILIO_RATE_LIMIT_INTERVAL_SECONDS,
          })
      }
      if (
        bucket != null &&
        (bucket.max !== TWILIO_RATE_LIMIT_MAX_PER_INTERVAL ||
          bucket.interval !== TWILIO_RATE_LIMIT_INTERVAL_SECONDS)
      ) {
        identityProviderBackendLogger.info(
          'updating rate limit bucket for Twilio'
        )
        await this.#_twilioClient.verify.v2
          .services(this.#_twilioSmsServiceId)
          .rateLimits(this.#_twilioRateLimitSid)
          .buckets(bucket.sid)
          .update({
            max: TWILIO_RATE_LIMIT_MAX_PER_INTERVAL,
            interval: TWILIO_RATE_LIMIT_INTERVAL_SECONDS,
          })
      }
      identityProviderBackendLogger.info('finished: init rate limit for Twilio')
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to init rate limit for Twilio`,
        4004507,
        {
          error: e,
        }
      )
      // Throwing on purpose - this should not happen and the IDP Backend shouldn't run without the Twilio rate limiter
      throw new Error('Failed to init rate limit for Twilio')
    }
  }

  /**
   * Checks if the phone number is valid using Twilio's lookup: https://www.twilio.com/docs/lookup/v2-api.
   * @param {string} phoneNumber - The user's phone number.
   * @returns {Promise<string | null>} - A valid phone number, null otherwise.
   */
  async #lookupPhoneNumber(phoneNumber: string): Promise<string | null> {
    const requestStartTime = identityProviderBackendLogger.streamApiData(
      `Calling Twilio API to lookup phone number`,
      4004505,
      'GET'
    )

    const lookupResponse = await this.#_twilioClient.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch()

    identityProviderBackendLogger.streamApiData(
      `Called Twilio API to lookup phone number`,
      4004505,
      'GET',
      lookupResponse.valid ? 'valid' : 'invalid',
      requestStartTime
    )

    return lookupResponse.valid ? lookupResponse.phoneNumber : null
  }

  /**
   * Sends an OTP (One-Time Password) to the specified phone number. It uses the internal rate limiter alongside the Twilio one.
   * @param {string} phoneNumber - The phone number to which the OTP will be sent.
   * @param {string | null} clientIp - The client IP address. Required for sending the OTP.
   * @returns {Promise<SendOtpResponse>} A promise that resolves to a response object indicating whether the OTP was successfully sent.
   * @throws {SmsOtpRateLimiterError} Thrown if the phone number is invalid.
   * @throws {Error} Thrown if clientIp is null.
   */
  async sendOtp(
    phoneNumber: string,
    clientIp: string | null
  ): Promise<SendOtpResponse> {
    const validPhoneNumber = await this.#lookupPhoneNumber(phoneNumber)

    if (validPhoneNumber == null) {
      throw new SmsOtpRateLimiterError(400, 'Invalid phone number')
    }

    if (clientIp == null) {
      throw new Error('clientIp is required to send otp')
    }

    const { timestampOfNextRetry, canRetry: canRetrySending } =
      await this.getTimestampOfNextRetry(validPhoneNumber, 'sendOtp')

    if (canRetrySending) {
      // https://www.twilio.com/docs/verify/api/verification
      const requestStartTime = identityProviderBackendLogger.streamApiData(
        `Calling Twilio API to send otp`,
        4004503,
        'POST'
      )
      const smsVerificationResponse = await this.#_twilioClient.verify.v2
        .services(this.#_twilioSmsServiceId)
        .verifications.create({
          to: validPhoneNumber,
          channel: 'sms',
          rateLimits:
            this.#_twilioRateLimitSid != null
              ? {
                  [TWILIO_RATE_LIMIT_UNIQUE_NAME]: `${clientIp}:${createHash(
                    'sha256'
                  )
                    .update(validPhoneNumber)
                    .digest('hex')}`,
                }
              : undefined,
        })

      identityProviderBackendLogger.streamApiData(
        `Calling Twilio API to send otp`,
        4004503,
        'GET',
        smsVerificationResponse.status,
        requestStartTime
      )

      const newlySetTimestampOfNextRetry = await this.setTimestampOfNextRetry(
        validPhoneNumber,
        'sendOtp'
      )

      if (smsVerificationResponse.status !== 'pending') {
        return {
          isOtpGenerated: false,
          timestampOfNextRetry: newlySetTimestampOfNextRetry,
        }
      }

      return {
        isOtpGenerated: true,
        timestampOfNextRetry: newlySetTimestampOfNextRetry,
      }
    }

    return {
      isOtpGenerated: false,
      timestampOfNextRetry,
    }
  }

  /**
   * Verifies the OTP (One-Time Password) sent to the specified phone number.
   * There is no internal rate limiting on verification, only the Twilio Rate Limiter is used.
   * @param {string} phoneNumber - The phone number for which the OTP is being verified.
   * @param {string} code - The OTP code to be verified.
   * @param {unknown} [options] - Additional options for OTP verification. (Optional)
   * @returns {Promise<string | null>} A promise that resolves to a string or null. Returns a string representing the verification result if successful, or null if the phone number is invalid or the OTP verification fails.
   */
  async verifyOtp(
    phoneNumber: string,
    code: string,
    options?: unknown
  ): Promise<string | null> {
    const validPhoneNumber = await this.#lookupPhoneNumber(phoneNumber)

    if (validPhoneNumber == null) {
      return null
    }

    const requestStartTime = identityProviderBackendLogger.streamApiData(
      `Calling Twilio API to verify otp`,
      4004504,
      'GET'
    )
    const smsVerificationCheckResponse = await this.#_twilioClient.verify.v2
      .services(this.#_twilioSmsServiceId)
      .verificationChecks.create({ to: validPhoneNumber, code })

    identityProviderBackendLogger.streamApiData(
      `Calling Twilio API to verify otp`,
      4004504,
      'GET',
      smsVerificationCheckResponse.status,
      requestStartTime
    )

    if (smsVerificationCheckResponse.status !== 'approved') {
      return null
    }

    const verifyOtpOption = hush(VerifyOtpOptions.decode(options))

    if (verifyOtpOption != null) {
      await this._otpStorage.setOtp(
        verifyOtpOption.eoa.toLowerCase(),
        JSON.stringify({
          verifiedSmsOTPSid: smsVerificationCheckResponse.sid,
        }),
        'sms'
      )
    }

    /*
     * On successful verification we clear the remaining timestamp
     * to ensure that if the user logs out and wants to log back in,
     * they don't need to wait.
     */
    await this.clearTimestampOfNextRetry(validPhoneNumber, 'sendOtp')

    return smsVerificationCheckResponse.sid
  }

  /**
   * Checks if the OTP (One-Time Password) is verified.
   * @param {unknown} [options] - Additional options for OTP verification. (Optional)
   * @returns {Promise<boolean>} A promise that resolves to a boolean value. Returns true if the OTP is verified, or false otherwise. If no options are provided, it returns true by default.
   */
  async isOtpVerified(options?: unknown): Promise<boolean> {
    const verifyOtpOption = hush(VerifyOtpOptions.decode(options))

    if (verifyOtpOption != null) {
      const verifiedOtp = await this._otpStorage.getOtp(
        verifyOtpOption.eoa.toLowerCase(),
        'sms'
      )
      return verifiedOtp != null
    }
    return true
  }
}
