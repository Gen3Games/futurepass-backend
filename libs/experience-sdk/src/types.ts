import { deriveAddressPair } from '@therootnetwork/extrinsic'
import { BigNumber, ethers } from 'ethers'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { hush } from './utils'

export const Custodian = t.union(
  [t.literal('fv'), t.literal('self')],
  'Custody'
)
export type Custodian = t.TypeOf<typeof Custodian>

export const BigNumberC = new t.Type<BigNumber, string, unknown>(
  'BigNumber',
  (s: unknown): s is BigNumber => s instanceof BigNumber,
  (i, c) => {
    if (i instanceof BigNumber) {
      return t.success(i)
    }

    if (typeof i === 'string' || typeof i === 'number') {
      try {
        const n = BigNumber.from(i)
        return t.success(n)
      } catch (error) {
        return t.failure(i, c, 'Invalid BigNumber')
      }
    }
    return t.failure(i, c, 'Expected a valid input number or string')
  },
  (a) => a.toString()
)

export type BigNumberC = t.TypeOf<typeof BigNumberC>

export const TokenAmount = t.type({
  value: BigNumberC,
  symbol: t.string,
  decimals: t.number,
})

export type TokenAmount = t.TypeOf<typeof TokenAmount>

export interface UrlBrand {
  readonly Url: unique symbol
}

