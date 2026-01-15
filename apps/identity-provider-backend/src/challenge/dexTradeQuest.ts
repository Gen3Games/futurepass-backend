import { config as C } from '../serverConfig'
import { ChallengeResult } from './challengeInterface'
import { FSChallenge } from './FSChallenge'

export class DexTradeQuest extends FSChallenge {
  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async run(): Promise<boolean> {
    return false
  }

  async check(): Promise<number> {
    const dexSwapQuestId = C.ORIGIN.includes('futureverse.app')
      ? '7668:root:dex.swap:DEX_SWAP_QUEST'
      : '7672:root:dex.swap:DEX_SWAP_QUEST_DEV'

    const evmSwapQuestId = C.ORIGIN.includes('futureverse.app')
      ? '7668:root:evm.swap:EVM_SWAP_QUEST'
      : '7672:root:evm.swap:EVM_SWAP_QUEST_DEV'

    return (
      (await this.checkChallengeCompletionOnFS(dexSwapQuestId)) +
      (await this.checkChallengeCompletionOnFS(evmSwapQuestId))
    )
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getRewards(): Promise<number | undefined> {
    // we don't know the reward since it is calculated by futurescore service
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getChallengeResult(): Promise<ChallengeResult[]> {
    // we don't need this as this is managed by futurescore service.
    return []
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getChallengeData(): Promise<unknown> {
    return undefined
  }
}
