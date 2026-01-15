import { Strategy as TikTokStrategy } from '@futureverse/passport-tiktok'
import { Request, Response, NextFunction } from 'express'
import Provider from 'oidc-provider'
import passport, { Strategy as PassportStrategy } from 'passport'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { TiktokOauthUserRawProfile, InvalidStateError } from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { FVPassport } from '../FVPassport'
import { BaseSocialLoginHandler, SocialLogin } from './BaseSocialLogin'

export class TikTokLoginHandler extends BaseSocialLoginHandler {
  constructor(protected provider: Provider) {
    super(provider)
  }

  public async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const { prompt } = await this.provider.interactionDetails(req, res)

      if (prompt.name !== 'login') {
        throw new InvalidStateError('Prompt should be set to "login"')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- it is safe since we know this function redirect user to the tiktok login
      return passport.authenticate(
        FVPassport.getStrategyNameForIdpHost(
          res.locals.idpHost ?? C.ORIGIN,
          'tiktok'
        ),
        {
          scope: ['user.info.basic'],
        }
      )(req, res, next)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to login with Tiktok ${JSON.stringify(e)}`,
        2003270,
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
        'tiktok'
      ),
      {
        scope: ['user.info.basic'],
        failureRedirect: '/login', // TODO hook this up properly
      }
    )(req, res, next)
  }
}

export const TikTokLogin: SocialLogin = {
  getStrategy(origin: string) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-call -- safe since we know that this is the TikTokStrategy
    return new TikTokStrategy(
      {
        clientID: C.TIKTOK_CLIENT_ID,
        clientSecret: C.TIKTOK_CLIENT_SECRET,
        callbackURL: `${origin}/login/social/tiktok/callback`,
        state: true,
        pkce: true,
      },
      function (
        _,
        __,
        profile,
        cb: (error: Error | null, user?: Express.User) => void
      ) {
        const rawProfile = CO.hush(
          TiktokOauthUserRawProfile.decode(profile._json)
        )

        if (rawProfile == null) {
          return cb(new Error('Failed to decode Tiktok profile'))
        }

        return cb(null, {
          type: 'idp',
          idp: 'tiktok',
          sub: rawProfile.data.user.open_id,
        })
      }
    ) as PassportStrategy
  },
  handler: TikTokLoginHandler,
}
