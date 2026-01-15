import { NextFunction, Request, Response } from 'express'
import * as CO from '../common'
import { ExperienceManager } from '../experienceManager'
import { identityProviderBackendLogger } from '../logger'
import { CustodialLoginAuthResponse } from '../types'
import { generateErrorRouteUri } from '../utils'

/**
 * Middleware function to check custodial login auth response
 *
 * If user denied the login, there must be an error returned in the response
 * If user accepted the login, there must be a code returned in the response
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function custodialLoginAuthCheck(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const custodialLoginAuthResponse =
    CO.hush(CustodialLoginAuthResponse.decode(req.query)) ??
    CO.hush(CustodialLoginAuthResponse.decode(req.body))

  if (custodialLoginAuthResponse == null) {
    // invalid response, redirect user to error page

    identityProviderBackendLogger.error(
      `Invalid custodial login auth response: ${req.url}`,
      2003203
    )
    return res.redirect(generateErrorRouteUri(2003203))
  } else if (custodialLoginAuthResponse.error != null) {
    //user denied login auth request

    const experience = ExperienceManager.getExperience()

    if (experience != null) {
      //redirect user back to the experience
      return res.redirect(experience.experienceHost)
    }

    //this should not happen
    identityProviderBackendLogger.error(`Invalid experience`, 2003204)
    return res.redirect(generateErrorRouteUri(2003204))
  }

  return next()
}
