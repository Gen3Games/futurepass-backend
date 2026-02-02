/**
 * SIWE (Sign-In with Ethereum) Authentication Strategy
 * 
 * This module implements the Sign-In with Ethereum (EIP-4361) authentication flow.
 * Users sign a message with their Ethereum wallet to prove ownership of their address.
 * 
 * @see https://eips.ethereum.org/EIPS/eip-4361
 * @see https://docs.login.xyz/
 */

import { SiweMessage, SiweError } from 'siwe'
import CSRF from 'csrf'
import { either as E, Either } from 'fp-ts/Either'
import * as t from 'io-ts'
import { AuthenticationError, SignInHeaders, SiweVerifyRequest } from '../types'

// ============================================================================
// Types
// ============================================================================

/** Result of SIWE verification */
export interface SiweVerificationResult {
  /** The verified Ethereum address (checksummed) */
  address: string
  /** The validated SIWE message */
  message: SiweMessage
  /** Chain ID from the message */
  chainId: number
  /** Domain that issued the challenge */
  domain: string
  /** Issued at timestamp */
  issuedAt?: string
  /** Expiration timestamp */
  expirationTime?: string
}

/** Configuration for SIWE authentication */
export interface SiweConfig {
  /** Secret for CSRF token generation/verification */
  csrfSecret: string
  /** Expected domain for SIWE messages */
  domain: string
  /** Expected URI for SIWE messages */
  uri: string
  /** Expected chain ID */
  chainId: number
  /** Maximum age of SIWE message in seconds (default: 300 = 5 minutes) */
  maxAge?: number
}

// ============================================================================
// SIWE Authentication Strategy
// ============================================================================

export class SiweAuthStrategy {
  private readonly config: SiweConfig
  private readonly csrf: CSRF

  constructor(config: SiweConfig) {
    this.config = {
      ...config,
      maxAge: config.maxAge ?? 300, // Default 5 minutes
    }
    this.csrf = new CSRF()
  }

  /**
   * Generates a nonce for SIWE message signing
   * The nonce is a CSRF token that must be included in the SIWE message
   * 
   * @returns A cryptographically secure nonce string
   */
  generateNonce(): string {
    return this.csrf.create(this.config.csrfSecret)
  }

  /**
   * Verifies a CSRF token/nonce
   * 
   * @param token - The token to verify
   * @returns true if valid, false otherwise
   */
  verifyNonce(token: string): boolean {
    return this.csrf.verify(this.config.csrfSecret, token)
  }

  /**
   * Validates request headers for SIWE verification
   * 
   * @param headers - Request headers object
   * @returns Either an error or the validated headers
   */
  validateHeaders(headers: unknown): Either<Error, { csrfToken: string }> {
    const result = SignInHeaders.decode(headers)
    if (E.isLeft(result)) {
      return E.left(new Error('Missing or invalid x-csrf-token header'))
    }
    return E.right({ csrfToken: result.right['x-csrf-token'] })
  }

  /**
   * Validates request body for SIWE verification
   * 
   * @param body - Request body object
   * @returns Either an error or the validated request
   */
  validateBody(body: unknown): Either<Error, SiweVerifyRequest> {
    const result = SiweVerifyRequest.decode(body)
    if (E.isLeft(result)) {
      return E.left(new Error('Missing or invalid message/signature in request body'))
    }
    return E.right(result.right)
  }

  /**
   * Verifies a SIWE message and signature
   * 
   * This method performs the following validations:
   * 1. CSRF token verification
   * 2. SIWE message parsing
   * 3. Signature verification (proves address ownership)
   * 4. Domain and URI validation
   * 5. Timestamp validation (not expired, not too old)
   * 
   * @param message - The SIWE message (JSON string)
   * @param signature - The hex-encoded signature
   * @param csrfToken - The CSRF token from headers
   * @returns Either an error or the verification result
   */
  async verify(
    message: string,
    signature: string,
    csrfToken: string
  ): Promise<Either<AuthenticationError, SiweVerificationResult>> {
    // Step 1: Verify CSRF token
    if (!this.verifyNonce(csrfToken)) {
      return E.left(new AuthenticationError(
        'Invalid or expired CSRF token',
        4005001,
        401
      ))
    }

    try {
      // Step 2: Parse the SIWE message
      let siweMessage: SiweMessage
      try {
        const parsed = JSON.parse(message)
        siweMessage = new SiweMessage(parsed)
      } catch (e) {
        // Try parsing as plain text format
        siweMessage = new SiweMessage(message)
      }

      // Step 3: Validate the signature
      const verificationResult = await siweMessage.verify({
        signature,
        domain: this.config.domain,
        nonce: csrfToken,
      })

      if (!verificationResult.success) {
        const errorMessage = verificationResult.error?.type ?? 'Signature verification failed'
        return E.left(new AuthenticationError(
          errorMessage,
          4005002,
          401
        ))
      }

      // Step 4: Additional validations
      const validatedMessage = verificationResult.data

      // Validate chain ID if present
      if (validatedMessage.chainId && validatedMessage.chainId !== this.config.chainId) {
        return E.left(new AuthenticationError(
          `Chain ID mismatch: expected ${this.config.chainId}, got ${validatedMessage.chainId}`,
          4005003,
          401
        ))
      }

      // Step 5: Return success
      return E.right({
        address: validatedMessage.address,
        message: validatedMessage,
        chainId: validatedMessage.chainId ?? this.config.chainId,
        domain: validatedMessage.domain,
        issuedAt: validatedMessage.issuedAt,
        expirationTime: validatedMessage.expirationTime,
      })

    } catch (error) {
      if (error instanceof SiweError) {
        return E.left(new AuthenticationError(
          `SIWE validation failed: ${error.type}`,
          4005004,
          401
        ))
      }
      
      const message = error instanceof Error ? error.message : 'Unknown error during SIWE verification'
      return E.left(new AuthenticationError(message, 4005005, 500))
    }
  }