export const Url = t.brand(
  t.string,
  (s: string): s is t.Branded<string, UrlBrand> => {
    try {
      const url = new URL(s)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  },
  'Url'
)

export type Url = t.TypeOf<typeof Url>

export const Stage = t.union(
  [
    t.literal('development'),
    t.literal('staging'),
    t.literal('audit'),
    t.literal('preview'),
    t.literal('neptune'),
    t.literal('production'),
  ],
  'stage'
)

export type Stage = t.TypeOf<typeof Stage>

export interface AddressBrand {
  readonly Address: unique symbol
}

export const Address = new t.Type<
  `0x${string}` & AddressBrand,
  `0x${string}`,
  unknown
>(
  'Address',
  (s: unknown): s is `0x${string}` & AddressBrand =>
    typeof s === 'string' && ethers.utils.isAddress(s),
  (i, c) => {
    if (typeof i === 'string' && ethers.utils.isAddress(i)) {
      try {
        const ethereumAddress: string = ethers.utils.getAddress(i)
        return t.success(ethereumAddress as `0x${string}` & AddressBrand)
      } catch {
        return t.failure(i, c, 'Expected a valid Ethereum-style address')
      }
    }
    return t.failure(i, c, 'Expected a valid Ethereum-style address')
  },
  (x) => x
)
export type Address = t.TypeOf<typeof Address>

export const User = t.type(
  {
    eoa: Address,
    chainId: t.number,
    custodian: Custodian,
    futurepass: Address,
  },
  'User'
)
export type User = t.TypeOf<typeof User>
export interface AssetIdBrand {
  readonly AssetId: unique symbol
}

export type AssetIdImpl = number & AssetIdBrand

export const AssetId = new t.Type<AssetIdImpl, number, unknown>(
  'AssetId',
  (s: unknown): s is AssetIdImpl => {
    return typeof s === 'number'
  },
  (i, c) => {
    const assetId = Number(i)

    if (isNaN(assetId)) {
      return t.failure(i, c, 'Expected a valid number')
    }

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- cast to distinguish from a standard number
    return t.success(assetId as AssetIdImpl)
  },
  (x) => x
)

export type AssetId = t.TypeOf<typeof AssetId>

export interface TxHashBrand {
  readonly TxHash: unique symbol
}

export const TxHash = new t.Type<
  `0x${string}` & TxHashBrand,
  `0x${string}`,
  unknown
>(
  'TxHash',
  (s: unknown): s is `0x${string}` & TxHashBrand =>
    typeof s === 'string' && ethers.utils.isHexString(s, 32),
  (i, c) => {
    if (typeof i === 'string' && ethers.utils.isHexString(i, 32)) {
      try {
        const txHash: string = ethers.utils.hexlify(i)
        return t.success(txHash as `0x${string}` & TxHashBrand)
      } catch {
        return t.failure(i, c, 'Expected a valid Ethereum transaction hash')
      }
    }
    return t.failure(i, c, 'Expected a valid Ethereum transaction hash')
  },
  (x) => x
)

export type TxHash = t.TypeOf<typeof TxHash>

const ChainId = t.union([
  t.literal('1'),
  t.literal('11155111'), // Sepolia
  t.literal('5'),
  t.literal('7668'),
  t.literal('7672'),
  t.literal('17672'), // Porcini devnet (Sprout-1)
])
type ChainId = t.TypeOf<typeof ChainId>

const ChainType = t.union([t.literal('evm'), t.literal('root')])
type ChainType = t.TypeOf<typeof ChainType>

export const ChainLocationString = new t.Type<Address, string, unknown>(
  'ChainLocationString',
  (s: unknown): s is Address => typeof s === 'string',
  (i, c) => {
    if (typeof i !== 'string') {
      return t.failure(i, c, 'Expected a valid ChainLocation value')
    }

    const chainLocationData = i.split(':')

    if (chainLocationData.length !== 3) {
      return t.failure(i, c, 'Expected a valid ChainLocation value')
    }

    const chainLocationR = ChainLocation.decode({
      chainId: chainLocationData[0],
      chainType: chainLocationData[1],
      chainAddress: chainLocationData[2],
    })

    if (E.isRight(chainLocationR)) {
      return t.success(chainLocationR.right.chainAddress)
    }

    return t.failure(i, c, 'Expected a valid ChainLocation value')
  },
  (x) => x
)
export type ChainLocationString = t.TypeOf<typeof ChainLocationString>

const ChainLocationImpl = t.type({
  chainId: ChainId,
  chainType: ChainType,
  chainAddress: Address,
})
type ChainLocationImpl = t.TypeOf<typeof ChainLocationImpl>

export interface ChainLocationAddressBrand {
  readonly ChainLocationAddress: unique symbol
}

const ChainLocationAddress = new t.Type<
  `${ChainId}:${ChainType}:${Address}` & ChainLocationAddressBrand,
  `${ChainId}:${ChainType}:${Address}`,
  unknown
>(
  'ChainLocationAddress',
  (
    s: unknown
  ): s is `${ChainId}:${ChainType}:${Address}` & ChainLocationAddressBrand => {
    if (typeof s !== 'string') {
      return false
    }
    const chainLocationData = s.split(':')

    if (chainLocationData.length !== 3) {
      return false
    }

    const chainLocationR = ChainLocationImpl.decode({
      chainId: chainLocationData[0],
      chainType: chainLocationData[1],
      chainAddress: chainLocationData[2],
    })
    return E.isRight(chainLocationR)
  },
  (i, c) => {
    if (typeof i !== 'string') {
      return t.failure(i, c, 'Expected a valid ChainLocationAddress')
    }

    const chainLocationData = i.split(':')

    if (chainLocationData.length !== 3) {
      return t.failure(i, c, 'Expected a valid ChainLocationAddress')
    }

    const chainLocationR = ChainLocationImpl.decode({
      chainId: chainLocationData[0],
      chainType: chainLocationData[1],
      chainAddress: chainLocationData[2],
    })

    if (E.isRight(chainLocationR)) {
      return t.success(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- cast is safe as we know the values and format
        `${chainLocationR.right.chainId}:${chainLocationR.right.chainType}:${chainLocationR.right.chainAddress}` as `${ChainId}:${ChainType}:${Address}` &
          ChainLocationAddressBrand
      )
    }

    return t.failure(i, c, 'Expected a valid ChainLocationAddress')
  },
  (x) => x
)
type ChainLocationAddress = t.TypeOf<typeof ChainLocationAddress>

export const ChainLocation = new t.Type<
  ChainLocationImpl,
  ChainLocationAddress,
  unknown
>(
  'ChainLocation',
  (s: unknown): s is ChainLocationImpl => {
    return ChainLocationImpl.is(s)
  },
  (i, c) => {
    if (typeof i === 'string') {
      const chainLocationData = i.split(':')

      if (chainLocationData.length !== 3) {
        return t.failure(i, c, 'Expected a valid ChainLocation value')
      }

      const chainLocationR = ChainLocationImpl.decode({
        chainId: chainLocationData[0],
        chainType: chainLocationData[1],
        chainAddress: chainLocationData[2],
      })

      if (E.isRight(chainLocationR)) {
        return t.success(chainLocationR.right)
      }
    }

    if (typeof i === 'object') {
      const chainLocationR = ChainLocationImpl.decode(i)

      if (E.isRight(chainLocationR)) {
        return t.success(chainLocationR.right)
      }
    }

    return t.failure(i, c, 'Expected a valid ChainLocation value')
  },
  (x) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- cast is safe as we know the values and format
    return `${x.chainId}:${x.chainType}:${x.chainAddress}` as ChainLocationAddress
  }
)
export type ChainLocation = t.TypeOf<typeof ChainLocation>

