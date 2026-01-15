import { Request, Response, NextFunction } from 'express'
import Provider from 'oidc-provider'
import passport from 'passport'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { FacebookOauthUserRawProfile, InvalidStateError } from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { FVPassport } from '../FVPassport'
import { SocialLogin, BaseSocialLoginHandler } from './BaseSocialLogin'

export class FacebookLoginHandler extends BaseSocialLoginHandler {
  constructor(protected provider: Provider) {
    super(provider)
  }

  public async authenticate(req: Request, res: Response) {
    try {
      const { prompt } = await this.provider.interactionDetails(req, res)

      if (prompt.name !== 'login') {
        throw new InvalidStateError('Prompt should be set to "login"')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- it is safe since we know this function redirect user to the facebook login
      return passport.authenticate(
        FVPassport.getStrategyNameForIdpHost(
          res.locals.idpHost ?? C.ORIGIN,
          'facebook'
        ),
        {
          scope: ['email', 'public_profile'],
        }
      )(req, res)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Facebook ${JSON.stringify(e)}`,
        2003250,
        { methodName: `${this.authenticate.name}` }
      )
      return res.status(500).redirect(generateErrorRouteUri(2003250))
    }
  }

  public async callback(req: Request, res: Response, next: NextFunction) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- wrap passport.authenticate
    return await passport.authenticate(
      FVPassport.getStrategyNameForIdpHost(
        res.locals.idpHost ?? C.ORIGIN,
        'facebook'
      ),
      {
        failureRedirect: '/login', // TODO hook this up properly
      }
    )(req, res, next)
  }
}

export const FacebookLogin: SocialLogin = {
  getStrategy(origin: string) {
    return new FacebookStrategy(
      {
        clientID: C.FACEBOOK_CLIENT_ID,
        clientSecret: C.FACEBOOK_CLIENT_SECRET,
        callbackURL: `${origin}/login/social/facebook/callback`,
        profileFields: ['id', 'email'],
      },
      function (_, __, profile, cb) {
        const data = CO.hush(FacebookOauthUserRawProfile.decode(profile._json))

        if (data == null) {
          return cb(new Error('Failed to decode Facebook profile'))
        }

        return cb(
          null,
          {
            type: 'idp',
            idp: 'facebook',
            sub: data.id,
          },
          {
            email: data.email,
          }
        )
      }
    )
  },
  handler: FacebookLoginHandler,
}
