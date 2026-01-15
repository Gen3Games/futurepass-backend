import * as sdk from '@futureverse/experience-sdk'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { stage } from '../constants'
import { FlagVariationsPerEnvironment } from '../types'

export function useXamanEnabled(clientId: string): boolean {
  const { disabledXamanAuthClientIds } = useFlags()

  if (!stage) {
    throw new Error('stage is required')
  }

  const disabledClients = sdk.hush(
    FlagVariationsPerEnvironment.decode(disabledXamanAuthClientIds)
  )

  if (!disabledClients) {
    // If the flag is not set, we assume the client is allowed to use Xaman
    return true
  }

  const currentStageDisabledClients = disabledClients[stage]

  const disabled = currentStageDisabledClients.includes(clientId)

  return !disabled
}
