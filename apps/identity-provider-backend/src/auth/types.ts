/**
 * Core type definitions for FuturePass Authentication
 * 
 * This module defines the fundamental types used throughout the authentication system,
 * including user subjects (FVSub), user data structures, and JWT claims.
 */

import * as t from 'io-ts'
import { either as E } from 'fp-ts'
import { isHex } from '@polkadot/util'

// ============================================================================
// Address Types
// ============================================================================

/** Ethereum/EVM address string (0x prefixed, 40 hex chars) */
export type ETHAddress = string

/** Validates an Ethereum address format */
export const ETHAddress = new t.Type<string, string, unknown>(
  'ETHAddress',
  (u): u is string => typeof u === 'string' && /^0x[a-fA-F0-9]{40}$/.test(u),
  (u, c) => {
    if (typeof u !== 'string') return t.failure(u, c, 'Expected string')
    if (!/^0x[a-fA-F0-9]{40}$/.test(u)) return t.failure(u, c, 'Invalid ETH address format')
    return t.success(u.toLowerCase())
  },
  (a) => a.toLowerCase()
)

// ============================================================================
// Social SSO Types
// ============================================================================

/** Supported social login providers */
export const SocialSSOType = t.keyof({
  google: null,
  apple: null,
  facebook: null,
  twitter: null,
  tiktok: null,
})
export type SocialSSOType = t.TypeOf<typeof SocialSSOType>

// ============================================================================
// User Subject (FVSub) - Core Identity Type
// ============================================================================

/**
 * FVSub represents the unique identifier for a user in the FuturePass system.
 * It encodes the authentication method and associated identifier.
 * 
 * Formats:
 * - Self-custody ETH: "eoa:0x1234..."
 * - Self-custody XRPL: "xrpl:ED01234...:eoa:0x5678..."
 * - Custodial email: "email:user@example.com"
 * - Custodial social: "idp:google:1234567890"
 */
export type FVSubImpl = 
  | { type: 'eoa'; eoa: string }
  | { type: 'xrpl'; publicKey: string; eoa: string }
  | { type: 'email'; email: string }
  | { type: 'idp'; idp: SocialSSOType; sub: string }

export const FVSubImpl = t.union([
  t.type({
    type: t.literal('eoa'),
    eoa: t.string,
  }),
  t.type({
    type: t.literal('xrpl'),
    eoa: t.string,
    publicKey: t.string,
  }),
  t.type({
    type: t.literal('email'),
    email: t.string,
  }),
  t.type({
    type: t.literal('idp'),
    idp: SocialSSOType,
    sub: t.string,
  }),
])

/**
 * FVSub codec for encoding/decoding user subjects to/from strings
 */
export type FVSub = t.TypeOf<typeof FVSub>
export const FVSub = new t.Type<FVSubImpl, string, string>(
  'FVSub',
  (u): u is FVSubImpl => FVSubImpl.is(u),
  (u, c) => {
    const [type, ...rest] = u.split(':')
    switch (type) {
      case 'email': {
        const email = rest.join(':')
        if (email === '') return t.failure(u, c, 'email is missing')
        return t.success({ type, email })
      }
      case 'idp': {
        const [idp, sub] = rest
        if (idp == null) return t.failure(u, c, 'idp is missing')
        const socialIdp = SocialSSOType.decode(idp)
        if (E.isLeft(socialIdp)) return t.failure(u, c, 'idp is invalid')
        if (sub === '') return t.failure(u, c, 'sub is missing')
        return t.success({ type, idp: socialIdp.right, sub })
      }
      case 'eoa': {
        const eoa = rest.join(':')
        if (eoa === '') return t.failure(u, c, 'eoa is missing')
        return t.success({ type, eoa })
      }
      case 'xrpl': {
        const [publicKey, _, eoa] = rest
        if (
          publicKey === '' ||
          (!isHex(publicKey) && !publicKey.toLowerCase().startsWith('ed'))
        ) {
          return t.failure(u, c, 'publicKey is missing or invalid')
        }
        if (eoa === '') return t.failure(u, c, 'eoa is missing')
        return t.success({ type, publicKey, eoa })
      }
      default:
        return t.failure(u, c, `Unknown sub type: ${type}`)
    }
  },
  (v) => {
    switch (v.type) {
      case 'email': return `email:${v.email}`
      case 'idp': return `idp:${v.idp}:${v.sub}`
      case 'eoa': return `eoa:${v.eoa}`
      case 'xrpl': return `xrpl:${v.publicKey}:eoa:${v.eoa}`
    }
  }
)

