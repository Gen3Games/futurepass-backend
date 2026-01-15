import CSRF from 'csrf'
import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'
import { identityProviderBackendLogger } from '../../../logger'

import { OIDCRoutesConfig } from '../../../oidc'
import { RouterController } from '../../routerController'
import LoginSiweRouterService from './loginSiweRouterService'

export default class LoginSiweRouterController extends RouterController {
  private readonly loginSiweRouter: Router = express.Router()
  private provider: Provider
  private config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  private nonceCallback(req: Request, res: Response) {
    try {
      const csrfToken = new CSRF().create(this.config.csrfSecret)
      return res.status(200).json({
        nonce: csrfToken,
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `SIWE nonce generation failed ${JSON.stringify(e)}`,
        4005003,
        { methodName: `${this.nonceCallback.name}` }
      )

      return res.status(500).json({ message: 'internal error' })
    }
  }

  private async verifyCallback(req: Request, res: Response) {
    try {
      const loginSiweRouterService = new LoginSiweRouterService(
        this.provider,
        this.config
      )

      const verifyRedirectUri = await loginSiweRouterService.siweVerify(
        req,
        res
      )

      if (verifyRedirectUri == null) {
        return res.status(500).json({})
      }

      return res.status(200).json({
        redirectTo: verifyRedirectUri,
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `SIWE verify failed ${JSON.stringify(e)}`,
        4005004,
        { methodName: `${this.nonceCallback.name}` }
      )
      return res.status(500).redirect('/')
    }
  }

  public override getRouter() {
    this.loginSiweRouter.get('/nonce', this.nonceCallback.bind(this))

    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- expressjs 5 will support this
    this.loginSiweRouter.post('/verify', this.verifyCallback.bind(this))

    return this.loginSiweRouter
  }
}
