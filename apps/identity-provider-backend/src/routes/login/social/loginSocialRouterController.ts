import express, { Router } from 'express'
import Provider from 'oidc-provider'

import { OIDCRoutesConfig } from '../../../oidc'
import { RouterController } from '../../routerController'
import LoginAppleRouterController from './apple/loginAppleRouterController'
import LoginFacebookRouterController from './facebook/loginFacebookRouterController'
import LoginGoogleRouterController from './google/loginGoogleRouterController'
import LoginTiktokRouterController from './tiktok/loginTiktokRouterController'
import LoginTwitterRouterController from './twitter/loginTwitterRouterController'

export default class LoginSocialRouterController extends RouterController {
  private readonly loginSocialRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  public override getRouter() {
    this.loginSocialRouter.use(
      '/google',
      new LoginGoogleRouterController(this.provider, this.config).getRouter()
    )

    this.loginSocialRouter.use(
      '/facebook',
      new LoginFacebookRouterController(this.provider, this.config).getRouter()
    )

    this.loginSocialRouter.use(
      '/twitter',
      new LoginTwitterRouterController(this.provider, this.config).getRouter()
    )

    this.loginSocialRouter.use(
      '/tiktok',
      new LoginTiktokRouterController(this.provider, this.config).getRouter()
    )

    this.loginSocialRouter.use(
      '/apple',
      new LoginAppleRouterController(this.provider, this.config).getRouter()
    )

    return this.loginSocialRouter
  }
}
