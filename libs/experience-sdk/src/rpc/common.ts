import * as t from '@sylo/io-ts'
import { BigNumber as BigNumberImpl } from 'ethers'

export const BigNumber = new t.Type<BigNumberImpl, string, unknown>(
  'BigNumber',
  (u): u is BigNumberImpl => u instanceof BigNumberImpl,
  (s, c) => {
    if (typeof s === 'string' || typeof s === 'number') {
      const n = BigNumberImpl.from(s)
      if (!n._isBigNumber) {
        return t.failure(s, c, 'Invalid BigNumber')
      }
      return t.success(n)
    }
    return t.failure(s, c, 'Expected a JS number or base-10 encoded string')
  },
  (a) => (typeof a === 'string' ? a : a.toHexString()) // ...
)

const BytesLike = t.union([t.string, t.number, t.array(t.number)], 'BytesLike')

export const TransactionRequest = t.partial(
  {
    to: t.string,
    from: t.string,
    nonce: BigNumber,
    gasLimit: BigNumber,
    gasPrice: BigNumber,
    data: BytesLike,
    value: BigNumber,
    chainId: t.number,
    type: t.number,
    accessList: t.any,
    maxPriorityFeePerGas: BigNumber,
    maxFeePerGas: BigNumber,
    customData: t.any,
    ccipReadEnabled: t.boolean,
  },
  'TransactionRequest'
)
