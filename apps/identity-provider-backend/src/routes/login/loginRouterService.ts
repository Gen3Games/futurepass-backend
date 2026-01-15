import * as sdk from '@futureverse/experience-sdk'
import { ethers } from 'ethers'
import { Request, Response } from 'express'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import * as njose from 'node-jose'
import { Snowflake } from 'nodejs-snowflake'
import Provider from 'oidc-provider'
import { SiweMessage } from 'siwe'
import { verifySignature } from 'verify-xrpl-signature'
import * as xrpl from 'xrpl'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { OIDCRoutesConfig } from '../../oidc'
import { config as C } from '../../serverConfig'
import { FVSub, FVUser } from '../../types'
import { deriveRAddress, generateErrorRouteUri } from '../../utils'
import { revokeTokens } from '../../utils/session'
import RouterService from '../routerService'

const snowflake = new Snowflake()
export default class LoginRouterService extends RouterService {
  protected provider: Provider
  protected config: OIDCRoutesConfig

  constructor(provider: Provider, config: OIDCRoutesConfig) {
    super()
    this.provider = provider
    this.config = config
  }

  /**
   * Retrieves login_hint from stored Interaction,
   * If login_hint is not present, redirects user to the frontend wallet selection page that is used for games.
   * If login_hint is present, it checks the type of login_hint and redirects user to the appropriate login page.
   *    - If login_hint is of type 'eoa', it validates the signature and log in the user.
   *    - If login_hint is of type 'xrpl', it validates the signature and log in the user.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @returns A promise that resolves to a string representing the login redirect URI.
   */
  public async getLoginRedirectUri(
    req: Request,
    res: Response
  ): Promise<string> {
    const details = await this.provider.interactionDetails(req, res)
    if (details.prompt.name === 'login') {
      const login_hint: string | null = (() => {
        const o = details.params['login_hint']
        if (typeof o === 'string') return o
        return null
      })()

      if (login_hint) {
        if (login_hint.startsWith('eoa:')) {
          const msgURLEncoded = login_hint.slice(4)
          const msg = new URLSearchParams(msgURLEncoded)
          const params: Record<string, string> = {}

          msg.forEach((v, k) => {
            if (k === 'signature') return
            params[k] = v
          })

          const siwe = new SiweMessage(params)

          // the client MUST set these as per below.

          siwe.version = '1'
          siwe.uri = res.locals.idpOrigin ?? this.config.hostname
          siwe.chainId = this.config.chainId

          // TODO this MUST be inferred by client id, but we allow it via 'params' for
          //      now (it's 11.15pm and release is tomorrow 10am...)
          // siwe.domain = new URL(environment.host).host;

          // TODO XXX since the client is in control of the nonce how can we check
          //          for replays? Should we additionally also verify issuedAt field
          //          accounting for some time skew?
          await siwe.validate(msg.get('signature') ?? undefined)

          // if we get here we have a valid siwe message and we can complete the
          // interaction.

          return await this.checkUserAndRedirect(
            {
              type: 'eoa',
              eoa: siwe.address,
            },
            req,
            res
          )
        } else if (login_hint.startsWith('xrpl:')) {
          const hintParts = login_hint.split(':')
          if (hintParts.length === 6) {
            const publicKey = hintParts[1]
            const eoa = hintParts[3]
            const transaction = hintParts[5]

            const signature = verifySignature(transaction)
            if (!signature.signatureValid) {
              identityProviderBackendLogger.error(
                'Signature is not valid',
                2005102
              )
              return `${generateErrorRouteUri(2005102)}`
            }
            const derivedRAddress = sdk.deriveAddressPair(publicKey)[1]
            if (derivedRAddress !== signature.signedBy) {
              identityProviderBackendLogger.error(
                'Derived address does not match signed by address',
                2005102
              )
              return `${generateErrorRouteUri(2005102)}`
            }

            const derivedEoa = sdk.deriveAddressPair(publicKey)[0]
            if (derivedEoa !== eoa) {
              identityProviderBackendLogger.error(
                'Derived EOA does not match provided EOA',
                2005102
              )
              return `${generateErrorRouteUri(2005102)}`
            }

            return await this.checkUserAndRedirect(
              {
                type: 'xrpl',
                eoa,
                publicKey,
              },
              req,
              res
            )
          } else {
            identityProviderBackendLogger.error('Invalid login hint', 2005103, {
              methodName: `${this.getLoginRedirectUri.name}`,
            })
            return `${generateErrorRouteUri(2005103)}`
          }
        } else {
          const loginHint = login_hint.split(':')

          // we know that the login_hint is formatted as A:B
          if (loginHint.length !== 2) {
            identityProviderBackendLogger.error('Invalid login hint', 2005103, {
              methodName: `${this.getLoginRedirectUri.name}`,
            })
            return `${generateErrorRouteUri(2005103)}`
          }

          if (loginHint[0] === 'email') {
            return await this.checkUserAndRedirect(
              {
                type: 'email',
                email: '',
              },
              req,
              res
            )
          }

          if (loginHint[0] === 'social' && loginHint[1] != '') {
            const ssoType = sdk.SocialSSOType.decode(loginHint[1])
            if (E.isLeft(ssoType)) {
              identityProviderBackendLogger.error(
                'Invalid login hint',
                2005103,
                {
                  methodName: `${this.getLoginRedirectUri.name}`,
                }
              )
              return `${generateErrorRouteUri(2005103)}`
            }
            return await this.checkUserAndRedirect(
              {
                type: 'idp',
                idp: ssoType.right,
                sub: '',
              },
              req,
              res
            )
          }
        }
      }

      const clientId = sdk.hush(t.string.decode(details.params.client_id))

      if (clientId == null) {
        identityProviderBackendLogger.error(
          `clientId is missing in the request`,
          2003201
        )
        return '/error'
      }

      // this redirects user to the frontend fvlogin page
      return await this.redirectToFvLoginPage(clientId)
    }

    identityProviderBackendLogger.error('Invalid login promote', 2005104, {
      methodName: `${this.getLoginRedirectUri.name}`,
    })
    return `${generateErrorRouteUri(2005104)}`
  }

