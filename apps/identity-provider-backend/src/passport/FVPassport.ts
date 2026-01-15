import { SocialSSOType } from '@futureverse/experience-sdk'
import passport from 'passport'
import { config as C } from '../serverConfig'
import {
  SocialLogin,
  GoogleLogin,
  AppleLogin,
  FacebookLogin,
  TikTokLogin,
  TwitterLogin,
} from './strategies'

export const SocialLogins: Record<SocialSSOType, SocialLogin> = {
  google: GoogleLogin,
  apple: AppleLogin,
  facebook: FacebookLogin,
  tiktok: TikTokLogin,
  twitter: TwitterLogin,
}

export class FVPassport {
  public static getStrategyNameForIdpHost(
    idpHost: string,
    strategyName: SocialSSOType
  ) {
    return `strategy-${strategyName}@${idpHost}`
  }

  public static getSocialLogin(type: SocialSSOType) {
    return SocialLogins[type]
  }

  public init() {
    passport.serializeUser(function (user, done) {
      process.nextTick(() => {
        done(null, user)
      })
    })

    passport.deserializeUser(function (user, done) {
      process.nextTick(() => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any -- Express.User is just a interface
        done(null, user as any)
      })
    })

    for (const allowedIdpDomain of C.ALLOWED_IDP_DOMAINS) {
      Object.entries(SocialLogins).forEach(
        ([type, login]: [SocialSSOType, SocialLogin]) => {
          passport.use(
            FVPassport.getStrategyNameForIdpHost(allowedIdpDomain.host, type),
            login.getStrategy(allowedIdpDomain.origin)
          )
        }
      )
    }
  }
}
