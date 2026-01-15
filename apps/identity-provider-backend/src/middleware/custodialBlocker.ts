import { hush, SocialSSOType } from '@futureverse/experience-sdk'
import { NextFunction, Request, Response } from 'express'
import { identityProviderBackendLogger } from '../logger'
import { config as C } from '../serverConfig'
import AuthOptionService from '../services/authOptions/AuthOptionService'
import LaunchdarklyService from '../services/launchDarkly/LaunchDarkly'
import { CustodialAuthLoginClientIdConfig } from '../types'
import { generateErrorRouteUri } from '../utils'

/**
 * Middleware function to block custodial auth request from un-authorized clients.
 *
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export async function custodialAuthBlocker(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.url.startsWith('/auth?')) {
    return next()
  }

  const url = new URL(C.ORIGIN + req.url)
  const clientId = url.searchParams.get('client_id')
  const loginHint = url.searchParams.get('login_hint')?.toLowerCase()
  const prompt = url.searchParams.get('prompt')

  if (loginHint == null) {
    // If loginHint is missing, then we can't block the request
    // because TNL and Raicers are not sending login_hint.
    return next()
  }

  if (!clientId) {
    // We better show an error than let the app go to custodial
    // by simply removing client_id from URL
    identityProviderBackendLogger.error(
      `Custodial auth request blocked because clientId=${clientId} or loginHint=${loginHint} are missing `,
      4008000
    )
    return res.redirect(generateErrorRouteUri(4008000))
  }

  if (!prompt || prompt === 'none') {
    // allow silent login.
    return next()
  }

  if (loginHint.includes('eoa') || loginHint.includes('xrpl')) {
    // allow non-custodial login
    return next()
  }

  if (!loginHint.startsWith('social:')) {
    // allow non-custodial login
    return next()
  }

  const socialSSOType = hush(SocialSSOType.decode(loginHint.split(':')[1]))

  if (socialSSOType == null) {
    return next()
  }

  const launchdarklyService = await LaunchdarklyService.getInstance()

  if (!launchdarklyService) {
    // Same here, in case this is unavailable, then we should error rather than show
    // custodial to the users too early
    identityProviderBackendLogger.error(
      `Custodial auth request blocked because launchDarkly service is unitialised `,
      4005005
    )
    return res.redirect(generateErrorRouteUri(4005005))
  }

  // this is the new logic to control custodial auth login, we should remove the legacy logic
  const isLoginEnabled = await isCustodialAuthLoginEnabled(
    clientId,
    socialSSOType,
    launchdarklyService
  )
  if (!isLoginEnabled) {
    return res.redirect(generateErrorRouteUri(4005005))
  }
  return next()
}

const isCustodialAuthLoginEnabled = async (
  clientId: string,
  socialSSOType: SocialSSOType,
  launchdarklyService: LaunchdarklyService
) => {
  const allowedLoginClientIds = await launchdarklyService.variation(
    'custodial-auth-login-client-id-config',
    CustodialAuthLoginClientIdConfig
  )

  if (allowedLoginClientIds == null) {
    identityProviderBackendLogger.info(
      `Custodial auth request allowed for all because LD config is invalid`,
      4005005
    )
    // there is no config, allow all
    return true
  }

  const authOptionService = AuthOptionService.getInstance()

  return authOptionService.isCustodialAuthLoginEnabledForTarget(
    allowedLoginClientIds[socialSSOType],
    clientId
  )
}
