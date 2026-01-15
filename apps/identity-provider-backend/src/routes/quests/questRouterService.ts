import * as sdk from '@futureverse/experience-sdk'
import { Redis } from 'ioredis'

import {
  ChallengeCheckParams,
  IChallenge,
  checkQuestCompletionStatus,
  createChallenge,
} from '../../challenge/challengeInterface'
import * as CO from '../../common'
import { config as C } from '../../serverConfig'
import RouterService from '../routerService'

class QuestRouterService extends RouterService {
  public static async runQuest(eoa: sdk.Address, query: unknown) {
    // check if eoa has rewards first
    const challenge: IChallenge | undefined = createChallenge(
      C.ACTIVE_CHALLENGE
    )

    let challengeRewards: number | undefined
    let challengeCompleted: boolean | number = false

    if (challenge != null) {
      const futurepass = await QuestRouterService.getFuturePass(eoa)
      challenge.setEOA(eoa).setFuturePass(futurepass).setRedis(C.redisClient)

      const checkParams = CO.hush(ChallengeCheckParams.decode(query))

      challengeCompleted = await challenge.run(checkParams ?? undefined)
      challengeRewards = await challenge.getRewards()
    }

    return {
      challengeRewards,
      challengeCompleted,
    }
  }

  public static async checkQuestCompletion(
    eoa: sdk.Address,
    futurepass: sdk.Address,
    redisClient: Redis
  ) {
    return await checkQuestCompletionStatus(eoa, futurepass, redisClient)
  }
}

export default QuestRouterService
