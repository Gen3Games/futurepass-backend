import * as t from 'io-ts'

export type RequestDescription<Tag extends string, I, IO> = {
  tag: Tag
  request: t.Type<I, IO>
}

export type ResponseDescription<Tag extends string, ER, ERO, EV, EVO, R, RO> = {
  tag: Tag
  error: t.Type<ER, ERO>
  event: t.Type<EV, EVO>
  response: t.Type<R, RO>
}

export type APIDescription<
  Tag extends string,
  I,
  IO,
  ER,
  ERO,
  EV,
  EVO,
  R,
  RO
> = RequestDescription<Tag, I, IO> &
  ResponseDescription<Tag, ER, ERO, EV, EVO, R, RO>

export type RequestTypeOf<T extends APIDesc> = T extends APIDescription<
  infer Tag,
  infer I,
  infer IO,
  // these 'any' types are perfectly safe.
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any // eslint-disable-line @typescript-eslint/no-explicit-any
>
  ? Tag extends string
    ? RequestCodec<Tag, I, IO>
    : never
  : never

export type ResponseTypeOf<T extends APIDesc> = T extends APIDescription<
  infer Tag,
  // these 'any' types are perfectly safe.
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  // these 'any' types are perfectly safe.
  infer ER,
  infer ERO,
  infer EV,
  infer EVO,
  infer R,
  infer RO
>
  ? ResponseCodec<Tag, ER, ERO, EV, EVO, R, RO>
  : never

export type EventPayloadOf<
  API extends APIBuilder,
  K extends keyof API
> = API[K] extends {
  event: infer R
}
  ? R extends t.Mixed
    ? R
    : never
  : never

export type APIError<A, O> = t.UnionC<
  [
    t.TypeC<{ tag: t.LiteralC<'cancelled'> }>,
    t.TypeC<{ tag: t.LiteralC<'decodeError'>; error: t.StringC }>,
    t.TypeC<{ tag: t.LiteralC<'internalError'>; error: t.StringC }>,
    t.TypeC<{ tag: t.LiteralC<'runError'>; error: t.Type<A, O> }>
  ]
>
export function wrapError<A, O>(errorType: t.Type<A, O>): APIError<A, O> {
  return t.union([
    t.type({ tag: t.literal('cancelled') }),
    t.type({ tag: t.literal('decodeError'), error: t.string }),
    t.type({ tag: t.literal('internalError'), error: t.string }),
    t.type({ tag: t.literal('runError'), error: errorType }),
  ])
}

type Types<API> = {
  // extends APIBuilder> = {
  readonly [P in keyof API]: API[P] extends APIDescription<
    infer Tag,
    infer I,
    infer IO,
    infer ER,
    infer ERO,
    infer EV,
    infer EVO,
    infer R,
    infer RO
  >
    ? {
        tag: Tag
        input: t.TypeOf<t.Type<I, IO>>
        error: t.TypeOf<APIError<ER, ERO>>
        event: t.TypeOf<t.Type<EV, EVO>>
        response: t.TypeOf<t.Type<R, RO>>
      }
    : never
}

export type RequestPayloadOf<
  API, // extends APIBuilder,
  K extends keyof API
> = Types<API>[K]['input']
export type ResponsePayloadOf<
  API extends APIBuilder,
  K extends keyof API
> = Types<API>[K]['response']
export type ErrorOf<
  API extends APIBuilder,
  K extends keyof API
> = Types<API>[K]['error']
export type EventOf<
  API extends APIBuilder,
  K extends keyof API
> = Types<API>[K]['event']

type RequestCodec<Tag extends string, A, O> = t.TypeC<{
  id: t.StringC
  tag: t.LiteralC<Tag>
  payload: t.Type<A, O>
}>

export function Request<Tag extends string, A, O>({
  tag,
  request,
}: RequestDescription<Tag, A, O>): RequestCodec<Tag, A, O> {
  return t.type(
    {
      id: t.string,
      tag: t.literal(tag),
      payload: request,
    },
    `Request<${tag}>`
  )
}

export const Envelope = t.type(
  {
    id: t.string,
  },
  'Envelope'
)
export type Envelope = t.TypeOf<typeof Envelope>

type ResponseCodec<Tag extends string, ER, ERO, EV, EVO, R, RO> = t.TypeC<{
  id: t.StringC
  tag: t.LiteralC<Tag>
  payload: t.UnionC<
    [
      t.TypeC<{ tag: t.LiteralC<'error'>; error: APIError<ER, ERO> }>,
      t.TypeC<{ tag: t.LiteralC<'event'>; event: t.Type<EV, EVO> }>,
      t.TypeC<{ tag: t.LiteralC<'response'>; response: t.Type<R, RO> }>
    ]
  >
}>

