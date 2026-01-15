import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import * as jose from 'jose'
import { identityProviderBackendLogger } from './logger'

export async function createAuthToken(opts: {
  issuer: string
  subject: string
  secretKey: jose.JWK
}): Promise<string> {
  const k = await jose.importJWK(opts.secretKey)
  const out = await new jose.SignJWT({})
    .setProtectedHeader({
      alg: 'RS256',
      kid: opts.secretKey.kid,
    })
    .setSubject(opts.subject)
    .setIssuedAt()
    .setIssuer(opts.issuer)
    .setExpirationTime('1h') // ...
    .sign(k)
  return out
}

export async function getOrCreateKey(
  baseURL: string,
  authToken: string
): Promise<{ publicKey: string }> {
  const r = await createKey(baseURL, authToken)
  if (r === 'exists') {
    const e = await keyInfo(baseURL, authToken)
    if (e == null /* what? */) {
      throw new Error('Failed to get or create key')
    }
    return { publicKey: e.publicKey }
  }
  return { publicKey: r.publicKey }
}

const KeyInfo = t.type(
  {
    publicKey: t.string,
  },
  'KeyInfo'
)

export async function createKey(
  baseURL: string,
  authToken: string
): Promise<'exists' | { publicKey: string }> {
  const requestStartTime = identityProviderBackendLogger.streamApiData(
    `Calling Foundation API to create a key`,
    4004501,
    'POST'
  )
  const response = await fetch(baseURL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  identityProviderBackendLogger.streamApiData(
    `Calling Foundation API to create a key`,
    4004501,
    'POST',
    response.status.toString(),
    requestStartTime
  )

  if (response.status === 409) {
    return 'exists'
  }
  if (response.status !== 201) {
    throw new Error(`Unexpected response status=${response.status}`)
  }

  const outR = KeyInfo.decode(await response.json())
  if (E.isLeft(outR)) {
    throw new Error(
      'Failed to decode response; error=' + PathReporter.report(outR).join(', ')
    )
  }

  return outR.right
}

export async function keyInfo(
  baseURL: string,
  authToken: string
): Promise<null | { publicKey: string }> {
  const requestStartTime = identityProviderBackendLogger.streamApiData(
    `Calling Foundation API to get a key`,
    4004502,
    'GET'
  )
  const response = await fetch(baseURL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  identityProviderBackendLogger.streamApiData(
    `Calling Foundation API to get a key`,
    4004502,
    'GET',
    response.status.toString(),
    requestStartTime
  )
  if (response.status !== 200) {
    return null
  }

  const outR = KeyInfo.decode(await response.json())
  if (E.isLeft(outR)) {
    throw new Error(
      'Failed to decode response; error=' + PathReporter.report(outR).join(', ')
    )
  }

  return outR.right
}
