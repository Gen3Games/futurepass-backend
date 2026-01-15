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
import LoginTiktokRouterService from './loginTiktokRouterService'

export default class LoginTiktokRouterController extends RouterController {
  private readonly loginTiktokRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async handleUser(req: Request, res: Response) {
    try {
      const loginTiktokRouterService = new LoginTiktokRouterService(
        this.provider,
        this.config
      )

      // we store the sub as req.user to defer account creation until after
      // the user has accepted our terms and conditions.
      const sub = CO.hush(FVSubImpl.decode(req.user))
      const profile = CO.hush(FVUserProfile.decode(req.authInfo))

      if (sub == null) {
        identityProviderBackendLogger.error(
          `Failed to login with Tiktok Callback with invalid sub`,
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

      const redirectTo = await loginTiktokRouterService.checkUserAndRedirect(
        sub,
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        identityProviderBackendLogger.stream(
          `Successfully Tiktok login ${redirectTo}`,
          2003008
        )
      }

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Tiktok Callback ${JSON.stringify(e)}`,
        2003271,
        { methodName: `${this.handleUser.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003251))
    }
  }

  public override getRouter() {
    const tiktokLogin = FVPassport.getSocialLogin('tiktok')
    const tiktokLoginHandler = new tiktokLogin.handler(this.provider)

    this.loginTiktokRouter.get(
      '/',
      tiktokLoginHandler.authenticate.bind(tiktokLoginHandler)
    )

    this.loginTiktokRouter.get(
      '/callback',
      custodialLoginAuthCheck,
      tiktokLoginHandler.callback.bind(tiktokLoginHandler),
      this.handleUser.bind(this)
    )

    return this.loginTiktokRouter
  }
}
