import { BigNumber } from 'ethers'
import * as E from 'fp-ts/lib/Either'
import { TokenAmount } from './types'
import {
  addressEquals,
  chainIdToName,
  hush,
  isEthereumAddress,
  notEmpty,
  renderCryptoAmount,
  truncateAddress,
} from './utils'

describe('Sdk utils unit tests', () => {
  describe('Crypto util unit tests', () => {
    describe('renderCryptoAmount', () => {
      const simpleAmount: TokenAmount = {
        value: BigNumber.from('1000000000000000000'),
        symbol: 'ETH',
        decimals: 18,
      }
      it('Correctly handles an amount', () => {
        expect(renderCryptoAmount(simpleAmount)).toEqual('1.0')
      })
      it('Correctly handles an amount with symbol', () => {
        expect(
          renderCryptoAmount(simpleAmount, {
            withSymbol: true,
          })
        ).toEqual('1.0 ETH')
      })
      it('Correctly handles an amount in the thousands', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1000000000000000000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(renderCryptoAmount(thousandsAmount)).toEqual('1,000,000.0')
      })
      it('Correctly handles an amount with decimals', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1033000000000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(renderCryptoAmount(thousandsAmount)).toEqual('1.033')
      })
      it('Only shows a default maximum of 6 decimal places', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1033333300000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(renderCryptoAmount(thousandsAmount)).toEqual('1.033333')
      })

      it('Correctly handles a custom number of decimal places', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1033333300000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(
          renderCryptoAmount(thousandsAmount, {
            decimalPlaces: 2,
          })
        ).toEqual('1.03')
      })

      it('Can hide decimal values', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1033000000000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(
          renderCryptoAmount(thousandsAmount, {
            hideDecimals: true,
          })
        ).toEqual('1')
      })

      it('Can show the full amount', () => {
        const thousandsAmount: TokenAmount = {
          value: BigNumber.from('1033333300000000000'),
          symbol: 'ETH',
          decimals: 18,
        }
        expect(
          renderCryptoAmount(thousandsAmount, {
            showFullAmount: true,
          })
        ).toEqual('1.0333333')
      })
    })
    describe('chainIdToName', () => {
      it('Returns correct name for Ethereum chains', () => {
        expect(chainIdToName(1)).toEqual('Ethereum')
        expect(chainIdToName(11_155_111)).toEqual('Ethereum')
      })
      it('Returns correct name for Root chains', () => {
        expect(chainIdToName(7668)).toEqual('Root')
        expect(chainIdToName(7672)).toEqual('Root')
        expect(chainIdToName(17672)).toEqual('Root')
      })
      it('Throws on an invalid chain', () => {
        expect(() => {
          chainIdToName(123)
        }).toThrowError(new Error('Found invalid chainId=123'))
      })
    })
    describe('truncateAddress', () => {
      it('truncates a string', () => {
        expect(
          truncateAddress('0x61C5ed58CeC4605D8d8f9CB8e0a906298095d187')
        ).toEqual('0x61C5...d187')
      })
      it('handles undefined', () => {
        expect(truncateAddress()).toEqual('')
      })
    })
    describe('isEthereumAddress', () => {
      // Note this uses ethers isAddress under the hood so should be safe
      it('Returns true for a valid address', () => {
        expect(
          isEthereumAddress('0x61C5ed58CeC4605D8d8f9CB8e0a906298095d187')
        ).toEqual(true)
      })
      it('Returns false for an invalid address', () => {
        expect(
          isEthereumAddress('adhvoi6q9847r1t94hj1t4093qgu40q3p4jtg903q74ttjqw')
        ).toEqual(false)
      })
    })
    describe('addressEquals', () => {
      it('Returns true for equal strings', () => {
        expect(
          addressEquals(
            '0x61C5ed58CeC4605D8d8f9CB8e0a906298095d187',
            '0x61C5ed58CeC4605D8d8f9CB8e0a906298095d187'
          )
        ).toEqual(true)
      })
      it('Returns true for strings with the same characters, ignoring casing', () => {
        expect(
          addressEquals(
            '0x61C5ed58CeC4605D8d8f9CB8e0a906298095d187',
            '0x61c5ed58cec4605d8d8f9cb8e0a906298095d187'
          )
        ).toEqual(true)
      })
      it('Returns false for different strings', () => {
        expect(
          addressEquals(
            '0x61c5ed58cec4605d8d8f9cb8e0a906298095d187',
            '0x6F2F81EbccfdBa82220AA9552646bFe0d2636F5F'
          )
        ).toEqual(false)
      })
    })
  })

  describe('TS util unit tests', () => {
    describe('notEmpty', () => {
      it('Returns false for null or undefined', () => {
        expect(notEmpty(null)).toEqual(false)
        expect(notEmpty(undefined)).toEqual(false)
      })
      it('Returns true for other falsy values', () => {
        expect(notEmpty('')).toEqual(true)
        expect(notEmpty(0)).toEqual(true)
        expect(notEmpty(NaN)).toEqual(true)
        expect(notEmpty(false)).toEqual(true)
      })
      it('Returns true for truthy values', () => {
        expect(notEmpty('abc')).toEqual(true)
        expect(notEmpty(1)).toEqual(true)
        expect(notEmpty({})).toEqual(true)
        expect(notEmpty(true)).toEqual(true)
      })
    })
    describe('hush', () => {
      it('returns null on a null value', () => {
        const actual = hush(null)
        expect(actual).toBeNull()
      })

      it('returns null on a E.left value', () => {
        const actual = hush(E.left(123))
        expect(actual).toBeNull()
      })

      it('returns value on a right value', () => {
        const actual = hush(E.right(123))
        expect(actual).toBe(123)
      })
    })
  })
})
