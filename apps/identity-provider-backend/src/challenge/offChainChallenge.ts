import { either as E } from 'fp-ts'
import * as t from 'io-ts'

import { Redis } from 'ioredis'
import { IdbOperations, RedisDBImpl } from '../db'

import { config as C } from '../serverConfig'
import {
  ChallengeCheckParams,
  ChallengeResult,
  IChallenge,
} from './challengeInterface'

const COMPLETE_OFF_CHAIN_CHALLENGE_URI = '/api/v1/off-chain/complete-challenge'
const CHECK_OFF_CHAIN_COMPLETION_URL = '/api/v1/challenge'

export abstract class OffChainChallenge implements IChallenge {
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
  abstract check(parameter?: ChallengeCheckParams): Promise<boolean | undefined>
  abstract getRewards(): Promise<number | undefined>
  abstract getChallengeResult(): Promise<ChallengeResult[]>
  abstract getChallengeData(): Promise<unknown>

  protected async completeOffChainChallenge(): Promise<boolean> {
    if (await this.checkOffChainChallengeCompletion()) {
      return true
    }

    if (this._redis != null && this._eoa != null && this._futurepass != null) {
      let shouldCheckCompletion = false

      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const isFuturepassAdded = await dbImpl.addFuturepassToOffChainDataSet(
        'processed',
        this._challengeId,
        this._eoa,
        this._futurepass
      )

      if (isFuturepassAdded) {
        // Once futurepass is successfully added to challenge db, call futurescore api to complete the challenge
        // this api shold create off-chain transaction id and save it into the challenge db
        const offChainTransactionId = await this.completeOffChainChallengeOnFS()

        if (offChainTransactionId != null) {
          // Challenge is completed on the FS, and successfully saved into challenge db, should be able to check the completion
          shouldCheckCompletion = true
        }
      } else {
        // Futurepass had already been added to challenge db

        const transactionId =
          await dbImpl.getOffChainTransactionIdForFuturepass(
            this._challengeId,
            this._futurepass
          )

        if (transactionId != null) {
          // find transaction id
          shouldCheckCompletion = true
        } else {
          // there is no transaction id
          // this should never happen, we need to save this futurepass for reference check with futurescore service later
          await dbImpl.addFuturepassToOffChainDataSet(
            'failure',
            this._challengeId,
            this._eoa,
            this._futurepass
          )
        }
      }

      if (shouldCheckCompletion) {
        let retryCount = 0
        let isOffChainChallengeCompleted = false
        do {
          await new Promise((resolve) => setTimeout(resolve, 1000 * 3))

          if (await this.checkOffChainChallengeCompletion()) {
            isOffChainChallengeCompleted = true
          }
          retryCount++
        } while (!isOffChainChallengeCompleted && retryCount < 5)

        return isOffChainChallengeCompleted
      }
    }

    throw new Error(
      `Internal server error. Fail to add futurepass to db, please check the challenge implementation: ${this._challengeId}`
    )
  }

  protected async checkOffChainChallengeCompletion(): Promise<boolean> {
    if (this._redis != null && this._eoa != null && this._futurepass != null) {
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      // Call futurescore service to check if off-chain challenge has completed
      const transactionId = await dbImpl.getOffChainTransactionIdForFuturepass(
        this._challengeId,
        this._futurepass
      )

      if (transactionId != null) {
        const isOffChainChallengeCompleted =
          await this.checkOffChainChallengeCompletionOnFS(transactionId)

        if (isOffChainChallengeCompleted) {
          // Save result to challenge db
          await dbImpl.addFuturepassToOffChainDataSet(
            'completion',
            this._challengeId,
            this._eoa,
            this._futurepass
          )
          return true
        }
      }
    }

    return false
  }

  private async completeOffChainChallengeOnFS(): Promise<string | null> {
    if (this._redis != null && this._futurepass != null) {
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)

      const payload = {
        challengeId: C.FUTURESCORE_OFFCHAIN_CHALLENGE_ID,
        futurePass: this._futurepass,
      }

      const response = await fetch(
        `${C.FUTURESCORE_API_GATEWAY_BASE_URL}${COMPLETE_OFF_CHAIN_CHALLENGE_URI}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        return null
      }

      const completeOffChainChallengeResponse =
        CompleteOffChainChallengeResponse.decode(await response.json())

      if (E.isLeft(completeOffChainChallengeResponse)) {
        return null
      }

      await dbImpl.addOffChainTransactionIdForFuturepass(
        this._challengeId,
        this._futurepass,
        completeOffChainChallengeResponse.right.transactionId
      )

      return await dbImpl.getOffChainTransactionIdForFuturepass(
        this._challengeId,
        this._futurepass
      )
    }

    return null
  }

  private async checkOffChainChallengeCompletionOnFS(
    offChainTransactionId: string
  ): Promise<boolean> {
    if (this._futurepass != null && this._eoa != null) {
      const url = new URL(
        `${C.FUTURESCORE_API_GATEWAY_BASE_URL}${CHECK_OFF_CHAIN_COMPLETION_URL}`
      )
      url.searchParams.append(
        'challengeId',
        C.FUTURESCORE_OFFCHAIN_CHALLENGE_ID
      )
      url.searchParams.append('offChainTransactionId', offChainTransactionId)
      url.searchParams.append('futurePass', this._futurepass)
      url.searchParams.append('eoa', this._eoa)

      const response = await fetch(url.toString())

      if (!response.ok) {
        return false
      }

      const checkOffChainChallengeCompletionResponse =
        CheckOffChainChallengeCompletionResponse.decode(await response.json())

      if (E.isLeft(checkOffChainChallengeCompletionResponse)) {
        return false
      }

      return checkOffChainChallengeCompletionResponse.right.isChallengeCompleted
    }

    return false
  }
}

const CompleteOffChainChallengeResponse = t.type({
  collectionLocation: t.string,
  transactionId: t.string,
})

type CompleteOffChainChallengeResponse = t.TypeOf<
  typeof CompleteOffChainChallengeResponse
>

const CheckOffChainChallengeCompletionResponse = t.type({
  isChallengeCompleted: t.boolean,
})

type CheckOffChainChallengeCompletionResponse = t.TypeOf<
  typeof CheckOffChainChallengeCompletionResponse
>

export const WalletAddressPair = t.type({
  eoa: t.string,
  futurepass: t.string,
})

export type WalletAddressPair = t.TypeOf<typeof WalletAddressPair>
