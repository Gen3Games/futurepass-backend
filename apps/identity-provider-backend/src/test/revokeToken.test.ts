/* eslint-disable @typescript-eslint/no-unsafe-argument -- unit test */
/* eslint-disable @typescript-eslint/restrict-template-expressions -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-return -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-call -- unit test */

import * as t from 'io-ts'
import jwt from 'jsonwebtoken'
import * as CO from '../common'

import {
  eoa,
  identityProviderOrigin,
  loginToIdentityProviderBackend,
  nonce,
  obtainTokensWithClientSecret,
} from './utils'

const tokenRevocationBaseUrl = `${identityProviderOrigin}/token/revocation`
const tokenIntrospectionBaseUrl = `${identityProviderOrigin}/token/introspection`
const userinfoBaseUrl = `${identityProviderOrigin}/me`

// FIXME: These can be reenabled after the `custodialBlocker` middleware is deleted
describe.skip('Authorization Endpoint Tests', () => {
  it('should revoke access token after a successful token introspection', async () => {
    /**
     * 
     * The client registered on staging for unit test purposes
     * 
     * {
          "application_type":"web",
          "grant_types":[
              "authorization_code"
          ],
          "id_token_signed_response_alg":"RS256",
          "post_logout_redirect_uris":[
              
          ],
          "require_auth_time":false,
          "response_types":[
              "code"
          ],
          "subject_type":"public",
          "token_endpoint_auth_method":"client_secret_post",
          "require_pushed_authorization_requests":false,
          "client_id_issued_at":1699494082,
          "client_id":"FlCJXgT3U92gXuOpwT1u3",
          "client_name":"unit-test",
          "client_secret_expires_at":0,
          "client_secret":"qscAjtAfwlL7AUSIum8wCQF7HdtkdfV-ODod9k3CSnKSiMyfteD7VqYuyozcSU5qWn8mLkWSewUi1jMPkJy5Ew",
          "redirect_uris":[
              "http://locahost:3000"
          ],
          "registration_client_uri":"https://login.futureverse.cloud/reg/FlCJXgT3U92gXuOpwT1u3",
          "registration_access_token":"d8wueVd9KTLo9KQkL1I-toVltT6Zu5gzaVsfD7hEHGX"
        }
     * 
     */

    const result = await loginToIdentityProviderBackend(
      'FlCJXgT3U92gXuOpwT1u3',
      'http://locahost:3000',
      false
    )

    expect(result).not.toBeNull()
    expect(result?.serverReturnedCode).not.toBeNull()

    const authorizationCode = result?.serverReturnedCode

    if (authorizationCode) {
      // Perform the operation
      const tokens = await obtainTokensWithClientSecret(
        authorizationCode,
        'FlCJXgT3U92gXuOpwT1u3',
        'http://locahost:3000',
        'qscAjtAfwlL7AUSIum8wCQF7HdtkdfV-ODod9k3CSnKSiMyfteD7VqYuyozcSU5qWn8mLkWSewUi1jMPkJy5Ew'
      )

      // Assert that all tokens are present in the response
      expect(tokens).toHaveProperty('id_token')
      expect(tokens).toHaveProperty('access_token')

      const idTokenPayload = CO.hush(
        JWTCodec.decode(jwt.decode(tokens.id_token))
      )

      expect(idTokenPayload).not.toBeNull()

      if (idTokenPayload) {
        expect(idTokenPayload.eoa).toBe(eoa)
        expect(idTokenPayload).toHaveProperty('nonce')
        expect(idTokenPayload.nonce).toBe(nonce)
      }

      const introspectTokenResponse = await introspectToken(
        tokens.access_token,
        'access_token',
        'FlCJXgT3U92gXuOpwT1u3',
        'qscAjtAfwlL7AUSIum8wCQF7HdtkdfV-ODod9k3CSnKSiMyfteD7VqYuyozcSU5qWn8mLkWSewUi1jMPkJy5Ew'
      )
      expect(introspectTokenResponse.active).toBeTruthy()

      const userInfo = await getUserInfo(tokens.access_token)
      expect(userInfo.eoa).toEqual(eoa)

      const revokeTokenResponse = await revokeToken(
        tokens.access_token,
        'access_token',
        'FlCJXgT3U92gXuOpwT1u3',
        'qscAjtAfwlL7AUSIum8wCQF7HdtkdfV-ODod9k3CSnKSiMyfteD7VqYuyozcSU5qWn8mLkWSewUi1jMPkJy5Ew'
      )
      expect(revokeTokenResponse.ok).toBeTruthy()

      const introspectTokenResponseAfterRevoke = await introspectToken(
        tokens.access_token,
        'access_token',
        'FlCJXgT3U92gXuOpwT1u3',
        'qscAjtAfwlL7AUSIum8wCQF7HdtkdfV-ODod9k3CSnKSiMyfteD7VqYuyozcSU5qWn8mLkWSewUi1jMPkJy5Ew'
      )
      expect(introspectTokenResponseAfterRevoke.active).toBeFalsy()

      try {
        await getUserInfo(tokens.access_token)
      } catch (e) {
        expect(e.message).toBe('invalid_token')
      }
    }
  }, 50000)
})

const getUserInfo = async (accessToken: string) => {
  const response = await fetch(userinfoBaseUrl, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + accessToken,
    },
  })

  if (!response.ok) {
    // Throw an error if the response from the token endpoint is not successful
    const errorDetail = await response.json()
    throw new Error(`${errorDetail.error}`)
  }

  return await response.json()
}

const introspectToken = async (
  accessToken: string,
  tokenTypeHint: string,
  clientId: string,
  clientSecret: string
) => {
  const params = {
    token: accessToken,
    token_type_hint: tokenTypeHint,
  }

  const response = await fetch(tokenIntrospectionBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })

  if (!response.ok) {
    // Throw an error if the response from the token endpoint is not successful
    const errorDetail = await response.json()
    throw new Error(`Token endpoint error: ${errorDetail.error}`)
  }

  return await response.json()
}

const revokeToken = async (
  accessToken: string,
  tokenTypeHint: string,
  clientId: string,
  clientSecret: string
) => {
  const params = {
    token: accessToken,
    token_type_hint: tokenTypeHint,
  }

  const response = await fetch(tokenRevocationBaseUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(clientId + ':' + clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })

  if (!response.ok) {
    // Throw an error if the response from the token endpoint is not successful
    const errorDetail = await response.json()
    throw new Error(`Token endpoint error: ${errorDetail.error}`)
  }

  // const result = await response.json()
  // console.log('revokeToken result', result)
  return response
}

const JWTCodec = t.type({
  sub: t.string,
  eoa: t.string,
  custodian: t.literal('self'), // use t.literal when the value is a constant
  chainId: t.number,
  auth_time: t.number,
  nonce: t.string,
  at_hash: t.string,
  aud: t.string,
  exp: t.number,
  iat: t.number,
  iss: t.string,
})
export {}

/* eslint-enable @typescript-eslint/no-unsafe-argument -- unit test */
/* eslint-enable @typescript-eslint/restrict-template-expressions -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-return -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-call -- unit test */
