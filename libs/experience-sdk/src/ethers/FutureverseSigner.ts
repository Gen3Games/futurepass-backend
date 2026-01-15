import {
  JsonRpcProvider,
  Provider,
  TransactionRequest,
  TransactionResponse,
} from '@ethersproject/providers'
import { UnsignedTransaction } from '@ethersproject/transactions'
import { stringify } from '@sylo/logger'
import { Bytes, ethers, Signer } from 'ethers'
import {
  Deferrable,
  resolveProperties,
  serializeTransaction,
  shallowCopy,
  hexlify,
} from 'ethers/lib/utils.js'
import { either as E } from 'fp-ts'
import {
  IFVClient,
  SignMessageResponse,
  SignTransactionResponse,
} from '../rpc/IFVClient'
import { User } from '../types'

export class FutureverseSigner extends Signer {
  constructor(
    private user: User | null,
    public override readonly provider: JsonRpcProvider,
    private readonly client: IFVClient | null,
    private readonly idpUrl?: string
  ) {
    super()
  }

  setUser(user: User | null) {
    this.user = user
  }

  #requireUser() {
    if (this.user == null) throw new Error('No active user: not logged in')
    return this.user
  }

  #requireEOA() {
    return this.#requireUser().eoa
  }

  override async getChainId(): Promise<number> {
    return this.#requireUser().chainId
  }

  override async getAddress(): Promise<string> {
    return this.#requireEOA()
  }

  override async signMessage(message: string | Bytes): Promise<string> {
    const msg = typeof message === 'string' ? message : hexlify(message)
    const signature = await this.#sign((client) =>
      client.signMessage({
        account: this.#requireEOA(),
        message: msg,
        idpUrl: this.idpUrl,
      })
    )
    return signature
  }

  override async signTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    const tx = await resolveProperties(transaction)

    tx.from = this.#requireEOA()

    const signature = await this.#sign((client) => {
      if (client.signTransaction == null) {
        throw new Error(
          'unsupported: client does not implement signTransaction'
        )
      }
      return client.signTransaction({
        account: this.#requireEOA(),
        // TODO do NOT use serializeTransaction as parseTransaction fills in wrong defaults!
        transaction: serializeTransaction(tx as UnsignedTransaction),
        idpUrl: this.idpUrl,
      })
    })

    const signedTransaction = serializeTransaction(
      tx as UnsignedTransaction,
      signature
    )

    return signedTransaction
  }

  override connect(_provider: Provider): ethers.Signer {
    throw new Error('cannot alter FutureverseSigner connection')
  }

  override async sendTransaction(
    transaction: Deferrable<TransactionRequest>
  ): Promise<TransactionResponse> {
    if (this.client == null) throw new Error('No active client')
    const tx: TransactionRequest = shallowCopy(
      await resolveProperties(transaction)
    )

    tx.from = this.#requireEOA()
    tx.nonce = await this.provider.getTransactionCount(tx.from)
    tx.chainId = await this.getChainId()

    // otherwise we'll have to prepare the tx right here, sign it, and send it
    // see e.g. JsonRPCSigner.sendTransaction for reference
    if (this.client.signTransaction == null) {
      // this should never happen
      throw new Error(
        'unsupported: client implements neither sendTransaction nor signTransaction'
      )
    }

    const address = await this.getAddress()

    if (tx.gasLimit == null) {
      const estimate = shallowCopy(tx)
      estimate.from = address
      tx.gasLimit = await this.provider.estimateGas(estimate)
    }

    if (tx.gasPrice == null) {
      tx.gasPrice = await this.provider.getGasPrice()
    }

    delete tx.from

    const { signature } = unwrap(
      await this.client.signTransaction({
        account: address,
        // TODO do NOT use serializeTransaction as parseTransaction fills in wrong defaults!
        transaction: serializeTransaction(tx as UnsignedTransaction),
      })
    )

    // broadcast to network
    return this.provider.sendTransaction(
      serializeTransaction(tx as UnsignedTransaction, signature)
    )
  }

  async #sign(
    fn: (client: IFVClient) => SignTransactionResponse | SignMessageResponse
  ): Promise<string> {
    if (this.client == null) throw new Error('No active client')
    const result = await fn(this.client)
    if (E.isLeft(result)) {
      if (
        result.left.tag === 'runError' &&
        result.left.error.code === 'USER_REJECTED'
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- throw error that ethers will recognize as user rejection
        const error: any = new Error('user rejected')
        error.code = 'ACTION_REJECTED' // see ethers sources
        throw error
      }
      console.warn('Unhandled error', result.left)
      throw new Error(`An unhandled error occurred (${result.left.tag})`)
    }
    return result.right.signature
  }
}

function unwrap<A>(e: E.Either<unknown, A>): A {
  if (E.isLeft(e)) {
    console.error('rpc call failed', e.left)
    throw new Error('rpc call failed:' + stringify(e.left))
  }
  return e.right
}
