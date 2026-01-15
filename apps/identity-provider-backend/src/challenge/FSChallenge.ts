import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { config as C } from '../serverConfig'
import {
  ChallengeCheckParams,
  ChallengeResult,
  IChallenge,
} from './challengeInterface'

const FS_CHECK_CHALLENGE_COMPLETION_URL = '/api/v1/challenge'

export abstract class FSChallenge implements IChallenge {
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

  async checkChallengeCompletionOnFS(
    futureScoreChallengeId: string
  ): Promise<number> {
    if (this._futurepass != null && this._eoa != null) {
      const url = new URL(
        `${C.FUTURESCORE_API_GATEWAY_BASE_URL}${FS_CHECK_CHALLENGE_COMPLETION_URL}`
      )
      url.searchParams.append('challengeId', futureScoreChallengeId)
      url.searchParams.append('futurePass', this._futurepass)
      url.searchParams.append('eoa', this._eoa)

      const response = await fetch(url.toString())

      if (!response.ok) {
        return 0
      }

      const checkFSChallengeCompletionResponse =
        CheckChallengeCompletionFromFSResponse.decode(await response.json())

      if (E.isLeft(checkFSChallengeCompletionResponse)) {
        return 0
      }

      return checkFSChallengeCompletionResponse.right.pointTransactions.length
    }

    return 0
  }
}

const CheckChallengeCompletionFromFSResponse = t.type({
  isChallengeCompleted: t.boolean,
  pointTransactions: t.array(t.unknown),
})

type CheckChallengeCompletionFromFSResponse = t.TypeOf<
  typeof CheckChallengeCompletionFromFSResponse
>
