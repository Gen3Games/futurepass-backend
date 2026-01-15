import { Address, Custodian, User } from '@futureverse/experience-sdk'
import {
  getAccessTokenFromRefreshToken,
  isJWTExpired,
} from '@futureverse/oidc-client'

import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import NextAuth, { AuthOptions, CookiesOptions, Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { OAuthConfig } from 'next-auth/providers/oauth'
import { config } from '../../../config'
import { getProviderIdForIdpDomain } from '../../../src/utils'

type FVUser = User & { id: string }
type FVSession = Session & { user?: Session['user'] & FVUser }

// MUST be strict to cull any other fields
const FVParams = t.strict(
  {
    // MUST be strict to cull any other fields
    account: t.strict(
      {
        provider: t.string,
        token_type: t.literal('Bearer'),
        refresh_token: t.optional(t.string),
        access_token: t.optional(t.string),
      },
      'FVAccount'
    ),
    // MUST be strict to cull any other fields
    user: t.strict(
      {
        id: t.string,
        eoa: Address,
        custodian: Custodian,
        chainId: t.number,
      },
      'FVUser'
    ),
    profile: t.strict(
      {
        futurepass: Address,
      },
      'FVProfile'
    ),
  },
  'FVParams'
)

// MUST be strict to cull any other fields
const FVJwtFields = t.strict(
  {
    refresh_token: t.optional(t.string),
    access_token: t.optional(t.string),
    eoa: Address,
    custodian: Custodian,
    chainId: t.number,
    futurepass: Address,
  },
  'FVJwtFields'
)

// the default jwt max age equals to session max age which is 30 days, but the access token is valid for one day, that is why this jwt needs to get expired in one day
const SESSION_MAX_AGE = 60 * 5

type FVOAuthConfig = OAuthConfig<{
  sub: string
  eoa: string
  custodian: Custodian
  chainId: number
}>

function FVProvider(config: {
  idpURL: string
  clientId: () => string
  clientSecret: () => string
  scopes?: () => string[]
}): FVOAuthConfig {
  const scope = (() => {
    const scopes = new Set(['openid'])
    for (const scope of config.scopes?.() ?? []) {
      scopes.add(scope)
    }
    return Array.from(scopes).join(' ')
  })()
  const providerId = getProviderIdForIdpDomain(config.idpURL)

  return {
    id: providerId,
    name: 'Futureverse',
    type: 'oauth',
    idToken: true,
    get wellKnown() {
      return `${config.idpURL}/.well-known/openid-configuration`
    },
    authorization: {
      params: {
        scope,
      },
    },
    async profile(profile) {
      return {
        id: profile.sub,
        eoa: profile.eoa,
        custodian: profile.custodian,
        chainId: profile.chainId,
      }
    },
    get clientId() {
      return config.clientId()
    },
    get clientSecret() {
      return config.clientSecret()
    },
  }
}

export function createAuthOptions(config: {
  idpURLs: () => string[]
  clientId: () => string
  clientSecret: () => string
  scopes?: () => string[]
  jwtExpirySlippageSeconds?: () => number
  useSecureCookies?: () => boolean
  devCookiePrefix?: () => string
}): AuthOptions {
  return {
    session: {
      strategy: 'jwt',
      maxAge: SESSION_MAX_AGE,
    },
    get cookies() {
      if (config.devCookiePrefix == null) return undefined
      const out: Partial<CookiesOptions> = {
        sessionToken: {
          name: `${config.devCookiePrefix()}-next-auth.session-token`,
          options: {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            secure:
              config.useSecureCookies == null
                ? true
                : config.useSecureCookies(),
          },
        },
      }
      return out
    },
    providers: (() => {
      return config.idpURLs().map((idpURL) => {
        const provider = FVProvider({
          idpURL,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          scopes: config.scopes,
        })

        return provider
      })
    })(),
    callbacks: {
      async jwt(params): Promise<JWT> {
        // see docs: these may or may not be set
        if (params.account && params.user) {
          // decode the params fields; this shouldn't be necessary but next-auth
          // is a bit of a black box and the types appear to be all over the show.
          const paramsR = FVParams.decode(params)
          if (E.isLeft(paramsR)) {
            throw new Error(
              'invalid callback params; error=' +
                PathReporter.report(paramsR).join(', ')
            )
          }
          const { user, account, profile } = paramsR.right

          return {
            ...params.token,
            ...FVJwtFields.encode({
              ...user,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              futurepass: profile.futurepass,
            }),
          }
        }

        const fieldsR = FVJwtFields.decode(params.token)
        if (E.isLeft(fieldsR)) {
          console.warn(
            'invalid jwt; error=' + PathReporter.report(fieldsR).join(', ')
          )
          return params.token // TODO maybe throw here instead?
        }
        const fields = fieldsR.right

        const { refresh_token, access_token } = await (async () => {
          if (
            fields.access_token == null ||
            fields.refresh_token == null ||
            !isJWTExpired(
              fields.access_token,
              config.jwtExpirySlippageSeconds?.()
            )
          ) {
            return fields
          }
          return getAccessTokenFromRefreshToken(fields.refresh_token, {
            clientId: config.clientId(),
            clientSecret: config.clientSecret(),
            oidcHost: (() => {
              /**
               *
               * for token exchange, we will try to get the idp-b passonline domain first since we may remove the futureverse domain in the future
               * but if passonline domain doesn't exist, we can get the first idpURL from the config
               *
               */
              const passonlineURLs = config
                .idpURLs()
                .find(
                  (idpURL) =>
                    idpURL.toLowerCase().includes('passonline') ||
                    idpURL.toLowerCase().includes('pass')
                )
              return passonlineURLs ?? config.idpURLs()[0]
            })(),
          })
        })()

        const out = {
          ...params.token,
          ...FVJwtFields.encode({
            ...fields,
            access_token,
            refresh_token,
          }),
        }
        return out
      },
      async session({ session, token: jwt }): Promise<FVSession> {
        const fieldsR = FVJwtFields.decode(jwt)
        if (E.isLeft(fieldsR)) {
          throw new Error(
            'invalid jwt; error=' + PathReporter.report(fieldsR).join(', ')
          )
        }
        const fields = fieldsR.right

        // IMPORTANT Do *NOT* remove this binding or do anything clever like
        // spreading from jwt. We MUST not, by any means, accidentally disclose
        // the refresh or access tokens. Be deliberate.
        const user: User = {
          eoa: fields.eoa,
          chainId: fields.chainId,
          custodian: fields.custodian,
          futurepass: fields.futurepass,
        }

        return {
          ...session,
          user: {
            ...session.user,
            ...user,
          } as FVUser | undefined,
        }
      },
    },
  }
}

export const authOptions = createAuthOptions({
  idpURLs: () => config.public.idpURLs,
  clientId: () => config.server.clientId,
  clientSecret: () => config.server.clientSecret,
  scopes: () => ['openid', 'foundation:sign'],
  jwtExpirySlippageSeconds: () => config.server.jwtExpirySlippageSeconds,
  devCookiePrefix: () => 'signer',
  useSecureCookies: () => new URL(config.server.host).protocol === 'https:',
})

export default NextAuth(authOptions)
