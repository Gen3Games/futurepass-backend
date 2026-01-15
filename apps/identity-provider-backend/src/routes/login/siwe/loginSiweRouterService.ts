import CSRF from 'csrf'
import { Request, Response } from 'express'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { SiweMessage } from 'siwe'

import { identityProviderBackendLogger } from '../../../logger'
import { SignInHeaders } from '../../../types'
import LoginRouterService from '../loginRouterService'

export default class LoginSiweRouterService extends LoginRouterService {
  public async siweVerify(req: Request, res: Response): Promise<string | null> {
    const signinR = await this.signIn(req, this.config.csrfSecret)
    if (E.isLeft(signinR)) {
      return null
    }

    return await this.checkUserAndRedirect(
      {
        type: 'eoa',
        eoa: signinR.right.address,
      },
      req,
      res
    )
  }

  private async signIn(req: Request, csrfSecret: string) {
    const reqHeaderR = SignInHeaders.decode(req.headers)
    if (E.isLeft(reqHeaderR)) {
      return E.left(new Error('Invalid Header'))
    }
    const isValidCSRFToken = new CSRF().verify(
      csrfSecret,
      reqHeaderR.right['x-csrf-token']
    )
    if (!isValidCSRFToken) {
      return E.left(new Error('Invalid CSRF token'))
    }

    const reqR = t
      .type(
        {
          message: t.string,
          signature: t.string, // hex-encoded
        },
        'RequestBody'
      )
      .decode(req.body)

    if (E.isLeft(reqR)) {
      return E.left(new Error('Invalid request body: ' + JSON.stringify(reqR)))
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- it is safe since the arguments to init the SiweMessage has already been decoded
      const siwe = new SiweMessage(JSON.parse(reqR.right.message))
      const validatedSiwe = await siwe.validate(reqR.right.signature)
      return E.right(validatedSiwe)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `siwe message validation failed: ${JSON.stringify(e)}}`,
        2005101,
        {
          methodName: `${this.signIn.name}`,
        }
      )
      return E.left(e)
    }
  }
}