  public async checkUserAndRedirect(
    sub: FVSub,
    req: Request,
    res: Response
  ): Promise<string> {
    // find user by their id
    const user = await this.config.fv.findUserBySub(sub)

    identityProviderBackendLogger.debug(
      `checkUserAndRedirect, find user by sub, ${JSON.stringify(user)}`,
      {
        methodName: `${this.checkUserAndRedirect.name}`,
      }
    )
    // if user does not exist or has not accepted terms, redirect to terms page
    if (user == null || !user.hasAcceptedTerms) {
      await this.provider.interactionResult(req, res, {
        sub: FVSub.encode(sub),
      })

      // let nonce: string | undefined
      if (sub.type === 'eoa') {
        identityProviderBackendLogger.stream(
          `Non-custodial account registration with account: ${sub.eoa}`,
          4001001
        )
        const eoa = CO.hush(sdk.Address.decode(sub.eoa))
        if (eoa == null) {
          identityProviderBackendLogger.error(
            `Invalid sub eoa: ${sub.eoa}`,
            4004105,
            {
              methodName: `${this.checkUserAndRedirect.name}`,
            }
          )
          return `${generateErrorRouteUri(4004105)}`
        }

        const is2faRequired = await this.isTwoFactorAuthRequired({
          type: 'Ethereum',
          eoa,
        })
        const is2faVerified = await this.isTwoFactorAuthVerified(eoa)

        identityProviderBackendLogger.debug(
          `is2faRequired: ${is2faRequired ? 'true' : 'false'}; is2faVerified: ${
            is2faVerified ? 'true' : 'false'
          }`,
          {
            methodName: `${this.checkUserAndRedirect.name}`,
          }
        )
        if (is2faRequired && !is2faVerified) {
          return this.redirectToLoginPage(`/login/auth/sms?eoa=${eoa}`, sub)
        }
      }

      if (sub.type === 'xrpl') {
        identityProviderBackendLogger.stream(
          `Non-custodial account registration with account: ${sub.eoa} ${sub.publicKey}`,
          4001001
        )
        const eoa = CO.hush(sdk.Address.decode(sub.eoa))
        if (eoa == null) {
          identityProviderBackendLogger.error(
            `Invalid sub eoa: ${sub.eoa}`,
            4004105,
            {
              methodName: `${this.checkUserAndRedirect.name}`,
            }
          )
          return `${generateErrorRouteUri(4004105)}`
        }

        const is2faRequired = await this.isTwoFactorAuthRequired({
          type: 'XRPL',
          publicKey: sub.publicKey,
        })
        const is2faVerified = await this.isTwoFactorAuthVerified(eoa)

        identityProviderBackendLogger.debug(
          `is2faRequired: ${is2faRequired ? 'true' : 'false'}; is2faVerified: ${
            is2faVerified ? 'true' : 'false'
          }`,
          {
            methodName: `${this.checkUserAndRedirect.name}`,
          }
        )
        if (is2faRequired && !is2faVerified) {
          return this.redirectToLoginPage(`/login/auth/sms?eoa=${eoa}`, sub)
        }
      }

      if (sub.type === 'email') {
        if (sub.email.length === 0) {
          identityProviderBackendLogger.stream(
            `Custodial account registration with email`,
            4001002
          )
          return this.redirectToLoginPage(`/login/email?hint=email`, sub)
        }
      }

      if (sub.type === 'idp') {
        if (sub.sub.length === 0) {
          identityProviderBackendLogger.stream(
            `Custodial account registration with ${sub.idp} account`,
            4001002
          )
          return this.redirectToLoginPage(
            `/login/social?hint=social&target=${sub.idp}`,
            sub
          )
        }
      }

      return this.redirectToLoginPage(`/login/terms`, sub)
    }
    const accountId = FVSub.encode(user.sub)

    await this.#handleSessionCleanUp(req, res, user)

    // otherwise, finish the login
    return await this.provider.interactionResult(req, res, {
      login: {
        accountId,
      },
    })
  }

