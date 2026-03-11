/**
 * XRPL (XRP Ledger) Wallet Authentication Strategy
 *
 * This module implements authentication using XRPL wallets.
 * Users sign a transaction with their XRPL wallet to prove ownership.
 * The signature is verified and an EOA address is derived from the public key.
 *
 * @see https://xrpl.org/
 */

import { verifySignature } from 'verify-xrpl-signature'
import * as E from 'fp-ts/Either'
import { AuthenticationError } from '../types'

// ============================================================================
// Types
// ============================================================================

/** Result of XRPL verification */
export interface XrplVerificationResult {
  /** The derived Ethereum-compatible EOA address */
  eoa: string
  /** The XRPL r-address */
  rAddress: string
  /** The XRPL public key */
  publicKey: string
}

/** Configuration for XRPL authentication */
export interface XrplConfig {
  /** Expected chain ID for the derived EOA */
  chainId: number
}

/** Signature verification result from verify-xrpl-signature */
interface XrplSignatureResult {
  signatureValid: boolean
  signedBy: string
}

// ============================================================================
// Address Derivation Utilities
// ============================================================================

/**
 * Derives an Ethereum-compatible address pair from an XRPL public key
 *
 * This is a placeholder implementation - the actual SDK function should be used
 * The real implementation uses:
 * 1. Decode the XRPL public key (ED25519 or SECP256k1)
 * 2. Hash the public key bytes
 * 3. Derive both the ETH address and XRPL r-address
 *
 * @param publicKey - The XRPL public key (hex or ED-prefixed)
 * @returns Tuple of [eoa, rAddress]
 */
function deriveAddressPair(publicKey: string): [string, string] {
  // This would use the actual SDK implementation:
  // import * as sdk from '@futureverse/experience-sdk'
  // return sdk.deriveAddressPair(publicKey)

  // For now, we'll need to import the actual SDK
  // This is a type stub
  throw new Error('deriveAddressPair not implemented - import from @futureverse/experience-sdk')
}

// ============================================================================
// XRPL Authentication Strategy
// ============================================================================

export class XrplAuthStrategy {
  private readonly config: XrplConfig

  // Import the actual SDK function when available
  private readonly deriveAddressPair: (publicKey: string) => [string, string]

  constructor(
    config: XrplConfig,
    deriveAddressPairFn?: (publicKey: string) => [string, string]
  ) {
    this.config = config
    this.deriveAddressPair = deriveAddressPairFn ?? deriveAddressPair
  }

  /**
   * Verifies an XRPL wallet authentication
   *
   * This method performs the following validations:
   * 1. Verify the transaction signature using the XRPL library
   * 2. Derive the r-address from the public key
   * 3. Ensure derived r-address matches the signer
   * 4. Derive the EOA from the public key
   * 5. Ensure derived EOA matches the provided EOA
   *
   * @param publicKey - The XRPL public key (hex-encoded or ED-prefixed)
   * @param transaction - The signed transaction blob
   * @param providedEoa - The EOA claimed by the client
   * @returns Either an error or the verification result
   */
  verify(
    publicKey: string,
    transaction: string,
    providedEoa: string
  ): E.Either<AuthenticationError, XrplVerificationResult> {
    try {
      // Step 1: Verify the transaction signature
      const signatureResult = verifySignature(transaction) as XrplSignatureResult

      if (!signatureResult.signatureValid) {
        return E.left(new AuthenticationError(
          'Invalid XRPL transaction signature',
          4006001,
          401
        ))
      }

      // Step 2: Derive addresses from public key
      const [derivedEoa, derivedRAddress] = this.deriveAddressPair(publicKey)

      // Step 3: Verify derived r-address matches the signer
      if (derivedRAddress !== signatureResult.signedBy) {
        return E.left(new AuthenticationError(
          'Derived r-address does not match transaction signer',
          4006002,
          401
        ))
      }

      // Step 4: Verify derived EOA matches provided EOA
      if (derivedEoa.toLowerCase() !== providedEoa.toLowerCase()) {
        return E.left(new AuthenticationError(
          'Derived EOA does not match provided EOA',
          4006003,
          401
        ))
      }

      // Step 5: Return success
      return E.right({
        eoa: derivedEoa.toLowerCase(),
        rAddress: derivedRAddress,
        publicKey,
      })

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error during XRPL verification'
      return E.left(new AuthenticationError(message, 4006004, 500))
    }
  }

