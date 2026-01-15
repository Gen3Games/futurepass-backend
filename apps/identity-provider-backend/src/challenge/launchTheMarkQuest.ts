import { DynamoDB } from 'aws-sdk'
import { ChallengeResult } from './challengeInterface'

import { OffChainChallenge } from './offChainChallenge'

export class LaunchTheMarkQuest extends OffChainChallenge {
  _questCompletionTableName = 'futureverse-quest-completion'
  _questId =
    'off-chain:futurepass:futurepass-quest-c355ed1a-50ad-4cb6-a9d7-e73c95b2f8f1:TheMARkLaunch'

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
            futurepass: this._futurepass?.toLowerCase(),
          },
        })
        .promise()

      if (!record.Item) {
        return false
      }

      return true
    } catch (err) {
      return false
    }
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
