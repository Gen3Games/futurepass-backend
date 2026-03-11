/**
 * Account Indexer Service
 *
 * This service interfaces with the FuturePass account indexer API to look up
 * linked FuturePass accounts for EOAs and vice versa.
 */

import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { FuturePassForEoaResponse, FuturePassAccount } from '../types'

// ============================================================================
// Configuration
// ============================================================================

export interface AccountIndexerConfig {
  /** Base URL for the account indexer API */
  baseUrl: string
  /** EVM chain ID (e.g., 7672 for Root Network mainnet) */
  evmChainId: number
  /** ETH chain ID (e.g., 7672 for Root Network mainnet) */
  ethChainId: number
  /** Request timeout in milliseconds */
  timeout?: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface LinkedFuturePassResult {
  /** The linked FuturePass address, if any */
  linkedFuturepass: string | null
}

export interface LinkedEoasResult {
  /** The FuturePass address */
  futurepass: string
  /** List of linked EOA addresses */
  linkedEoas: string[]
}

// ============================================================================
// Account Indexer Service
// ============================================================================

export class AccountIndexerService {
  private readonly config: AccountIndexerConfig
  private readonly timeout: number

  constructor(config: AccountIndexerConfig) {
    this.config = config
    this.timeout = config.timeout ?? 10000 // 10 seconds default
  }

  /**
   * Get the linked FuturePass for an EOA
   *
   * @param eoa - The EOA address to look up
   * @returns The linked FuturePass address or null if none exists
   */
  async getLinkedFuturePassForEoa(eoa: string): Promise<LinkedFuturePassResult> {
    const url = `${this.config.baseUrl}/api/v1/linked-futurepass?eoa=${this.config.evmChainId}:evm:${eoa}`

    try {
      const response = await this.fetchWithTimeout(url)

      if (!response.ok) {
        console.warn(`Account indexer returned ${response.status} for EOA ${eoa}`)
        return { linkedFuturepass: null }
      }

      const raw = await response.text()
      const parsed = this.parseJSON(raw)

      if (E.isLeft(parsed)) {
        console.warn(`Failed to parse account indexer response: ${parsed.left}`)
        return { linkedFuturepass: null }
      }

      const decoded = FuturePassForEoaResponse.decode(parsed.right)

      if (E.isLeft(decoded)) {
        console.warn(`Failed to decode account indexer response: ${PathReporter.report(decoded).join(', ')}`)
        return { linkedFuturepass: null }
      }

      return {
        linkedFuturepass: decoded.right.linkedFuturepass ?? null,
      }

    } catch (error) {
      console.error('Error fetching linked FuturePass:', error)
      return { linkedFuturepass: null }
    }
  }

  /**
   * Get the linked EOAs for a FuturePass
   *
   * @param futurepass - The FuturePass address to look up
   * @returns The FuturePass account with linked EOAs
   */
  async getLinkedEoasForFuturePass(futurepass: string): Promise<LinkedEoasResult | null> {
    const url = `${this.config.baseUrl}/api/v1/linked-eoa?futurepass=${this.config.ethChainId}:root:${futurepass}`

    try {
      const response = await this.fetchWithTimeout(url)

      if (!response.ok) {
        console.warn(`Account indexer returned ${response.status} for FuturePass ${futurepass}`)
        return null
      }

      const raw = await response.text()
      const parsed = this.parseJSON(raw)

      if (E.isLeft(parsed)) {
        console.warn(`Failed to parse account indexer response: ${parsed.left}`)
        return null
      }

      const decoded = FuturePassAccount.decode(parsed.right)

      if (E.isLeft(decoded)) {
        console.warn(`Failed to decode account indexer response: ${PathReporter.report(decoded).join(', ')}`)
        return null
      }

      return {
        futurepass: decoded.right.futurepass ?? futurepass,
        linkedEoas: decoded.right.linkedEoas ?? [],
      }

    } catch (error) {
      console.error('Error fetching linked EOAs:', error)
      return null
    }
  }

  /**
   * Check if an EOA has a linked FuturePass
   *
   * @param eoa - The EOA address to check
   * @returns true if the EOA has a linked FuturePass
   */
  async hasLinkedFuturePass(eoa: string): Promise<boolean> {
    const result = await this.getLinkedFuturePassForEoa(eoa)
    return result.linkedFuturepass !== null
  }

