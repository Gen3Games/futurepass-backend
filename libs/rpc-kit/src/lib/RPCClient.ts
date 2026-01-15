import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import {
  AnyResponseOf,
  APIBuilder,
  ErrorOf,
  EventOf,
  Request,
  RequestPayloadOf,
  ResponseCodecOf,
  ResponsePayloadOf,
} from './RPC'
import { unreachable } from './util'

export type ResponseOf<API extends APIBuilder, T extends keyof API> = Promise<
  E.Either<ErrorOf<API, T>, ResponsePayloadOf<API, T>>
>

export type ApiCall<API extends APIBuilder, T extends keyof API> = Promise<
  E.Either<ErrorOf<API, T>, ResponsePayloadOf<API, T>>
>

export type Req0<API extends APIBuilder, T extends keyof API> = (
  onEvent?: (event: EventOf<API, T>) => void,
  abortSignal?: AbortSignal
) => ResponseOf<API, T>

export type Req1<API extends APIBuilder, T extends keyof API> = (
  payload: RequestPayloadOf<API, T>,
  onEvent?: (event: EventOf<API, T>) => void,
  abortSignal?: AbortSignal
) => ResponseOf<API, T>

export abstract class BaseRPCClient<API extends APIBuilder> {
  private reqId = 0
  private readonly pending = new Map<
    string,
    { handler: (response: t.TypeOf<ResponseCodecOf<API>>) => void; tag: string }
  >()

  private readonly responseCodec: ResponseCodecOf<API>

  constructor(private readonly api: Readonly<API>) {
    this.responseCodec = AnyResponseOf(api)
  }

  protected req0<T extends keyof API>(
    k: T
  ): (
    onEvent?: (event: EventOf<API, T>) => void,
    abortSignal?: AbortSignal
  ) => ResponseOf<API, T> {
    return (
      onEvent?: (event: EventOf<API, T>) => void,
      abortSignal?: AbortSignal
    ) => {
      return this.makeRequest(k, undefined, onEvent, abortSignal)
    }
  }

  protected req1<T extends keyof API>(
    k: T
  ): (
    payload: RequestPayloadOf<API, T>,
    onEvent?: (event: EventOf<API, T>) => void,
    abortSignal?: AbortSignal
  ) => ResponseOf<API, T> {
    return (
      payload: RequestPayloadOf<API, T>,
      onEvent?: (event: EventOf<API, T>) => void,
      abortSignal?: AbortSignal
    ) => {
      return this.makeRequest(k, payload, onEvent, abortSignal)
    }
  }

  protected makeRequest<T extends keyof API>(
    k: T,
    payload: RequestPayloadOf<API, T>,
    onEvent?: (event: EventOf<API, T>) => void,
    abortSignal?: AbortSignal
  ): ResponseOf<API, T> {
    const id = 'client:' + String(this.reqId++)
    const codec = Request(this.api[k])
    const desc = this.api[k]

    const encoded = codec.encode({
      id,
      tag: desc.tag,
      payload,
    })

    let cancelled = false
    const cancel = () => {
      if (cancelled) return
      cancelled = true
      // TODO: design remote cancellation mechanism. not needed right now.
      this.pending.delete(id)
    }
    abortSignal?.addEventListener('abort', cancel)

    return new Promise<E.Either<ErrorOf<API, T>, ResponsePayloadOf<API, T>>>(
      (resolve) => {
        const handler: (response: t.TypeOf<ResponseCodecOf<API>>) => void = (
          response
        ) => {
          if (response.payload.tag === 'event') {
            if (cancelled) return
            // TypeScript is unable to keep up. This should be safe. See comment
            // on 'AnyResponseCodec' for more details.
            if (!onEvent) return
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            onEvent(response.payload.event)
            return
          }

          if (response.payload.tag === 'response') {
            resolve(E.right(response.payload.response))
            this.pending.delete(id)
            abortSignal?.removeEventListener('abort', cancel)
            return
          }

          if (response.payload.tag === 'error') {
            resolve(E.left(response.payload.error))
            this.pending.delete(id)
            abortSignal?.removeEventListener('abort', cancel)
            return
          }

          return unreachable(response.payload)
        }
        this.pending.set(id, { handler, tag: desc.tag })
        this.postMessage(encoded)
      }
    )
  }

  protected receiveMessage(msg: unknown): void {
    const messageR = this.responseCodec.decode(msg)
    if (E.isLeft(messageR)) {
      this.onUnknownMessage(msg)
      return
    }
    const message = messageR.right
    const handler = this.pending.get(message.id)?.handler
    handler?.(message)
  }

  protected cancelAll(): void {
    // cancel any ongoing requests
    new Map(this.pending).forEach((req, key) => {
      req.handler({
        id: key,
        tag: req.tag,
        payload: { tag: 'error', error: { tag: 'cancelled' } },
      })
    })
    this.pending.clear()
  }
  abstract onUnknownMessage(msg: unknown): void
  abstract postMessage(payload: unknown): void
}
