import * as sdk from '@futureverse/experience-sdk'
import * as t from 'io-ts'

export const config = {
  server: {
    get signerAPIHost() {
      return sdk.io.fromEnv(
        'GEN3_SIGNER_BASE_URL',
        sdk.io.fromEnv('FOUNDATION_API_BASE_URL')
      )
    },
    get foundationAPIHost() {
      return sdk.io.fromEnv('FOUNDATION_API_BASE_URL')
    },
    get clientId() {
      return sdk.io.fromEnv('CLIENT_ID')
    },
    get clientSecret() {
      return sdk.io.fromEnv('CLIENT_SECRET')
    },
    get jwtExpirySlippageSeconds() {
      return sdk.io.fromEnv('JWT_EXPIRY_SLIPPAGE_SECONDS', 0, (i) =>
        t.number.decode(JSON.parse(i))
      )
    },
    get host() {
      return sdk.io.fromEnv('NEXTAUTH_URL')
    },
  },
  public: {
    get idpURLs() {
      const allowedIdpDomains = sdk.io
        .fromEnv('ALLOWED_IDP_DOMAINS')
        .split(',')
        .map((allowedHost) => {
          try {
            const { origin } = new URL(allowedHost)
            return origin
          } catch (e) {
            return null
          }
        })
        .filter((domain): domain is string => {
          return domain != null && typeof domain === 'string'
        })

      return allowedIdpDomains
    },
    get graphQLUrl(): string {
      const url = sdk.io.fromEnvNextJS(
        'NEXT_PUBLIC_ASSET_INDEXER_GRAPHQL_API',
        process.env['NEXT_PUBLIC_ASSET_INDEXER_GRAPHQL_API'],
        undefined,
        t.string.decode
      )
      if (!url) {
        throw new Error('Invalid NEXT_PUBLIC_ASSET_INDEXER_GRAPHQL_API')
      }
      return url
    },
    get etherscanAPIKey(): string {
      const apiKey = sdk.io.fromEnvNextJS(
        'NEXT_PUBLIC_ETHERSCAN_API_KEY',
        process.env['NEXT_PUBLIC_ETHERSCAN_API_KEY'],
        undefined,
        t.string.decode
      )

      if (!apiKey) {
        throw new Error('Invalid NEXT_PUBLIC_ETHERSCAN_API_KEY')
      }
      return apiKey
    },
    get defaultIdpURL() {
      return sdk.io.fromEnvNextJS(
        'NEXT_PUBLIC_DEFAULT_IDP_DOMAIN',
        process.env['NEXT_PUBLIC_DEFAULT_IDP_DOMAIN'],
        'https://login.futureverse.app',
        t.string.decode
      )
    },
  },
}