export const FuturePassForEoaResponse = t.type(
  {
    eoa: ChainLocationString,
    ownedFuturepass: t.union([t.null, ChainLocationString]),
    linkedFuturepass: t.union([t.null, ChainLocationString]),
  },
  'FuturePassForEoaResponse'
)
export type FuturePassForEoaResponse = t.TypeOf<typeof FuturePassForEoaResponse>

export interface PublicKeyBrand {
  readonly PublicKey: unique symbol
}

export const PublicKey = new t.Type<
  (`0x${string}` | `ed${string}`) & PublicKeyBrand,
  `0x${string}` | `ed${string}`,
  unknown
>(
  'PublicKey',
  (s: unknown): s is (`0x${string}` | `ed${string}`) & PublicKeyBrand =>
    typeof s === 'string' &&
    (ethers.utils.isHexString(s) || s.toLowerCase().startsWith('ed')),
  (i, c) => {
    if (typeof i === 'string') {
      let hexInput = i.toLowerCase()

      if (hexInput.startsWith('ed')) {
        try {
          //todo: find a better way to validate the ed25519 public key
          //When hexInput is a ed25519 public key, it should have exactly 32 bytes length which is 64 string length, and it starts with 'ed' so total length is 66
          if (hexInput.length === 66) {
            return t.success(hexInput as `ed${string}` & PublicKeyBrand)
          }

          return t.failure(i, c, 'Expected a valid Public Key')
        } catch (error) {
          return t.failure(i, c, 'Expected a valid Public Key')
        }
      } else {
        if (!ethers.utils.isHexString(hexInput)) {
          hexInput = '0x' + i.toLowerCase()
        }

        try {
          const computedPublicKey: string = ethers.utils.computePublicKey(
            hexInput,
            true
          )

          //When hexInput is a secp256k1 public key, it should exactly equal to computedPublicKey
          const publicKey =
            hexInput === computedPublicKey ? computedPublicKey : hexInput

          return t.success(publicKey as `0x${string}` & PublicKeyBrand)
        } catch {
          return t.failure(i, c, 'Expected a valid Public Key')
        }
      }
    }
    return t.failure(i, c, 'Expected a valid Public Key')
  },
  (x) => x
)

export type PublicKey = t.TypeOf<typeof PublicKey>

const isString = (s: unknown): s is string => typeof s === 'string'

export const EmailType = t.literal('email')
export type EmailType = t.TypeOf<typeof EmailType>

export const FVPrefixEmailType = t.literal('fv:email')
export type FVPrefixEmailType = t.TypeOf<typeof FVPrefixEmailType>

export const UserEmailAuthenticationType = t.type({
  method: FVPrefixEmailType,
  email: t.string,
})

type UserEmailAuthenticationType = t.TypeOf<typeof UserEmailAuthenticationType>

const UserEmailAuthenticationMethod = new t.Type<
  UserEmailAuthenticationType,
  string,
  unknown
>(
  'UserLoginSubUsingEmail',
  (i): i is UserEmailAuthenticationType => UserEmailAuthenticationType.is(i),
  (i, c) => {
    if (isString(i)) {
      const parts = i.split(':')
      if (parts[0] === 'email' && parts.length === 2) {
        return t.success({ method: 'fv:email', email: parts[1] })
      }
    }

    return t.failure(i, c)
  },
  (a) => `email:${a.email}`
)

