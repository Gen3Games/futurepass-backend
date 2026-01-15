import express, { Router, Request, Response } from 'express'
import Provider from 'oidc-provider'

import { identityProviderBackendLogger } from '../../logger'
import { generateErrorRouteUri } from '../../utils'
import { revokeTokens } from '../../utils/session'
import { RouterController } from '../routerController'

export default class LogoutRouterController extends RouterController {
  private readonly logoutRouter: Router = express.Router()
  private provider: Provider
  constructor(provider: Provider) {
    super()
    this.provider = provider
  }

  private async logoutCallback(req: Request, res: Response) {
    try {
      // TODO: this needs to be properly implemented with the following requirements
      // 1. central logout
      // 2. rewrite the logic to call logout endpoint in SDK
      // 2. remove frontend logout page
      const sessionId =
        req.cookies['_session'] || req.cookies['_session.legacy']
      const session = await this.provider.Session.find(sessionId)
      if (session) {
        revokeTokens({ sessionId, provider: this.provider })
        await session.destroy()
      }

      req.session.destroy(() => {
        ;[
          { cookieName: 'connect.sid', cookieOptions: { path: '/' } },
          { cookieName: '_session', cookieOptions: { path: '/' } },
          { cookieName: '_session.sig', cookieOptions: { path: '/' } },
          { cookieName: '_session.legacy', cookieOptions: { path: '/' } },
          { cookieName: '_session.legacy.sig', cookieOptions: { path: '/' } },
          { cookieName: '_interaction', cookieOptions: { path: '/login' } },
          { cookieName: '_interaction.sig', cookieOptions: { path: '/login' } },
        ].forEach((cookie) => {
          const { cookieName, cookieOptions } = cookie
          res.clearCookie(cookieName, cookieOptions)
        })
        return res.sendStatus(200)
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `logout error: ${JSON.stringify(e)}}`,
        2004001,
        {
          methodName: `${this.logoutCallback.name}`,
        }
      )
      return res.redirect(generateErrorRouteUri(2004001))
    }
  }

  public getRouter() {
    this.logoutRouter.post('/', this.logoutCallback.bind(this))

    return this.logoutRouter
  }
}
