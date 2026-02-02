/**
 * Base Authentication Strategy Interface
 * 
 * This module defines the common interface for all authentication strategies
 * in the FuturePass authentication system.
 */

import { Either } from 'fp-ts/Either'
import { FVSub, AuthenticationError } from '../types'

// ============================================================================
// Base Types
// ============================================================================

/** Authentication method types */
export type AuthMethod = 'siwe' | 'xrpl' | 'email' | 'social'

/** Result of successful authentication */
export interface AuthResult {
  /** The authenticated subject */
  sub: FVSub
  /** The EOA address */
  eoa: string
  /** Whether this is a new user */
  isNewUser?: boolean
  /** Additional metadata from authentication */
  metadata?: Record<string, unknown>
}

/** Common configuration for all strategies */
export interface BaseStrategyConfig {
  /** Chain ID for blockchain operations */
  chainId: number
}

// ============================================================================
// Base Strategy Interface
// ============================================================================

/**
 * Base interface for authentication strategies
 * 
 * All authentication strategies must implement this interface
 * to provide consistent behavior across the authentication system.
 */
export interface AuthStrategy<TVerifyParams, TResult> {
  /** The authentication method type */
  readonly method: AuthMethod

  /**
   * Verify authentication credentials
   * 
   * @param params - Strategy-specific verification parameters
   * @returns Either an error or the verification result
   */
  verify(params: TVerifyParams): Promise<Either<AuthenticationError, TResult>> | Either<AuthenticationError, TResult>
}

// ============================================================================
// Strategy Registry
// ============================================================================

/**
 * Registry for managing authentication strategies
 */
export class StrategyRegistry {
  private strategies: Map<AuthMethod, AuthStrategy<unknown, unknown>> = new Map()

  /**
   * Register an authentication strategy
   * 
   * @param strategy - The strategy to register
   */
  register<T, R>(strategy: AuthStrategy<T, R>): void {
    this.strategies.set(strategy.method, strategy as AuthStrategy<unknown, unknown>)
  }

  /**
   * Get a registered strategy by method
   * 
   * @param method - The authentication method
   * @returns The strategy or undefined if not found
   */
  get<T, R>(method: AuthMethod): AuthStrategy<T, R> | undefined {
    return this.strategies.get(method) as AuthStrategy<T, R> | undefined
  }

  /**
   * Check if a strategy is registered
   * 
   * @param method - The authentication method
   * @returns true if registered
   */
  has(method: AuthMethod): boolean {
    return this.strategies.has(method)
  }

  /**
   * Get all registered methods
   * 
   * @returns Array of registered authentication methods
   */
  getMethods(): AuthMethod[] {
    return Array.from(this.strategies.keys())
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a FVSub from authentication result
 * 
 * @param method - The authentication method
 * @param identifier - Method-specific identifier
 * @param additionalData - Additional data for complex sub types
 * @returns The constructed FVSub
 */
export function createSubFromAuth(
  method: AuthMethod,
  identifier: string,
  additionalData?: { publicKey?: string; idp?: string }
): FVSub {
  switch (method) {
    case 'siwe':
      return { type: 'eoa', eoa: identifier }
    
    case 'xrpl':
      if (!additionalData?.publicKey) {
        throw new Error('XRPL authentication requires publicKey')
      }
      return { type: 'xrpl', eoa: identifier, publicKey: additionalData.publicKey }
    
    case 'email':
      return { type: 'email', email: identifier }
    
    case 'social':
      if (!additionalData?.idp) {
        throw new Error('Social authentication requires idp')
      }
      // Validate idp is a valid social provider
      const validIdps = ['google', 'apple', 'facebook', 'twitter', 'tiktok']
      if (!validIdps.includes(additionalData.idp)) {
        throw new Error(`Invalid social idp: ${additionalData.idp}`)
      }
      return { 
        type: 'idp', 
        idp: additionalData.idp as 'google' | 'apple' | 'facebook' | 'twitter' | 'tiktok',
        sub: identifier 
      }
  }
}
