/**
 * Login Routes
 * 
 * Main login controller that handles the OIDC interaction flow
 * and routes to appropriate authentication strategies.
 */

import { Router, Request, Response } from 'express'
import { either as E } from 'fp-ts'
import { FVSub, encodeSub, decodeSub, FVUserData } from '../types'
import { UserStorage } from '../services/user-storage'
import { CachedAccountIndexer } from '../services/account-indexer'

// ============================================================================
// Types
// ============================================================================

export interface LoginRoutesConfig {
  /** User storage service */
  userStorage: UserStorage
  /** Account indexer service */
  accountIndexer: CachedAccountIndexer
  /** OIDC provider instance */
  oidcProvider: any // Type from oidc-provider
  /** Chain ID for blockchain operations */
  chainId: number
  /** Frontend URL for redirects */
  frontendUrl?: string
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * Create login routes
 * 
 * Routes:
 * - GET / - Handle initial login redirect from OIDC
 * - POST /accept_terms - Accept terms and conditions
 * 
 * @param config - Route configuration
 * @returns Express router
 */
export function createLoginRoutes(config: LoginRoutesConfig): Router {
  const router = Router()
  const { userStorage, oidcProvider, frontendUrl } = config

  /**
   * GET /
   * 
   * Handles the initial login redirect from the OIDC provider.
   * Checks for login_hint and routes to appropriate auth method.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      // Get OIDC interaction details
      const details = await oidcProvider.interactionDetails(req, res)

      if (details.prompt.name !== 'login') {
        // Not a login prompt - redirect to error
        return res.redirect('/error?code=invalid_prompt')
      }

      // Check for login_hint
      const loginHint = details.params.login_hint as string | undefined

      if (loginHint) {
        // Route based on login_hint prefix
        if (loginHint.startsWith('eoa:')) {
          // SIWE authentication with pre-signed message
          return handleSiweLoginHint(req, res, loginHint, config)
        }
        
        if (loginHint.startsWith('xrpl:')) {
          // XRPL authentication with pre-signed transaction
          return handleXrplLoginHint(req, res, loginHint, config)
        }

        if (loginHint.startsWith('email:')) {
          // Custodial email authentication (Phase 2)
          const frontendPath = frontendUrl ?? '/login'
          return res.redirect(`${frontendPath}/email?hint=email`)
        }

        if (loginHint.startsWith('social:')) {
          // Custodial social authentication (Phase 2)
          const provider = loginHint.split(':')[1]
          const frontendPath = frontendUrl ?? '/login'
          return res.redirect(`${frontendPath}/social?target=${provider}`)
        }
      }

      // No login_hint - redirect to wallet selection page
      const clientId = details.params.client_id as string
      const frontendPath = frontendUrl ?? '/login'
      
      return res.redirect(`${frontendPath}/wallet-select?client_id=${clientId}`)

    } catch (error) {
      console.error('Login handler error:', error)
      return res.redirect('/error?code=internal_error')
    }
  })

  /**
   * POST /accept_terms
   * 
   * Accepts terms and conditions for a new user.
   * Completes the authentication flow after terms acceptance.
   */
  router.post('/accept_terms', async (req: Request, res: Response) => {
    try {
      // Get the pending interaction result
      const details = await oidcProvider.interactionDetails(req, res)
      
      // Extract the subject from the interaction
      const pendingSub = details.result?.sub as string | undefined
      
      if (!pendingSub) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'No pending authentication found',
        })
      }

      const sub = decodeSub(pendingSub)
      if (!sub) {
        return res.status(400).json({
          error: 'invalid_request',
          message: 'Invalid subject identifier',
        })
      }

      // Update user to mark terms as accepted
      await userStorage.saveUserData(sub, {
        sub,
        hasAcceptedTerms: true,
      })

      // Complete the OIDC interaction
      const redirectTo = await oidcProvider.interactionResult(req, res, {
        login: {
          accountId: pendingSub,
        },
      })

      return res.json({
        redirectTo,
      })

    } catch (error) {
      console.error('Accept terms error:', error)
      return res.status(500).json({
        error: 'internal_error',
        message: 'Failed to accept terms',
      })
    }
  })

  return router
}

// ============================================================================
// Helper Functions
// ============================================================================

async function handleSiweLoginHint(
  req: Request,
  res: Response,
  loginHint: string,
  config: LoginRoutesConfig
): Promise<void> {
  const { oidcProvider, userStorage } = config

  try {
    // The login_hint contains a pre-signed SIWE message
    // Format: eoa:domain=...&address=...&signature=...
    const hintData = loginHint.slice(4) // Remove "eoa:" prefix
    const params = new URLSearchParams(hintData)
    
    const address = params.get('address')
    const signature = params.get('signature')

    if (!address || !signature) {
      res.redirect('/error?code=invalid_login_hint')
      return
    }

    // Note: Full signature verification should happen in the SIWE strategy
    // Here we're just parsing the hint to get the address

    const sub: FVSub = { type: 'eoa', eoa: address.toLowerCase() }
    const accountId = encodeSub(sub)

    // Check if user exists and has accepted terms
    const user = await userStorage.findUserBySub(sub)

    if (!user || !user.hasAcceptedTerms) {
      // Store intermediate result and redirect to terms
      await oidcProvider.interactionResult(req, res, {
        sub: accountId,
      })
      
      const frontendPath = config.frontendUrl ?? '/login'
      res.redirect(`${frontendPath}/terms`)
      return
    }

    // Complete the login
    const redirectTo = await oidcProvider.interactionResult(req, res, {
      login: {
        accountId,
      },
    })

    res.redirect(redirectTo)
  } catch (error) {
    console.error('SIWE login_hint error:', error)
    res.redirect('/error?code=siwe_failed')
  }
}

async function handleXrplLoginHint(
  req: Request,
  res: Response,
  loginHint: string,
  config: LoginRoutesConfig
): Promise<void> {
  const { oidcProvider, userStorage } = config

  try {
    // Parse XRPL login_hint
    // Format: xrpl:publicKey:eoa:address:tx:transaction
    const parts = loginHint.split(':')
    
    if (parts.length < 5) {
      res.redirect('/error?code=invalid_login_hint')
      return
    }

    const publicKey = parts[1]
    const eoaIndex = parts.indexOf('eoa')
    
    if (eoaIndex === -1 || eoaIndex + 1 >= parts.length) {
      res.redirect('/error?code=invalid_login_hint')
      return
    }

    const eoa = parts[eoaIndex + 1]

    // Note: Full signature verification should happen in the XRPL strategy
    
    const sub: FVSub = { type: 'xrpl', eoa: eoa.toLowerCase(), publicKey }
    const accountId = encodeSub(sub)

    // Check if user exists and has accepted terms
    const user = await userStorage.findUserBySub(sub)

    if (!user || !user.hasAcceptedTerms) {
      await oidcProvider.interactionResult(req, res, {
        sub: accountId,
      })
      
      const frontendPath = config.frontendUrl ?? '/login'
      res.redirect(`${frontendPath}/terms`)
      return
    }

    // Complete the login
    const redirectTo = await oidcProvider.interactionResult(req, res, {
      login: {
        accountId,
      },
    })

    res.redirect(redirectTo)
  } catch (error) {
    console.error('XRPL login_hint error:', error)
    res.redirect('/error?code=xrpl_failed')
  }
}