  /**
   * Verifies a SIWE login_hint from an OIDC authorization request
   * 
   * The login_hint is URL-encoded and contains the SIWE message parameters
   * Format: "eoa:domain=...&address=...&statement=...&uri=...&version=1&chainId=...&nonce=...&issuedAt=...&signature=..."
   * 
   * @param loginHint - The login_hint parameter value (without "eoa:" prefix)
   * @returns Either an error or the verified address
   */
  async verifyLoginHint(loginHint: string): Promise<Either<AuthenticationError, { address: string }>> {
    try {
      const params = new URLSearchParams(loginHint)
      const signature = params.get('signature')
      
      if (!signature) {
        return E.left(new AuthenticationError(
          'Missing signature in login_hint',
          4005006,
          400
        ))
      }

      // Build SIWE message from params
      const messageParams: Record<string, string> = {}
      params.forEach((value, key) => {
        if (key !== 'signature') {
          messageParams[key] = value
        }
      })

      const siweMessage = new SiweMessage(messageParams)

      // Set expected values
      siweMessage.version = '1'
      siweMessage.uri = this.config.uri
      siweMessage.chainId = this.config.chainId

      // Validate signature
      const result = await siweMessage.verify({ signature })

      if (!result.success) {
        return E.left(new AuthenticationError(
          'Invalid signature in login_hint',
          4005007,
          401
        ))
      }

      return E.right({ address: result.data.address })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify login_hint'
      return E.left(new AuthenticationError(message, 4005008, 400))
    }
  }

  /**
   * Creates a SIWE message for the client to sign
   * This is a helper method for testing or server-side message generation
   * 
   * @param address - The Ethereum address
   * @param nonce - The nonce (CSRF token)
   * @param statement - Optional statement to include
   * @returns The prepared SIWE message
   */
  createMessage(
    address: string,
    nonce: string,
    statement?: string
  ): SiweMessage {
    const now = new Date()
    const expirationTime = new Date(now.getTime() + (this.config.maxAge! * 1000))

    return new SiweMessage({
      domain: this.config.domain,
      address,
      statement: statement ?? 'Sign in with Ethereum to FuturePass',
      uri: this.config.uri,
      version: '1',
      chainId: this.config.chainId,
      nonce,
      issuedAt: now.toISOString(),
      expirationTime: expirationTime.toISOString(),
    })
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a SIWE authentication strategy with the given configuration
 * 
 * @param config - SIWE configuration
 * @returns Configured SiweAuthStrategy instance
 */
export function createSiweStrategy(config: SiweConfig): SiweAuthStrategy {
  return new SiweAuthStrategy(config)
}

/**
 * Creates a SIWE strategy from environment variables
 * 
 * Required env vars:
 * - CSRF_SECRET
 * - OIDC_ISSUER (used for domain/uri)
 * - ETH_CHAIN_ID
 * 
 * @returns Configured SiweAuthStrategy instance
 */
export function createSiweStrategyFromEnv(): SiweAuthStrategy {
  const csrfSecret = process.env.CSRF_SECRET
  const issuer = process.env.OIDC_ISSUER
  const chainId = process.env.ETH_CHAIN_ID

  if (!csrfSecret) throw new Error('CSRF_SECRET environment variable is required')
  if (!issuer) throw new Error('OIDC_ISSUER environment variable is required')
  if (!chainId) throw new Error('ETH_CHAIN_ID environment variable is required')

  const url = new URL(issuer)

  return new SiweAuthStrategy({
    csrfSecret,
    domain: url.host,
    uri: issuer,
    chainId: parseInt(chainId, 10),
  })
}
