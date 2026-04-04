import { Request, Response, Router } from 'express'

import { AuthenticatedResponseLocals } from './auth'
import { CustodyProvider } from './provider'
import {
  EnsureCustodyAccountRequest,
  SignDigestRequest,
} from './types'

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} is required`)
  }

  return value
}

function parseEnsureAccountRequest(body: unknown): EnsureCustodyAccountRequest {
  if (body == null || typeof body !== 'object') {
    throw new Error('request body is required')
  }

  const parsedBody = body as Record<string, unknown>

  return {
    subject: asNonEmptyString(parsedBody['subject'], 'subject'),
    issuer: asNonEmptyString(parsedBody['issuer'], 'issuer'),
    createIfMissing:
      typeof parsedBody['createIfMissing'] === 'boolean'
        ? parsedBody['createIfMissing']
        : true,
  }
}

function requireAuth(
  res: Response<unknown, AuthenticatedResponseLocals>
): NonNullable<AuthenticatedResponseLocals['auth']> {
  const auth = res.locals.auth

  if (auth == null) {
    throw new HttpError(401, 'authenticated token context is required')
  }

  return auth
}

function requireMatchingIdentity<T extends { subject: string; issuer: string }>(
  request: T,
  res: Response<unknown, AuthenticatedResponseLocals>
): T {
  const auth = requireAuth(res)

  if (request.subject.trim().toLowerCase() !== auth.subject.trim().toLowerCase()) {
    throw new HttpError(403, 'request subject does not match authenticated token')
  }

  if (request.issuer.trim().toLowerCase() !== auth.issuer.trim().toLowerCase()) {
    throw new HttpError(403, 'request issuer does not match authenticated token')
  }

  return {
    ...request,
    subject: auth.subject,
    issuer: auth.issuer,
  } as T
}

function parseSignDigestRequest(body: unknown): SignDigestRequest {
  if (body == null || typeof body !== 'object') {
    throw new Error('request body is required')
  }

  const parsedBody = body as Record<string, unknown>
  const requestId = parsedBody['requestId']

  return {
    subject: asNonEmptyString(parsedBody['subject'], 'subject'),
    issuer: asNonEmptyString(parsedBody['issuer'], 'issuer'),
    digest: asNonEmptyString(parsedBody['digest'], 'digest'),
    requestId: typeof requestId === 'string' ? requestId : undefined,
  }
}

function sendError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error'
  const status = error instanceof HttpError ? error.status : 400
  return res.status(status).json({ error: message })
}

export function createRouter(provider: CustodyProvider): Router {
  const router = Router()

  router.get('/health', async (_req: Request, res: Response) => {
    const providerHealth = await provider.health()

    return res.status(200).json({
      status: 'ok',
      service: 'gen3-signer-backend',
      provider: providerHealth,
    })
  })

  router.get('/v1/custody/health', async (_req: Request, res: Response) => {
    return res.status(200).json(await provider.health())
  })

  router.post(
    '/v1/custody/accounts/ensure',
    async (req: Request, res: Response<unknown, AuthenticatedResponseLocals>) => {
    try {
      const response = await provider.ensureAccount(
        requireMatchingIdentity(parseEnsureAccountRequest(req.body), res)
      )
      return res.status(200).json(response)
    } catch (error) {
      return sendError(res, error)
    }
    }
  )

  router.post(
    '/v1/custody/signatures',
    async (req: Request, res: Response<unknown, AuthenticatedResponseLocals>) => {
    try {
      const response = await provider.signDigest(
        requireMatchingIdentity(parseSignDigestRequest(req.body), res)
      )
      return res.status(200).json(response)
    } catch (error) {
      return sendError(res, error)
    }
    }
  )

  return router
}
