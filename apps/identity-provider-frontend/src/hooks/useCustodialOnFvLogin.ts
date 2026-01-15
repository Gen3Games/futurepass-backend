import * as sdk from '@futureverse/experience-sdk'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { stage } from '../constants'
import { FlagVariationsPerEnvironment } from '../types'

export function useCustodialOnFvloginEnabled(clientId: string): boolean {
  const { disabledCustodialOnFvloginClientIds } = useFlags()

  if (!stage) {
    throw new Error('stage is required')
  }

  const disabledClients = sdk.hush(
    FlagVariationsPerEnvironment.decode(disabledCustodialOnFvloginClientIds)
  )

  if (!disabledClients) {
    // If the flag is not set, we assume the client is allowed to use custodial
    return true
  }

  const currentStageDisabledClients = disabledClients[stage]

  const disabled =
    currentStageDisabledClients.includes(clientId) ||
    currentStageDisabledClients.includes('all')

  return !disabled
}
