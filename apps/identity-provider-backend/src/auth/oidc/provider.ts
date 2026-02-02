/**
 * OIDC Provider Configuration
 * 
 * This module configures the node-oidc-provider for FuturePass authentication.
 * It sets up claims, scopes, token handling, and integration with the FV user storage.
 */

import { either as E } from 'fp-ts'
import type { Configuration, JWKS, ClientMetadata, ResourceServer } from 'oidc-provider'
import { FVSub, FVUser, custodianOf, encodeSub } from '../types'
import { UserStorage } from '../services/user-storage'
import { CachedAccountIndexer } from '../services/account-indexer'

// ============================================================================
// Types
// ============================================================================

export interface OIDCProviderConfig {
  /** Issuer URL (e.g., https://login.futureverse.app) */
  issuer: string
  /** JSON Web Key Set for signing tokens */
  jwks: JWKS
  /** Chain ID for blockchain operations */
  chainId: number
  /** User storage adapter */
  userStorage: UserStorage
  /** Account indexer for FuturePass lookups */
  accountIndexer: CachedAccountIndexer
  /** OIDC adapter factory (for sessions/tokens) */
  adapter?: Configuration['adapter']
  /** Pre-registered clients */
  clients?: ClientMetadata[]
  /** Session secret for cookies */
  sessionSecret: string
  /** Whether to enable dev interactions (debug mode) */
  devMode?: boolean
}

// ============================================================================
// Resource Servers
// ============================================================================

const ResourceServers = {
  api: {
    url: 'https://api.futureverse.com',
    info: {
      scope: 'foundation:sign offline_access',
      accessTokenFormat: 'jwt',
    } as ResourceServer,
  },
} as const

const ResourceServersIndex: Record<string, ResourceServer> = {
  [ResourceServers.api.url]: ResourceServers.api.info,
}

// ============================================================================
// OIDC Configuration Factory
// ============================================================================

/**
 * Creates the OIDC provider configuration
 * 
 * @param config - OIDC provider configuration options
 * @returns node-oidc-provider Configuration object
 */
