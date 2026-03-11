/* eslint-disable @typescript-eslint/no-unnecessary-condition -- do not eslint this config file */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- do not eslint this config file */
/* eslint-disable @typescript-eslint/no-unsafe-return -- do not eslint this config file */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- do not eslint this config file */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- do not eslint this config file */

import crypto from 'crypto'
import * as sdk from '@futureverse/experience-sdk'
import RateLimiter from 'async-ratelimiter'
import { ethers } from 'ethers'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { ClientMetadata, ResponseType } from 'oidc-provider'
import {
  MemoryOtpStorage,
  RedisOtpStorage,
} from '../src/services/otp/IOtpStorage'
import { parseClientRedirectUrls } from './common'
import { createMailer } from './services/mailer/email'
import { EmailOtpRateLimiter } from './services/otp/EmailOtpRateLimiter'
import { SmsOtpRateLimiter } from './services/otp/SmsOtpRateLimiter'
import { KeyStore } from './types'

export const config = (() => {
  const LOCALHOST_IP = '127.0.0.1'
  // used to create redis client
  const REDIS_URL = sdk.io.fromEnv('REDIS_URL', null)

  // used to create wallet
  const ETH_WALLET_KEY = sdk.io.fromEnv('ETH_WALLET_KEY')
  const ETH_CHAIN_NAME = sdk.io.fromEnv('ETH_CHAIN_NAME')
  const ETH_CHAIN_URL = sdk.io.fromEnv('ETH_CHAIN_URL')

  // used to create rate limiter
  const CAPTCHA_IP_RATE_LIMIT_THRESHOLD = sdk.io.fromEnv(
    'CAPTCHA_IP_RATE_LIMIT_THRESHOLD',
    undefined,
    (i) => t.number.decode(JSON.parse(i))
  )
  const CATPCHA_IP_RATE_LIMIT_DURATION = sdk.io.fromEnv(
    'CATPCHA_IP_RATE_LIMIT_DURATION',
    undefined,
    (i) => t.number.decode(JSON.parse(i))
  )

  // used to create twilio service
  const TWILIO_ACCCOUNT_SID = sdk.io.fromEnv('TWILIO_ACCCOUNT_SID')
  const TWILIO_AUTH_TOKEN = sdk.io.fromEnv('TWILIO_AUTH_TOKEN')
  const TWILIO_SMS_VERIFICATION_SERVICE_ID = sdk.io.fromEnv(
    'TWILIO_SMS_VERIFICATION_SERVICE_ID'
  )

  // used to create mailer
  const SEND_GRID_API_KEY = sdk.io.fromEnv('SEND_GRID_API_KEY')
  const SEND_GRID_FROM_EMAIL = sdk.io.fromEnv('SEND_GRID_FROM_EMAIL')
  const SEND_GRID_TEMPLATE_ID = sdk.io.fromEnv('SEND_GRID_TEMPLATE_ID')

  // wellknown client - signer
  const SIGNER_CLIENT_ID = sdk.io.fromEnv('SIGNER_CLIENT_ID')
  const SIGNER_CLIENT_SECRET = sdk.io.fromEnv('SIGNER_CLIENT_SECRET')
  const SIGNER_REDIRECT_URI = sdk.io.fromEnv('SIGNER_REDIRECT_URI')
  const SIGNER_LEGACY_REDIRECT_URI = sdk.io.fromEnv(
    'SIGNER_LEGACY_REDIRECT_URI'
  )

  // wellknown client - demo app
  const DEMO_CLIENT_ID = sdk.io.fromEnv('DEMO_CLIENT_ID', null)
  const DEMO_CLIENT_SECRET = sdk.io.fromEnv('DEMO_CLIENT_SECRET', null)
  const DEMO_REDIRECT_URI = sdk.io.fromEnv('DEMO_REDIRECT_URI', null)
  const DEMO_REACT_CLIENT_ID = sdk.io.fromEnv('DEMO_REACT_CLIENT_ID', null)
  const DEMO_REACT_REDIRECT_URI = sdk.io.fromEnv(
    'DEMO_REACT_REDIRECT_URI',
    null
  )

  // wellknown client - Identity Dashboard
  const IDENTITY_DASHBOARD_CLIENT_ID = sdk.io.fromEnv(
    'IDENTITY_DASHBOARD_CLIENT_ID',
    null
  )
  const IDENTITY_DASHBOARD_CLIENT_SECRET = sdk.io.fromEnv(
    'IDENTITY_DASHBOARD_CLIENT_SECRET',
    null
  )
  const IDENTITY_DASHBOARD_REDIRECT_URI = sdk.io.fromEnv(
    'IDENTITY_DASHBOARD_REDIRECT_URI',
    null
  )

  // the following configurations are exposed
  return {
    get LOCALHOST_IP() {
      return LOCALHOST_IP
    },
    // Basic settings
    get isDevelopment() {
      return sdk.io.fromEnv('NODE_ENV') !== 'production'
    },
    get loggerLevel() {
      return sdk.io.fromEnv('LOGGER_LEVEL', 'debug')
    },
    get ORIGIN() {
      const { origin: ORIGIN } = new URL(
        sdk.io.fromEnv('OIDC_HOSTNAME', 'http://localhost')
      )
      return ORIGIN
    },
    get ALLOWED_IDP_DOMAINS() {
      const allowedIdpDomains = sdk.io
        .fromEnv('ALLOWED_IDP_DOMAINS', 'http://localhost')
        .split(',')
        .map((allowedHost) => {
          try {
            const { host, origin } = new URL(allowedHost)
            return {
              origin,
              host,
            }
          } catch (e) {
            return null
          }
        })
        .filter((domain): domain is { origin: string; host: string } => {
          return domain != null
        })

      return allowedIdpDomains
    },
    get DEV_ISSUER() {
      return sdk.io.fromEnv('DEV_ISSUER', this.ORIGIN)
    },
    get CDN_HOSTNAME() {
      const { origin: ORIGIN } = new URL(
        sdk.io.fromEnv('CDN_HOSTNAME', 'https://cdn.passonline.dev')
      )
      return ORIGIN
    },

    get SIGNER_HOSTNAME() {
      const { origin: ORIGIN } = new URL(
        sdk.io.fromEnv('SIGNER_HOSTNAME', 'https://signer.passonline.dev')
      )
      return ORIGIN
    },
    get KEYSTORE() {
      return sdk.io.fromEnv('KEYSTORE', undefined, (i) =>
        KeyStore.decode(JSON.parse(i))
      )
    },
    get CSRF_SECRET() {
      return sdk.io.fromEnv('CSRF_SECRET')
    },
    get SESSION_SECRET() {
      return sdk.io.fromEnv('SESSION_SECRET')
    },
    get ALLOW_WILDCARDS() {
      return sdk.io.fromEnv<boolean>('ALLOW_WILDCARDS', false, (i: string) =>
        BooleanFromString.decode(i)
      )
    },
    get IDENTITY_DASHBOARD_HOSTNAME() {
      return sdk.io.fromEnv('IDENTITY_DASHBOARD_HOSTNAME')
    },

    // used for google custodial login
    get GOOGLE_CLIENT_ID() {
      return sdk.io.fromEnv('GOOGLE_CLIENT_ID')
    },
    get GOOGLE_CLIENT_SECRET() {
      return sdk.io.fromEnv('GOOGLE_CLIENT_SECRET')
    },

    // used for facebook custodial login
    get FACEBOOK_CLIENT_ID() {
      return sdk.io.fromEnv('FACEBOOK_CLIENT_ID')
    },
    get FACEBOOK_CLIENT_SECRET() {
      return sdk.io.fromEnv('FACEBOOK_CLIENT_SECRET')
    },

    // used for twitter custodial login
    get TWITTER_CLIENT_ID() {
      return sdk.io.fromEnv('TWITTER_CLIENT_ID')
    },
    get TWITTER_CLIENT_SECRET() {
      return sdk.io.fromEnv('TWITTER_CLIENT_SECRET')
    },

    // used for tiktok custodial login
    get TIKTOK_CLIENT_ID() {
      return sdk.io.fromEnv('TIKTOK_CLIENT_ID')
    },
    get TIKTOK_CLIENT_SECRET() {
      return sdk.io.fromEnv('TIKTOK_CLIENT_SECRET')
    },

    // used for apple custodial login
    get APPLE_CLIENT_ID() {
      return sdk.io.fromEnv('APPLE_CLIENT_ID')
    },
    get APPLE_TEAM_ID() {
      return sdk.io.fromEnv('APPLE_TEAM_ID')
    },
    get APPLE_KEY_ID() {
      return sdk.io.fromEnv('APPLE_KEY_ID')
    },
    get APPLE_PRIVATE_KEY() {
      return sdk.io.fromEnv('APPLE_PRIVATE_KEY').replace(/\\n/g, '\n')
    },

    // futureverse api endpoints, public API endpoints
    // todo: follow the naming convention < ****_BASE_URL > ?
    get FOUNDATION_API_BASE_URL() {
      return sdk.io.fromEnv('FOUNDATION_API_BASE_URL')
    },
    get GRAPHQL_ENDPOINT() {
      return sdk.io.fromEnv('GRAPHQL_ENDPOINT')
    },
    get ACCOUNT_LINKER_API() {
      return sdk.io.fromEnv('ACCOUNT_LINKER_API')
    },
    get FUTURESCORE_API_GATEWAY_BASE_URL() {
      return sdk.io.fromEnv('FUTURESCORE_API_GATEWAY_BASE_URL')
    },
    get DELEGATED_ACCOUNT_INDEXER_API_BASE_URL() {
      return sdk.io.fromEnv('DELEGATED_ACCOUNT_INDEXER_API_BASE_URL')
    },
    get TRN_RPCURL_WEBSOCKET() {
      return sdk.io.fromEnv('TRN_RPCURL_WEBSOCKET')
    },
    get ALCHEMY_JSON_PRC_PROVIDER_URL() {
      return sdk.io.fromEnv('ALCHEMY_JSON_PRC_PROVIDER_URL')
    },
    get XRPL_JSON_PRC_URL() {
      return sdk.io.fromEnv('XRPL_JSON_PRC_URL')
    },
    get DYNAMODB_ENDPOINT() {
      const dynamoDbEndpoint = process.env.DYNAMODB_ENDPOINT
      if (dynamoDbEndpoint != null && dynamoDbEndpoint !== '') {
        return dynamoDbEndpoint
      }

      return sdk.io.fromEnv('LOCALSTACK_ENDPOINT', undefined)
    },

    // there is a legacy naming issue here
    // todo: ETH_CHAIN_ID rename to EVM_CHAIN_ID; EVM_CHAIN_ID to ROOT_CHAIN_ID
    get ETH_CHAIN_ID() {
      return sdk.io.fromEnv('ETH_CHAIN_ID', undefined, (i) =>
        t.number.decode(JSON.parse(i))
      )
    },
    get EVM_CHAIN_ID() {
      return sdk.io.fromEnv('EVM_CHAIN_ID', undefined, (i) =>
        t.number.decode(JSON.parse(i))
      )
    },

    // used for hCaptcha
    get HCAPTCHA_SECRET_KEY() {
      return sdk.io.fromEnv('HCAPTCHA_SECRET_KEY', '')
    },
    get HCAPTCHA_SITE_KEY() {
      return sdk.io.fromEnv('HCAPTCHA_SITE_KEY', '')
    },
    get CAPTCHA_DOMAIN_NAME() {
      return sdk.io.fromEnv('CAPTCHA_DOMAIN_NAME', '')
    },

    // used for launchdarkly
    get LAUNCHDARKLY_SDK_KEY() {
      return sdk.io.fromEnv('LAUNCHDARKLY_SDK_KEY')
    },

    get LAUNCHDARKLY_FRONTEND_SDK_KEY() {
      return sdk.io.fromEnv('LAUNCHDARKLY_FRONTEND_SDK_KEY')
    },

    // used for legacy challenges and quests
    // todo: those variables need to be fulled removed from oidc. They may or may not need to be added to dedicated quest services
    get ACTIVE_CHALLENGE() {
      return sdk.io.fromEnv('ACTIVE_CHALLENGE')
    },
    get TNL_CHARACTER_CONTRACT() {
      return sdk.io.fromEnv('TNL_CHARACTER_CONTRACT')
    },
    get FUTURESCORE_OFFCHAIN_CHALLENGE_ID() {
      return sdk.io.fromEnv('FUTURESCORE_OFFCHAIN_CHALLENGE_ID')
    },
    get ASSET_REGISTRY_QUEST_EVENT_ENDPOINT() {
      return sdk.io.fromEnv('ASSET_REGISTRY_QUEST_EVENT_ENDPOINT')
    },
    get ASSET_REGISTRY_QUEST_EVENT_APIKEY() {
      return sdk.io.fromEnv('ASSET_REGISTRY_QUEST_EVENT_APIKEY')
    },
    get FP_CREATION_BATCH_SIZE() {
      return sdk.io.fromEnv('FP_CREATION_BATCH_SIZE')
    },

    // wellknown clients
    get wellKnownClients() {
      const response_types: ResponseType[] = ['id_token', 'code', 'none']
      const grant_types = ['implicit', 'authorization_code', 'refresh_token']
      const token_endpoint_auth_method = 'none'

      const signer: ClientMetadata = {
        client_id: SIGNER_CLIENT_ID,
        client_secret: SIGNER_CLIENT_SECRET,
        redirect_uris: (() => {
          /**
           * why do we need this?
           *
           * we want to support multiple IDP domains at the same time, which means, from the custodial signer's perspective,
           * multiple providers need to point to different IDP domains.
           *
           * each provider in Singer needs to have an ID and a unique redirect URL, so as well-known clients, we need to
           * pre-register all those redirect URLs
           *
           * here are the steps on how to generate the unique URLs:
           *
           * 1, read SIGNER_REDIRECT_URI from env var, it provides a base URL
           * 2, read ALLOWED_IDP_DOMAINS from env var
           * 3, loop ALLOWED_IDP_DOMAINS and calc the md5 hash for the origin of each domain
           * 4, append the md5 hash to the base URL and return it as the full signer redirect URL
           * 5, append the legacy signer redirect URL ( this can avoid asking experiences to update the SDK, we should remove
           *    this later when the futureverse domain is no longer required )
           */

          const legacyOriginMD5Hash = crypto
            .createHash('md5')
            .update(this.ORIGIN)
            .digest('hex')

          return this.ALLOWED_IDP_DOMAINS.map((allowedIdpDomain) => {
            const originMD5Hash = crypto
              .createHash('md5')
              .update(allowedIdpDomain.origin)
              .digest('hex')
            return `${SIGNER_REDIRECT_URI}_${originMD5Hash}`
          }).concat(`${SIGNER_LEGACY_REDIRECT_URI}_${legacyOriginMD5Hash}`)
        })(),
        response_types,
        grant_types,
      }
      const demo: ClientMetadata | null =
        DEMO_CLIENT_ID != null &&
        DEMO_CLIENT_SECRET != null &&
        DEMO_REDIRECT_URI != null
          ? {
              client_id: DEMO_CLIENT_ID,
              client_secret: DEMO_CLIENT_SECRET,
              redirect_uris: parseClientRedirectUrls(DEMO_REDIRECT_URI),
              response_types,
              grant_types,
              token_endpoint_auth_method,
            }
          : null

      const demoReact: ClientMetadata | null =
        DEMO_REACT_CLIENT_ID != null &&
        DEMO_REACT_REDIRECT_URI != null &&
        DEMO_CLIENT_SECRET != null
          ? {
              client_id: DEMO_REACT_CLIENT_ID,
              redirect_uris: parseClientRedirectUrls(DEMO_REACT_REDIRECT_URI),
              response_types,
              grant_types,
              token_endpoint_auth_method,
            }
          : null

      const identityDashboard: ClientMetadata | null =
        IDENTITY_DASHBOARD_CLIENT_ID != null &&
        IDENTITY_DASHBOARD_CLIENT_SECRET != null &&
        IDENTITY_DASHBOARD_REDIRECT_URI != null
          ? {
              client_id: IDENTITY_DASHBOARD_CLIENT_ID,
              client_secret: IDENTITY_DASHBOARD_CLIENT_SECRET,
              redirect_uris: parseClientRedirectUrls(
                IDENTITY_DASHBOARD_REDIRECT_URI
              ),
              response_types,
              grant_types,
              token_endpoint_auth_method,
            }
          : null
      return {
        signer,
        demo,
        demoReact,
        identityDashboard,
      }
    },

    // variables based services
    get redisClient() {
      if (!REDIS_URL) {
        throw new Error('REDIS_URL not set')
      }
      const redisClient = new Redis(REDIS_URL, { keyPrefix: 'oidc:' })

      return redisClient
    },
    get wallet() {
      const network: ethers.providers.Networkish = {
        name: ETH_CHAIN_NAME,
        chainId: this.ETH_CHAIN_ID,
      }

      const ethersProvider = new ethers.providers.JsonRpcProvider(
        ETH_CHAIN_URL,
        network
      )

      return new ethers.Wallet(ETH_WALLET_KEY, ethersProvider)
    },
    get rateLimiter() {
      let rateLimiter: RateLimiter | null = null

      if (this.redisClient != null) {
        rateLimiter = new RateLimiter({
          db: this.redisClient,
          max: CAPTCHA_IP_RATE_LIMIT_THRESHOLD,
          duration: CATPCHA_IP_RATE_LIMIT_DURATION,
        })
      }

      return rateLimiter
    },
    get smsOtpRateLimiter() {
      let smsOtpRateLimiter: SmsOtpRateLimiter | null = null

      // FIXME: change this back to !this.isDevelopment
      if (this.isDevelopment) {
        const otpStorage =
          this.redisClient == null
            ? new MemoryOtpStorage()
            : new RedisOtpStorage(this.redisClient)

        smsOtpRateLimiter = new SmsOtpRateLimiter(
          otpStorage,
          TWILIO_ACCCOUNT_SID,
          TWILIO_AUTH_TOKEN,
          TWILIO_SMS_VERIFICATION_SERVICE_ID
        )
      }

      return smsOtpRateLimiter
    },
    get emailOtpRateLimiter() {
      const otpStorage =
        this.redisClient == null
          ? new MemoryOtpStorage()
          : new RedisOtpStorage(this.redisClient)

      return new EmailOtpRateLimiter(otpStorage)
    },
    get mailer() {
      return createMailer({
        apiKey: SEND_GRID_API_KEY,
        from: SEND_GRID_FROM_EMAIL,
        defaultTemplateId: SEND_GRID_TEMPLATE_ID,
      })
    },
  }
})()

const BooleanFromString = new t.Type<boolean, string>(
  'BooleanFromString',
  (input: unknown): input is boolean => typeof input === 'boolean',
  (i: unknown, context: t.Context): t.Validation<boolean> => {
    if (typeof i === 'string') {
      if (i.toLowerCase() === 'true' || i === '1') {
        return t.success(true)
      }

      if (i.toLowerCase() === 'false' || i === '0') {
        return t.success(false)
      }
    }

    return t.failure(i, context)
  },
  (output: boolean): string => output.toString()
)

/* eslint-enable @typescript-eslint/no-unnecessary-condition -- enable the rest */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- enable the rest */
/* eslint-enable @typescript-eslint/no-unsafe-return -- enable the rest */
/* eslint-enable  @typescript-eslint/no-unsafe-member-access -- enable the rest */
/* eslint-enable @typescript-eslint/no-unsafe-argument -- enable the rest */
