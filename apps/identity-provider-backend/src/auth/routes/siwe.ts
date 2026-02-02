/**
 * SIWE (Sign-In with Ethereum) Routes
 * 
 * Express routes for SIWE authentication endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { either as E } from 'fp-ts'
import { SiweAuthStrategy } from '../strategies/siwe'
import { UserStorage } from '../services/user-storage'
import { FVSub, encodeSub, FVUserData } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface SiweRoutesConfig {
  /** SIWE authentication strategy */
  strategy: SiweAuthStrategy
  /** User storage service */
  userStorage: UserStorage
  /** Function to complete OIDC interaction */
  completeInteraction: (
    req: Request,
    res: Response,
    accountId: string
  ) => Promise<string>
  /** Function to get current interaction result */
  getInteractionResult?: (
    req: Request,
    res: Response,
    result: object
  ) => Promise<string>
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * Create SIWE authentication routes
 * 
 * Routes:
 * - GET /nonce - Get a nonce for SIWE message signing
 * - POST /verify - Verify a signed SIWE message
 * 
 * @param config - Route configuration
 * @returns Express router
 */
export function createSiweRoutes(config: SiweRoutesConfig): Router {
  const router = Router()
  const { strategy, userStorage } = config

  /**
   * GET /nonce
   * 
   * Generates a cryptographic nonce for the SIWE message.
   * The client must include this nonce in the SIWE message.
   */
  router.get('/nonce', (req: Request, res: Response) => {
    try {
      const nonce = strategy.generateNonce()
      
      res.status(200).json({
        nonce,
      })
    } catch (error) {
      console.error('Failed to generate SIWE nonce:', error)
      res.status(500).json({
        error: 'internal_error',
        message: 'Failed to generate nonce',
      })
    }
  })

  /**
   * POST /verify
   * 
   * Verifies a signed SIWE message and completes the authentication.
   * 
   * Request body:
   * - message: string (the SIWE message, JSON stringified)
   * - signature: string (hex-encoded signature)
   * 
   * Headers:
   * - x-csrf-token: string (the nonce from /nonce)
   */
  router.post('/verify', async (req: Request, res: Response) => {
    try {
      // Validate headers
      const headersResult = strategy.validateHeaders(req.headers)
      if (E.isLeft(headersResult)) {
        return res.status(400).json({
          error: 'invalid_request',
          message: headersResult.left.message,
        })
      }

      // Validate body
      const bodyResult = strategy.validateBody(req.body)
      if (E.isLeft(bodyResult)) {
        return res.status(400).json({
          error: 'invalid_request',
          message: bodyResult.left.message,
        })
      }

      const { csrfToken } = headersResult.right
      const { message, signature } = bodyResult.right

      // Verify the SIWE message
      const verifyResult = await strategy.verify(message, signature, csrfToken)

      if (E.isLeft(verifyResult)) {
        return res.status(verifyResult.left.statusCode).json({
          error: 'authentication_failed',
          message: verifyResult.left.message,
          code: verifyResult.left.code,
        })
      }

      const { address } = verifyResult.right

      // Create subject identifier
      const sub: FVSub = { type: 'eoa', eoa: address.toLowerCase() }
      const accountId = encodeSub(sub)

      // Check if user exists
      const existingUser = await userStorage.findUserBySub(sub)
      
      if (!existingUser) {
        // New user - store intermediate result and redirect to terms
        if (config.getInteractionResult) {
          const redirectTo = await config.getInteractionResult(req, res, {
            sub: accountId,
          })
          
          return res.status(200).json({
            redirectTo,
            requiresTerms: true,
          })
        }
        
        // Create user with terms not accepted
        await userStorage.saveUserData(sub, {
          sub,
          hasAcceptedTerms: false,
        })
      }

      // Complete the OIDC interaction
      const redirectTo = await config.completeInteraction(req, res, accountId)

      return res.status(200).json({
        redirectTo,
      })

    } catch (error) {
      console.error('SIWE verification failed:', error)
      return res.status(500).json({
        error: 'internal_error',
        message: 'Authentication failed',
      })
    }
  })

  return router
}

// ============================================================================
// Middleware
// ============================================================================

/**
 * Middleware to extract and validate SIWE login_hint from OIDC interaction
 */
export function siweLoginHintMiddleware(strategy: SiweAuthStrategy) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loginHint = req.query.login_hint as string | undefined

    if (!loginHint || !loginHint.startsWith('eoa:')) {
      return next()
    }

    try {
      const hintData = loginHint.slice(4) // Remove "eoa:" prefix
      const result = await strategy.verifyLoginHint(hintData)

      if (E.isRight(result)) {
        // Attach verified address to request
        ;(req as any).siweAddress = result.right.address
      }
    } catch (error) {
      console.error('Failed to verify SIWE login_hint:', error)
    }

    next()
  }
}
