/**
 * Authentication Strategies Index
 * 
 * Exports all authentication strategy implementations
 */

// Base strategy types
export {
  AuthMethod,
  AuthResult,
  AuthStrategy,
  BaseStrategyConfig,
  StrategyRegistry,
  createSubFromAuth,
} from './base'

// SIWE (Sign-In with Ethereum) strategy
export {
  SiweAuthStrategy,
  SiweConfig,
  SiweVerificationResult,
  createSiweStrategy,
  createSiweStrategyFromEnv,
} from './siwe'

// XRPL wallet strategy
export {
  XrplAuthStrategy,
  XrplConfig,
  XrplVerificationResult,
  createXrplStrategy,
  createXrplStrategyFromEnv,
} from './xrpl'
