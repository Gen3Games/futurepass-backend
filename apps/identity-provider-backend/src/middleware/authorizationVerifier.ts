import { NextFunction, Request, Response } from 'express'
import * as njose from 'node-jose'

import * as CO from '../common'
import { identityProviderBackendLogger } from '../logger'
import { config as C } from '../serverConfig'
import { JwsVerifiedTokenPayload } from '../types'
import { isJwtFormat } from '../utils'

export async function authorizationVerifier(
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

  try {
    const keystore = await njose.JWK.asKeyStore(C.KEYSTORE)
    const verifiedToken = await njose.JWS.createVerify(keystore).verify(token)
    const verifiedPayload = CO.hush(
      JwsVerifiedTokenPayload.decode(
        JSON.parse(verifiedToken.payload.toString())
      )
    )

    // Check expiration (exp) claim
    if (verifiedPayload?.exp && Date.now() >= verifiedPayload.exp * 1000) {
      return res.status(401).send({ error: 'Token has expired' })
    }

    if (verifiedPayload == null) {
      identityProviderBackendLogger.info(`JWT is empty - ${token}`)
      return res.status(500).send({
        error: 'Invalid JWT payload',
      })
    }
    const savedAccount = await C.redisClient.get(verifiedPayload.nonce)
    if (savedAccount != verifiedPayload.account) {
      identityProviderBackendLogger.info(
        `Error retrieving account from redis - ${token}`
      )
      return res.status(500).send({
        error: 'internal error',
      })
    }
    next()
    return
  } catch (error) {
    return res.status(401).send({ error: 'invalid auth token provided' })
  }
}