export function Response<Tag extends string, ER, ERO, EV, EVO, R, RO>({
  tag,
  error,
  event,
  response,
}: ResponseDescription<Tag, ER, ERO, EV, EVO, R, RO>): ResponseCodec<
  Tag,
  ER,
  ERO,
  EV,
  EVO,
  R,
  RO
> {
  return t.type(
    {
      id: t.string,
      tag: t.literal(tag),
      payload: t.union(
        [
          t.type({ tag: t.literal('error'), error: wrapError(error) }, 'error'),
          t.type({ tag: t.literal('event'), event }, 'event'),
          t.type({ tag: t.literal('response'), response }, 'response'),
        ],
        'payload'
      ),
    },
    `Response<${tag}>`
  )
}

// turn a union type into a tuple. note that this unions are unordered and the
// order of the resulting type is undefined. for our purposes this does not
// matter, however, as the io-ts UnionC type does not care about the order.
//
// see: https://github.com/Microsoft/TypeScript/issues/13298
export type UnionToTuple<T> = // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (
    (T extends any ? (t: T) => T : never) extends infer U
      ? // this is perfectly safe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (U extends any ? (u: U) => any : never) extends (v: infer V) => any
        ? V
        : never
      : never
  ) extends // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (_: any) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : []

export type ValueOf<T> = T[keyof T]

export type ToResponseIOTS<T> = T extends [
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResponseCodec<string, any, any, any, any, any, any>,
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ResponseCodec<string, any, any, any, any, any, any>,
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...Array<ResponseCodec<string, any, any, any, any, any, any>>
]
  ? t.UnionC<T>
  : // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends [ResponseCodec<string, any, any, any, any, any, any>]
  ? T[0]
  : never

export type ToRequestIOTS<T> = T extends [
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RequestCodec<string, any, any>,
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RequestCodec<string, any, any>,
  // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...Array<RequestCodec<string, any, any>>
]
  ? t.UnionC<T>
  : // this is perfectly safe
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends [RequestCodec<string, any, any>]
  ? T[0]
  : never

export type ToIOTS<T> = T extends [t.Mixed, t.Mixed, ...Array<t.Mixed>]
  ? t.UnionC<T>
  : T extends [t.Mixed]
  ? T[0]
  : never

export type RequestCodecsOf<API extends APIBuilder> = {
  readonly [P in keyof API]: RequestTypeOf<API[P]>
}

export type ResponseCodecsOf<API extends APIBuilder> = {
  readonly [P in keyof API]: ResponseTypeOf<API[P]>
}

export type RequestCodecOf<API extends APIBuilder> = ToRequestIOTS<
  UnionToTuple<ValueOf<RequestCodecsOf<API>>>
>

export type ResponseCodecOf<API extends APIBuilder> = ToResponseIOTS<
  UnionToTuple<ValueOf<ResponseCodecsOf<API>>>
>

type APIDesc = Readonly<{
  tag: string
  request: t.Mixed
  error: t.Mixed
  event: t.Mixed
  response: t.Mixed
}>

export type APIBuilder = {
  readonly [name: string]: APIDesc
}

export function AnyRequestOf<T extends APIBuilder>(api: T): RequestCodecOf<T> {
  const ts: any[] = []
  for (const kraw in api) {
    const k: keyof typeof api = kraw
    // this is safe
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const v: APIDesc = api[k]!
    ts.push(Request(v))
  }

  // this is safe
  if (ts.length === 0) {
    throw new Error('Invariant violation: Empty APIs are not supported')
  } else if (ts.length === 1) {
    // TypeScript cannot follow here, but this is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
    return ts[0] as any
  } else {
    // TypeScript cannot follow here, but this is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
    return t.union(ts as any) as any
  }
}

export function AnyResponseOf<T extends APIBuilder>(
  api: T
): ResponseCodecOf<T> {
  const ts: any[] = []
  for (const kraw in api) {
    const k: keyof typeof api = kraw
    // this is safe
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const v: APIDesc = api[k]!
    ts.push(Response(v))
  }

  // this is safe
  if (ts.length === 0) {
    throw new Error('Invariant violation: Empty APIs are not supported')
  } else if (ts.length === 1) {
    // TypeScript cannot follow here, but this is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
    return ts[0] as any
  } else {
    // TypeScript cannot follow here, but this is safe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-return
    return t.union(ts as any) as any
  }
}

export type TagOf<API extends APIBuilder> = ValueOf<API>['tag']
export type TagToKey<API extends APIBuilder, Tag> = ValueOf<{
  [P in keyof API]: API[P] extends { tag: Tag } ? P : never
}>