  private async redirectToLoginPage(redirectUri: string, sub: FVSub) {
    // If user is redirected to the frontend login page, it means that multi-factor authentication is required
    identityProviderBackendLogger.stream(
      `multi-factor authentication is required, redirect user to the frontend. sub type is ${sub.type}`,
      2001003
    )

    const nonce: string | undefined = snowflake.getUniqueID().toString()

    const keystore = await njose.JWK.asKeyStore(C.KEYSTORE)
    const exp = Math.floor(Date.now() / 1000) + 3600 // token valid for 1h

    if (sub.type === 'eoa') {
      const eoa = CO.hush(sdk.Address.decode(sub.eoa))
      if (eoa != null) {
        const payload = {
          account: eoa,
          nonce,
          exp,
        }
        const signedToken = await njose.JWS.createSign(
          { format: 'compact' },
          keystore.all()
        )
          .update(JSON.stringify(payload), 'utf8')
          .final()

        await this.config.redis?.set(nonce, eoa)

        // TODO: nonce is valid in 15 mins ?
        await this.config.redis?.expire(nonce, 1000 * 60 * 15)

        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- it is safe here because we use JSON.stringify(payload) to ensure the token is converted to string
        const tokenQuery = `token=${signedToken}`
        return redirectUri.includes('?')
          ? redirectUri.concat(`&${tokenQuery}`)
          : redirectUri.concat(`?${tokenQuery}`)
      }
    }

    if (sub.type === 'xrpl') {
      const eoa = CO.hush(sdk.Address.decode(sub.eoa))
      if (eoa != null) {
        const payload = {
          account: eoa,
          publicKey: sub.publicKey,
          nonce,
          exp,
        }
        const signedToken = await njose.JWS.createSign(
          { format: 'compact' },
          keystore.all()
        )
          .update(JSON.stringify(payload), 'utf8')
          .final()

        await this.config.redis?.set(nonce, eoa)

        // TODO: nonce is valid in 15 mins ?
        await this.config.redis?.expire(nonce, 1000 * 60 * 15)

        // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- it is safe here because we use JSON.stringify(payload) to ensure the token is converted to string
        const tokenQuery = `token=${signedToken}`
        return redirectUri.includes('?')
          ? redirectUri.concat(`&${tokenQuery}`)
          : redirectUri.concat(`?${tokenQuery}`)
      }
    }

    if (sub.type === 'idp') {
      const payload = {
        account: sub.sub,
        nonce,
        exp,
      }
      const signedToken = await njose.JWS.createSign(
        { format: 'compact' },
        keystore.all()
      )
        .update(JSON.stringify(payload), 'utf8')
        .final()

      await this.config.redis?.set(nonce, sub.sub)
      // TODO: nonce is valid in 15 mins ?
      await this.config.redis?.expire(nonce, 1000 * 60 * 15)

      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- it is safe here because we use JSON.stringify(payload) to ensure the token is converted to string
      const tokenQuery = `token=${signedToken}`
      return redirectUri.includes('?')
        ? redirectUri.concat(`&${tokenQuery}`)
        : redirectUri.concat(`?${tokenQuery}`)
    }

    if (sub.type === 'email') {
      const payload = {
        account: sub.email,
        nonce,
        exp,
      }
      const signedToken = await njose.JWS.createSign(
        { format: 'compact' },
        keystore.all()
      )
        .update(JSON.stringify(payload), 'utf8')
        .final()

      await this.config.redis?.set(nonce, sub.email)
      // TODO: nonce is valid in 15 mins ?
      await this.config.redis?.expire(nonce, 1000 * 60 * 15)

      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- it is safe here because we use JSON.stringify(payload) to ensure the token is converted to string
      const tokenQuery = `token=${signedToken}`
      return redirectUri.includes('?')
        ? redirectUri.concat(`&${tokenQuery}`)
        : redirectUri.concat(`?${tokenQuery}`)
    }

    identityProviderBackendLogger.error(
      `Invalid sub type: ${sub.type}`,
      4004105,
      {
        methodName: `${this.checkUserAndRedirect.name}`,
      }
    )
    return `${generateErrorRouteUri(4004105)}`
  }