// ============================================================================
// Custodian Type
// ============================================================================

/** Identifies who holds custody of the user's private keys */
export type Custodian = 'fv' | 'self'

/** Determines custodian based on authentication method */
export function custodianOf(sub: FVSub): Custodian {
  return sub.type === 'eoa' || sub.type === 'xrpl' ? 'self' : 'fv'
}

// ============================================================================
// User Data Structures
// ============================================================================

/** User data stored in the database */
export interface FVUser {
  /** User subject identifier */
  sub: FVSub
  /** The EOA (Externally Owned Account) address */
  eoa: ETHAddress
  /** Whether user has accepted terms and conditions */
  hasAcceptedTerms: boolean
  /** Timestamp of account creation */
  createdAt?: number
  /** Timestamp of last update */
  updatedAt?: number
}

export const FVUserData = t.type({
  sub: FVSubImpl,
  hasAcceptedTerms: t.boolean,
})
export type FVUserData = t.TypeOf<typeof FVUserData>

/** Additional user profile information */
export const FVUserProfile = t.partial({
  email: t.string,
  /** Hosted domain (for Google Workspace accounts) */
  hd: t.string,
  /** Display name */
  name: t.string,
  /** Avatar URL */
  picture: t.string,
})
export type FVUserProfile = t.TypeOf<typeof FVUserProfile>

// ============================================================================
// Custodial Account Types
// ============================================================================

/** Address of a custodial account (Futureverse-managed) */
export type FVCustodialAccount = ETHAddress

/** Address of a FuturePass smart account */
export type FVSmartAccount = ETHAddress

// ============================================================================
// JWT and Token Types
// ============================================================================

/** Claims included in the ID token */
export interface IDTokenClaims {
  /** Subject identifier (encoded FVSub) */
  sub: string
  /** EOA address */
  eoa: string
  /** FuturePass smart account address */
  futurepass?: string
  /** Chain ID */
  chainId: number
  /** Who holds custody */
  custodian: Custodian
  /** User's email if available */
  email?: string
}

/** JWT payload for internal auth tokens */
export const JwtPayload = t.type({
  iss: t.string,
  iat: t.number,
  exp: t.number,
  eoa: ETHAddress,
})
export type JwtPayload = t.TypeOf<typeof JwtPayload>

// ============================================================================
// Request/Response Types
// ============================================================================

/** Headers required for SIWE verification */
export const SignInHeaders = t.type({
  'x-csrf-token': t.string,
})
export type SignInHeaders = t.TypeOf<typeof SignInHeaders>

/** Body for SIWE verify request */
export const SiweVerifyRequest = t.type({
  message: t.string,
  signature: t.string,
})
export type SiweVerifyRequest = t.TypeOf<typeof SiweVerifyRequest>

/** Response from account indexer for linked FuturePass */
export const FuturePassForEoaResponse = t.partial({
  linkedFuturepass: t.string,
})
export type FuturePassForEoaResponse = t.TypeOf<typeof FuturePassForEoaResponse>

/** Full FuturePass account info from indexer */
export const FuturePassAccount = t.partial({
  futurepass: t.string,
  linkedEoas: t.array(t.string),
})
export type FuturePassAccount = t.TypeOf<typeof FuturePassAccount>

// ============================================================================
// Error Types
// ============================================================================

/** Standard API error response */
export const ApiError = t.type({
  status: t.number,
  message: t.string,
  code: t.union([t.number, t.undefined]),
})
export type ApiError = t.TypeOf<typeof ApiError>

/** Authentication-specific error */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/** Validation error */
export class ValidationError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message)
    this.name = 'ValidationError'
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Encode FVSub to string */
export function encodeSub(sub: FVSub): string {
  return FVSub.encode(sub)
}

/** Decode string to FVSub */
export function decodeSub(encoded: string): FVSub | null {
  const result = FVSub.decode(encoded)
  return E.isRight(result) ? result.right : null
}

/** Generate storage key for user data */
export function userStorageKey(sub: FVSub): string {
  return `USER:${encodeSub(sub).toLowerCase()}`
}

/** Generate storage key for user profile */
export function userProfileStorageKey(sub: FVSub): string {
  return `USER_PROFILE:${encodeSub(sub).toLowerCase()}`
}
