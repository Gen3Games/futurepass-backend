import { BaseRPCClient } from '@futureverse/rpc-kit'
import { either as E } from 'fp-ts'
import { CustodialAPI } from './API'
import { IFVClient, IFVCustodialClient, SwitchChain } from './IFVClient'

export class FVCustodialClient
  extends BaseRPCClient<CustodialAPI>
  implements IFVClient, IFVCustodialClient
{
  onUnknownMessage(msg: unknown): void {
    console.log('rpc(client): received unknown message', msg)
  }

  postMessage(_payload: unknown): void {
    // will be overwritten; see constructor
    throw new Error('Invariant violation: This should never be called')
  }

  health = this.req0('health')
  signMessage = this.req1('signMessage')
  signTransaction = this.req1('signTransaction')

  getChainId = async () => {
    return E.right(this.chainId)
  }

  switchChain: SwitchChain = async (chainId) => {
    this.chainId = chainId
    return E.right(undefined)
  }

  #listener: (ev: MessageEvent<unknown>) => void
  #popup: Window | null = null

  constructor(workerURL: string, private chainId: number) {
    super(CustodialAPI)

    if (typeof window === 'undefined' /* SSR */) {
      this.#listener = () => {
        // no-op
      }
      return
    }

    this.postMessage = (payload: unknown) => {
      // if we already have an open popup, send a follow up RPC call via post message.

      if (this.#popup?.closed === false) {
        this.#popup.postMessage(payload, '*')
        return
      }

      // otherwise, we open a fresh popup
      const popup = window.open(
        workerURL + '?request=' + base64UrlEncode(JSON.stringify(payload)),
        'futureverse_wallet',
        'popup,right=0,width=290,height=430,menubar=no,toolbar=no,location=no,status=0'
      )

      if (popup == null) {
        // this will be reported as a transport error
        throw new Error('Failed to open popup')
      }

      // use workaround to detect when popup is closed
      // see https://stackoverflow.com/a/48240128
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer)
          this.cancelAll()
          this.#popup = null
        }
      }, 1000)

      this.#popup = popup
    }

    // set up listener for RPC replies
    const workerOrigin = new URL(workerURL).origin
    this.#listener = (ev: MessageEvent<unknown>) => {
      if (ev.origin === workerOrigin) {
        this.receiveMessage(ev.data)
      }
    }

    window.addEventListener('message', this.#listener)
  }

  dispose(): void {
    if (typeof window === 'undefined' /* SSR */) return
    window.removeEventListener('message', this.#listener)
  }
}

function base64UrlEncode(raw: string) {
  const encoded = btoa(raw || '')
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
