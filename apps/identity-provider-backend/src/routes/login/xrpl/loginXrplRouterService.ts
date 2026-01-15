import * as sdk from '@futureverse/experience-sdk'
import CSRF from 'csrf'
import { Request, Response } from 'express'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { verifySignature } from 'verify-xrpl-signature'
import { identityProviderBackendLogger } from '../../../logger'
import { SignInHeaders } from '../../../types'
import LoginRouterService from '../loginRouterService'

export default class LoginXrplRouterService extends LoginRouterService {
  /**
   * Handles XRPL sign-in requests.
   * this endpoint is used to verify the signature of the xrpl transaction from `/fvlogin` page.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @returns A Promise that resolves to a string or null.
   */
  public async xrplSignIn(req: Request, res: Response): Promise<string | null> {
    const reqHeaderR = SignInHeaders.decode(req.headers)
    if (E.isLeft(reqHeaderR)) {
      identityProviderBackendLogger.error('Invalid Header', 2005102)
      return null
    }
    const isValidCSRFToken = new CSRF().verify(
      this.config.csrfSecret,
      reqHeaderR.right['x-csrf-token']
    )
    if (!isValidCSRFToken) {
      identityProviderBackendLogger.error('Invalid CSRF token', 2005102)
      return null
    }

    const reqR = t
      .type(
        {
          eoa: t.string,
          publicKey: t.string,
          transaction: t.string,
        },
        'RequestBody'
      )
      .decode(req.body)

    if (E.isLeft(reqR)) {
      identityProviderBackendLogger.error(
        'Invalid request body: ' + JSON.stringify(reqR),
        2005102
      )
      return null
    }

    try {
      const signature = verifySignature(reqR.right.transaction)
      if (!signature.signatureValid) {
        identityProviderBackendLogger.error('Invalid signature', 2005102)
        return null
      }
      const signatureRAddress = signature.signedBy
      const derivedRAddress = sdk.deriveAddressPair(reqR.right.publicKey)[1]
      if (signatureRAddress !== derivedRAddress) {
        identityProviderBackendLogger.error(
          'signatureRAddress !== derivedRAddress',
          2005102
        )
        return null
      }
      const derivedEoa = sdk.deriveAddressPair(reqR.right.publicKey)[0]
      if (reqR.right.eoa !== derivedEoa) {
        identityProviderBackendLogger.error(
          'reqR.right.eoa !== derivedEoa',
          2005102
        )
        return null
      }

      return await this.checkUserAndRedirect(
        {
          type: 'xrpl',
          eoa: reqR.right.eoa,
          publicKey: reqR.right.publicKey,
        },
        req,
        res
      )
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `xrpl sign in failed: ${JSON.stringify(e)}}`,
        2005102
      )
      return null
    }
  }
}
