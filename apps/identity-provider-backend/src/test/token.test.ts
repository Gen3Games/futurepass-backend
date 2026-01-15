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
  code_verifier,
  eoa,
  identityProviderOrigin,
  loginToIdentityProviderBackend,
  nonce,
  obtainTokensWithClientSecret,
} from './utils'

const clientOrigin = 'https://identity-dashboard.futureverse.cloud'
const tokenBaseUrl = `${identityProviderOrigin}/token`

// FIXME: These can be reenabled after the `custodialBlocker` middleware is deleted
describe.skip('Authorization Endpoint Tests', () => {
  it('should obtain tokens with valid authorization code', async () => {
    const clientId = 'dashboard'
    const redirectUri = `${clientOrigin}/login`

    const result = await loginToIdentityProviderBackend(
      clientId,
      redirectUri,
      true
    )

    expect(result).not.toBeNull()
    expect(result?.serverReturnedCode).not.toBeNull()

    const authorizationCode = result?.serverReturnedCode

    if (authorizationCode) {
      // Perform the operation
      const tokens = await obtainTokens(
        authorizationCode,
        clientId,
        redirectUri
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
    }
  }, 50000)

  it('should throw an error with invalid authorization code', async () => {
    const clientId = 'dashboard'
    const redirectUri = `${clientOrigin}/login`

    // Pass an invalid authorization code
    const authorizationCode = 'invalid-authorization-code'

    // Expect the obtainTokens function to throw an error
    await expect(
      obtainTokens(authorizationCode, clientId, redirectUri)
    ).rejects.toThrow('Token endpoint error:')
  })

  it('should obtain tokens with valid authorization code using client secret', async () => {
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
    }
  }, 50000)
})

const obtainTokens = async (
  authorizationCode: string,
  clientId: string,
  redirectUri: string
) => {
  const params = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier,
  }

  const response = await fetch(tokenBaseUrl, {
    method: 'POST',
    headers: {
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
