import { NextFunction, Request, Response } from 'express'
import { config as C } from '../serverConfig'

export function idpDomainVerifier(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const hostHeader = req.headers.host

  if (hostHeader) {
    const idpDomain = C.ALLOWED_IDP_DOMAINS.find((domain) => {
      return domain.host === hostHeader
    })

    if (idpDomain == null) {
      return res
        .status(401)
        .send({ error: `Origin ${hostHeader} is not allowed` })
    }

    res.locals.idpOrigin = idpDomain.origin
    res.locals.idpHost = idpDomain.host
  }

  next()
}
