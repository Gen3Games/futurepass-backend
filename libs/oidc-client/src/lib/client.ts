import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import reporter from 'io-ts-reporters'
import JWT from 'jsonwebtoken'

export type AccessToken = t.TypeOf<typeof AccessToken>
const AccessToken = t.type(
  {
    sub: t.string,
    client_id: t.string,
    exp: t.number,
    iat: t.number,
    iss: t.string,
    scope: t.string,
    token_type: t.string,
  },
  'AccessToken'
)

export type UserInfo = t.TypeOf<typeof UserInfo>
const UserInfo = t.type(
  {
    sub: t.string,
  },
  'UserInfo'
)

export type OpaqueToken = string

export type OIDCConfig = {
  clientId: string
  clientSecret: string
  oidcHost: string
}

export async function userInfo(
  token: OpaqueToken,
  config: { baseURL: string }
): Promise<
  E.Either<
    | {
        code: 'request_failed'
        status: number
      }
    | { code: 'bad_decode'; message: string },
    UserInfo & Record<string, unknown>
  >
> {
  const response = await fetch(`${config.baseURL}/me`, {
    headers: {
      authorization: 'Bearer ' + token,
    },
  })
  if (response.status !== 200) {
    return E.left({ code: 'request_failed', status: response.status })
  }

  const userInfoR = UserInfo.decode(await response.json())
  if (E.isLeft(userInfoR)) {
    return E.left({
      code: 'bad_decode',
      message: reporter.report(userInfoR).join(', '),
    })
  }

  return E.right(userInfoR.right)
}

export async function introspectAccessToken(
  token: OpaqueToken,
  config: OIDCConfig
): Promise<
  E.Either<
    | {
        code: 'request_failed'
        status: number
      }
    | { code: 'bad_decode'; message: string }
    | { code: 'not_active' },
    AccessToken & Record<string, unknown>
  >
> {
  const response = await fetch(`${config.oidcHost}/token/introspection`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization:
        'basic ' +
        Buffer.from(config.clientId + ':' + config.clientSecret).toString(
          'base64'
        ),
    },
    body: new URLSearchParams({
      token,
      token_type_hint: 'access_token',
    }),
  })
  if (response.status !== 200) {
    return E.left({
      code: 'request_failed',
      status: response.status,
    })
  }

  const json = await response.json()

  // check if active first
  const isActiveR = t.strict({ active: t.boolean }).decode(json)
  if (E.isLeft(isActiveR)) {
    return E.left({
      code: 'bad_decode',
      message: reporter.report(isActiveR).join(', '),
    })
  }

  if (!isActiveR.right.active) {
    return E.left({ code: 'not_active' })
  }

  const tokenR = AccessToken.decode(json)
  if (E.isLeft(tokenR)) {
    return E.left({
      code: 'bad_decode',
      message: reporter.report(tokenR).join(', '),
    })
  }

  const out: AccessToken & Record<string, unknown> = tokenR.right
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- these two rules clash
  delete out['active'] // meaningless & potentially confusing to callers

  return E.right(out)
}

export async function getAccessTokenFromRefreshToken(
  refreshToken: string,
  config: OIDCConfig
): Promise<{ access_token: string; refresh_token: string }> {
  const res = await fetch(`${config.oidcHost}/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
    }),
  })
  // TODO handle error where refresh token is no longer valid! the caller should
  //      be informed in this case.
  if (res.status !== 200) {
    throw new Error(
      'Failed to get access token from refreshToken; bad status; status=' +
        res.status
    )
  }
  const resR = t
    .type(
      {
        access_token: t.string,
        refresh_token: t.string,
      },
      'AccessTokenResponse'
    )
    .decode(await res.json())

  if (E.isLeft(resR)) {
    throw new Error(
      'Failed to get access token from refreshToken error=' +
        reporter.report(resR).join(', ')
    )
  }
  return resR.right
}

export function isJWTExpired(token: string, slippageSeconds?: number) {
  const decoded = JWT.decode(token)
  if (decoded == null || typeof decoded === 'string' || decoded.exp == null) {
    throw new Error('Failed to decode JWT')
  }
  const currentTime = Date.now() / 1000
  if (slippageSeconds != null) {
    return decoded.exp < currentTime + slippageSeconds
  }
  return decoded.exp < currentTime
}
