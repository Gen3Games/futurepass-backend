import { Request, Response, NextFunction } from 'express'
import * as JWT from 'jsonwebtoken'
import Provider from 'oidc-provider'
import passport, { Strategy as PassportStrategy } from 'passport'
import { Strategy as AppleStrategy } from 'passport-apple'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import {
  InvalidStateError,
  AppleOauthUserRawProfile,
  FVSubImpl,
  FVUserProfile,
} from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { FVPassport } from './../FVPassport'
import { SocialLogin, BaseSocialLoginHandler } from './BaseSocialLogin'

const REDIRECT_PATH = 'login/social/apple/callback'

class AppleLoginHandler extends BaseSocialLoginHandler {
  constructor(protected provider: Provider) {
    super(provider)
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = await this.provider.interactionDetails(req, res)

      if (prompt.name !== 'login') {
        throw new InvalidStateError('Prompt should be set to "login"')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- it is safe since we know this function redirect user to the apple login
      return passport.authenticate(
        FVPassport.getStrategyNameForIdpHost(
          res.locals.idpHost ?? C.ORIGIN,
          'apple'
        )
      )(req, res, next)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Apple ${JSON.stringify(e)}`,
        2003280,
        { methodName: `${this.authenticate.name}` }
      )

      return res.status(500).redirect(generateErrorRouteUri(2003280))
    }
  }

  public async callback(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- wrap passport.authenticate
    return await passport.authenticate(
      FVPassport.getStrategyNameForIdpHost(
        res.locals.idpHost ?? C.ORIGIN,
        'apple'
      ),
      {},
      (err, user: Express.User, info: FVUserProfile) => {
        if (err) {
          res.send(err)
        } else {
          const sub = CO.hush(FVSubImpl.decode(user))
          const profile = CO.hush(FVUserProfile.decode(info))
          if (sub == null) {
            identityProviderBackendLogger.error(
              `Failed to login with Apple Callback with invalid sub`,
              2003281,
              {
                methodName: `${this.callback.name}`,
              }
            )
            return res.status(500).redirect(generateErrorRouteUri(2003281))
          }

          // Apple OAuth server does not return `interaction` cookies
          // so we need to set them manually by redirecting to the user endpoint
          // and set the user and profile in session.
          req.session['user'] = user

          if (profile != null) {
            req.session['profile'] = info
          }

          return res.redirect('/login/social/apple/callback/user')
        }
      }
    )(req, res, next)
  }
}

export const AppleLogin: SocialLogin = {
  getStrategy(origin: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/consistent-type-assertions -- it is safe since we know this function returns a PassportStrategy
    return new AppleStrategy(
      {
        clientID: C.APPLE_CLIENT_ID,
        teamID: C.APPLE_TEAM_ID,
        keyID: C.APPLE_KEY_ID,
        privateKeyString: C.APPLE_PRIVATE_KEY,
        callbackURL: C.isDevelopment
          ? `https://redirectmeto.com/${origin}/${REDIRECT_PATH}` // Apple does not allow localhost as a redirect uri, so we use redirectmeto.com to redirect to localhost
          : `${origin}/${REDIRECT_PATH}`,
        scope: ['name', 'email'],
        passReqToCallback: true,
      },
      function (
        _,
        __,
        ___,
        idToken,
        ____,
        cb: (
          error: Error | null,
          user?: Express.User,
          info?: FVUserProfile
        ) => void
      ) {
        const data = CO.hush(
          AppleOauthUserRawProfile.decode(JWT.decode(String(idToken)))
        )

        if (data != null) {
          return cb(
            null,
            {
              type: 'idp',
              idp: 'apple',
              sub: data.sub,
            },
            {
              email: data.email,
              hd: undefined,
            }
          )
        }
        return cb(new Error('Failed to decode Apple ID Token'))
      }
    ) as PassportStrategy
  },
  handler: AppleLoginHandler,
}
