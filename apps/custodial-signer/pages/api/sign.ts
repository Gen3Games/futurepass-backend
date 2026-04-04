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
import * as CustodyAPI from '../../custody-api'
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

  const signer = hush(
    t
      .strict({
        access_token: t.string,
        eoa: t.string,
        subject: t.string,
        issuer: t.string,
      })
      .decode(jwt)
  )

  if (session?.user == null || signer == null || signer.access_token == null) {
    res.status(401).json({ error: 'unauthorized', message: 'no session' })
    return
  }

  const accessToken = signer.access_token
  const signerAPIHost = config.server.signerAPIHost

  if (signerAPIHost == null) {
    res.status(500).json({ message: 'Signer API host is not configured' })
    return
  }

  // parse the params
  const reqR = SignRequest.decode(req.body)
  if (E.isLeft(reqR)) {
    res.status(400).json({ message: PathReporter.report(reqR).join(', ') })
    return
  }

  if (reqR.right.account.toLowerCase() !== signer.eoa.toLowerCase()) {
    res.status(403).json({
      error: 'invalid_signer',
      message: 'request account does not match authenticated signer',
      expected: signer.eoa,
      actual: reqR.right.account,
    })
    return
  }

  const digest =
    reqR.right.type === 'message'
      ? hashMessage({
          message: reqR.right.message,
          isUTF8Encoded: false,
        })
      : keccak256(arrayify(reqR.right.transaction))

  // sign the given digest
  const signature = await CustodyAPI.sign(signerAPIHost, accessToken, {
    subject: signer.subject,
    issuer: signer.issuer,
    digest,
  })

  res.json({
    signature,
  })
}
