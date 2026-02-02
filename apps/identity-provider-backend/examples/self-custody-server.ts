/**
 * Example Server Setup for Self-Custody Authentication
 * 
 * This file demonstrates how to set up the FuturePass Identity Provider
 * with self-custody authentication (SIWE and XRPL wallets).
 * 
 * Usage:
 *   npx ts-node examples/self-custody-server.ts
 * 
 * Required environment variables:
 *   - OIDC_ISSUER: The issuer URL (e.g., https://login.futureverse.app)
 *   - OIDC_KEYSTORE: JSON Web Key Set for signing tokens
 *   - ETH_CHAIN_ID: Ethereum chain ID (e.g., 7672 for Root Network)
 *   - EVM_CHAIN_ID: EVM chain ID
 *   - CSRF_SECRET: Secret for CSRF token generation
 *   - SESSION_SECRET: Secret for session cookies
 *   - DYNAMODB_USER_TABLE: DynamoDB table for user data
 *   - DYNAMODB_OIDC_TABLE: DynamoDB table for OIDC sessions
 *   - DELEGATED_ACCOUNT_INDEXER_API_BASE_URL: Account indexer API URL
 *   - PORT: Server port (default: 4200)
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'

import {
  // Types
  FVSub,
  encodeSub,
  
  // Strategies
  createSiweStrategyFromEnv,
  createXrplStrategyFromEnv,
  
  // Services
  createDynamoDBStorageFromEnv,
  createCachedAccountIndexerFromEnv,
  
  // OIDC
  createOIDCConfiguration,
  createDynamoDBAdapterFactoryFromEnv,
  
  // Routes
  createLoginRoutes,
  createSiweRoutes,
  createXrplRoutes,
} from '../auth'

// ============================================================================
// Environment Configuration
// ============================================================================

const requiredEnvVars = [
  'OIDC_ISSUER',
  'OIDC_KEYSTORE',
  'ETH_CHAIN_ID',
  'EVM_CHAIN_ID',
  'CSRF_SECRET',
  'SESSION_SECRET',
  'DELEGATED_ACCOUNT_INDEXER_API_BASE_URL',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// ============================================================================
// Server Setup
// ============================================================================

async function main() {
  const app = express()
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4200
  const issuer = process.env.OIDC_ISSUER!
  const chainId = parseInt(process.env.ETH_CHAIN_ID!, 10)

  // Parse JWKS from environment
  const jwks = JSON.parse(process.env.OIDC_KEYSTORE!)

  // ========================================================================
  // Middleware
  // ========================================================================
  
  app.set('trust proxy', 1) // Trust first proxy
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(cors({
    origin: true, // Reflect the request origin
    credentials: true,
  }))
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for OAuth redirects
  }))

  // ========================================================================
  // Health Check
  // ========================================================================
  
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  // ========================================================================
  // Initialize Services
  // ========================================================================
  
  console.log('Initializing services...')
  
  // User storage (DynamoDB)
  const userStorage = createDynamoDBStorageFromEnv()
  console.log('✓ User storage initialized')
  
  // Account indexer (for FuturePass lookups)
  const accountIndexer = createCachedAccountIndexerFromEnv()
  console.log('✓ Account indexer initialized')
  
  // Authentication strategies
  const siweStrategy = createSiweStrategyFromEnv()
  console.log('✓ SIWE strategy initialized')
  
  // Note: XRPL strategy requires SDK's deriveAddressPair function
  // This would need to be imported from @futureverse/experience-sdk
  // const xrplStrategy = createXrplStrategyFromEnv(deriveAddressPair)

  // ========================================================================
  // Initialize OIDC Provider
  // ========================================================================
  
  console.log('Initializing OIDC provider...')
  
  // Create OIDC configuration
  const oidcConfig = createOIDCConfiguration({
    issuer,
    jwks,
    chainId,
    userStorage,
    accountIndexer,
    adapter: createDynamoDBAdapterFactoryFromEnv(),
    sessionSecret: process.env.SESSION_SECRET!,
    devMode: process.env.NODE_ENV !== 'production',
  })

  // Dynamic import for oidc-provider (ESM module)
  const { default: Provider } = await import('oidc-provider')
  const oidcProvider = new Provider(issuer, oidcConfig)
  console.log('✓ OIDC provider initialized')

  // ========================================================================
  // Authentication Routes
  // ========================================================================
  
  console.log('Setting up routes...')

  // Helper to complete OIDC interaction
  const completeInteraction = async (req: express.Request, res: express.Response, accountId: string) => {
    return oidcProvider.interactionResult(req, res, {
      login: { accountId },
    })
  }

  // Helper to store intermediate interaction result
  const getInteractionResult = async (req: express.Request, res: express.Response, result: object) => {
    return oidcProvider.interactionResult(req, res, result)
  }

  // SIWE routes
  app.use('/login/siwe', createSiweRoutes({
    strategy: siweStrategy,
    userStorage,
    completeInteraction,
    getInteractionResult,
  }))
  console.log('✓ SIWE routes mounted at /login/siwe')

  // XRPL routes (uncomment when SDK is available)
  // app.use('/login/xrpl', createXrplRoutes({
  //   strategy: xrplStrategy,
  //   userStorage,
  //   completeInteraction,
  //   getInteractionResult,
  // }))

  // Main login routes
  app.use('/login', createLoginRoutes({
    userStorage,
    accountIndexer,
    oidcProvider,
    chainId,
    frontendUrl: process.env.FRONTEND_URL,
  }))
  console.log('✓ Login routes mounted at /login')

  // OIDC provider routes
  app.use(oidcProvider.callback())
  console.log('✓ OIDC provider routes mounted')

  // ========================================================================
  // Error Handler
  // ========================================================================
  
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err)
    res.status(500).json({
      error: 'internal_error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
    })
  })

  // ========================================================================
  // Start Server
  // ========================================================================
  
  app.listen(port, () => {
    console.log('')
    console.log('='.repeat(60))
    console.log('FuturePass Identity Provider - Self-Custody Auth')
    console.log('='.repeat(60))
    console.log(`Server running at ${issuer}`)
    console.log(`Chain ID: ${chainId}`)
    console.log('')
    console.log('Available endpoints:')
    console.log('  GET  /.well-known/openid-configuration')
    console.log('  GET  /.well-known/jwks.json')
    console.log('  GET  /auth (authorization endpoint)')
    console.log('  POST /token')
    console.log('  GET  /userinfo')
    console.log('  POST /login/siwe/nonce')
    console.log('  POST /login/siwe/verify')
    console.log('  POST /login/accept_terms')
    console.log('='.repeat(60))
    console.log('')
  })
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
