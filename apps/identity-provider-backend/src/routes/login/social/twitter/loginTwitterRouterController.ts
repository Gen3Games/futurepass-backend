import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'
import * as CO from '../../../../common'
import { identityProviderBackendLogger } from '../../../../logger'
import { custodialLoginAuthCheck } from '../../../../middleware/custodialLoginAuthCheck'
import { OIDCRoutesConfig } from '../../../../oidc'
import { FVPassport } from '../../../../passport'
import { FVSubImpl } from '../../../../types'
import { generateErrorRouteUri } from '../../../../utils'
import { RouterController } from '../../../routerController'
import LoginTwitterRouterService from './loginTwitterRouterService'

export default class LoginTwitterRouterController extends RouterController {
  private readonly loginTwitterRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async handleUser(req: Request, res: Response) {
    try {
      const loginTwitterRouterService = new LoginTwitterRouterService(
        this.provider,
        this.config
      )

      // we store the sub as req.user to defer account creation until after
      // the user has accepted our terms and conditions.
      const sub = CO.hush(FVSubImpl.decode(req.user))

      if (sub == null) {
        identityProviderBackendLogger.error(
          `Failed to login with Twitter Callback with invalid sub`,
          4004105,
          {
            methodName: `${this.handleUser.name}`,
          }
        )
        return res.status(500).redirect(generateErrorRouteUri(4004105))
      }

      const redirectTo = await loginTwitterRouterService.checkUserAndRedirect(
        sub,
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        identityProviderBackendLogger.stream(
          `Successfully Twitter login ${redirectTo}`,
          2003007
        )
      }

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Twitter Callback ${JSON.stringify(e)}`,
        2003261,
        { methodName: `${this.handleUser.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003251))
    }
  }

  public override getRouter() {
    const twitterLogin = FVPassport.getSocialLogin('twitter')
    const twitterLoginHandler = new twitterLogin.handler(this.provider)

    this.loginTwitterRouter.get(
      '/',
      twitterLoginHandler.authenticate.bind(twitterLoginHandler)
    )

    this.loginTwitterRouter.get(
      '/callback',
      custodialLoginAuthCheck,
      twitterLoginHandler.callback.bind(twitterLoginHandler),
      this.handleUser.bind(this)
    )

    return this.loginTwitterRouter
  }
}
