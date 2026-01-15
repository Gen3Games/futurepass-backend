import { NextFunction, Request, Response } from 'express'
import { config as C } from '../serverConfig'

/**
 * Middleware function to handle Instagram browser redirect.
 *
 * We cannot serve google login from Instagram embedded browser.
 * so redirect to `/unsupported-browser` page if google login is requested from Instagram browser.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export function instagramBrowserRedirect(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.url.startsWith('/auth')) {
    return next()
  }

  const url = new URL(C.ORIGIN + req.url)
  const loginHint = url.searchParams.get('login_hint')

  if (!loginHint?.includes('google')) {
    return next()
  }

  const userAgent = req.headers['user-agent']?.toLowerCase()

  if (userAgent?.includes('instagram')) {
    // Instagram embedded browser detected
    return res.redirect('/unsupported-browser')
  }
  return next()
}
