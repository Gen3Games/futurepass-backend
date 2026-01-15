import {
  Environment,
  User as FVUser,
  Address as SdkAddress,
  PublicKey,
} from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import { User } from 'oidc-client-ts'
import { CreatedPayload } from 'xumm-sdk/dist/src/types'
import { GenericTokenBalancesQuery, NftsQuery } from '../__generated__/graphql'

export interface Address {
  eoa: string
  chainId: number
}

export type UserSession = FVUser & {
  linked: Address[]
  user: User | null
}

export interface FVEnvironmentConfig {
  clientId: string
  redirectUri: string
  environment?: Environment
}

export type NFT = NonNullable<NftsQuery['nfts']>['edges'][number]['node']
export type TokenRaw = NonNullable<
  GenericTokenBalancesQuery['genericTokenBalances']
>['edges']

export const WagmiConnectorId = t.union([
  t.literal('MetaMask'),
  t.literal('WalletConnect'),
  t.literal('Coinbase'),
  t.literal('FutureverseConnector'),
])
export type WagmiConnectorId = t.TypeOf<typeof WagmiConnectorId>

export type XamanConnectorId = 'Xaman'

export type ConnectorId = WagmiConnectorId | XamanConnectorId

export type XamanSignMessageParams = {
  instructions?: string
  genesisHash: string
  accountNonce: string
  maxBlockNumber: string
  hashedExtrinsicWithoutPrefix: string
}

export const XamanSignInTxResponse = t.type({
  AccountTxnID: t.optional(t.string),
  SigningPubKey: t.string,
  TxnSignature: t.string,
  Account: t.string,
})

export type XamanSignInTxResponse = t.TypeOf<typeof XamanSignInTxResponse>

export type SignMessageResponse = {
  signedMessage: HexString | string
  signature: HexString
  details: XamanSignInTxResponse | null
}

export const HexString = t.HexString
export type HexString = t.TypeOf<typeof HexString>

export type SignMessageCallbacks = {
  onRejected?: () => void
  onCreated?: (createdPayload: CreatedPayload) => void
  onOpened?: () => void
}

export type SignMessageFunctionWagmiArgs = {
  connectorId: WagmiConnectorId
  body: { message: HexString | string }
}

export type SignMessageFunctionXamanArgs = {
  connectorId: XamanConnectorId
  body: XamanSignMessageParams
  signMessageCallbacks?: SignMessageCallbacks
}

export type SignMessageFunction = (
  payload: SignMessageFunctionWagmiArgs | SignMessageFunctionXamanArgs
) => Promise<SignMessageResponse>

export type GetEthAccountFunction = (
  connectorId: ConnectorId,
  signMessageCallbacks?: SignMessageCallbacks
) => Promise<{
  eoa: SdkAddress
  publicKey: PublicKey | null
  transaction: string | null
}>

export interface ILoginAdapter {
  /**
   * Returns EOA for Wagmi, rAddress for Xaman.
   */
  connect(connector: ConnectorId): Promise<string /* address */>
  signMessage: SignMessageFunction
  getEthAccount: GetEthAccountFunction
}
