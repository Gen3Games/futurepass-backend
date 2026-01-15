import { NextFunction, Request, Response } from 'express'
import Provider from 'oidc-provider'
import * as CO from '../common'
import { ExperienceManager } from '../experienceManager'
import { identityProviderBackendLogger } from '../logger'
import { InteractionParams } from '../types'

/**
 * Middleware function to find client id from interaction
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function.
 */
export const experienceFinderWithInteraction = (provider: Provider) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const interaction = await provider.interactionDetails(req, res)
      const interactionParams = CO.hush(
        InteractionParams.decode(interaction.params)
      )

      if (interactionParams == null) {
        // invalid interaction
        identityProviderBackendLogger.error(
          `Invalid custodial login ${req.path} auth response: ${req.url}`,
          4005102
        )

        return next()
      }

      //Get experience from interaction
      const experienceHost = new URL(interactionParams.redirect_uri).origin

      ExperienceManager.setExperience({
        experienceClientId: interactionParams.client_id,
        experienceHost,
      })
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to get interaction on ${req.path} with error: ${JSON.stringify(
          e
        )}`,
        4005101,
        {
          methodName: `custodialLoginAuthCheck`,
        }
      )
    }

    return next()
  }
}
