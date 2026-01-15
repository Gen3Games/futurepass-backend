import { Eip1193Bridge } from '@ethersproject/experimental'
import { ethers } from 'ethers'

export class FVEip1193Bridge extends Eip1193Bridge {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override async request(request: {
    method: string
    params?: any[]
  }): Promise<any> {
    console.log('FVEip1193Bridge: request/1:', request)

    if (request.method === 'eth_requestAccounts') {
      return [await this.signer.getAddress()]
    }

    if (request.method === 'eth_chainId' || request.method === 'net_version') {
      return this.signer.getChainId()
    }

    if (request.method === 'eth_call') {
      const req = ethers.providers.JsonRpcProvider.hexlifyTransaction(
        request.params![0],
        { from: true }
      )
      return await this.provider.call(req, request.params![1])
    }
    if (request.method === 'estimateGas') {
      if (request.params![1] && request.params![1] !== 'latest') {
        throw new Error('Unsupported: estimateGas does not support blockTag')
      }

      const req = ethers.providers.JsonRpcProvider.hexlifyTransaction(
        request.params![0],
        { from: true }
      )
      const result = await this.provider.estimateGas(req)
      return result.toHexString()
    }

    if (request.method === 'personal_sign') {
      const [message, address] = request.params!
      const selfAddress = await this.signer.getAddress()
      if (address.toLowerCase() !== selfAddress.toLowerCase()) {
        throw new Error('personal_sign: address mismatch')
      }
      return this.signer.signMessage(message)
    }

    if (request.method === 'eth_sendTransaction') {
      return this.signer.sendTransaction(request.params![0])
    }

    return super.request(request)
  }
}
