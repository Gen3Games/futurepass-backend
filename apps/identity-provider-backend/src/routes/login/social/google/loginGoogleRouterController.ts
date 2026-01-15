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
import LoginGoogleRouterService from './loginGoogleRouterService'

export default class LoginGoogleRouterController extends RouterController {
  private readonly loginGoogleRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async handleUser(req: Request, res: Response) {
    try {
      const loginGoogleRouterService = new LoginGoogleRouterService(
        this.provider,
        this.config
      )

      // we store the sub as req.user to defer account creation until after
      // the user has accepted our terms and conditions.
      const sub = CO.hush(FVSubImpl.decode(req.user))
      const profile = CO.hush(FVUserProfile.decode(req.authInfo))

      if (sub == null) {
        identityProviderBackendLogger.error(
          `Failed to login with Google Callback with invalid sub`,
          4004105,
          { methodName: `${this.handleUser.name}` }
        )
        return res.status(500).redirect(generateErrorRouteUri(4004105))
      }

      if (profile != null) {
        await this.config.fv.updateUserProfile(sub, profile)
      }

      const redirectTo = await loginGoogleRouterService.checkUserAndRedirect(
        sub,
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        // if loginRedirectUri starts with '/', it means login failed because a successful login must redirect user back to the experience
        identityProviderBackendLogger.stream(
          `Successfully Google login ${redirectTo}`,
          2003004
        )
      }

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Google Callback ${JSON.stringify(e)}`,
        2003231,
        { methodName: `${this.handleUser.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003231))
    }
  }

  public override getRouter() {
    const googleLogin = FVPassport.getSocialLogin('google')
    const googleLoginHandler = new googleLogin.handler(this.provider)

    this.loginGoogleRouter.get(
      '/',
      googleLoginHandler.authenticate.bind(googleLoginHandler)
    )

    this.loginGoogleRouter.get(
      '/callback',
      custodialLoginAuthCheck,
      googleLoginHandler.callback.bind(googleLoginHandler),
      this.handleUser.bind(this)
    )

    return this.loginGoogleRouter
  }
}
