import * as t from 'io-ts'
import { IOtpStorage } from './IOtpStorage'

/**
 * Used by the SmsOtpService which sends the OTPs.
 */
export const SendOtpResponse = t.type(
  {
    isOtpGenerated: t.boolean,
    timestampOfNextRetry: t.number,
  },
  'SendOtpResponse'
)
export type SendOtpResponse = t.TypeOf<typeof SendOtpResponse>

/**
 * Used by the SmsOtpService which only generates the OTPs.
 */
export const GenerateOtpResponse = t.type(
  {
    otp: t.union([t.string, t.null]),
    timestampOfNextRetry: t.number,
  },
  'GenerateOtpResponse'
)
export type GenerateOtpResponse = t.TypeOf<typeof GenerateOtpResponse>

export const VerifyOtpResponse = t.type(
  {
    isVerified: t.boolean,
    errorType: t.union([
      t.undefined,
      t.literal('codeNoLongerValid'),
      t.literal('codeIncorrect'),
      t.literal('revalidateTimeout'),
    ]),
    timestampOfNextRetry: t.union([t.number, t.undefined]),
  },
  'VerifyOtpResponse'
)
export type VerifyOtpResponse = t.TypeOf<typeof VerifyOtpResponse>

export interface IOtpRateLimiter {
  _otpStorage: IOtpStorage
  sendOtp(
    sendOtpTo: string,
    clientIp: string | null
  ): Promise<SendOtpResponse | GenerateOtpResponse>
  verifyOtp(
    sendOtpTo: string,
    otp: string,
    options?: unknown
  ): Promise<string | null | VerifyOtpResponse>
}
