import { GenerateOtpResponse, VerifyOtpResponse } from './IOtpRateLimiter'
import { IOtpStorage } from './IOtpStorage'
import { OtpRateLimiter } from './OtpRateLimiter'

const RATE_LIMITER_NAMESPACE = 'rateLimiter:email:otp'
const RATE_LIMITER_MAX_RETRY = 5
const RATE_LIMITER_DURATION = 1000 * 60 * 60 * 24

export class EmailOtpRateLimiter extends OtpRateLimiter {
  readonly _otpStorage: IOtpStorage

  constructor(otpStorage: IOtpStorage) {
    super(RATE_LIMITER_NAMESPACE, RATE_LIMITER_MAX_RETRY, RATE_LIMITER_DURATION)
    this._otpStorage = otpStorage
  }

  /**
   *
   * Generates the OTP but doesn't send it to the user. The sending is handled by
   * the LoginEmailRouterController. The internal rate limiting is used.
   *
   * We use this name because EmailOtpRateLimiter extends OtpRateLimiter. OtpRateLimiter is an interface and
   * defines all the names of the abstract methods. From the end developer perspective, this is what this
   * function does and the rest are implementation details.
   *
   * @param {string} email - The email to send the OTP to.
   * @returns {Promise<GenerateOtpResponse>} - Generated OTP and the timestampOfNextRetry.
   *
   */
  async sendOtp(email: string): Promise<GenerateOtpResponse> {
    const { timestampOfNextRetry, canRetry: canRetrySending } =
      await this.getTimestampOfNextRetry(email, 'sendOtp')

    if (canRetrySending) {
      const otp = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, '0')
      await this._otpStorage.setOtp(email, otp, 'email')
      const newlySetTimestampOfNextRetry = await this.setTimestampOfNextRetry(
        email,
        'sendOtp'
      )

      // A new code warrants new retries, so we clear the old timeout
      await this.clearTimestampOfNextRetry(email, 'verifyOtp')

      return {
        otp,
        timestampOfNextRetry: newlySetTimestampOfNextRetry,
      }
    }

    return {
      otp: null,
      timestampOfNextRetry,
    }
  }

  /**
   * Verifies the OTP (One-Time Password) provided for a given email address. The internal rate limiting is used.
   * @param {string} email - The email address for which the OTP is being verified.
   * @param {string} otp - The OTP to be verified.
   * @returns {Promise<VerifyOtpResponse>} A promise that resolves to a verification response object.
   */
  async verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
    const { timestampOfNextRetry, canRetry: canRetryVerifying } =
      await this.getTimestampOfNextRetry(email, 'verifyOtp')

    const newlySetTimestampOfNextRetry = await this.setTimestampOfNextRetry(
      email,
      'verifyOtp'
    )

    if (canRetryVerifying) {
      // user is allowed to verify otp immediately
      const savedOtp = await this._otpStorage.getOtp(email, 'email')

      if (savedOtp === otp) {
        await this._otpStorage.deleteOtp(email, 'email')

        /*
         * On successful verification we clear the remaining timestamps
         * to ensure that if the user logs out and wants to log back in,
         * they don't need to wait.
         */
        await this.clearTimestampOfNextRetry(email, 'sendOtp')
        await this.clearTimestampOfNextRetry(email, 'verifyOtp')
        return {
          isVerified: true,
          errorType: undefined,
          timestampOfNextRetry: undefined,
        }
      }

      let errorType:
        | 'codeIncorrect'
        | 'revalidateTimeout'
        | 'codeNoLongerValid'
        | undefined
      if (savedOtp == null) {
        errorType = 'codeNoLongerValid'
      } else if (otp.length !== 6 || savedOtp !== otp) {
        errorType = 'codeIncorrect'
      } else if (newlySetTimestampOfNextRetry >= Date.now()) {
        errorType = 'revalidateTimeout'
      }

      return {
        isVerified: false,
        errorType,
        timestampOfNextRetry: newlySetTimestampOfNextRetry,
      }
    }

    return {
      isVerified: false,
      errorType: 'revalidateTimeout',
      timestampOfNextRetry,
    }
  }
}
