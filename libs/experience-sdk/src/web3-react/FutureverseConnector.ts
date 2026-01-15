import { JsonRpcProvider } from '@ethersproject/providers'
import { EIP1193, EIP1193ConstructorArgs } from '@web3-react/eip1193'
import { Environment } from '../constants'
import { FutureverseSigner, FVEip1193Bridge } from '../ethers'
import { FVCustodialClient } from '../rpc'
import { User } from '../types'

export class FutureverseConnector extends EIP1193 {
  #signer: FutureverseSigner
  constructor({
    actions,
    onError,
    provider,
    user,
    environment,
  }: Omit<EIP1193ConstructorArgs, 'provider'> & {
    provider?: JsonRpcProvider
    environment: Environment
    user?: User | null
  }) {
    const client = new FVCustodialClient(
      environment.signerURL,
      environment.chain.id
    )
    provider =
      provider ?? new JsonRpcProvider(environment.chain.rpcUrls.default.http[0])
    const signer = new FutureverseSigner(
      user ?? null,
      provider,
      client,
      environment.idpURL
    )
    const bridge = new FVEip1193Bridge(signer)
    super({ actions, provider: bridge as any, onError })
    this.#signer = signer
  }

  setUser(user: User | null) {
    this.#signer.setUser(user)
  }
}
