import { arrayify } from '@ethersproject/bytes'
import { keccak256 } from '@ethersproject/keccak256'
import { SignRequest } from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import { PathReporter } from 'io-ts/PathReporter'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { config } from '../../config'
import * as FoundationAPI from '../../foundation-api'
import { hush, hashMessage } from '../../src/utils'
import { authOptions } from './auth/[...nextauth]'

export default async function SignR(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const session = await getServerSession(req, res, authOptions)
  const jwt = await getToken({
    req,
    cookieName: authOptions.cookies?.sessionToken?.name,
  })

  const access_token = hush(
    t.strict({ access_token: t.string }).decode(jwt)
  )?.access_token

  if (session == null || access_token == null) {
    res.status(401).json({ error: 'unauthorized', message: 'no session' })
    return
  }

  // parse the params
  const reqR = SignRequest.decode(req.body)
  if (E.isLeft(reqR)) {
    res.status(400).json({ message: PathReporter.report(reqR).join(', ') })
    return
  }

  let digest: string | null = null
  if (reqR.right.type === 'message') {
    digest = hashMessage({
      message: reqR.right.message,
      isUTF8Encoded: false,
    })
  } else {
    digest = keccak256(arrayify(reqR.right.transaction))
  }

  if (digest == null) {
    res.status(400).json({ message: 'Failed to generate digest' })
    return
  }

  // sign the given digest
  const signature = await FoundationAPI.sign(
    config.server.foundationAPIHost,
    access_token,
    digest
  )

  res.json({
    signature,
  })
}
