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
import LoginAppleRouterService from './loginAppleRouterService'

export default class LoginAppleRouterController extends RouterController {
  private readonly loginAppleRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private async handleUser(req: Request, res: Response) {
    try {
      const loginAppleRouterService = new LoginAppleRouterService(
        this.provider,
        this.config
      )

      const sub = CO.hush(FVSubImpl.decode(req.session['user']))
      const profile = CO.hush(FVUserProfile.decode(req.session['profile']))

      if (sub == null) {
        identityProviderBackendLogger.error(
          `Failed to login with Apple Callback with invalid sub`,
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

      const redirectTo = await loginAppleRouterService.checkUserAndRedirect(
        sub,
        req,
        res
      )

      if (!redirectTo.startsWith('/')) {
        identityProviderBackendLogger.stream(
          `Successfully Apple login ${redirectTo}`,
          2003009
        )
      }

      return res.redirect(redirectTo)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Apple handleUser ${JSON.stringify(e)}`,
        2003282,
        { methodName: `${this.handleUser.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003282))
    }
  }

  public override getRouter() {
    const appleLogin = FVPassport.getSocialLogin('apple')
    const appleLoginHandler = new appleLogin.handler(this.provider)

    this.loginAppleRouter.get(
      '/',
      appleLoginHandler.authenticate.bind(appleLoginHandler)
    )

    this.loginAppleRouter.post(
      '/callback',
      custodialLoginAuthCheck,
      appleLoginHandler.callback.bind(this)
    )

    this.loginAppleRouter.get(
      '/callback/user',
      this.handleUser.bind(appleLoginHandler)
    )

    return this.loginAppleRouter
  }
}
