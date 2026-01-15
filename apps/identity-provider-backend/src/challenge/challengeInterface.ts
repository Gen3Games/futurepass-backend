import * as sdk from '@futureverse/experience-sdk'

import * as t from 'io-ts'
import { Redis } from 'ioredis'

import { BridgingAssetChallenge } from './bridgingAssetsChallenge'
import { DexTradeQuest } from './dexTradeQuest'
import { FutureScoreQuestCompletion } from './futurescoreQuest'
import { LaunchTheMarkQuest } from './launchTheMarkQuest'
import { MintAssetChallenge } from './mintAssetsChallenge'
import { PartyBearSwapQuest } from './pbSwapQuest'
import { TnlBoxerCutAndStyleQuest } from './tnlBoxerCutAndStyleQuest'

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- safe to use any here since this list is fully controlled
const CHALLENGE_MAP = new Map<string, any>([
  ['01', MintAssetChallenge],
  ['02', BridgingAssetChallenge],
  ['OFF-CHAIN-FUTURESCORE-QUEST', FutureScoreQuestCompletion],
  ['OFF-CHAIN-THE-MARK-QUEST', LaunchTheMarkQuest],
  ['ON-CHAIN-THE-STYLE-QUEST', TnlBoxerCutAndStyleQuest],
  ['05-ON-CHAIN-THE-DEX-TRADE-QUEST', DexTradeQuest],
  ['06-ON-CHAIN-THE-SWAP-QUEST', PartyBearSwapQuest],
])

export const ChallengeCheckParams = t.strict({
  // different challenges could have different parameters
  // that is why any key added here must have an "undefined" type
  tokenId: t.union([t.string, t.undefined]),
})

export type ChallengeCheckParams = t.TypeOf<typeof ChallengeCheckParams>

export const ChallengeResult = t.strict({
  walletAddress: t.string,
  futurepass: t.union([t.string, t.undefined]),
  amount: t.union([t.number, t.undefined]),
})

export type ChallengeResult = t.TypeOf<typeof ChallengeResult>

export interface IChallenge {
  _challengeId: string
  _rewardPerUnit: number

  setEOA(eoa: string): IChallenge
  setFuturePass(futurepass: string | null): IChallenge
  setRedis(redis: Redis | null | undefined): IChallenge

  run(parameter?: ChallengeCheckParams): Promise<boolean>
  check(parameter?: ChallengeCheckParams): Promise<boolean | number | undefined>

  // reward > 0 means how much tokens will be airdropped
  // reward = 0 means no tokens will be airdropped
  // reward = undefined means reward will be calculated at the end of the challenge
  getRewards(): Promise<number | undefined>
  getChallengeResult(): Promise<ChallengeResult[]>
  getChallengeData(): Promise<unknown>
}

export const createChallenge = (
  challengeId: string,
  rewardsPerUnit = 100
): IChallenge | undefined => {
  if (CHALLENGE_MAP.has(challengeId)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- safe to use any here since we know a quest class is returned
    const challengeClass = CHALLENGE_MAP.get(challengeId)
    if (typeof challengeClass === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- safe to use any here since we know this is a quest class construction
      return new challengeClass(challengeId, rewardsPerUnit)
    }
  }

  return undefined
}

export const checkQuestCompletionStatus = async (
  eoa: sdk.Address,
  futurepass: sdk.Address,
  redisClient: Redis
) => {
  const questCompletionStatus: Record<string, boolean | number> = {}
  for (const key of CHALLENGE_MAP.keys()) {
    const { challengeCompleted } = await getQuestCompletionStatus(
      key,
      eoa,
      futurepass,
      redisClient
    )

    if (challengeCompleted != null) {
      questCompletionStatus[key] = challengeCompleted
    }
  }

  return questCompletionStatus
}

const getQuestCompletionStatus = async (
  questId: string,
  eoa: sdk.Address,
  futurepass: sdk.Address,
  redisClient: Redis
) => {
  // check if eoa has rewards first
  const challenge: IChallenge | undefined = createChallenge(questId)

  let challengeRewards: number | undefined
  let challengeCompleted: boolean | number | undefined

  if (challenge != null) {
    challenge.setEOA(eoa).setFuturePass(futurepass).setRedis(redisClient)

    challengeCompleted = await challenge.check()
    challengeRewards = await challenge.getRewards()
  }

  return {
    challengeCompleted,
    challengeRewards,
  }
}
