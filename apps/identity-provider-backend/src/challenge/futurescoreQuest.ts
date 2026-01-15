import { either as E } from 'fp-ts'
import { IdbOperations, RedisDBImpl } from '../db'
import { ChallengeResult } from './challengeInterface'

import { OffChainChallenge, WalletAddressPair } from './offChainChallenge'

export class FutureScoreQuestCompletion extends OffChainChallenge {
  async run(): Promise<boolean> {
    try {
      return await this.completeOffChainChallenge()
    } catch (err) {
      return false
    }
  }

  async check(): Promise<boolean | undefined> {
    return await this.checkOffChainChallengeCompletion()
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getRewards(): Promise<number | undefined> {
    // we don't know the reward since it is calculated by futurescore service
    return undefined
  }

  async getChallengeResult(): Promise<ChallengeResult[]> {
    const challengeResult: ChallengeResult[] = []
    if (this._redis != null && this._eoa != null && this._futurepass != null) {
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const dataSet = await dbImpl.getFuturepassFromOffChainDataSet(
        'completion',
        this._challengeId
      )

      dataSet.forEach((data: string) => {
        const walletAddressPair = WalletAddressPair.decode(JSON.parse(data))
        if (E.isRight(walletAddressPair)) {
          challengeResult.push({
            walletAddress: walletAddressPair.right.eoa,
            futurepass: walletAddressPair.right.futurepass,
            amount: 1,
          })
        }
      })
    }
    return challengeResult
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make it compatible with the interface
  async getChallengeData(): Promise<unknown> {
    return undefined
  }
}
