import { NextFunction, Request, Response } from 'express'
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose'

export type VerifiedAccessToken = {
  subject: string
  issuer: string
  scopes: string[]
  eoa?: string
  audience?: string | string[]
}

export type AuthenticatedResponseLocals = {
  auth?: VerifiedAccessToken
}

function sendAuthError(res: Response, status: number, error: string) {
  return res.status(status).json({ error })
}

function extractBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization

  if (authorization == null) {
    return null
  }

  const [scheme, token] = authorization.split(' ')

  if (scheme !== 'Bearer' || token == null || token.trim() === '') {
    return null
  }

  return token
}

function parseScopes(payload: JWTPayload): string[] {
  const scopeClaim = payload['scope']
  if (typeof scopeClaim === 'string') {
    return scopeClaim
      .split(' ')
      .map((scope) => scope.trim())
      .filter((scope) => scope !== '')
  }

  const scpClaim = payload['scp']
  if (Array.isArray(scpClaim)) {
    return scpClaim.filter((scope): scope is string => typeof scope === 'string')
  }

  return []
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined
}

export function createAuthMiddleware(config: {
  issuer: string
  audience: string
  requiredScope: string
}) {
  const jwks = createRemoteJWKSet(
    new URL(`${config.issuer}/.well-known/jwks.json`)
  )

  return async function authMiddleware(
    req: Request,
    res: Response<unknown, AuthenticatedResponseLocals>,
    next: NextFunction
  ) {
    const token = extractBearerToken(req)
    if (token == null) {
      return sendAuthError(res, 401, 'missing bearer token')
    }

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: config.issuer,
        audience: config.audience,
      })

      if (typeof payload.sub !== 'string' || payload.sub.trim() === '') {
        return sendAuthError(res, 401, 'token subject is required')
      }

      const scopes = parseScopes(payload)
      if (!scopes.includes(config.requiredScope)) {
        return sendAuthError(
          res,
          403,
          `token is missing required scope ${config.requiredScope}`
        )
      }

      res.locals.auth = {
        subject: payload.sub,
        issuer: payload.iss ?? config.issuer,
        audience: payload.aud,
        scopes,
        eoa: asOptionalString(payload['eoa']),
      }

      next()
      return
    } catch {
      return sendAuthError(res, 401, 'invalid bearer token')
    }
  }
}
