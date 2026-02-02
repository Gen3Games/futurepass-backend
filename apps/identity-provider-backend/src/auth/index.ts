/**
 * FuturePass Authentication Module
 * 
 * This is the main entry point for the FuturePass authentication system.
 * It provides self-custody (wallet-based) and custodial authentication
 * via an OpenID Connect compliant identity provider.
 * 
 * ## Architecture Overview
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    FuturePass Auth Module                       │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
 * │  │   Routes    │   │  Strategies │   │   OIDC      │           │
 * │  │             │   │             │   │  Provider   │           │
 * │  │ /login/siwe │   │  SIWE       │   │             │           │
 * │  │ /login/xrpl │   │  XRPL       │   │  Claims     │           │
 * │  │ /auth       │   │  Social*    │   │  Tokens     │           │
 * │  │ /token      │   │  Email*     │   │  Sessions   │           │
 * │  └─────────────┘   └─────────────┘   └─────────────┘           │
 * │         │                │                 │                   │
 * │         └────────────────┼─────────────────┘                   │
 * │                          ▼                                     │
 * │  ┌─────────────────────────────────────────────────────────┐   │
 * │  │                      Services                            │   │
 * │  │                                                          │   │
 * │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
 * │  │  │ User Storage │  │ Account      │  │ Session      │   │   │
 * │  │  │ (DynamoDB)   │  │ Indexer      │  │ Management   │   │   │
 * │  │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
 * │  └─────────────────────────────────────────────────────────┘   │
 * │                                                                 │
 * │  * Social and Email strategies are for custodial auth (Phase 2) │
 * └─────────────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Usage Example
 * 
 * ```typescript
 * import express from 'express'
 * import { 
 *   createSiweStrategyFromEnv,
 *   createDynamoDBStorageFromEnv,
 *   createCachedAccountIndexerFromEnv,
 *   createOIDCConfiguration,
 *   createDynamoDBAdapterFactoryFromEnv,
 * } from './auth'
 * 
 * const app = express()
 * 
 * // Initialize services
 * const userStorage = createDynamoDBStorageFromEnv()
 * const accountIndexer = createCachedAccountIndexerFromEnv()
 * const siweStrategy = createSiweStrategyFromEnv()
 * 
 * // Create OIDC configuration
 * const oidcConfig = createOIDCConfiguration({
 *   issuer: process.env.OIDC_ISSUER!,
 *   jwks: JSON.parse(process.env.OIDC_KEYSTORE!),
 *   chainId: parseInt(process.env.ETH_CHAIN_ID!, 10),
 *   userStorage,
 *   accountIndexer,
 *   adapter: createDynamoDBAdapterFactoryFromEnv(),
 *   sessionSecret: process.env.SESSION_SECRET!,
 * })
 * 
 * // Initialize OIDC provider
 * const Provider = require('oidc-provider')
 * const oidc = new Provider(process.env.OIDC_ISSUER!, oidcConfig)
 * 
 * // Mount routes
 * app.use('/auth', oidc.callback())
 * ```
 * 
 * @module auth
 */

// ============================================================================
// Types
// ============================================================================

export * from './types'

// ============================================================================
// Strategies (Self-Custody Authentication)
// ============================================================================

export * from './strategies'

// ============================================================================
// Services
// ============================================================================

export * from './services'

// ============================================================================
// OIDC Provider
// ============================================================================

export * from './oidc'

// ============================================================================
// Routes
// ============================================================================

export * from './routes'
