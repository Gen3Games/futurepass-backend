import { Strategy as TwitterStrategy } from '@superfaceai/passport-twitter-oauth2'
import { Request, Response, NextFunction } from 'express'
import Provider from 'oidc-provider'
import passport from 'passport'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { TwitterOauthUserRawProfile, InvalidStateError } from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { FVPassport } from './../FVPassport'
import { BaseSocialLoginHandler, SocialLogin } from './BaseSocialLogin'

export class TwitterLoginHandler extends BaseSocialLoginHandler {
  constructor(protected provider: Provider) {
    super(provider)
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = await this.provider.interactionDetails(req, res)

      if (prompt.name !== 'login') {
        throw new InvalidStateError('Prompt should be set to "login"')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- it is safe since we know this function redirect user to the twitter login
      return passport.authenticate(
        FVPassport.getStrategyNameForIdpHost(
          res.locals.idpHost ?? C.ORIGIN,
          'twitter'
        ),
        {
          scope: ['tweet.read', 'users.read'],
        }
      )(req, res, next)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Twitter ${JSON.stringify(e)}`,
        2003260,
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
        'twitter'
      ),
      {
        scope: ['tweet.read', 'users.read'],
        failureRedirect: '/login', // TODO hook this up properly
      }
    )(req, res, next)
  }
}

export const TwitterLogin: SocialLogin = {
  getStrategy(origin: string) {
    return new TwitterStrategy(
      {
        clientType: 'confidential', //depends on your Twitter app settings, valid values are `confidential` or `public`
        clientID: C.TWITTER_CLIENT_ID,
        clientSecret: C.TWITTER_CLIENT_SECRET,
        callbackURL: `${origin}/login/social/twitter/callback`,
      },
      function (_, __, profile, cb) {
        const data = CO.hush(TwitterOauthUserRawProfile.decode(profile._json))
        if (data == null) {
          cb(new Error('Failed to decode Twitter profile'))
          return
        }

        cb(null, {
          type: 'idp',
          idp: 'twitter',
          sub: data.id,
        })
      }
    )
  },
  handler: TwitterLoginHandler,
}