export function createOIDCConfiguration(config: OIDCProviderConfig): Configuration {
  const { userStorage, accountIndexer, chainId } = config

  return {
    // ========================================================================
    // Adapter (for storing sessions, tokens, etc.)
    // ========================================================================
    adapter: config.adapter,

    // ========================================================================
    // JWKS (signing keys)
    // ========================================================================
    jwks: config.jwks,

    // ========================================================================
    // Pre-registered clients
    // ========================================================================
    clients: config.clients,

    // ========================================================================
    // Account Management
    // ========================================================================
    findAccount: async (ctx, id) => {
      const subResult = FVSub.decode(id)
      if (E.isLeft(subResult)) return undefined

      const sub = subResult.right
      const user = await userStorage.findUserBySub(sub)
      if (!user) return undefined

      return {
        accountId: id,
        claims: async () => {
          const profile = await userStorage.findUserProfile(sub)
          
          // Get FuturePass address
          const futurepass = await (async () => {
            const result = await accountIndexer.getLinkedFuturePassForEoa(user.eoa)
            return result.linkedFuturepass
          })()

          return {
            sub: id,
            eoa: user.eoa,
            chainId,
            custodian: custodianOf(sub),
            email: profile?.email,
            futurepass,
          }
        },
      }
    },

    // ========================================================================
    // Token Configuration
    // ========================================================================
    ttl: {
      AccessToken: 3600,          // 1 hour
      AuthorizationCode: 600,     // 10 minutes
      RefreshToken: 2592000,      // 30 days
      IdToken: 3600,              // 1 hour
      DeviceCode: 600,            // 10 minutes
      Grant: 2592000,             // 30 days
      Interaction: 3600,          // 1 hour
      Session: 1209600,           // 14 days
    },

    // ========================================================================
    // Refresh Token Handling
    // ========================================================================
    issueRefreshToken(ctx, client, code) {
      if (!client.grantTypeAllowed('refresh_token')) {
        return false
      }
      return (
        code.scopes.has('offline_access') ||
        (client.applicationType === 'web' && client.clientAuthMethod === 'none')
      )
    },

    // ========================================================================
    // Features
    // ========================================================================
    features: {
      // Dynamic client registration
      registration: {
        enabled: true,
      },
      registrationManagement: {
        enabled: true,
        rotateRegistrationAccessToken: false,
      },

      // Token introspection
      introspection: {
        enabled: true,
        allowedPolicy: (ctx, client, token) => token.clientId === client.clientId,
      },

      // Token revocation
      revocation: {
        enabled: true,
      },

      // UserInfo endpoint
      userinfo: {
        enabled: true,
      },

      // Resource indicators (for API access)
      resourceIndicators: {
        enabled: true,
        defaultResource(ctx) {
          // Return default resource for special clients
          return []
        },
        getResourceServerInfo(ctx, resourceIndicator) {
          const info = ResourceServersIndex[resourceIndicator]
          if (!info) {
            throw new Error(`Unknown resource: ${resourceIndicator}`)
          }
          return info
        },
        useGrantedResource() {
          return true
        },
      },

      // Logout
      rpInitiatedLogout: {
        enabled: true,
        logoutSource: (ctx, form) => {
          ctx.body = createLogoutPage(form)
        },
        postLogoutSuccessSource: (ctx) => {
          ctx.body = createLogoutSuccessPage()
        },
      },

      // Dev interactions (for debugging)
      devInteractions: {
        enabled: config.devMode ?? false,
      },
    },

    // ========================================================================
    // Interactions (Login Flow)
    // ========================================================================
    interactions: {
      url(ctx, interaction) {
        return `/login`
      },
    },

    // ========================================================================
    // Claims & Scopes
    // ========================================================================
    claims: {
      openid: ['sub', 'eoa', 'custodian', 'chainId', 'email', 'futurepass'],
      profile: ['name', 'picture'],
      email: ['email', 'email_verified'],
    },

    scopes: ['openid', 'profile', 'email', 'offline_access'],

    // ========================================================================
    // PKCE Configuration
    // ========================================================================
    pkce: {
      methods: ['S256'],
      required: () => true, // Always require PKCE
    },

    // ========================================================================
    // Cookie Configuration
    // ========================================================================
    cookies: {
      keys: [config.sessionSecret],
      long: {
        signed: true,
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
      },
      short: {
        signed: true,
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      },
    },

    // ========================================================================
    // Client Defaults
    // ========================================================================
    clientDefaults: {
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none', // Public clients by default
    },

    // ========================================================================
    // CORS
    // ========================================================================
    clientBasedCORS(ctx, origin, client) {
      // In production, this should validate against client's allowed origins
      // For now, allow all origins (should be configured per-client)
      return true
    },

    // ========================================================================
    // Error Handling
    // ========================================================================
    renderError(ctx, out, error) {
      ctx.type = 'html'
      ctx.body = createErrorPage(error.message, error.error_description)
    },

    // ========================================================================
    // Grant Handling
    // ========================================================================
    async loadExistingGrant(ctx) {
      if (!ctx.oidc.client || !ctx.oidc.session) return undefined

      // Check for existing grant
      const grantId = ctx.oidc.session.grantIdFor(ctx.oidc.client.clientId)
      if (grantId) {
        return ctx.oidc.provider.Grant.find(grantId)
      }

      // Create new grant
      const grant = new ctx.oidc.provider.Grant({
        clientId: ctx.oidc.client.clientId,
        accountId: ctx.oidc.session.accountId,
      })

      // Auto-grant openid scope
      grant.addOIDCScope('openid')

      await grant.save()
      return grant
    },

    // ========================================================================
    // Routes
    // ========================================================================
    routes: {
      authorization: '/auth',
      token: '/token',
      userinfo: '/userinfo',
      jwks: '/.well-known/jwks.json',
      registration: '/reg',
      introspection: '/token/introspection',
      revocation: '/token/revocation',
      end_session: '/session/end',
    },
  }
}

// ============================================================================
// Helper Functions for HTML Pages
// ============================================================================

function createLogoutPage(form: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Logout - FuturePass</title>
      <style>
        body { font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        button { padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>Logout</h1>
      <p>Are you sure you want to sign out?</p>
      ${form}
    </body>
    </html>
  `
}

function createLogoutSuccessPage(): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Signed Out - FuturePass</title>
      <style>
        body { font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>Signed Out</h1>
      <p>You have been successfully signed out.</p>
    </body>
    </html>
  `
}

function createErrorPage(error: string, description?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error - FuturePass</title>
      <style>
        body { font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto; }
        h1 { color: #c00; }
        .error { background: #fee; padding: 1rem; border-radius: 4px; }
      </style>
    </head>
    <body>
      <h1>Authentication Error</h1>
      <div class="error">
        <p><strong>Error:</strong> ${error}</p>
        ${description ? `<p>${description}</p>` : ''}
      </div>
    </body>
    </html>
  `
}

// ============================================================================
// Exports
// ============================================================================

export { ResourceServers, ResourceServersIndex }
