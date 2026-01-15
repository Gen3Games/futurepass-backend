import { hush } from '@futureverse/experience-sdk'
import { DynamoDB } from 'aws-sdk'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { config as C } from '../serverConfig'
import { ChallengeResult, IChallenge } from './challengeInterface'

export class TnlBoxerCutAndStyleQuest implements IChallenge {
  _questCompletionTableName = 'futureverse-quest-completion'
  _questId =
    '1:evm:0x6bca6de2dbdc4e0d41f7273011785ea16ba47182:394e39fe-8210-4876-bb18-f286668d4132-TnlBoxerUpdateStyle'
  _timestamp = '1699916400000' // Nov 13 3pm PT = Nov 14 12pm NZDT

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

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async run(): Promise<boolean> {
    // we don't run the quest here
    return false
  }

  async check(): Promise<boolean | undefined> {
    const dynamodbClient = new DynamoDB.DocumentClient()

    try {
      const record = await dynamodbClient
        .get({
          TableName: this._questCompletionTableName,
          Key: {
            questId: this._questId,
            futurepass: `${
              C.ETH_CHAIN_ID
            }:root:${this._futurepass?.toLowerCase()}`,
          },
        })
        .promise()

      if (!record.Item) {
        const questCompletedResult = await this.checkAssetRegistry()
        if (questCompletedResult?.hasQuestCompleted) {
          for (const account of questCompletedResult.questCompletedAccounts) {
            // write record to quest db
            await dynamodbClient
              .put({
                TableName: this._questCompletionTableName,
                Item: {
                  questId: this._questId,
                  futurepass: account.toLowerCase(),
                },
              })
              .promise()
          }

          return true
        }

        return false
      }

      return true
    } catch (err) {
      return false
    }
  }

  async checkAssetRegistry(): Promise<
    AssetRegistryQueestEventResponse | undefined
  > {
    if (this._eoa == null) {
      return undefined
    }

    const response = await fetch(
      `${C.ASSET_REGISTRY_QUEST_EVENT_ENDPOINT}/api/v1/asset-registry-quest-event?questId=${this._questId}&eoa=${this._eoa}&timestamp=${this._timestamp}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          api_key: `${C.ASSET_REGISTRY_QUEST_EVENT_APIKEY}`,
        },
      }
    )

    if (response.status !== 200) {
      return undefined
    }

    const assetRegistryQueestEventResponse = hush(
      AssetRegistryQueestEventResponse.decode(await response.json())
    )

    if (assetRegistryQueestEventResponse == null) {
      return undefined
    }

    return assetRegistryQueestEventResponse
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getRewards(): Promise<number | undefined> {
    // we don't know the reward here
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getChallengeResult(): Promise<ChallengeResult[]> {
    // we don't know the challenge result here
    return []
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compitable with the interface
  async getChallengeData(): Promise<unknown> {
    return undefined
  }
}

const AssetRegistryQueestEventResponse = t.type({
  hasQuestCompleted: t.boolean,
  questCompletedAccounts: t.array(t.string),
})

type AssetRegistryQueestEventResponse = t.TypeOf<
  typeof AssetRegistryQueestEventResponse
>
