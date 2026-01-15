import CSRF from 'csrf'
import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'
import { identityProviderBackendLogger } from '../../../logger'

import { OIDCRoutesConfig } from '../../../oidc'
import { RouterController } from '../../routerController'
import LoginXrplRouterService from './loginXrplRouterService'

export default class LoginXrplRouterController extends RouterController {
  private readonly loginXrplRouter: Router = express.Router()
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
        `XRPL nonce generation failed ${JSON.stringify(e)}`,
        4005006,
        { methodName: `${this.nonceCallback.name}` }
      )

      return res.status(500).json({ message: 'internal error' })
    }
  }

  private async verifyCallback(req: Request, res: Response) {
    try {
      const loginXrplRouterService = new LoginXrplRouterService(
        this.provider,
        this.config
      )

      const verifyRedirectUri = await loginXrplRouterService.xrplSignIn(
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
        `XRPL verify failed ${JSON.stringify(e)}`,
        2005102,
        { methodName: `${this.nonceCallback.name}` }
      )
      return res.status(500).redirect('/')
    }
  }

  public override getRouter() {
    this.loginXrplRouter.get('/nonce', this.nonceCallback.bind(this))

    this.loginXrplRouter.post('/verify', this.verifyCallback.bind(this))

    return this.loginXrplRouter
  }
}
