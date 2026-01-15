import { utils as ethersUtils } from 'ethers'
import { either as E } from 'fp-ts'
import * as Wagmi from 'wagmi'
import { TokenAmount } from './types'

export function renderCryptoAmount(
  amount: TokenAmount,
  config?: {
    withSymbol?: boolean
    hideDecimals?: boolean
    decimalPlaces?: number
    showFullAmount?: boolean
  }
): string {
  const amountToShow = ethersUtils.formatUnits(amount.value, amount.decimals)

  const amountParts = amountToShow.split('.')

  const decimalPlaces = config?.decimalPlaces ?? 6

  const decimals = amountParts[1]
    ? amountParts[1]?.length > decimalPlaces
      ? amountParts[1]?.slice(0, decimalPlaces)
      : amountParts[1]
    : '0'
  const ints = amountParts[0]
    ? amountParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    : '0'

  if (config?.hideDecimals) {
    return `${ints}${config.withSymbol ? ` ${amount.symbol}` : ''}`
  }

  if (config?.showFullAmount) {
    return `${amountToShow}${config.withSymbol ? ` ${amount.symbol}` : ''}`
  }

  return `${ints}.${decimals}${config?.withSymbol ? ` ${amount.symbol}` : ''}`
}

export function chainIdToName(chainId: number) {
  switch (chainId) {
    case 1:
    case 11_155_111:
      return 'Ethereum'
    case 7668:
    case 7672:
    case 17672:
      return 'Root'
    default:
      /**
       * Are we ok to throw here? The assumption is we'll only ever be using the above set of chains.
       * If not how do we want to handle this?
       */
      throw new Error(`Found invalid chainId=${chainId}`)
  }
}

// TODO: we should remove this func and use the codec instead
export function isEthereumAddress(
  rawAddress: string
): rawAddress is Wagmi.Address {
  return ethersUtils.isAddress(rawAddress)
}

// TODO: Should be Address
export function addressEquals(
  firstAddress: string,
  secondAddress: string
): boolean {
  return firstAddress.toLowerCase() === secondAddress.toLowerCase()
}

export function assetIdEquals(
  firstAssetId: string,
  secondAssetId: string
): boolean {
  return firstAssetId.toLowerCase() === secondAssetId.toLowerCase()
}

export function truncateAddress(address?: string): string {
  if (address == null) {
    return ''
  }

  return (
    address.substring(0, 5 + 1) +
    '...' +
    address.substring(address.length - 4, address.length)
  )
}

export function notEmpty<T>(value: T | null | undefined): value is T {
  if (value === null || value === undefined) return false
  return true
}

export function hush<A, B>(v: E.Either<A, B> | null): B | null {
  if (v == null || E.isLeft(v)) return null
  return v.right
}

export function decodedOrThrow<A, B>(v: E.Either<A, B> | null): B {
  if (v == null || E.isLeft(v)) {
    throw new Error('unable to decode value')
  }

  return v.right
}

export function noOp() {
  // noOp
}

// Recursively freeze an object with circular references
export function deepFreeze<T extends object>(x: T): T {
  Object.freeze(x)
  Object.values(x)
    .filter((x) => !Object.isFrozen(x))
    .forEach(deepFreeze)
  return x
}
