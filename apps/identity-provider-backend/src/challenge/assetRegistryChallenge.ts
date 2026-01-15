import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { config as C } from '../serverConfig'
import {
  ChallengeCheckParams,
  ChallengeResult,
  IChallenge,
} from './challengeInterface'

const ASSET_REGISTRY_CHECK_CHALLENGE_COMPLETION_URL =
  '/api/v1/asset-registry-event-completion'

export abstract class AssetRegistryChallenge implements IChallenge {
  _challengeId: string
  _rewardPerUnit: number

  _eoa: string | null | undefined
  _futurepass: string | null | undefined
  _redis: Redis | null | undefined

  constructor(_challengeId: string, _rewardPerUnit: number) {
    this._challengeId = _challengeId
    this._rewardPerUnit = _rewardPerUnit
  }

  setEOA(eoa: string): IChallenge {
    this._eoa = eoa
    return this
  }
  setFuturePass(futurepass: string | null): IChallenge {
    this._futurepass = futurepass
    return this
  }
  setRedis(redis: Redis | null | undefined): IChallenge {
    this._redis = redis
    return this
  }

  abstract run(parameter?: ChallengeCheckParams): Promise<boolean>
  abstract check(
    parameter?: ChallengeCheckParams
  ): Promise<boolean | number | undefined>
  abstract getRewards(): Promise<number | undefined>
  abstract getChallengeResult(): Promise<ChallengeResult[]>
  abstract getChallengeData(): Promise<unknown>

  async checkChallengeCompletionOnAssetRegistry(
    questId: string,
    startTime: number,
    endTime: number
  ): Promise<number> {
    if (this._futurepass != null && this._eoa != null) {
      const url = new URL(
        `${C.ASSET_REGISTRY_QUEST_EVENT_ENDPOINT}${ASSET_REGISTRY_CHECK_CHALLENGE_COMPLETION_URL}`
      )
      url.searchParams.append('questId', questId)
      url.searchParams.append('futurepass', this._futurepass)
      url.searchParams.append('startTime', startTime.toString())
      url.searchParams.append('endTime', endTime.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        return 0
      }

      const completionResponseE =
        CheckChallengeCompletionFromAssetRegistryResponse.decode(
          await response.json()
        )

      if (E.isLeft(completionResponseE)) {
        return 0
      }

      return completionResponseE.right.questCompletedAccounts.length
    }

    return 0
  }
}

const CheckChallengeCompletionFromAssetRegistryResponse = t.type({
  isQuestCompleted: t.boolean,
  questCompletedAccounts: t.array(t.string),
})

type CheckChallengeCompletionFromAssetRegistryResponse = t.TypeOf<
  typeof CheckChallengeCompletionFromAssetRegistryResponse
>