  private async redirectToFvLoginPage(clientId: string) {
    const nonce: string | undefined = snowflake.getUniqueID().toString()

    const keystore = await njose.JWK.asKeyStore(C.KEYSTORE)
    const exp = Math.floor(Date.now() / 1000) + 3600 // token valid for 1h

    const payload = {
      // we are about to show user the fvlogin page, at this moment we don't know the account so make it undefined, or a hash maybe ?
      account: 'undefined',
      nonce,
      exp,
      clientId,
    }

    const signedToken = await njose.JWS.createSign(
      { format: 'compact' },
      keystore.all()
    )
      .update(JSON.stringify(payload), 'utf8')
      .final()

    await this.config.redis?.set(nonce, nonce)

    // TODO: nonce is valid in 15 mins ?
    await this.config.redis?.expire(nonce, 1000 * 60 * 15)

    // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions -- it is safe here because we use JSON.stringify(payload) to ensure the token is converted to string
    return `/fvlogin?token=${signedToken}`
  }

  private async isTwoFactorAuthRequired(
    req:
      | { type: 'Ethereum'; eoa: sdk.Address }
      | { type: 'XRPL'; publicKey: string }
  ) {
    if (C.isDevelopment) {
      return false
    }

    if (req.type === 'Ethereum') {
      // check if eth balance is 0
      const provider = new ethers.providers.JsonRpcProvider(
        `${C.ALCHEMY_JSON_PRC_PROVIDER_URL}`
      )
      const balance = await provider.getBalance(req.eoa)

      identityProviderBackendLogger.debug(
        `isTwoFactorAuthRequired eoa=${req.eoa.toLowerCase()}; ethBalance=${ethers.utils.formatEther(
          balance
        )}`,
        { methodName: `${this.isTwoFactorAuthRequired.name}` }
      )
      return balance.eq(0)
    } else {
      // check if xrpl balance is 0
      const rAddress = deriveRAddress(req.publicKey)
      const client = new xrpl.Client(C.XRPL_JSON_PRC_URL)
      try {
        await client.connect()
        const response = await client.request({
          command: 'account_info',
          account: rAddress,
        })

        const balance = ethers.BigNumber.from(
          response.result.account_data.Balance
        )
        identityProviderBackendLogger.debug(
          `isTwoFactorAuthRequired rAddress=${rAddress}; xrplBalance=${balance.toString()}`,
          { methodName: `${this.isTwoFactorAuthRequired.name}` }
        )
        return balance.eq(0)
      } catch (e) {
        // ignore, as it is not a critical error and caused because of account not found/activated
      } finally {
        await client.disconnect()
      }
      return true
    }
  }

  private async isTwoFactorAuthVerified(eoa: sdk.Address) {
    if (C.smsOtpRateLimiter == null) {
      return false
    }

    return C.smsOtpRateLimiter.isOtpVerified({ eoa })
  }

  /**
   * Clear the session if the account id is different than the session account id
   */
  async #handleSessionCleanUp(req: Request, res: Response, user: FVUser) {
    try {
      const interaction = req.cookies['_interaction']
      const sessionId =
        req.cookies['_session'] || req.cookies['_session.legacy']
      const accountId = FVSub.encode(user.sub)
      if (sessionId && interaction) {
        const session = await this.provider.Session.find(sessionId)
        const iteraction = await this.provider.Interaction.find(interaction)
        if (iteraction?.session && session?.accountId != accountId) {
          await revokeTokens({ sessionId, provider: this.provider })
          await session?.destroy()
          delete iteraction.session
          await iteraction.save(3600) // 1h ttl
          const interactionDetails = await this.provider.interactionDetails(
            req,
            res
          )
          const grantId = interactionDetails.grantId

          if (grantId) {
            const grant = await this.provider.Grant.find(grantId)
            await grant?.destroy()
          }
          identityProviderBackendLogger.info(
            `Successfully destroyed user's session`
          )
        }
      }
    } catch (err) {
      identityProviderBackendLogger.error(
        `Error when trying to destroy existing session - error_message=${err.message}`,
        2005105
      )
    }
  }
}
