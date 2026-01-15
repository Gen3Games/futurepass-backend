import * as sdk from '@futureverse/experience-sdk'
import { addMinutes } from 'date-fns'
import express, { Request, Response, Router } from 'express'

import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import Provider from 'oidc-provider'

import { getClientIp } from 'request-ip'
import * as CO from '../../../common'
import { identityProviderBackendLogger } from '../../../logger'
import * as M from '../../../middleware'
import { OIDCRoutesConfig } from '../../../oidc'
import { config as C } from '../../../serverConfig'
import { SmsOtpServiceErrorType } from '../../../services/otp/SmsOtpRateLimiter'

import { FVSub } from '../../../types'
import { RouterController } from '../../routerController'
import Login2faRouterService from './login2faRouterService'

const OtpSmsCallbackRequest = t.type({
  phoneNumber: t.string,
})

const OtpSmsVerifyCallbackRequest = t.type({
  phoneNumber: t.string,
  otp: t.string,
  eoa: t.string,
})

export default class Login2faRouterController extends RouterController {
  readonly #login2faRouter: Router = express.Router()
  readonly #oidcProvider: Provider
  readonly #oidcRoutesConfig: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.#oidcProvider = provider
    this.#oidcRoutesConfig = config
  }

  async #sendSmsOtpCallback(req: Request, res: Response) {
    const otpSmsCallbackRequest = CO.hush(
      OtpSmsCallbackRequest.decode(req.body)
    )

    if (
      C.smsOtpRateLimiter != null &&
      otpSmsCallbackRequest?.phoneNumber != null
    ) {
      try {
        const sendOtpResponse = await C.smsOtpRateLimiter.sendOtp(
          otpSmsCallbackRequest.phoneNumber,
          C.isDevelopment ? C.LOCALHOST_IP : getClientIp(req)
        )

        if (sendOtpResponse.isOtpGenerated) {
          return res
            .status(200)
            .set('Retry-After', sendOtpResponse.timestampOfNextRetry.toString())
            .json({})
        } else {
          return res
            .status(429)
            .set('Retry-After', sendOtpResponse.timestampOfNextRetry.toString())
            .json({})
        }
      } catch (e: unknown) {
        const error = SmsOtpServiceErrorType.decode(e)
        if (E.isRight(error)) {
          switch (error.right.code) {
            case 400:
              return res.status(400).json({
                error: error.right.message,
              })
            // TODO: these error codes and returns types are inconsistent throughout our services - fix it!
            case 60203: {
              // https://www.twilio.com/docs/errors/60203 - Max send attempts reached
              const tenMinutesFromNowTimestamp = addMinutes(
                Date.now(),
                10
              ).getTime()
              return res
                .status(429)
                .set('Retry-After', tenMinutesFromNowTimestamp.toString())
                .json({
                  code: 4004103,
                  error:
                    'Verification attempts maximum exceeded. Please wait 10 minutes before trying again. ',
                })
            }
          }
        }

        identityProviderBackendLogger.error(
          `Failed to send otp with twilio, ${JSON.stringify(e)}`,
          4004103,
          {
            methodName: `${this.#sendSmsOtpCallback.name}`,
          }
        )
      }
    }

    res.status(500).json({})
    return
  }

  async #verifySmsOtpCallback(req: Request, res: Response) {
    try {
      const login2faRouterService = new Login2faRouterService(
        this.#oidcProvider,
        this.#oidcRoutesConfig
      )

      const otpSmsVerifyCallbackRequest = CO.hush(
        OtpSmsVerifyCallbackRequest.decode(req.body)
      )

      const sub = await this.getFVSub(req, res)
      if (sub == null) {
        identityProviderBackendLogger.error(
          'No account info available(sub) on OTP verification',
          2005005
        )
        return res.status(401).json({})
      }

      if (C.smsOtpRateLimiter != null && otpSmsVerifyCallbackRequest != null) {
        const verifyOtpResponse = await C.smsOtpRateLimiter.verifyOtp(
          otpSmsVerifyCallbackRequest.phoneNumber,
          otpSmsVerifyCallbackRequest.otp,
          {
            eoa: otpSmsVerifyCallbackRequest.eoa,
          }
        )
        if (verifyOtpResponse != null) {
          return res.status(200).json({
            redirectTo: await login2faRouterService.checkUserAndRedirect(
              sub,
              req,
              res
            ),
          })
        } else {
          // The code is invalid
          return res.status(401).json({})
        }
      }

      res.status(500).json({})
    } catch (e: unknown) {
      const error = SmsOtpServiceErrorType.decode(e)
      if (E.isRight(error)) {
        if (error.right.code === 60202) {
          // https://www.twilio.com/docs/errors/60202 - Max check attempts reached
          const tenMinutesFromNowTimestamp = addMinutes(
            Date.now(),
            10
          ).getTime()
          return res
            .status(429)
            .set('Retry-After', tenMinutesFromNowTimestamp.toString())
            .json({
              code: 4004104,
              error:
                'Verification attempts maximum exceeded. Please wait 10 minutes before trying again. ',
            })
        }
      }

      identityProviderBackendLogger.error(
        `Failed to verify OTP with Twilio, ${JSON.stringify(e)}`,
        4004104,
        {
          methodName: `${this.#sendSmsOtpCallback.name}`,
        }
      )

      res.status(500).json({})
      return
    }
  }

  private async getFVSub(req: Request, res: Response) {
    const interactionDetails = await this.#oidcProvider.interactionDetails(
      req,
      res
    )
    const result = sdk.hush(
      t.type({ sub: FVSub }).decode(interactionDetails.result)
    )
    if (result == null) {
      identityProviderBackendLogger.error(
        'No interaction details (sub) available on OTP verification',
        2005005
      )
      return null
    }
    return result.sub
  }

  public override getRouter() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.#login2faRouter.all('/otp/sms/verify', M.authorizationVerifier)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.#login2faRouter.post('/otp/sms', this.#sendSmsOtpCallback.bind(this))

    this.#login2faRouter.post(
      '/otp/sms/verify',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
      this.#verifySmsOtpCallback.bind(this)
    )

    return this.#login2faRouter
  }
}
