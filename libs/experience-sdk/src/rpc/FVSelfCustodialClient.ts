import { BaseRPCClient } from '@futureverse/rpc-kit'
import { SelfCustodialAPI } from './API'
import {
  Connect,
  IFVClient,
  IFVSelfCustodialClient,
  SendTransaction,
} from './IFVClient'

export class FVSelfCustodialClient
  extends BaseRPCClient<SelfCustodialAPI>
  implements IFVSelfCustodialClient, IFVClient
{
  onUnknownMessage(msg: unknown): void {
    // console.log('rpc(client): received unknown message', msg);
  }

  postMessage(payload: unknown): void {
    // will be overwritten; see constructor
    throw new Error('Invariant violation: This should never be called')
  }

  health = this.req0('health')
  disconnect = this.req0('disconnect')

  #showRC = 0
  #show(): (() => void) | null {
    if (this.#iframe == null) return null
    this.#showRC++
    console.log('(iframe) show: rc=', this.#showRC)

    this.#iframe.style.visibility = 'visible'
    this.#iframe.style.zIndex = '10000'
    this.#iframe.style.width = '100vw'
    this.#iframe.style.height = '100vh'

    let canHide = true
    return () => {
      if (canHide) {
        canHide = false // only once!
        this.#unsafeHide()
      }
    }
  }

  #unsafeHide() {
    if (this.#iframe == null) return
    this.#showRC--
    console.log('(iframe) hide: rc=', this.#showRC)
    if (this.#showRC > 0) return
    // TODO consider ref counting
    this.#iframe.style.visibility = 'hidden'
  }

  // TODO proper types (i ran out of time)
  #interactive(mkreq: any, name: string) {
    const fn = mkreq.call(this, name)
    return (...args: any[]) => {
      let hide: (() => void) | null = null
      const eventIndex = fn.length === 3 ? 1 : 0
      const onEvent = args[eventIndex]
      args[eventIndex] = (event: any) => {
        // intercept INTERFACE_REQUIRED event in order to display host iframe;
        // the host wants to display some ui required to complete the request.
        if (event.type === 'INTERFACE_REQUIRED') {
          hide = hide ?? this.#show()
        }
        onEvent?.(event)
      }
      const result = fn.call(this, ...args).finally(() => {
        if (hide) {
          console.log(`interface no longer required(${name}): hiding iframe`)
          hide()
        }
      })
      return result
    }
  }

  connect: Connect = this.#interactive(this.req0, 'connect')
  sendTransaction: SendTransaction = this.#interactive(
    this.req1,
    'sendTransaction'
  )
  signMessage = this.#interactive(this.req1, 'signMessage')
  getChainId = this.#interactive(this.req0, 'getChainId')
  switchChain = this.#interactive(this.req1, 'switchChain')

  #listener: (ev: MessageEvent<unknown>) => void
  #iframe: HTMLIFrameElement | null = null

  constructor(workerURL: string) {
    workerURL = workerURL + '/idworker' // well-known

    super(SelfCustodialAPI)

    const pendingMessages: unknown[] = []

    // TODO create iframe lazily?
    // discover or create iframe to use for communication with fv host
    let loaded: boolean
    if (this.#iframe == null) {
      const existing = document.querySelector('iframe[src="' + workerURL + '"]')
      if (existing != null) {
        console.log('rpc(client): found existing iframe; url=' + workerURL)
        this.#iframe = existing as HTMLIFrameElement
      } else {
        console.log('rpc(client): creating iframe; url=' + workerURL)
        const elem = document.createElement('iframe')
        this.#iframe = elem
        elem.src = workerURL
        elem.style.position = 'absolute'
        // prevents weird iframe flickering
        elem.style.zIndex = '-1'
        elem.style.visibility = 'hidden'
        loaded = false

        // wait for signal that RPC server is ready for usage
        const listener = (ev: { data: any }) => {
          if (ev.data !== 'FV_IDWORKER_READY') return
          loaded = true
          console.log(
            `rpc(client): iframe ready; sending ${pendingMessages.length} pending messages...`
          )
          while (pendingMessages.length) {
            this.#iframe?.contentWindow?.postMessage(
              pendingMessages.shift(),
              '*'
            )
          }
          window.removeEventListener('message', listener)
        }
        console.log(`rpc(client): waiting for ready signal from iframe...`)
        window.addEventListener('message', listener)

        document.body.prepend(elem)
      }
    } else {
      loaded = false
    }

    this.postMessage = (payload: unknown) => {
      if (!loaded) {
        pendingMessages.push(payload)
        return
      }
      this.#iframe?.contentWindow?.postMessage(payload, '*')
    }

    this.#listener = (ev: MessageEvent<unknown>) => {
      this.receiveMessage(ev.data)
    }
    window.addEventListener('message', this.#listener)
  }

  dispose(): void {
    window.removeEventListener('message', this.#listener)
    this.#iframe?.remove()
    this.#iframe = null
  }
}
