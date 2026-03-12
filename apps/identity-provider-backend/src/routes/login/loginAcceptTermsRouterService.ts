import * as sdk from '@futureverse/experience-sdk'
import RateLimiter from 'async-ratelimiter'
import { Request, Response } from 'express'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { getClientIp } from 'request-ip'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { FVSub, FVUser, HCaptchaResponse } from '../../types'
import { generateErrorRouteUri } from '../../utils'
import { ApiError } from '../routeApiError'
import LoginRouterService from './loginRouterService'
import type { Interaction } from '../../oidc-types'

const rateLimiter: RateLimiter | null = C.rateLimiter

const BOT_ACTIVITY_THRESHOLD = 0.8
const BEHAVIOR_COUNT_THRESHOLD = {
  ip_ua: 20,
  ip_device: 20,
}

/**
 *
 * https://futureverse.atlassian.net/browse/PRFP-48
 *
 * We are no longer blocking any more ip addresses, but will keep if there are any
 * manually added blocked IP addresses. The code below is used to check if a given
 * ip address is blocked, we will remove it after all blocked ip addresses are removed
 * from database
 *
 * Removing false for all IPs to test disabling the blacklist without actually removing
 * any records from the database. In case there are problems, we will still have all
 * the blocked IPs available
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await -- see comments above
const isIpBlacklisted = async (ip: string) => {
  return false
  // if (config.redis == null) return

  // return (await config.redis.hget(`black:ipaddress`, ip)) === 'true'
}

export default class LoginAcceptTermsRouterService extends LoginRouterService {
  private async interactionGetSub(
    req: Request,
    res: Response,
    clientIp: string | null
  ): Promise<FVSub> {
    let interaction: Interaction | null | undefined = null
    try {
      interaction = await this.provider.interactionDetails(req, res)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 404 interaction error: ${JSON.stringify(
          e
        )}`,
        4005101,
        {
          methodName: `${this.interactionGetSub.name}`,
        }
      )

      throw new ApiError('Interaction not found', 404)
    }

    // this is very unlikely to happen, but just in case
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- DONT REMOVE ? after interaction, it can be null
    const subRaw = interaction?.result?.['sub']
    if (typeof subRaw !== 'string') {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 400 subRaw is not string ${JSON.stringify(
          subRaw
        )}; ip=${clientIp ?? 'undefined'}; aborting`,
        4005102,
        {
          methodName: `${this.interactionGetSub.name}`,
        }
      )

      throw new ApiError('bad interaction result (1)', 400)
    }

    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms][D] subRaw=${subRaw}; ip=${
        clientIp ?? 'undefined'
      }`,
      {
        methodName: `${this.interactionGetSub.name}`,
      }
    )

    const subR = FVSub.decode(subRaw)
    if (E.isLeft(subR)) {
      // bad subject
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 400 user ended up with bad sub in interaction; subRaw=${subRaw}; ip=${
          clientIp ?? 'undefined'
        }`,
        4005001,
        {
          methodName: `${this.interactionGetSub.name}`,
        }
      )

      throw new ApiError('bad interaction result (2)', 400)
    }
    const sub = subR.right

    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms][D] sub=${JSON.stringify(sub)}`,
      {
        methodName: `${this.interactionGetSub.name}`,
      }
    )
    return sub
  }

  private async verifyHCaptcha(
    req: Request,
    res: Response,
    clientIp: string | null,
    token: string
  ) {
    if (clientIp == null) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 400 no ip address found`,
        2005001,
        {
          methodName: `${this.verifyHCaptcha.name}`,
        }
      )

      throw new ApiError('internal error', 400)
    }

    const verificationUrl = `https://api.hcaptcha.com/siteverify`

    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms] verifying captcha ${JSON.stringify(
        clientIp
      )}`,
      {
        methodName: `${this.verifyHCaptcha.name}`,
      }
    )

    const headers = { ...req.headers }
    delete headers.cookie
    const clientHeadersBase64 = Buffer.from(JSON.stringify(headers)).toString(
      'base64'
    )

    const hcaptchaValidateHost: string = C.isDevelopment
      ? C.CAPTCHA_DOMAIN_NAME
      : res.locals.idpHost ?? C.CAPTCHA_DOMAIN_NAME

    const dataR = await sdk.io.fetchDecoded(
      () =>
        fetch(verificationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${C.HCAPTCHA_SECRET_KEY}&response=${token}&sitekey=${C.HCAPTCHA_SITE_KEY}&host=${hcaptchaValidateHost}&remoteip=${clientIp}&client_headers_full=${clientHeadersBase64}&behavior_type=signup`,
        }),
      {
        200: (raw) => {
          const r = sdk.io.fromJSONString(HCaptchaResponse, raw)
          const out: E.Either<
            string,
            t.TypeOf<typeof HCaptchaResponse>
          > = (() => {
            if (E.isLeft(r)) {
              identityProviderBackendLogger.warn(
                `failed to decode hCaptcha response; raw=${JSON.stringify(
                  raw
                )}`,
                {
                  code: 4004700,
                  methodName: `${this.verifyHCaptcha.name}`,
                }
              )
              return E.left(PathReporter.report(r).join(', '))
            }
            return E.right(r.right)
          })()
          return out
        },
      }
    )

    const failureCount = await this.config.redis?.get(
      `recaptcha_failures:ip:${clientIp}` // TODO: Left recaptcha here, should be renamed to hCaptcha with time
    )
    if (failureCount != null && parseInt(failureCount) > 5) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 400 hCaptcha verification failed multiple times ${JSON.stringify(
          dataR
        )}`,
        2001102,
        {
          methodName: `${this.verifyHCaptcha.name}`,
        }
      )

      throw new ApiError('hCaptcha verification failed multiple times', 400)
    }

    if (E.isLeft(dataR) || !dataR.right.success) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 400 hCaptcha verification failed; ip=${clientIp}, ${JSON.stringify(
          dataR
        )}`,
        2001101,
        {
          methodName: `${this.verifyHCaptcha.name}`,
        }
      )
      identityProviderBackendLogger.stream(
        `failed to verify hCaptcha, ${JSON.stringify(dataR)}`,
        2001101
      )
      await this.config.redis?.incr(`recaptcha_failures:ip:${clientIp}`) // TODO: Left recaptcha here, should be renamed to hCaptcha with time

      // captcha verification failed
      throw new ApiError('captcha verification failed', 400)
    }

    if ((dataR.right.score ?? 0) > BOT_ACTIVITY_THRESHOLD) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] bot activity detected: returning; ip=${clientIp}, ${JSON.stringify(
          dataR
        )}`,
        2001103,
        {
          methodName: `${this.verifyHCaptcha.name}`,
        }
      )
      throw new ApiError('invalid request', 400)
    }

    // we leverage hCaptcha behavior_counts values to rateLimit per ip or device.
    // note: these counts are refreshed every 24 hours.
    if (dataR.right.behavior_counts != null) {
      if (
        (dataR.right.behavior_counts.ip_device ?? 0) >
        BEHAVIOR_COUNT_THRESHOLD.ip_device
      ) {
        identityProviderBackendLogger.error(
          `bot activity detected: ip_device behavior count exceeded, threshold: ${
            BEHAVIOR_COUNT_THRESHOLD.ip_device
          }, detected: ${
            dataR.right.behavior_counts.ip_device ?? 'n/a'
          } returning `,
          2001103,
          {
            methodName: `${this.verifyHCaptcha.name}`,
          }
        )
        throw new ApiError('invalid request', 400)
      }

      if (
        (dataR.right.behavior_counts.ip_ua ?? 0) >
        BEHAVIOR_COUNT_THRESHOLD.ip_ua
      ) {
        identityProviderBackendLogger.error(
          `bot activity detected: ip_ua behavior count exceeded, threshold: ${
            BEHAVIOR_COUNT_THRESHOLD.ip_ua
          }, detected: ${
            dataR.right.behavior_counts.ip_ua ?? 'n/a'
          } returning `,
          2001103,
          {
            methodName: `${this.verifyHCaptcha.name}`,
          }
        )
        throw new ApiError('invalid request', 400)
      }
    }

    identityProviderBackendLogger.debug(
      `hCaptcha token: ${JSON.stringify(dataR.right)}`,
      {
        methodName: `${this.verifyHCaptcha.name}`,
      }
    )
  }

  private async verifyClientIp(
    req: Request,
    res: Response,
    clientIp: string | null
  ) {
    if (rateLimiter == null || clientIp == null) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 500 invalid rateLimiter or clientIp: ${JSON.stringify(
          {
            rateLimiter,
            clientIp,
          }
        )}`,
        2005001,
        {
          methodName: `${this.verifyClientIp.name}`,
        }
      )

      throw new ApiError(
        'internal error: failed to create user or update user data',
        400
      )
    }

    // the following code block will be removed once disscussed with the team
    if (await isIpBlacklisted(clientIp)) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 500 clientIp ${clientIp} is blacklisted`,
        2005002,
        {
          methodName: `${this.verifyClientIp.name}`,
        }
      )

      throw new ApiError(
        'internal error: failed to create user or update user data',
        400
      )
    }

    const limit = await rateLimiter.get({ id: clientIp })
    if (!limit.remaining) {
      identityProviderBackendLogger.error(
        `[POST /login/accept_terms][E] returning 500 clientIp ${clientIp} is rate limited`,
        2005003,
        {
          methodName: `${this.verifyClientIp.name}`,
        }
      )

      throw new ApiError(
        'internal error: failed to create user or update user data',
        400
      )
    } else {
      // we need this to analyse the attacker's user behaviour
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][D] async-ratelimiter, remainings for ${clientIp} : ${
          limit.remaining
        } at ${new Date().toISOString()}`,
        {
          methodName: `${this.verifyClientIp.name}`,
        }
      )
    }
  }

  private async findOrCreateUser(
    req: Request,
    res: Response,
    requestId: string,
    clientIp: string | null,
    sub: FVSub
  ): Promise<FVUser> {
    const user: FVUser = await (async () => {
      // const eoa =
      //   sub.type === 'eoa'
      //     ? sub.eoa
      //     : await config.fv.findOrCreateCustodialAccount(sub)

      const eoa = await (async () => {
        if (sub.type === 'eoa') return sub.eoa
        if (sub.type === 'xrpl') return sub.eoa
        identityProviderBackendLogger.debug(
          `[POST /login/accept_terms][D] finding or creating custodial account for sub=${JSON.stringify(
            sub
          )}; ip=${clientIp ?? 'undefined'}`,
          {
            methodName: `${this.findOrCreateUser.name}`,
          }
        )
        return await this.config.fv.findOrCreateCustodialAccount(sub)
      })()

      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][D] resolved eoa=${eoa}; sub=${JSON.stringify(
          sub
        )}; ip=${clientIp ?? 'undefined'}`,
        {
          methodName: `${this.findOrCreateUser.name}`,
        }
      )
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][D] creating smart account for eoa=${eoa}; sub=${JSON.stringify(
          sub
        )}; ip=${clientIp ?? 'undefined'}`,
        {
          methodName: `${this.findOrCreateUser.name}`,
        }
      )

      // IMPORTANT: this MUST happen prior to storing the user's acceptance
      //            of the terms and conditions there is currently no other
      //            code path that creates this account.
      // await config.fv.findOrCreateSmartAccount(eoa)

      const actionStart = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${requestId}] Action start: create fp starts at: ${actionStart}`,
        {
          methodName: `${this.findOrCreateUser.name}`,
        }
      )
      await this.config.fv.requestFuturepassCreation(eoa)

      const actionEnd = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${requestId}] Action end: create fp ends at: ${actionEnd}, duration: ${
          actionStart - actionEnd
        } milliseconds`,
        {
          methodName: `${this.findOrCreateUser.name}`,
        }
      )

      switch (sub.type) {
        case 'eoa':
          identityProviderBackendLogger.stream(
            `FP created by Wagmi login: ${JSON.stringify(sub)}`,
            4001011
          )
          break
        case 'xrpl':
          identityProviderBackendLogger.stream(
            `FP created by Xaman login: ${JSON.stringify(sub)}`,
            4001012
          )
          break
        case 'email':
          identityProviderBackendLogger.stream(
            `FP created by Xaman login: ${JSON.stringify(sub)}`,
            4001015
          )
          break
        case 'idp':
          switch (sub.idp) {
            case 'google': {
              identityProviderBackendLogger.stream(
                `FP created by Google login: ${JSON.stringify(sub)}`,
                4001013
              )
              break
            }
            case 'facebook': {
              identityProviderBackendLogger.stream(
                `FP created by Facebook login: ${JSON.stringify(sub)}`,
                4001014
              )
              break
            }
            case 'twitter': {
              identityProviderBackendLogger.stream(
                `FP created by Twitter login: ${JSON.stringify(sub)}`,
                4001016
              )
              break
            }
            case 'tiktok': {
              identityProviderBackendLogger.stream(
                `FP created by Tiktok login: ${JSON.stringify(sub)}`,
                4001017
              )
              break
            }
            case 'apple': {
              identityProviderBackendLogger.stream(
                `FP created by Apple login: ${JSON.stringify(sub)}`,
                4001018
              )
              break
            }
            default:
              break
          }
          break
        default:
          break
      }

      return {
        sub,
        eoa,
        hasAcceptedTerms: true,
      }
    })()

    // write user data to the database
    identityProviderBackendLogger.debug(`updating user data`, {
      methodName: `${this.findOrCreateUser.name}`,
    })
    await this.config.fv.updateUserData(user)
    return user
  }

  public async acceptTerms(req: Request, res: Response) {
    const acceptTermsRequest = CO.hush(AcceptTermsRequest.decode(req.body))
    if (acceptTermsRequest == null) {
      identityProviderBackendLogger.error(`Failed to accept T&C`, 2003202, {
        methodName: `${this.verifyClientIp.name}`,
      })

      return `${generateErrorRouteUri(2003202)}`
    }

    const clientIp = C.isDevelopment
      ? C.LOCALHOST_IP
      : getClientIp(req) ?? C.LOCALHOST_IP
    // clientIp in the format “client IP, proxy 1 IP, proxy 2 IP.”

    /** INTERACTION TO GET THE SUB START ****************************************************************************************/
    const sub = await this.interactionGetSub(req, res, clientIp)

    identityProviderBackendLogger.stream(
      `user accepts the T&C, sub: ${JSON.stringify(sub)}`,
      4001003
    )

    /** INTERACTION TO GET THE SUB OVER */

    const requestId = `${clientIp}`
    let actionStart = Date.now()

    /** VERIFYING THE H-CAPTCHA START *******************************************************************************************/
    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms][E][${requestId}] Action start: verify h-captcha token starts at: ${actionStart}`,
      {
        methodName: `${this.acceptTerms.name}`,
      }
    )
    await this.verifyHCaptcha(req, res, clientIp, acceptTermsRequest.token)

    let actionEnd = Date.now()
    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms][E][${requestId}] Action end: verify h-captcha token ends at: ${actionEnd}, duration: ${
        actionStart - actionEnd
      } milliseconds`,
      {
        methodName: `${this.acceptTerms.name}`,
      }
    )
    /** VERIFYING THE H-CAPTCHA OVER */

    /** VERIFYING THE CLIENT IP AND RATE LIMIT START **************************************************************************/
    if (!C.isDevelopment) {
      identityProviderBackendLogger.debug(`start checking ip`, {
        methodName: `${this.acceptTerms.name}`,
      })
      actionStart = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${requestId}] Action start: verify rate limit starts at: ${actionStart}`,
        {
          methodName: `${this.acceptTerms.name}`,
        }
      )
      await this.verifyClientIp(req, res, clientIp)
      actionEnd = Date.now()
      identityProviderBackendLogger.debug(
        `[POST /login/accept_terms][E][${requestId}] Action end: verify rate limit ends at: ${actionEnd}, duration: ${
          actionStart - actionEnd
        } milliseconds`,
        {
          methodName: `${this.acceptTerms.name}`,
        }
      )
    }
    /** VERIFYING THE CLIENT IP AND RATE LIMIT OVER */

    const user: FVUser = await this.findOrCreateUser(
      req,
      res,
      requestId,
      clientIp,
      sub
    )

    const accountId = FVSub.encode(user.sub)
    identityProviderBackendLogger.debug(
      `[POST /login/accept_terms][D] completing interaction; accountId= ${accountId}`,
      {
        methodName: `${this.acceptTerms.name}`,
      }
    )
    return await this.provider.interactionResult(req, res, {
      login: {
        accountId,
      },
    })
  }
}

const AcceptTermsRequest = t.type({
  token: t.string,
})
