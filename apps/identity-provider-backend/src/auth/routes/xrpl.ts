/**
 * XRPL Wallet Routes
 * 
 * Express routes for XRPL wallet authentication endpoints.
 */

import { Router, Request, Response, NextFunction } from 'express'
import { either as E } from 'fp-ts'
import { XrplAuthStrategy } from '../strategies/xrpl'
import { UserStorage } from '../services/user-storage'
import { FVSub, encodeSub } from '../types'

// ============================================================================
// Types
// ============================================================================

export interface XrplRoutesConfig {
  /** XRPL authentication strategy */
  strategy: XrplAuthStrategy
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
 * Create XRPL authentication routes
 * 
 * Routes:
 * - POST /verify - Verify an XRPL wallet signature
 * 
 * @param config - Route configuration
 * @returns Express router
 */
export function createXrplRoutes(config: XrplRoutesConfig): Router {
  const router = Router()
  const { strategy, userStorage } = config

  /**
   * POST /verify
   * 
   * Verifies an XRPL wallet signature and completes the authentication.
   * 
   * Request body:
   * - publicKey: string (XRPL public key)
   * - transaction: string (signed transaction blob)
   * - eoa: string (claimed EOA address)
   */
  router.post('/verify', async (req: Request, res: Response) => {
    try {
      const { publicKey, transaction, eoa } = req.body

      // Validate required fields
      if (!publicKey || !transaction || !eoa) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Missing required fields: publicKey, transaction, eoa',
        })
      }

      // Verify the XRPL signature
      const verifyResult = strategy.verify(publicKey, transaction, eoa)

      if (E.isLeft(verifyResult)) {
        return res.status(verifyResult.left.statusCode).json({
          error: 'authentication_failed',
          message: verifyResult.left.message,
          code: verifyResult.left.code,
        })
      }

      const { eoa: verifiedEoa, publicKey: verifiedPublicKey } = verifyResult.right

      // Create subject identifier for XRPL
      const sub: FVSub = {
        type: 'xrpl',
        eoa: verifiedEoa.toLowerCase(),
        publicKey: verifiedPublicKey,
      }
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
      console.error('XRPL verification failed:', error)
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
 * Middleware to extract and validate XRPL login_hint from OIDC interaction
 */
export function xrplLoginHintMiddleware(strategy: XrplAuthStrategy) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const loginHint = req.query.login_hint as string | undefined

    if (!loginHint || !loginHint.startsWith('xrpl:')) {
      return next()
    }

    try {
      const hintData = loginHint.slice(5) // Remove "xrpl:" prefix
      const result = strategy.verifyLoginHint(hintData)

      if (E.isRight(result)) {
        // Attach verified data to request
        ;(req as any).xrplAddress = result.right.eoa
        ;(req as any).xrplPublicKey = result.right.publicKey
      }
    } catch (error) {
      console.error('Failed to verify XRPL login_hint:', error)
    }

    next()
  }
}
