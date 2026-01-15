import { config as C } from '../serverConfig'
import { AssetRegistryChallenge } from './assetRegistryChallenge'
import { ChallengeResult } from './challengeInterface'

export class PartyBearSwapQuest extends AssetRegistryChallenge {
  private pbSwapQuestId = C.ORIGIN.includes('futureverse.app')
    ? '7668:root:17508:ASSET_REGISTRY_006_PARTY_BEAR_THE_SWAP_QUEST'
    : '7672:root:303204:ASSET_REGISTRY_006_PARTY_BEAR_THE_SWAP_QUEST_DEV'

  private questStartTimeMS = C.ORIGIN.includes('futureverse.app')
    ? 1702332000000 // 2023-12-12T11:00:00.000+13:00
    : 1700791832000
  private questEndTimeMS = 1704319200000 // 2024-01-04T11:00:00.000+13:00

  async run(): Promise<boolean> {
    return Promise.resolve(false)
  }

  async check(): Promise<number> {
    return await this.checkChallengeCompletionOnAssetRegistry(
      this.pbSwapQuestId,
      this.questStartTimeMS,
      this.questEndTimeMS
    )
  }

  async getRewards(): Promise<number | undefined> {
    // we don't know the reward since it is calculated by futurescore service
    return Promise.resolve(undefined)
  }

  async getChallengeResult(): Promise<ChallengeResult[]> {
    if (this._futurepass == null || this._eoa == null) {
      return []
    }
    return [
      {
        amount: await this.checkChallengeCompletionOnAssetRegistry(
          this.pbSwapQuestId,
          this.questStartTimeMS,
          this.questEndTimeMS
        ),
        futurepass: this._futurepass,
        walletAddress: this._eoa,
      },
    ]
  }

  async getChallengeData(): Promise<unknown> {
    return Promise.resolve(undefined)
  }
}
