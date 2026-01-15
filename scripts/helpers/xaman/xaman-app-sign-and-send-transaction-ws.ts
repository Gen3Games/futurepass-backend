import { computeAddress } from '@ethersproject/transactions'
import { ApiPromise, Keyring, WsProvider } from '@polkadot/api'
import { hexToU8a } from '@polkadot/util'
import { blake256 } from 'codechain-primitives'
import { decode } from 'ripple-binary-codec'
import { Xumm } from 'xumm'

const stringToHex = (str: string) =>
  str
    .split('')
    .map((c) => c.charCodeAt(0).toString(16))
    .join('')

// SDK setup
const xamanClient = new Xumm(
  '3a1c0fd4-6f88-402e-8aa9-13183ce9aac2',
  '2d58ef50-17de-42d8-b735-c7d246b5c095'
)

// const signer = "rhLmGWkHr59h9ffYgPEAqZnqiQZMGb71yo";
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
const GAS_TOKEN_ID = 2
const ALITH_PRIVATE_KEY =
  '0x3b5aa87072d68429afaecce20a813264ea1185f00cb3e93504caa6a2fcb0bf31' // DEVNET
// const wsProvider = new WsProvider(`ws://127.0.0.1:9944`);
const wsProvider = new WsProvider(`wss://porcini.rootnet.app/ws`)
const alith = new Keyring({ type: 'ethereum' }).addFromSeed(
  hexToU8a(ALITH_PRIVATE_KEY)
)

const signMessage = async (payload: any) => {
  const txHex = await new Promise<string | null>(async (resolve, reject) => {
    if (xamanClient.payload == null) {
      throw new Error('Xaman client not found')
    }
    const data = await xamanClient.payload.createAndSubscribe(
      payload,
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
          return resolve(eventMessage.payload.response.hex)
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
  return { txHex, decodedTx }
}

const xamanTest = async () => {
  const api = await ApiPromise.create({ provider: wsProvider, types: typedefs })
  const genesisHash = api.genesisHash.toHex().slice(2)

  const signedTx = await signMessage({
    custom_meta: {
      instruction: 'Sign In',
    },
    txjson: {
      TransactionType: 'SignIn',
    },
  })

  const ethereumAddress = computeAddress(
    `0x${signedTx.decodedTx.SigningPubKey}`
  )

  // create a futurepass for user
  await new Promise<any[]>(async (resolve) => {
    await api.tx.futurepass
      .create(ethereumAddress)
      .signAndSend(alith, ({ events = [], status }) => {
        if (status.isInBlock) resolve(events)
      })
  })

  const futurepassAddress = (
    await api.query.futurepass.holders(ethereumAddress)
  ).toString()
  console.log('Futurepass', futurepassAddress)

  // fund the futurepass account with XRP
  await new Promise<any[]>(async (resolve) => {
    await api.tx.assets
      .transfer(GAS_TOKEN_ID, futurepassAddress, 5_000_000)
      .signAndSend(alith, ({ events = [], status }) => {
        if (status.isInBlock) resolve(events)
      })
  })

  const innerCall = api.tx.assets.transfer(GAS_TOKEN_ID, alith.address, 1000)
  const extrinsic = api.tx.futurepass.proxyExtrinsic(
    futurepassAddress,
    innerCall
  )
  const hashedExtrinsicWithoutPrefix = blake256(
    extrinsic.toHex().slice(6)
  ).toString()
  const maxBlockNumber = +(await api.query.system.number()).toString() + 500
  const nonce = (
    (await api.query.system.account(ethereumAddress)).toJSON() as any
  )?.nonce

  const payload = {
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

  const sig = await signMessage(payload)

  // execute xumm tx extrinsic on-chain - dispatch the signed message with the signature
  const events = await new Promise<any[]>(async (resolve) => {
    await api.tx.xrpl
      .transact(`0x${sig.txHex}`, `0x${sig.decodedTx.TxnSignature}`, extrinsic)
      .send(({ events = [], status }) => {
        console.log('XXX: status', status.toHuman())
        if (status.isInBlock) resolve(events)
      })
  })

  events.forEach(({ event: { data, method, section } }) =>
    console.log(`${section}\t${method}\t${data}`)
  )
}

;(async () => {
  await xamanTest()
})()
