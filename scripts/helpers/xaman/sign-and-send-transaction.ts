// usage: run `pnpm run exec:script scripts/helpers/xaman/sign-and-send-transaction.ts`

import { Xumm } from 'xumm'
import { decode } from 'xrpl-binary-codec-prerelease'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import '@therootnetwork/api-types'
import { ethers } from 'ethers'
import { deriveAddress, sign } from 'ripple-keypairs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { getApiOptions, getPublicProvider } from '@therootnetwork/api'
import '@therootnetwork/api-types'
import { blake256 } from 'codechain-primitives'
import { encode, encodeForSigning } from 'ripple-binary-codec'
import * as AccountLib from 'xrpl-accountlib'
import { verify } from 'ripple-keypairs'

const typedefs = {
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

const stringToHex = (str: string) =>
  str
    .split('')
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')

const SignInTxResponse = t.type({
  AccountTxnID: t.string,
  SigningPubKey: t.string,
  TxnSignature: t.string,
  Account: t.string,
})

const xamanClient = new Xumm(
  '5376fa18-f6d8-45d6-98df-cfdbc6b3b62b',
  'c781b327-c3c4-4a68-a555-34184c7a9bda'
)

const GAS_TOKEN_ID = 2

const accountLibTest = async () => {
  const importedAccount = AccountLib.derive.secretNumbers([
    '579262',
    '338636',
    '324450',
    '632463',
    '521020',
    '619725',
    '110032',
    '605266',
  ])
  console.log(importedAccount)

  const signerInstance = AccountLib.derive.privatekey(
    importedAccount.keypair.privateKey!
  )

  const rAddress = await deriveAddress(signerInstance.keypair.publicKey!)

  const wsProvider = new WsProvider(`wss://porcini.rootnet.app/ws`)
  const api = await ApiPromise.create({ provider: wsProvider, types: typedefs })

  const extrinsic = api.tx.assets.transfer(
    GAS_TOKEN_ID,
    '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874',
    10
  )
  const hashedExtrinsicWithoutPrefix = blake256(
    extrinsic.toHex().slice(6)
  ).toString()
  const maxBlockNumber = +(await api.query.system.number()).toString() + 20

  const genesisHash = api.genesisHash.toHex().slice(2)

  const publicKey = ethers.utils.computePublicKey(
    `0x${signerInstance.keypair.publicKey!}`,
    true
  )

  const eoa = ethers.utils.computeAddress(
    `0x${signerInstance.keypair.publicKey!}`
  )

  const nonce = ((await api.query.system.account(eoa)).toJSON() as any)?.nonce

  console.log(`nonce: ${nonce}`)

  const xrpBalanceBefore =
    ((await api.query.assets.account(GAS_TOKEN_ID, eoa)).toJSON() as any)
      ?.balance ?? 0

  console.log(`XRP balance in new account: ${xrpBalanceBefore}`)

  console.table({
    compressedPublicKey: publicKey,
    uncompressedPublicKey: signerInstance.keypair.publicKey!,
    memoData: `${genesisHash}:${nonce}:${maxBlockNumber}:0:${hashedExtrinsicWithoutPrefix}`,
    eoa,
    xrpBalanceBefore,
  })

  const xamanJsonTx = {
    AccountTxnID:
      '16969036626990000000000000000000F236FD752B5E4C84810AB3D41A3C2580',
    SigningPubKey: signerInstance.keypair.publicKey!,
    Account: rAddress,
    Memos: [
      {
        Memo: {
          MemoType: stringToHex('extrinsic'),
          // remove `0x` from extrinsic hex string
          MemoData: stringToHex(
            `${genesisHash}:${nonce}:${maxBlockNumber}:0:${hashedExtrinsicWithoutPrefix}`
          ),
        },
      },
    ],
  }

  console.log(`xamanJSONtx: `, JSON.stringify(xamanJsonTx, null, 2))

  // sign xaman tx
  const message = encode(xamanJsonTx)
  const encodedSigningMessage = encodeForSigning(xamanJsonTx)
  const signature = sign(
    encodedSigningMessage,
    signerInstance.keypair.privateKey
  )

  console.log(`encodedMessage: ${encodedSigningMessage}`)
  console.log(`signature: ${signature}`)

  const verified = verify(
    `${encodedSigningMessage}`,
    `${signature}`,
    signerInstance.keypair.publicKey
  )
  console.log(`verified: ${verified}`)

  await new Promise<any[]>(async (resolve) => {
    await api.tx.xrpl
      .transact(`0x${message}`, `0x${signature}`, extrinsic)
      .send(({ events = [], status }) => {
        console.log('Transaction status:', status.toHuman())
        if (status.isInBlock) resolve(events)
      })
  })
}

;(async () => {
  await accountLibTest()
})()