  /**
   * Resolve the FuturePass address for an EOA, returning the EOA itself if no FuturePass exists
   *
   * @param eoa - The EOA address
   * @returns The FuturePass address or the original EOA
   */
  async resolveFuturePassOrEoa(eoa: string): Promise<string> {
    const result = await this.getLinkedFuturePassForEoa(eoa)
    return result.linkedFuturepass ?? eoa
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      return await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Parse JSON safely
   */
  private parseJSON(raw: string): E.Either<string, unknown> {
    try {
      return E.right(JSON.parse(raw))
    } catch (error) {
      return E.left(error instanceof Error ? error.message : 'Failed to parse JSON')
    }
  }
}

// ============================================================================
// Cached Account Indexer
// ============================================================================

export interface CacheConfig {
  /** TTL for cache entries in milliseconds */
  ttl: number
  /** Maximum cache size */
  maxSize: number
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * Account indexer with in-memory caching
 */
export class CachedAccountIndexer {
  private readonly indexer: AccountIndexerService
  private readonly cache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly ttl: number
  private readonly maxSize: number

  constructor(config: AccountIndexerConfig, cacheConfig?: Partial<CacheConfig>) {
    this.indexer = new AccountIndexerService(config)
    this.ttl = cacheConfig?.ttl ?? 60000 // 1 minute default
    this.maxSize = cacheConfig?.maxSize ?? 1000
  }

  async getLinkedFuturePassForEoa(eoa: string): Promise<LinkedFuturePassResult> {
    const cacheKey = `fp:${eoa.toLowerCase()}`

    const cached = this.getFromCache<LinkedFuturePassResult>(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    const result = await this.indexer.getLinkedFuturePassForEoa(eoa)
    this.setInCache(cacheKey, result)

    return result
  }

  async getLinkedEoasForFuturePass(futurepass: string): Promise<LinkedEoasResult | null> {
    const cacheKey = `eoas:${futurepass.toLowerCase()}`

    const cached = this.getFromCache<LinkedEoasResult | null>(cacheKey)
    if (cached !== undefined) {
      return cached
    }

    const result = await this.indexer.getLinkedEoasForFuturePass(futurepass)
    this.setInCache(cacheKey, result)

    return result
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Invalidate cache for a specific EOA
   */
  invalidateEoa(eoa: string): void {
    this.cache.delete(`fp:${eoa.toLowerCase()}`)
  }

  /**
   * Invalidate cache for a specific FuturePass
   */
  invalidateFuturePass(futurepass: string): void {
    this.cache.delete(`eoas:${futurepass.toLowerCase()}`)
  }

  private getFromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined

    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  private setInCache<T>(key: string, value: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    })
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an account indexer from environment variables
 */
export function createAccountIndexerFromEnv(): AccountIndexerService {
  const baseUrl = process.env.DELEGATED_ACCOUNT_INDEXER_API_BASE_URL
  const evmChainId = process.env.EVM_CHAIN_ID
  const ethChainId = process.env.ETH_CHAIN_ID

  if (!baseUrl) throw new Error('DELEGATED_ACCOUNT_INDEXER_API_BASE_URL is required')
  if (!evmChainId) throw new Error('EVM_CHAIN_ID is required')
  if (!ethChainId) throw new Error('ETH_CHAIN_ID is required')

  return new AccountIndexerService({
    baseUrl,
    evmChainId: parseInt(evmChainId, 10),
    ethChainId: parseInt(ethChainId, 10),
  })
}

/**
 * Create a cached account indexer from environment variables
 */
export function createCachedAccountIndexerFromEnv(): CachedAccountIndexer {
  const baseUrl = process.env.DELEGATED_ACCOUNT_INDEXER_API_BASE_URL
  const evmChainId = process.env.EVM_CHAIN_ID
  const ethChainId = process.env.ETH_CHAIN_ID

  if (!baseUrl) throw new Error('DELEGATED_ACCOUNT_INDEXER_API_BASE_URL is required')
  if (!evmChainId) throw new Error('EVM_CHAIN_ID is required')
  if (!ethChainId) throw new Error('ETH_CHAIN_ID is required')

  return new CachedAccountIndexer({
    baseUrl,
    evmChainId: parseInt(evmChainId, 10),
    ethChainId: parseInt(ethChainId, 10),
  })
}
