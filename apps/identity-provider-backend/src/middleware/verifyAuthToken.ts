import { NextFunction, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import * as pemJwk from 'pem-jwk'

import * as CO from '../common'
import { config as C } from '../serverConfig'
import * as T from '../types'
import { isJwtFormat } from '../utils'

export function verifyAuthToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).send({ error: 'No auth token provided' })
  }

  const tokenArray = authHeader.split(' ')

  if (tokenArray.length !== 2) {
    return res.status(401).send({ error: 'invalid auth token provided' })
  }

  const [_, token] = tokenArray

  if (!isJwtFormat(token)) {
    return res.status(400).send({
      error: 'The input is not a valid JWT',
    })
  }

  // Extract the public key from the keystore
  const publicKeyJwk = C.KEYSTORE.keys[0]
  const publicKeyPem = pemJwk.jwk2pem(publicKeyJwk)

  try {
    // Verify JWT signature using the public key
    const decodedToken = jwt.verify(token, publicKeyPem, {
      algorithms: ['RS256'],
    })

    // If the signature is valid, the decodedToken will contain the decoded payload
    const decoded = CO.hush(T.JwtPayload.decode(decodedToken))

    if (
      decoded == null ||
      ![
        'https://login.futureverse.app',
        'https://login.futureverse.cloud',
        'https://login.futureverse.dev',
        'https://login.futureverse.kiwi',
        'https://login.futureverse.red',
      ].includes(decoded.iss)
    ) {
      return res.status(500).send({
        error: 'Invalid JWT payload',
      })
    }
    // todo: put it into the req header instead of body ?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we need to add verifiedEoa to the request body
    req.body.verifiedEoa = decoded.eoa
    next()
    return
  } catch (error) {
    return res.status(401).send({ error: 'invalid auth token provided' })
  }
}
