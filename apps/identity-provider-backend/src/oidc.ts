import * as sdk from '@futureverse/experience-sdk'
import RedisStore from 'connect-redis'
import cors from 'cors'
import { Express } from 'express'
import session from 'express-session'
import { either as E } from 'fp-ts'
import { Redis } from 'ioredis'

import wildcard from 'wildcard'
import { IOtpStorage } from '../src/services/otp/IOtpStorage'
import { startEventListening } from './eventListener'
import { getGenericErrorScreen } from './genericErrorScreen'
import { identityProviderBackendLogger } from './logger'
import * as MDW from './middleware'
import { experienceFinderWithInteraction } from './middleware/experienceFinderWithInteraction'
import AuthOptionsRouterController from './routes/authOptions/authOptionsRouterController'
import LoginRouterController from './routes/login/loginRouterController'
import LogoutRouterController from './routes/logout/logoutRouterController'
import QuestRouterController from './routes/quests/questRouterController'
import TenantAssetConfigRouterController from './routes/tenant/tenantAssetConfigRouteController'
import { config as C } from './serverConfig'
import { getLinkedFuturePassForEoa } from './services/accountIndexer/accountIndexer'
import { Mailer } from './services/mailer/email'
import { getLogoutSource } from './session/end'
import { getLogoutSuccessSource } from './session/end/success'
import { custodianOf, FVAdapter, FVSub } from './types'
import { generateErrorRouteUri, safeIdentityOf } from './utils'
import type { DefaultPolicy, OIDCProvider } from './oidc-types'
import type {
  AdapterConstructor,
  AdapterFactory,
  ClientMetadata,
  Configuration,
  JWKS,
  ResourceServer,
} from 'oidc-provider'

// resource server definitions
const ResourceServers = {
  api: {
    url: 'https://api.futureverse.com',
    info: {
      scope: 'foundation:sign offline_access',
      accessTokenFormat: 'jwt',
    },
  },
} as const

const ResourceServersIndex: Record<string, ResourceServer> = {
  [ResourceServers.api.url]: ResourceServers.api.info,
}

export type OIDCRoutesConfig = {
  issuer: string
  redis: Redis | null
  adapter?: AdapterConstructor | AdapterFactory | undefined
  fv: FVAdapter
  chainId: number
  mailer: Mailer
  sessionSecret: string
  hostname: string
  csrfSecret: string
  otpStorage: IOtpStorage
  jwks: JWKS
  wellKnownClients: {
    signer: ClientMetadata
    demo?: ClientMetadata | null
    demoReact?: ClientMetadata | null
    identityDashboard?: ClientMetadata | null
  }
  safeIdentityOf: (eoa: string) => Promise<string | null>
}

