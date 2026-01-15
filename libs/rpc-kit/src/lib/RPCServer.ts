import { either as E } from 'fp-ts'
import reporter from 'io-ts-reporters'
import {
  AnyRequestOf,
  AnyResponseOf,
  APIBuilder,
  ErrorOf,
  EventOf,
  RequestCodecOf,
  RequestPayloadOf,
  ResponseCodecOf,
  ResponsePayloadOf,
  TagOf,
  TagToKey,
} from './RPC'

// this is safe as the envelope is unaffected
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyResponseCodec = ResponseCodecOf<any>

export type HandlerEvent<
  API extends APIBuilder,
  T extends TagOf<API>
> = EventOf<API, TagToKey<API, T>>

export type HandlerPayload<
  API extends APIBuilder,
  T extends TagOf<API>
> = RequestPayloadOf<API, TagToKey<API, T>>

export type HandlerReturn<
  API extends APIBuilder,
  T extends TagOf<API>
> = E.Either<
  Extract<ErrorOf<API, TagToKey<API, T>>, { tag: 'runError' }>['error'],
  ResponsePayloadOf<API, TagToKey<API, T>>
>

type CancelFn = () => void

export type RPCDelegateFor<T> = T extends BaseRPCServer<infer A, infer B>
  ? RPCDelegate<A, B>
  : never

export type InfoFor<T> = T extends BaseRPCServer<infer A, infer B>
  ? Info<B>
  : never

export type Info<Connection = unknown> = {
  connection?: Connection
  message: unknown
}

export type RPCDelegate<API extends APIBuilder, Connection = unknown> = {
  [P in keyof API as `::${API[P]['tag']}`]: (
    payload: RequestPayloadOf<API, P>,
    emit: (event: EventOf<API, P>) => void,
    info: Info<Connection>
  ) => [
    Promise<
      E.Either<
        Extract<ErrorOf<API, P>, { tag: 'runError' }>['error'],
        ResponsePayloadOf<API, P>
      >
    >,
    CancelFn
  ]
}

export abstract class BaseRPCServer<
  API extends APIBuilder,
  Connection = unknown
> {
  private readonly requestCodec: RequestCodecOf<API>
  private readonly responseCodec: ResponseCodecOf<API>
  private uniqueId = 0 // server-side unique id
  private readonly cancellers: Record<string, CancelFn> = {}

  constructor(api: API, private readonly delegate?: RPCDelegate<API>) {
    this.requestCodec = AnyRequestOf(api)
    this.responseCodec = AnyResponseOf(api)
  }

  dispose(): void {
    for (const id in this.cancellers) {
      const fn = this.cancellers[id]
      if (fn == null) continue
      delete this.cancellers[id]
      fn()
    }
  }

  protected receiveMessage(msg: unknown, connection?: Connection): boolean {
    // TODO: decode envelope first in order to return 'decodeError'
    const messageR = this.requestCodec.decode(msg)

    if (E.isLeft(messageR)) {
      this.onUnknownMessage(msg, reporter.report(messageR).join(', '))
      return false
    }

    const message = messageR.right

    const handle: unknown = (this.delegate ??
      (this as Record<string, unknown>))[`::${message.tag}`]
    const handleFn = typeof handle === 'function' ? handle : null
    if (handleFn == null) {
      this.onUnhandled(message.tag)
      return false
    }

    // assign a server-side unique id since message ids our not in our control
    // and may not be unique.
    const ourId = this.uniqueId++

    // TODO: handle synchronous exceptions here
    const [promise, cancel] = handleFn(
      message.payload,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event: any) => {
        this.postMessage(
          (this.responseCodec as AnyResponseCodec).encode({
            id: message.id,
            tag: message.tag,
            payload: {
              tag: 'event',
              event, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            },
          })
        )
      },
      { connection, message: msg }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as [Promise<E.Either<any, any>>, CancelFn]

    this.cancellers[ourId] = cancel

    // eslint-disable-next-line no-void
    void (async () => {
      // we are unable to proof this at compile time and we have to assume that
      // sub-classes are implemented correctly. implementing the 'RPCDelegate'
      // interface on subclasses makes this hard to get wrong.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: E.Either<any, any>
      try {
        result = await promise
      } catch (e: unknown) {
        this.onInternalError(message.tag, e)
        this.postMessage(
          (this.responseCodec as AnyResponseCodec).encode({
            id: message.id,
            tag: message.tag,
            payload: {
              tag: 'error',
              error: {
                tag: 'internalError',
                error: 'An internal error occurred',
              },
            },
          })
        )
        return
      } finally {
        delete this.cancellers[ourId]
      }
      if (E.isLeft(result)) {
        this.postMessage(
          (this.responseCodec as AnyResponseCodec).encode({
            id: message.id,
            tag: message.tag,
            payload: {
              tag: 'error',
              error: {
                tag: 'runError',
                error: result.left,
              },
            },
          })
        )
        return
      }
      this.postMessage(
        (this.responseCodec as AnyResponseCodec).encode({
          id: message.id,
          tag: message.tag,
          payload: {
            tag: 'response',
            response: result.right,
          },
        })
      )
    })()

    return true
  }

  protected withCancel<T extends TagOf<API>>(
    fn: (
      payload: HandlerPayload<API, T>,
      emit: (event: HandlerEvent<API, T>) => void,
      info: { connection?: Connection; message: unknown }
    ) => [Promise<HandlerReturn<API, T>>, CancelFn]
  ): (
    payload: HandlerPayload<API, T>,
    emit: (event: HandlerEvent<API, T>) => void,
    info: { connection?: Connection; message: unknown }
  ) => [Promise<HandlerReturn<API, T>>, CancelFn] {
    return fn
  }

  protected nonCancel<T extends TagOf<API>>(
    fn: (
      payload: HandlerPayload<API, T>,
      emit: (event: HandlerEvent<API, T>) => void,
      info: { connection?: Connection; message: unknown }
    ) => Promise<HandlerReturn<API, T>>
  ): (
    payload: HandlerPayload<API, T>,
    emit: (event: HandlerEvent<API, T>) => void,
    info: { connection?: Connection; message: unknown }
  ) => [Promise<HandlerReturn<API, T>>, CancelFn] {
    return (p, e, m) => [
      fn(p, e, m),
      () => {
        /* cancellation: no-op */
      },
    ]
  }

  protected onInternalError(_tag: string, _error: unknown): void {
    /* default: no-op */
  }

  protected onUnhandled(_tag: string): void {
    /* default: no-op */
  }

  protected onUnknownMessage(_msg: unknown, _reason: string): void {
    /* default: no-op */
  }

  protected abstract postMessage(msg: unknown): void
}
