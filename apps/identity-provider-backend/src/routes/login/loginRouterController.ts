import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'

import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import * as M from '../../middleware'
import { OIDCRoutesConfig } from '../../oidc'
import { ApiError } from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { RouterController } from '../routerController'
import Login2faRouterController from './2fa/login2faRouterController'
import LoginEmailRouterController from './email/loginEmailRouterController'
import LoginAcceptTermsRouterService from './loginAcceptTermsRouterService'
import LoginRouterService from './loginRouterService'

import LoginSiweRouterController from './siwe/loginSiweRouterController'
import LoginSocialRouterController from './social/loginSocialRouterController'
import LoginXrplRouterController from './xrpl/loginXrplRouterController'

export default class LoginRouterController extends RouterController {
  private readonly loginRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async loginCallback(req: Request, res: Response) {
    try {
      const loginRouterService = new LoginRouterService(
        this.provider,
        this.config
      )
      const loginRedirectUri = await loginRouterService.getLoginRedirectUri(
        req,
        res
      )
      if (!loginRedirectUri.startsWith('/')) {
        // if loginRedirectUri starts with '/', it means login failed because a successful login must redirect user back to the experience
        identityProviderBackendLogger.stream(
          `Successfully login ${loginRedirectUri}`,
          2003000
        )

        const details = await this.provider.interactionDetails(req, res)
        const login_hint: string | null = (() => {
          const o = details.params['login_hint']
          if (typeof o === 'string') return o
          return null
        })()

        if (details.prompt.name === 'login' && login_hint != null) {
          if (login_hint.startsWith('eoa:')) {
            identityProviderBackendLogger.stream(
              `Successfully login with Wagmi ${loginRedirectUri}`,
              2003002
            )
          } else if (login_hint.startsWith('xrpl:')) {
            identityProviderBackendLogger.stream(
              `Successfully login with Xaman ${loginRedirectUri}`,
              2003003
            )
          }
        }
      } else if (loginRedirectUri.startsWith('/error')) {
        // if loginRedirectUri starts with '/error', it means somehow to login failed
        identityProviderBackendLogger.stream(`Failed to login`, 2003201)
      }

      return res.redirect(loginRedirectUri)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login: ${JSON.stringify(e)}}`,
        2003020,
        {
          methodName: `${this.loginCallback.name}`,
        }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003020))
    }
  }

  private async acceptTermsCallback(req: Request, res: Response) {
    try {
      const loginAcceptTermsRouterService = new LoginAcceptTermsRouterService(
        this.provider,
        this.config
      )

      const redirectTo = await loginAcceptTermsRouterService.acceptTerms(
        req,
        res
      )

      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][D] redirecting; redirectTo= ${redirectTo}`,
        {
          methodName: `${this.acceptTermsCallback.name}`,
        }
      )

      if (!redirectTo.startsWith('/')) {
        // if loginRedirectUri starts with '/', it means login failed because a successful login must redirect user back to the experience
        identityProviderBackendLogger.stream(
          `Successfully login with accept T&C${redirectTo}`,
          2003001
        )
      }
      return res.json({
        redirectTo,
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with accept T&C: ${JSON.stringify(e)}}`,
        2003202,
        {
          methodName: `${this.acceptTermsCallback.name}`,
        }
      )

      const apiError = CO.hush(ApiError.decode(e))

      if (apiError != null) {
        return res.status(apiError.status).json({
          message: apiError.message,
        })
      }

      return res.status(500).json({
        message: 'Internal Server Error',
      })
    }
  }

  public getRouter() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.loginRouter.all('/accept_terms', M.authorizationVerifier)

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.loginRouter.get('/', this.loginCallback.bind(this))

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.loginRouter.post('/accept_terms', this.acceptTermsCallback.bind(this))

    this.loginRouter.use(
      '/siwe',
      new LoginSiweRouterController(this.provider, this.config).getRouter()
    )

    this.loginRouter.use(
      '/2fa',
      new Login2faRouterController(this.provider, this.config).getRouter()
    )

    this.loginRouter.use(
      '/social',
      new LoginSocialRouterController(this.provider, this.config).getRouter()
    )

    this.loginRouter.use(
      '/email',
      new LoginEmailRouterController(this.provider, this.config).getRouter()
    )

    this.loginRouter.use(
      '/xrpl',
      new LoginXrplRouterController(this.provider, this.config).getRouter()
    )

    return this.loginRouter
  }
}