export async function createOIDCRoutes(app: Express, config: OIDCRoutesConfig) {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- hack to get esm working in nx
  const { default: OIDCProvider } = (await eval(`import('oidc-provider')`)) as {
    default: new (issuer: string, configuration?: Configuration) => OIDCProvider
    interactionPolicy: {
      base: () => DefaultPolicy
    }
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-assignment -- hack to get esm working in nx
  const { errors } = await (eval(`import('oidc-provider')`) as Promise<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any  -- not sure how to create the type here since erros form oidc-provider is a namespace
    errors: any // TODO: Should be updated ASAP with defined type
  }>)

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: true,
      ...(!C.isDevelopment
        ? {
            proxy: true,
            cookie: { secure: true },
          }
        : {}),
      store:
        config.redis == null
          ? undefined
          : new RedisStore({
              client: config.redis,
              prefix: 'session:',
            }),
    })
  )

  const oidcProviderConfiguration: Configuration = {
    renderError: (ctx, out, error) => {
      identityProviderBackendLogger.error(
        `${JSON.stringify(error)}`,
        4006000,
        JSON.stringify(ctx)
      )

      const isNotInvalidRedirectUri = !error.message.includes(
        'invalid_redirect_uri'
      )
      ctx.type = 'html'
      ctx.body = getGenericErrorScreen(isNotInvalidRedirectUri)
    },
    adapter: config.adapter,
    issueRefreshToken(ctx, client, code) {
      if (!client.grantTypeAllowed('refresh_token')) {
        return false
      }
      return (
        code.scopes.has('offline_access') ||
        (client.applicationType === 'web' && client.clientAuthMethod === 'none')
      )
    },
    findAccount: async (ctx, id) => {
      const subR = FVSub.decode(id)
      if (E.isLeft(subR)) return undefined
      const user = await config.fv.findUserBySub(subR.right)
      if (user == null) return undefined
      const out = {
        accountId: id,
        claims: async () => {
          const profile = await config.fv.findUserProfileBySub(subR.right)
          const fp = await (async () => {
            const futurepass = await safeIdentityOf(user.eoa)

            if (futurepass != null) {
              return futurepass
            }

            // User could login with the delegated account
            const eoaR = sdk.Address.decode(user.eoa)
            if (E.isRight(eoaR)) {
              const decodedSubEoa = eoaR.right

              const linkedFuturepassForEoa = await getLinkedFuturePassForEoa(
                decodedSubEoa
              )

              if (
                linkedFuturepassForEoa &&
                linkedFuturepassForEoa.linkedFuturepass
              ) {
                return linkedFuturepassForEoa.linkedFuturepass
              }
            }

            identityProviderBackendLogger.error(
              `Failed to retrieve FuturePass address for a given EOA: ${user.eoa}`,
              4005103,
              JSON.stringify(ctx)
            )
            return generateErrorRouteUri(4005103)
          })()
          return {
            sub: id,
            eoa: user.eoa,
            chainId: config.chainId,
            custodian: custodianOf(user.sub),
            email: profile?.email,
            futurepass: fp,
          }
        },
      }
      return out
    },
    features: {
      registration: {
        enabled: true,
      },
      registrationManagement: {
        enabled: true,
        rotateRegistrationAccessToken: false, // TODO enable this?
      },
      userinfo: {
        enabled: true,
      },
      revocation: {
        enabled: true,
      },
      introspection: {
        enabled: true,
        allowedPolicy: (ctx, client, token) =>
          token.clientId === client.clientId,
      },
      devInteractions: {
        enabled: false,
      },
      resourceIndicators: {
        enabled: true,
        defaultResource(ctx) {
          // special case for the signer app
          if (
            ctx.oidc.client?.clientId ===
            config.wellKnownClients.signer.client_id
          ) {
            return ResourceServers.api.url
          }
          return []
        },
        getResourceServerInfo(ctx, resourceIndicator) {
          const out = ResourceServersIndex[resourceIndicator]
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-condition -- see comments above
          if (out == null) throw new errors.InvalidTarget()
          return out
        },
        useGrantedResource() {
          // returning 'true' allows the client to skip providing the 'resource' parameter
          // https://github.com/panva/node-oidc-provider/blob/864cf94438e0d8edb04801eccd9ed3c03b42fa31/docs/README.md#usegrantedresource
          return true
        },
      },
      rpInitiatedLogout: {
        enabled: true,
        logoutSource: (ctx, form) => {
          ctx.body = getLogoutSource(form)
        },
        postLogoutSuccessSource: (ctx) => {
          ctx.body = getLogoutSuccessSource()
        },
      },
    },
    interactions: {
      url() {
        return `/login`
      },
    },
    claims: {
      openid: ['sub', 'eoa', 'custodian', 'chainId', 'email', 'futurepass'],
    },
    pkce: {
      methods: ['S256', 'plain'],
      required: () => false,
    },
    scopes: ['openid', 'offline_access'],
    jwks: config.jwks,
    clients: [
      config.wellKnownClients.signer,
      config.wellKnownClients.demo,
      config.wellKnownClients.demoReact,
      config.wellKnownClients.identityDashboard,
    ].filter(notEmpty),
    routes: {
      jwks: '/.well-known/jwks.json',
    },

    async loadExistingGrant(ctx) {
      if (ctx.oidc.client == null) {
        return
      }
      if (ctx.oidc.session == null) {
        return
      }

      // check for existing grant first
      const grantId =
        ctx.oidc.result?.consent?.grantId ??
        ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId)
      if (grantId) {
        const grant = await ctx.oidc.provider.Grant.find(grantId)

        if (grant != null) {
          return grant
        }
      }

      // otherwise construct a new grant
      const grant = new ctx.oidc.provider.Grant({
        clientId: ctx.oidc.client.clientId,
        accountId: ctx.oidc.session.accountId,
      })

      // automatically grant foundation:sign scope to the (special) signer client
      if (
        ctx.oidc.client.clientId === config.wellKnownClients.signer.client_id
      ) {
        grant.addResourceScope(ResourceServers.api.url, 'foundation:sign')
        grant.addResourceScope(ResourceServers.api.url, 'offline_access')
      }

      // we automatically grant the openid scope
      grant.addOIDCScope('openid')

      await grant.save()

      return grant
    },

    clientBasedCORS() {
      // TODO do this properly! this is just a hack to get it working
      //  SEE https://github.com/panva/node-oidc-provider/blob/main/recipes/client_based_origins.md
      return true
    },
    cookies: {
      keys: ['OIDC3', 'OIDC2', 'OIDC1'],
    },
    ttl: {
      AccessToken: 24 * 60 * 60,
      IdToken: 24 * 60 * 60,
      Grant: 7 * 24 * 60 * 60,
      RefreshToken: 7 * 24 * 60 * 60,
      Session: 7 * 24 * 60 * 60,
    },
  }

  identityProviderBackendLogger.debug(
    `allow wildcard=${C.ALLOW_WILDCARDS ? 'true' : 'false'}`,
    {
      methodName: `${createOIDCRoutes.name}`,
    }
  )

  if (C.ALLOW_WILDCARDS) {
    oidcProviderConfiguration.extraClientMetadata = {
      properties: ['redirect_uris'],
      validator(ctx, key, value) {
        if (key === 'redirect_uris') {
          // eslint-disable-next-line  @typescript-eslint/consistent-type-assertions -- it is safe since we know the value is a redirect url string
          for (const redirectUri of value as string) {
            if (redirectUri.includes('*')) {
              const { hostname, href } = new URL(redirectUri)
              if (href.split('*').length !== 2) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- see comments above
                throw new errors.InvalidClientMetadata(
                  'redirect_uris with a wildcard may only contain a single one'
                )
              }

              if (!hostname.includes('*')) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- see comments above
                throw new errors.InvalidClientMetadata(
                  'redirect_uris may only have a wildcard in the hostname'
                )
              }

              const test = hostname.replace('*', 'test')
              if (!wildcard(hostname, test)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- see comments above
                throw new errors.InvalidClientMetadata(
                  'redirect_uris with a wildcard must only match the whole subdomain'
                )
              }
            }
          }
        }
      },
    }
  }

  const provider = new OIDCProvider(config.issuer, oidcProviderConfiguration)
  startEventListening(provider)

  if (C.ALLOW_WILDCARDS) {
    // redirectUriAllowed on a client prototype checks whether a redirect_uri is allowed or not
    // eslint-disable-next-line @typescript-eslint/unbound-method -- cannot make it arrow function since it is coming form 3rd party library, but it is safe because we bound the func to this later
    const { redirectUriAllowed } = provider.Client.prototype

    const hasWildcardHost = (redirectUri: string) => {
      const { hostname } = new URL(redirectUri)
      return hostname.includes('*')
    }

    const wildcardMatches = (redirectUri: string, wildcardUri: string) => {
      return !!wildcard(wildcardUri, redirectUri)
    }

    provider.Client.prototype.redirectUriAllowed =
      function wildcardRedirectUriAllowed(redirectUri: string) {
        if (redirectUri.includes('*')) {
          //we don't want that the payload redirect uri contains a wildcard, if it does, using the default redirectUriAllowed to check
          return redirectUriAllowed.call(this, redirectUri)
        } else if (this.redirectUris == null) {
          return false
        }

        //playload uri must not contains any wildcards
        //check if there is any exactly matches
        const redirectUriIncluded = this.redirectUris.includes(redirectUri)
        if (redirectUriIncluded) {
          return true
        }

        //check if there is any wildcard matches
        const wildcardUris = this.redirectUris.filter(hasWildcardHost)
        if (wildcardUris.length === 0) {
          return false
        } else {
          return wildcardUris.some((wildcardUri) =>
            wildcardMatches(redirectUri, wildcardUri)
          )
        }
      }
  }

  provider.proxy = true

  // todo: we will remove all of these when we have quest service
  app.use('/quest', new QuestRouterController().getRouter())

  app.use(
    '/login',
    /**
     *
     * Do not use this middleware anywhere else because it is calling provider.interactionDetails(req, res)
     * which requires the interaction session cookie. And the interaction session cookie is strictly tight with
     * /login routes.
     *
     */
    experienceFinderWithInteraction(provider),
    new LoginRouterController(provider, config).getRouter()
  )
  app.use('/logout', new LogoutRouterController(provider).getRouter())

  app.use(
    '/tenant',
    cors({
      origin: [C.isDevelopment ? '*' : C.SIGNER_HOSTNAME],
    }),
    new TenantAssetConfigRouterController().getRouter()
  )

  app.use(
    '/auth-options',
    cors(),
    new AuthOptionsRouterController(provider).getRouter()
  )

  provider.use(MDW.openIdConfigurationMiddleware)

  return provider
}

function notEmpty<T>(x: T | undefined | null): x is T {
  return x != null
}
