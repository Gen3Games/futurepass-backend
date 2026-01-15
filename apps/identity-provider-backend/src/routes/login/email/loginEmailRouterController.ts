import * as sdk from '@futureverse/experience-sdk'
import express, { Request, Response, Router } from 'express'
import * as t from 'io-ts'
import Provider from 'oidc-provider'
import { hush } from '../../../common'
import { identityProviderBackendLogger } from '../../../logger'
import * as M from '../../../middleware'
import { OIDCRoutesConfig } from '../../../oidc'
import { config as C } from '../../../serverConfig'

import { RouterController } from '../../routerController'
import LoginEmailRouterService from './loginEmailRouterService'

const OtpCallbackRequest = t.type({
  email: t.string,
})

const VerifyCallbackRequest = t.type({
  email: t.string,
  otp: t.string,
})

export default class LoginEmailRouterController extends RouterController {
  readonly #loginEmailRouter: Router = express.Router()
  #oidcProvider: Provider
  #oidcRoutesConfig: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.#oidcProvider = provider
    this.#oidcRoutesConfig = config
  }

  async #sendEmailOtpCallback(req: Request, res: Response) {
    try {
      const details = await this.#oidcProvider.interactionDetails(req, res)
      const clientId = sdk.hush(t.string.decode(details.params.client_id))

      if (!clientId) {
        throw new Error('ClientId cannot be null')
      }

      const otpCallbackRequest = hush(OtpCallbackRequest.decode(req.body))

      if (otpCallbackRequest != null) {
        const { otp, timestampOfNextRetry } =
          await C.emailOtpRateLimiter.sendOtp(otpCallbackRequest.email)

        if (otp == null) {
          return res
            .status(429)
            .set('Retry-After', timestampOfNextRetry.toString())
            .json({})
        }

        const mailerRequestStartTime =
          identityProviderBackendLogger.streamApiData(
            `Calling Mailer API to send email`,
            4004506,
            'POST'
          )

        await this.#oidcRoutesConfig.mailer.sendEmail(
          otpCallbackRequest.email,
          otp,
          clientId,
          req.hostname
        )

        identityProviderBackendLogger.streamApiData(
          `Called Mailer API to send email`,
          4004506,
          'POST',
          '200',
          mailerRequestStartTime
        )

        return res
          .status(200)
          .set('Retry-After', timestampOfNextRetry.toString())
          .json({})
      }

      identityProviderBackendLogger.error(
        `Failed to send otp with Email`,
        4004106,
        {
          methodName: `${this.#sendEmailOtpCallback.name}`,
        }
      )
      return res.status(500).json({})
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with email, failed to generate otp ${JSON.stringify(
          e
        )}`,
        2003240,
        {
          methodName: `${this.#sendEmailOtpCallback.name}`,
        }
      )
      return res.status(500).json({})
    }
  }

  async #verifyEmailOtpCallback(req: Request, res: Response) {
    try {
      identityProviderBackendLogger.info(`verifyEmailOtpCallback `, req.body)

      const loginEmailRouterService = new LoginEmailRouterService(
        this.#oidcProvider,
        this.#oidcRoutesConfig
      )

      const verifyCallbackRequest = hush(VerifyCallbackRequest.decode(req.body))

      if (!verifyCallbackRequest) {
        return res.status(500).json({})
      }

      const verifyOtpResult = await C.emailOtpRateLimiter.verifyOtp(
        verifyCallbackRequest.email,
        verifyCallbackRequest.otp
      )

      if (!verifyOtpResult.isVerified) {
        return res
          .status(401)
          .set('Retry-After', verifyOtpResult.timestampOfNextRetry?.toString())
          .json({
            errorType: verifyOtpResult.errorType,
          })
      }

      const redirectTo = await loginEmailRouterService.checkUserAndRedirect(
        {
          type: 'email',
          email: verifyCallbackRequest.email,
        },
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        // If loginRedirectUri starts with '/', it's because the login failed because a successful login must redirect user back to the experience
        identityProviderBackendLogger.stream(
          `Successfully logged in with email, redirectTo=${redirectTo}`,
          2003006
        )
      }

      return res.status(200).json({
        redirectTo,
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with email, failed to verify otp ${JSON.stringify(e)}`,
        2003241,
        {
          methodName: `${this.#verifyEmailOtpCallback.name}`,
        }
      )
      return res.status(500).json({})
    }
  }

  private async redirectToEmailLogin(req: Request, res: Response) {
    try {
      const loginEmailRouterService = new LoginEmailRouterService(
        this.#oidcProvider,
        this.#oidcRoutesConfig
      )

      const redirectTo = await loginEmailRouterService.checkUserAndRedirect(
        {
          type: 'email',
          email: '',
        },
        req,
        res
      )

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to redirect to Email login ${JSON.stringify(e)}`,
        2003241,
        { methodName: `${this.redirectToEmailLogin.name}` }
      )
      return res.status(500).json({})
    }
  }

  public override getRouter() {
    this.#loginEmailRouter.all('/otp/verify', M.authorizationVerifier)

    this.#loginEmailRouter.post('/otp', this.#sendEmailOtpCallback.bind(this))

    this.#loginEmailRouter.post(
      '/otp/verify',
      this.#verifyEmailOtpCallback.bind(this)
    )

    this.#loginEmailRouter.get(
      '/redirect',
      this.redirectToEmailLogin.bind(this)
    )

    return this.#loginEmailRouter
  }
}
