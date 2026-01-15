import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import reporter from 'io-ts-reporters'

export function fromEnv<A = string>(
  key: string,
  fallback?: A,
  validate?: (i: string) => t.Validation<A>
): typeof validate extends undefined ? string : A {
  return fromEnvNextImpl(key, process.env[key], fallback, validate)
}

function fromEnvNextImpl<A = string>(
  key: string,
  value: string | undefined,
  fallback?: A,
  validate?: (i: string) => t.Validation<A>
): typeof validate extends undefined ? string : A {
  if (value == null) {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing environment variable "${key}"`)
  }
  if (validate != null) {
    let r: t.Validation<A>
    try {
      r = validate(value)
    } catch (e: unknown) {
      console.error(`Bad environment variable for key=${key}:`, value)
      throw new Error('Invalid environment variable')
    }
    if (E.isLeft(r)) {
      throw new Error(
        `Invalid environment variable for key=${key}: ${reporter
          .report(r)
          .join(', ')}`
      )
    }
    return r.right
  }
  return value as A // see conditional type (how to convince TS this is safe?)
}

/**
 * A version of 'fromEnv' that is safe to use for public variables in next js.
 * The caller has to, unfortunately, pass in the value as well as they key as a
 * parameter, making for duplicated and error prone code at the call site (but
 * better error messages at runtime.)
 */
export const fromEnvNextJS: <A = string>(
  key: string,
  value: string | undefined,
  fallback?: A,
  validate?: (i: string) => t.Validation<A>
) => typeof validate extends undefined ? string : A = fromEnvNextImpl

export async function fetchDecoded<
  T extends Record<number, (raw: string) => E.Either<string, unknown>>
>(
  pendingResponse: (() => Promise<Response>) | Promise<Response>,
  decoders: T
): Promise<Output<T>> {
  let res: Response
  try {
    res = await (typeof pendingResponse === 'function'
      ? pendingResponse()
      : pendingResponse)
  } catch (e: unknown) {
    return E.left(`fetch failed with error; message=` + (e as Error).message)
  }
  const decoder = decoders[res.status]
  if (decoder == null) {
    return E.left(`unexpected status code: ${res.status}`)
  }

  const raw = await res.text()
  const result = decoder(raw)

  if (E.isLeft(result)) {
    return E.left(`failed to decode body: ${result.left}`)
  }

  return E.right(result.right) as Output<T>
}

type ValueOf<T> = T[keyof T]
type Output<T> = E.Either<
  string,
  ValueOf<{
    [P in keyof T]: T[P] extends (raw: string) => E.Either<string, infer R>
      ? R
      : never
  }>
>

export function renderUnknownError(e: unknown, stack = false): string {
  if (e instanceof Error) {
    if (stack) {
      return e.stack ?? e.message
    }
    return e.message
  }
  if (typeof e === 'string') {
    return e
  }
  return '<unknown error>'
}

export function fromJSONString<A>(
  type: t.Decoder<unknown, A>,
  input: string,
  ctx: t.Context = []
): t.Validation<A> {
  let json: unknown
  try {
    json = JSON.parse(input)
  } catch (e) {
    return t.failure(input, ctx, 'Invalid JSON')
  }
  return type.decode(json)
}

// TODO: make this type safe - see: https://alteredstatemachine.atlassian.net/browse/FPD-128?atlOrigin=eyJpIjoiYWFmYmUzNGQwZTA1NGI5ODg3OTFhMTMzMDM5MDI3ZGEiLCJwIjoiaiJ9
export async function executeGraphQuery(
  url: string,
  query: string,
  variables: Record<string, unknown>,
  accessToken?: string
) {
  const fetchResponse = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      query,
      variables,
    }),
    ...(accessToken && {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  })

  // TODO: use `fetchDecoded` with a Codec here
  const data = await fetchResponse.json()

  return data
}
