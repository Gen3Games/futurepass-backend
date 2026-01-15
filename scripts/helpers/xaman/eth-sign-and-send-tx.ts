// usage: run `pnpm run exec:script  pnpm run exec:script scripts/helpers/xaman/eth-sign-and-send-tx.ts`
import * as ethers from 'ethers'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { blake256 } from 'codechain-primitives'
import { computePublicKey } from 'ethers/lib/utils'
import { deriveAddress, sign } from 'ripple-keypairs'
import { encode, encodeForSigning } from 'ripple-binary-codec'

const stringToHex = (str: string) =>
  str
    .split('')
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')

import { SignerOptions, SubmittableExtrinsic } from '@polkadot/api/types'
import { KeyringPair } from '@polkadot/keyring/types'

const GAS_TOKEN_ID = 2

export const typedefs = {
  AccountId: 'EthereumAccountId',
  AccountId20: 'EthereumAccountId',
  AccountId32: 'EthereumAccountId',
  Address: 'AccountId',
  LookupSource: 'AccountId',
  Lookup0: 'AccountId',
  EthereumSignature: {
    r: 'H256',
    s: 'H256',
    v: 'U8',
  },
  ExtrinsicSignature: 'EthereumSignature',
  SessionKeys: '([u8; 32], [u8; 32])',
  CollectionInformation: {
    owner: 'AccountId',
    name: 'Vec<u8>',
    metadataScheme: 'MetadataScheme',
    royaltiesSchedule: 'Option<RoyaltiesSchedule>',
    maxIssuance: 'Option<TokenCount>',
    originChain: 'OriginChain',
    nextSerialNumber: 'SerialNumber',
    collectionIssuance: 'TokenCount',
    crossChainCompatibility: 'CrossChainCompatibility',
    ownedTokens: 'Vec<TokenOwnership>',
  },
}

const FUND_AMOUNT = 10

export const finalizeTx = (
  signer: KeyringPair,
  extrinsic: SubmittableExtrinsic<'promise'>,
  opts?: Partial<SignerOptions>
) => {
  return new Promise<any[]>((resolve) => {
    if (opts) {
      extrinsic.signAndSend(signer, opts, ({ status, events = [] }: any) => {
        if (status.isInBlock) resolve(events)
      })
    } else {
      extrinsic.signAndSend(signer, ({ status, events = [] }: any) => {
        if (status.isInBlock) resolve(events)
      })
    }
  })
}

const ethWalletXRPLTxTest = async () => {
  const user = new ethers.Wallet(
    'df2037e0d0dfca82d2c3a56938e5873bce9bca0090a4b71f77213ef1d494760e'
  )

  const publicKey = computePublicKey(user.publicKey, true)

  console.table({
    address: user.address,
    publicKey: publicKey,
    privateKey: user.privateKey,
  })

  const wsProvider = new WsProvider(`wss://porcini.rootnet.app/ws`)
  const api = await ApiPromise.create({ provider: wsProvider, types: typedefs })

  const xrpBalanceBefore =
    (
      (
        await api.query.assets.account(GAS_TOKEN_ID, user.address)
      ).toJSON() as any
    )?.balance ?? 0

  console.log(`XRP balance in new account: ${xrpBalanceBefore}`)

  // return back funds to accountWithFunds
  const extrinsic = api.tx.assets.transfer(
    GAS_TOKEN_ID,
    '0x3361295a44F2388E4Dd01E8C00b60174BF9Fe3A3',
    FUND_AMOUNT
  )
  const hashedExtrinsicWithoutPrefix = blake256(
    extrinsic.toHex().slice(6)
  ).toString()

  const maxBlockNumber = +(await api.query.system.number()).toString() + 5
  const genesisHash = api.genesisHash.toHex().slice(2)
  const nonce = ((await api.query.system.account(user.address)).toJSON() as any)
    ?.nonce

  const xamanJsonTx = {
    AccountTxnID:
      '16969036626990000000000000000000F236FD752B5E4C84810AB3D41A3C2580',
    SigningPubKey: publicKey.slice(2),
    Account: deriveAddress(publicKey.slice(2)),
    Memos: [
      {
        Memo: {
          MemoType: stringToHex('extrinsic'),
          // remove `0x` from extrinsic hex string
          MemoData: stringToHex(
            `${genesisHash}:${0}:${0}:0:${hashedExtrinsicWithoutPrefix}`
          ),
        },
      },
    ],
  }

  // sign xaman tx
  const message = encode(xamanJsonTx)
  const encodedSigningMessage = encodeForSigning(xamanJsonTx)
  const signature = sign(encodedSigningMessage, user.privateKey.slice(2))

  console.log(`xaman tx json: ${JSON.stringify(xamanJsonTx, null, 2)}`)
  console.log(
    'xaman memoData: ',
    `${genesisHash}:${nonce}:${maxBlockNumber}:0:${hashedExtrinsicWithoutPrefix}`
  )
  console.log(`xaman tx message: ${message}`)
  console.log(`xaman tx encodedSigningMessage: ${encodedSigningMessage}`)
  console.log(`xaman tx signature: ${signature}`)

  // execute xaman tx extrinsic
  await new Promise<any[]>(async (resolve) => {
    await api.tx.xrpl
      .transact(`0x${message}`, `0x${signature}`, extrinsic)
      .send(({ events = [], status }) => {
        console.log(`tx events ${JSON.stringify({ status, events }, null, 2)}`)
        if (status.isInBlock) resolve(events)
      })
  })
}

;(async () => {
  await ethWalletXRPLTxTest()
})()
