import crypto from 'crypto'
import * as sdk from '@futureverse/experience-sdk'
import { clsx, type ClassValue } from 'clsx'
import * as E from 'fp-ts/lib/Either'
import { twMerge } from 'tailwind-merge'

export function bytesFromHexString(
  hexData: string /* assumes 0x prefix */
): number {
  if (!hexData.startsWith('0x')) return 0

  return Math.round(hexData.slice(2).length / 2)
}

export function decodeOrThrow<T>(data: E.Either<unknown, T>): T {
  if (E.isLeft(data)) {
    throw new Error('failed decoding: ' + data.left)
  }
  return data.right
}

export function hush<E, A>(e: E.Either<E, A>): A | null {
  if (E.isLeft(e)) {
    return null
  }
  return e.right
}

export function getProviderIdForIdpDomain(domain: string): string {
  return `fv_${crypto.createHash('md5').update(domain).digest('hex')}`
}

/**
 * A handy utility function that makes optional tailwind classes more readable and effective.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toChainLocation(chainId: number, contractAddress: string) {
  const chainType = chainId === 1 || chainId === 11_155_111 ? 'evm' : 'root'
  const chainLocationE = sdk.ChainLocation.decode({
    chainId: chainId.toString(),
    chainType,
    chainAddress: contractAddress,
  })
  if (E.isLeft(chainLocationE)) {
    throw new Error('Invalid chain location')
  }
  return chainLocationE.right
}
