import { Req0, Req1 } from '@futureverse/rpc-kit'
import { CustodialAPI, SelfCustodialAPI, SharedAPI } from './API'

// self-custodial API
export type IFVSelfCustodialClient = {
  sendTransaction: Req1<SelfCustodialAPI, 'sendTransaction'>
  connect: Req0<SelfCustodialAPI, 'connect'>
  disconnect: Req0<SelfCustodialAPI, 'disconnect'>
  getChainId: Req0<SelfCustodialAPI, 'getChainId'>
  switchChain: Req1<SelfCustodialAPI, 'switchChain'>
  dispose(): void
}

// fv-custodial API
export type IFVCustodialClient = {
  signTransaction: Req1<CustodialAPI, 'signTransaction'>
  dispose(): void
}

export interface IFVClient
  extends Partial<IFVSelfCustodialClient>,
    Partial<IFVCustodialClient> {
  health: Req0<SharedAPI, 'health'>
  signMessage: Req1<SharedAPI, 'signMessage'>
  dispose(): void
}

export type Health = API<'health'>
export type SignTransaction = API<'signTransaction'>
export type SignMessage = API<'signMessage'>
export type SendTransaction = API<'sendTransaction'>
export type SwitchChain = API<'switchChain'>
export type Connect = API<'connect'>
export type Disconnect = API<'disconnect'>

export type HealthRequest = Req<'health'>
export type SignTransactionRequest = Req<'signTransaction'>
export type SignMessageRequest = Req<'signMessage'>
export type SendTransactionRequest = Req<'sendTransaction'>
export type SwitchChainRequest = Req<'switchChain'>
export type ConnectRequest = Req<'connect'>
export type DisconnectRequest = Req<'disconnect'>

export type HealthResponse = Res<'health'>
export type SignTransactionResponse = Res<'signTransaction'>
export type SignMessageResponse = Res<'signMessage'>
export type SendTransactionResponse = Res<'sendTransaction'>
export type SwitchChainResponse = Res<'switchChain'>
export type ConnectResponse = Res<'connect'>
export type DisconnectResponse = Res<'disconnect'>

type API<T> = T extends keyof IFVClient ? Required<IFVClient>[T] : never
type Req<T> = Parameters<API<T>>[0]
type Res<T> = ReturnType<API<T>>