  /**
   * Verifies an XRPL login_hint from an OIDC authorization request
   *
   * The login_hint format is:
   * "xrpl:{publicKey}:eoa:{eoaAddress}:tx:{signedTransaction}"
   *
   * @param loginHint - The login_hint parameter value (without "xrpl:" prefix)
   * @returns Either an error or the verification result
   */
  verifyLoginHint(loginHint: string): E.Either<AuthenticationError, XrplVerificationResult> {
    try {
      // Parse the login_hint
      // Expected format after removing "xrpl:" prefix:
      // {publicKey}:eoa:{eoaAddress}:tx:{transaction}
      // Or the simplified format from the existing code:
      // {publicKey}:eoa:{eoaAddress}:{transaction} (6 parts with "xrpl:" prefix)

      const parts = loginHint.split(':')

      // Handle different formats
      let publicKey: string
      let eoa: string
      let transaction: string

      if (parts.length >= 4) {
        // Format: publicKey:eoa:eoaAddress:transaction (without xrpl: prefix)
        // Or: publicKey:eoa:eoaAddress (then transaction is in last part)
        publicKey = parts[0]

        // Find 'eoa' marker
        const eoaIndex = parts.indexOf('eoa')
        if (eoaIndex === -1 || eoaIndex + 1 >= parts.length) {
          return E.left(new AuthenticationError(
            'Invalid login_hint format: missing eoa marker or value',
            4006005,
            400
          ))
        }

        eoa = parts[eoaIndex + 1]

        // Transaction is everything after EOA
        // Check if there's a 'tx' marker or just use the last part
        const txIndex = parts.indexOf('tx')
        if (txIndex !== -1 && txIndex + 1 < parts.length) {
          transaction = parts.slice(txIndex + 1).join(':')
        } else if (eoaIndex + 2 < parts.length) {
          transaction = parts.slice(eoaIndex + 2).join(':')
        } else {
          return E.left(new AuthenticationError(
            'Invalid login_hint format: missing transaction',
            4006006,
            400
          ))
        }
      } else {
        return E.left(new AuthenticationError(
          'Invalid login_hint format: insufficient parts',
          4006007,
          400
        ))
      }

      // Validate public key format
      if (!this.isValidXrplPublicKey(publicKey)) {
        return E.left(new AuthenticationError(
          'Invalid XRPL public key format',
          4006008,
          400
        ))
      }

      // Perform verification
      return this.verify(publicKey, transaction, eoa)

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify XRPL login_hint'
      return E.left(new AuthenticationError(message, 4006009, 400))
    }
  }

  /**
   * Validates XRPL public key format
   *
   * XRPL public keys can be:
   * - ED25519: Prefixed with "ED" followed by 64 hex characters
   * - SECP256k1: 66 hex characters
   *
   * @param publicKey - The public key to validate
   * @returns true if valid format
   */
  private isValidXrplPublicKey(publicKey: string): boolean {
    if (!publicKey) return false

    // ED25519 keys start with "ED"
    if (publicKey.toUpperCase().startsWith('ED')) {
      return /^ED[A-Fa-f0-9]{64}$/i.test(publicKey)
    }

    // SECP256k1 keys are hex-encoded
    return /^[A-Fa-f0-9]{66}$/.test(publicKey)
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an XRPL authentication strategy with the given configuration
 *
 * @param config - XRPL configuration
 * @param deriveAddressPairFn - Optional custom address derivation function
 * @returns Configured XrplAuthStrategy instance
 */
export function createXrplStrategy(
  config: XrplConfig,
  deriveAddressPairFn?: (publicKey: string) => [string, string]
): XrplAuthStrategy {
  return new XrplAuthStrategy(config, deriveAddressPairFn)
}

/**
 * Creates an XRPL strategy from environment variables
 *
 * Required env vars:
 * - ETH_CHAIN_ID
 *
 * @param deriveAddressPairFn - The SDK's address derivation function
 * @returns Configured XrplAuthStrategy instance
 */
export function createXrplStrategyFromEnv(
  deriveAddressPairFn: (publicKey: string) => [string, string]
): XrplAuthStrategy {
  const chainId = process.env.ETH_CHAIN_ID

  if (!chainId) throw new Error('ETH_CHAIN_ID environment variable is required')

  return new XrplAuthStrategy(
    { chainId: parseInt(chainId, 10) },
    deriveAddressPairFn
  )
}
