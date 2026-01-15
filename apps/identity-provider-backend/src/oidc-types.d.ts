import * as O from 'oidc-provider'
import 'express'

export * from 'oidc-provider'

export type OIDCProvider = O.default
export type Check = O.interactionPolicy.Check
export type Prompt = O.interactionPolicy.Prompt
export type DefaultPolicy = O.interactionPolicy.DefaultPolicy
export type Interaction = {
  result?: O.InteractionResults
}
declare global {
  namespace Express {
    interface Locals {
      idpOrigin: string | undefined
      idpHost: string | undefined
    }
  }
}
