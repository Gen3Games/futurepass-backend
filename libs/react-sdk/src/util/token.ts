import { Address, Custodian } from '@futureverse/experience-sdk'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import reporter from 'io-ts-reporters'
import { jwtDecode } from 'jwt-decode'

const optionalString = t.union([t.string, t.undefined, t.null])
export const IdTokenC = t.strict(
  {
    eoa: Address,
    sub: t.string,
    custodian: Custodian,
    chainId: t.number,
    futurepass: Address,
    nonce: optionalString,
    s_hash: optionalString,
    at_hash: optionalString,
    aud: t.string,
    exp: t.number,
    iat: t.number,
    iss: t.string,
  },
  'IdToken'
)

export const TokenEndpointResponseC = t.strict(
  {
    access_token: t.string,
    expires_in: t.number,
    id_token: t.string,
    scope: t.string,
    token_type: t.string,
  },
  'TokenEndpointResponse'
)

export const getUserFromToken = (idToken: string) => {
  const decoded = IdTokenC.decode(jwtDecode(idToken))
  if (E.isLeft(decoded)) {
    console.warn('invalid jwt; error=' + reporter.report(decoded).join(', '))
    return
  }
  return decoded.right
}
