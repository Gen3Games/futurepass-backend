import { Request, Response, NextFunction } from 'express'
import Provider from 'oidc-provider'
import passport from 'passport'
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import {
  FVSub,
  FVUserProfile,
  GoogleOauthUserRawProfile,
  InvalidStateError,
} from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { FVPassport } from '../FVPassport'
import { BaseSocialLoginHandler, SocialLogin } from './BaseSocialLogin'

export class GoogleLoginHandler extends BaseSocialLoginHandler {
  constructor(protected provider: Provider) {
    super(provider)
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = await this.provider.interactionDetails(req, res)

      if (prompt.name !== 'login') {
        throw new InvalidStateError('Prompt should be set to "login"')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- it is safe since we know this function redirect user to the google login
      return passport.authenticate(
        FVPassport.getStrategyNameForIdpHost(
          res.locals.idpHost ?? C.ORIGIN,
          'google'
        ),
        { scope: ['email'] }
      )(req, res, next)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Google ${JSON.stringify(e)}`,
        2003230,
        { methodName: `${this.authenticate.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003230))
    }
  }

  public async callback(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- wrap passport.authenticate
    return await passport.authenticate(
      FVPassport.getStrategyNameForIdpHost(
        res.locals.idpHost ?? C.ORIGIN,
        'google'
      ),
      {
        failureRedirect: '/login',
      }
    )(req, res, next)
  }
}

export const GoogleLogin: SocialLogin = {
  getStrategy(origin: string) {
    return new GoogleStrategy(
      {
        clientID: C.GOOGLE_CLIENT_ID,
        clientSecret: C.GOOGLE_CLIENT_SECRET,
        callbackURL: `${origin}/login/social/google/callback`,
        state: true,
        passReqToCallback: true,
      },
      (
        req: Request,
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        cb: (e: Error | null, user: FVSub, info: FVUserProfile) => void
      ) => {
        const data = CO.hush(GoogleOauthUserRawProfile.decode(profile._json))
        const googleSub = data?.sub || profile.id || ''

        cb(
          null,
          {
            type: 'idp',
            idp: 'google',
            sub: googleSub,
          },
          {
            email: data?.email,
            hd: data?.hd,
          }
        )
      }
    )
  },
  handler: GoogleLoginHandler,
}
