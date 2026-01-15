// usage: run `pnpm run exec:script scripts/helpers/xaman/xaman-app-sign-and-send-transaction.ts`
// it will prompt you to scan the QR code with the xaman app 2 times, then will attempt to submit a transaction to the blockchain

import { Xumm } from 'xumm'
import { decode } from 'xrpl-binary-codec-prerelease'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import '@therootnetwork/api-types'
import { ethers } from 'ethers'
import { deriveAddress, sign, verify } from 'ripple-keypairs'
import { ApiPromise, WsProvider } from '@polkadot/api'
import '@therootnetwork/api-types'
import { blake256 } from 'codechain-primitives'
import { encode, encodeForSigning } from 'ripple-binary-codec'

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

const _signMessage = async (signingTx: any) => {
  const txHex = await new Promise<string | null>(async (resolve, reject) => {
    if (xamanClient.payload == null) {
      throw new Error('Xaman client not found')
    }
    const data = await xamanClient.payload.createAndSubscribe(
      signingTx,
      (eventMessage) => {
        if (Object.keys(eventMessage.data).indexOf('opened') > -1) {
          // Update the UI? The payload was opened.
        }
        if (Object.keys(eventMessage.data).indexOf('signed') > -1) {
          // The `signed` property is present, true (signed) / false (rejected)
          const signed = eventMessage.data.signed
          if (!signed) {
            return reject('Transaction was rejected')
          }
          const txHex = eventMessage.payload.response.hex
          return resolve(txHex)
        }
      }
    )
    console.log(
      '\nOpen this link and scan from xaman app to login',
      data.created.refs.qr_png,
      '\n'
    )
  })

  if (txHex == null) {
    throw new Error('hexTx is null')
  }
  const decodedTx = decode(txHex)
  const decodedTxE = SignInTxResponse.decode(decodedTx)
  if (E.isLeft(decodedTxE)) {
    throw new Error('Failed to decode transaction')
  }
  return decodedTxE.right
}

const xamanTest = async () => {
  const signedTx = await _signMessage({
    custom_meta: {
      instruction: 'Sign transaction',
    },
    TransactionType: 'SignIn',
  })
  console.log(signedTx)
  let publicKey = signedTx.SigningPubKey
  const signingRAddress = await deriveAddress(signedTx.SigningPubKey)

  // if (publicKey.startsWith('ED')) {
  //   // this is an Ed25519 public key we strip the ED prefix to get the secp256k1 public key
  //   // https://xrpl.org/docs/concepts/accounts/cryptographic-keys
  //   publicKey = publicKey.slice(2)
  // }

  console.log(`publicKey: ${publicKey}`)

  // new addresses
  const eoa = ethers.utils.computeAddress(`0x${publicKey}`)
  const rAddress = await deriveAddress(publicKey)

  console.table({ eoa, rAddress, signingRAddress })

  console.log('initializing API...')
  const wsProvider = new WsProvider(`wss://porcini.rootnet.app/ws`)
  const api = await ApiPromise.create({ provider: wsProvider, types: typedefs })

  const futurepassAddress = (await api.query.futurepass.holders(eoa)).toString()
  console.log(`FuturePass address: ${futurepassAddress} of ${eoa}`)

  const xrpBalanceBefore =
    ((await api.query.assets.account(GAS_TOKEN_ID, eoa)).toJSON() as any)
      ?.balance ?? 0

  console.log(`XRP balance : ${xrpBalanceBefore}`)

  const genesisHash = api.genesisHash.toHex().slice(2)
  const extrinsic = api.tx.assets.transfer(
    GAS_TOKEN_ID,
    '0xa4593663bD1c96dc04799b4f21f2F8ef6834f874',
    1
  )
  const hashedExtrinsicWithoutPrefix = blake256(
    extrinsic.toHex().slice(6)
  ).toString()
  const nonce = ((await api.query.system.account(eoa)).toJSON() as any)?.nonce
  const maxBlockNumber = +(await api.query.system.number()).toString() + 5

  // const xamanJsonTx = {
  //   AccountTxnID:
  //     '16969036626990000000000000000000F236FD752B5E4C84810AB3D41A3C2580',
  //   SigningPubKey: publicKey,
  //   Account: deriveAddress(publicKey),
  //   Memos: [
  //     {
  //       Memo: {
  //         MemoType: stringToHex('extrinsic'),
  //         // remove `0x` from extrinsic hex string
  //         MemoData: stringToHex(
  //           `${genesisHash}:${nonce}:${maxBlockNumber}:0:${hashedExtrinsicWithoutPrefix}`
  //         ),
  //       },
  //     },
  //   ],
  // }

  const xamanJsonTx = {
    txjson: {
      TransactionType: 'SignIn',
      Memos: [
        {
          Memo: {
            MemoType: stringToHex('extrinsic'),
            MemoData: stringToHex(
              `${genesisHash}:${nonce}:${maxBlockNumber}:0:${hashedExtrinsicWithoutPrefix}`
            ),
          },
        },
      ],
    },
    custom_meta: {
      instruction: 'Sign Futurepass balance transfer extrinsic',
    },
  }

  console.log(`xamanJsonTx: ${JSON.stringify(xamanJsonTx, null, 2)}`)

  // sign xaman tx
  const message = encode(xamanJsonTx)
  const encodedMessage = encodeForSigning(xamanJsonTx)
  const signResponse = await _signMessage({
    TransactionType: 'SignIn',
    txblob: encodedMessage, // TODO: is this correct ???
  })
  const txSignature = signResponse.TxnSignature

  console.table({ message, txSignature, signResponse })

  // execute xaman tx extrinsic
  const events = await new Promise<any[]>(async (resolve) => {
    await api.tx.xrpl
      .transact(`0x${message}`, `0x${txSignature}`, extrinsic)
      .send(({ events = [], status }) => {
        console.log('Transaction events:', status.toHuman())
        if (status.isInBlock) resolve(events)
      })
  })
}

;(async () => {
  await xamanTest()
})()
