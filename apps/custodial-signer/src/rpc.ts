import { CustodialAPI } from '@futureverse/experience-sdk'
import { BaseRPCServer } from '@futureverse/rpc-kit'

/**
 * This RPC server is used to communicate with the embedding application.
 */
export abstract class ARPCServer extends BaseRPCServer<
  CustodialAPI,
  { origin: string }
> {
  #listener: (ev: MessageEvent<unknown>) => void

  protected override onUnhandled(tag: string): void {
    console.warn('rpc(host): unhandled rpc message', tag)
  }

  protected override onUnknownMessage(_msg: unknown, reason: string): void {
    console.warn('rpc(host): received unknown message', reason)
  }

  protected override onInternalError(tag: string, error: unknown): void {
    console.error('rpc(host): internal error', tag, error)
  }

  public handle(msg: unknown, connection: { origin: string }): boolean {
    return this.receiveMessage(msg, connection)
  }

  constructor() {
    super(CustodialAPI)
    this.#listener = (ev: MessageEvent<unknown>) => {
      this.receiveMessage(ev.data, { origin: ev.origin })
    }
    window.addEventListener('message', this.#listener)
  }

  override dispose(): void {
    super.dispose()
    window.removeEventListener('message', this.#listener)
  }

  protected postMessage(msg: unknown): void {
    window.opener?.postMessage(msg, '*')
  }
}