export const SocialSSOType = t.union([
  t.literal('google'),
  t.literal('facebook'),
  t.literal('twitter'),
  t.literal('tiktok'),
  t.literal('apple'),
])
export type SocialSSOType = t.TypeOf<typeof SocialSSOType>

export const FVPrefixSocialSSOType = t.union([
  t.literal('fv:google'),
  t.literal('fv:facebook'),
  t.literal('fv:twitter'),
  t.literal('fv:tiktok'),
  t.literal('fv:apple'),
])
export type FVPrefixSocialSSOType = t.TypeOf<typeof FVPrefixSocialSSOType>

export const FVPrefixCustodialType = t.union([
  FVPrefixEmailType,
  FVPrefixSocialSSOType,
])
export type FVPrefixCustodialType = t.TypeOf<typeof FVPrefixCustodialType>

export const UserIdpAuthenticationType = t.type({
  method: FVPrefixSocialSSOType,
  email: t.union([t.string, t.undefined]),
})

type UserIdpAuthenticationType = t.TypeOf<typeof UserIdpAuthenticationType>

const UserIdpAuthenticationMethod = new t.Type<
  UserIdpAuthenticationType,
  null,
  unknown
>(
  'UserLoginSubUsingIdp',
  (i): i is UserIdpAuthenticationType => UserIdpAuthenticationType.is(i),
  (i, c) => {
    if (isString(i)) {
      const parts = i.split(':')
      if (parts.length !== 3) {
        return t.failure(i, c)
      }

      const socialSsoType = SocialSSOType.decode(parts[1])
      if (E.isLeft(socialSsoType)) {
        return t.failure(i, c)
      }

      return t.success({
        method: `fv:${socialSsoType.right}`,
        email: undefined,
      })
    }
    return t.failure(i, c)
  },
  (_) => null // cannot roundtrip since it is impossible to get the google / facebook id
)

export const UserWagmiAuthenticationType = t.type({
  method: t.literal('wagmi'),
  eoa: Address,
})

type UserWagmiAuthenticationType = t.TypeOf<typeof UserWagmiAuthenticationType>

const UserWagmiAthenticationMethod = new t.Type<
  UserWagmiAuthenticationType,
  string,
  unknown
>(
  'UserLoginSubUsingEoa',
  (i): i is UserWagmiAuthenticationType => UserWagmiAuthenticationType.is(i),
  (i, c) => {
    if (isString(i)) {
      const parts = i.split(':')
      if (parts[0] === 'eoa' && parts.length === 2) {
        const eoa = hush(Address.decode(parts[1]))
        if (eoa) {
          return t.success({ method: 'wagmi', eoa })
        }
      }
    }

    return t.failure(i, c)
  },
  (a) => `eoa:${a.eoa}`
)

export const UserXamanAuthenticationType = t.type({
  method: t.literal('xaman'),
  rAddress: t.string,
})

type UserXamanAuthenticationType = t.TypeOf<typeof UserXamanAuthenticationType>

const UserXamanAuthenticationMethod = new t.Type<
  UserXamanAuthenticationType,
  null,
  unknown
>(
  'UserLoginSubUsingXaman',
  (i): i is UserXamanAuthenticationType => UserXamanAuthenticationType.is(i),
  (i, c) => {
    if (isString(i)) {
      const parts = i.split(':')
      if (parts[0] === 'xrpl' && parts.length === 4 && parts[2] === 'eoa') {
        const [_, rAddress] = deriveAddressPair(parts[1])
        return t.success({ method: 'xaman', rAddress })
      }
    }
    return t.failure(i, c)
  },
  (_) => null // cannot roundtrip since it is impossible to get the public key from a rAddress
)

export const UserAuthenticationMethod = t.union([
  UserEmailAuthenticationMethod,
  UserIdpAuthenticationMethod,
  UserWagmiAthenticationMethod,
  UserXamanAuthenticationMethod,
])
