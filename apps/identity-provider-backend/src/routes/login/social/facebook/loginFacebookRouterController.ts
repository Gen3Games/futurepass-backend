import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'
import * as CO from '../../../../common'
import { identityProviderBackendLogger } from '../../../../logger'
import { custodialLoginAuthCheck } from '../../../../middleware/custodialLoginAuthCheck'
import { OIDCRoutesConfig } from '../../../../oidc'
import { FVPassport } from '../../../../passport'
import { FVSubImpl, FVUserProfile } from '../../../../types'
import { generateErrorRouteUri } from '../../../../utils'
import { RouterController } from '../../../routerController'
import LoginFacebookRouterService from './loginFacebookRouterService'

export default class LoginFacebookRouterController extends RouterController {
  private readonly loginFacebookRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async handleUser(req: Request, res: Response) {
    try {
      const loginFacebookRouterService = new LoginFacebookRouterService(
        this.provider,
        this.config
      )

      // we store the sub as req.user to defer account creation until after
      // the user has accepted our terms and conditions.
      const sub = CO.hush(FVSubImpl.decode(req.user))
      const profile = CO.hush(FVUserProfile.decode(req.authInfo))

      if (sub == null) {
        identityProviderBackendLogger.error(
          `Failed to login with Facebook Callback with invalid sub`,
          4004105,
          {
            methodName: `${this.handleUser.name}`,
          }
        )
        return res.status(500).redirect(generateErrorRouteUri(4004105))
      }

      if (profile != null) {
        await this.config.fv.updateUserProfile(sub, profile)
      }

      const redirectTo = await loginFacebookRouterService.checkUserAndRedirect(
        sub,
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        identityProviderBackendLogger.stream(
          `Successfully Facebook login ${redirectTo}`,
          2003005
        )
      }

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Facebook Callback ${JSON.stringify(e)}`,
        2003251,
        { methodName: `${this.handleUser.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003251))
    }
  }

  public override getRouter() {
    const facebookLogin = FVPassport.getSocialLogin('facebook')
    const facebookLoginHandler = new facebookLogin.handler(this.provider)

    this.loginFacebookRouter.get(
      '/',
      facebookLoginHandler.authenticate.bind(facebookLoginHandler)
    )

    this.loginFacebookRouter.get(
      '/callback',
      custodialLoginAuthCheck,
      facebookLoginHandler.callback.bind(facebookLoginHandler),
      this.handleUser.bind(this)
    )

    return this.loginFacebookRouter
  }
}
