import Redis from 'ioredis'
import { IdbOperations } from '.'

export class RedisDBImpl implements IdbOperations {
  private WALLET_COMPLETED_CHALLENGE_SET = 'WalletCompletedChallenge'
  private WALLET_WITH_MINTED_ASSET_SET = 'WalletWithMintedAssetSet'
  private WALLET_WITH_BRIDGED_ASSET_SET = 'WalletWithBridgedAssetSet'
  private OFF_CHAIN_CHALLENGE_SET_NAME_PREFIX = 'OffChainChallenge-'

  private redisClient: Redis
  constructor(redisClient: Redis) {
    this.redisClient = redisClient
  }

  // for general purpose
  public async saveWallet(
    challengeId: string,
    walletAddress: string,
    futurepass: string
  ): Promise<boolean> {
    const count = await this.redisClient.sadd(
      `${this.WALLET_COMPLETED_CHALLENGE_SET}:${challengeId}`,
      JSON.stringify({
        walletAddress,
        futurepass,
      })
    )

    return count > 0
  }

  public async getWalletsForChallenge(challengeId: string): Promise<string[]> {
    return this.redisClient.smembers(
      `${this.WALLET_COMPLETED_CHALLENGE_SET}:${challengeId}`
    )
  }

  // for mint assets challenge
  public async saveWalletWithMintedAsset(
    challengeId: string,
    walletAddress: string,
    mintedAssetsCount: number
  ): Promise<boolean> {
    const count = await this.redisClient.sadd(
      `${this.WALLET_WITH_MINTED_ASSET_SET}:${challengeId}`,
      JSON.stringify({
        walletAddress,
        mintedAssetsCount,
      })
    )

    return count > 0
  }

  public async getWalletsWithMintedAsset(
    challengeId: string
  ): Promise<string[]> {
    return this.redisClient.smembers(
      `${this.WALLET_WITH_MINTED_ASSET_SET}:${challengeId}`
    )
  }

  // for bridge assets challenge
  public async isAssetNotBridged(tokenId: string): Promise<boolean> {
    // if successfully added asset token to the set, then this asset must not be bridged
    const count = await this.redisClient.sadd(
      `${this.WALLET_WITH_BRIDGED_ASSET_SET}`,
      tokenId
    )

    return count === 1
  }

  public async getBridgedAssets(): Promise<string[]> {
    return await this.redisClient.smembers(
      `${this.WALLET_WITH_BRIDGED_ASSET_SET}`
    )
  }

  // used to check if a futurepass has completed an off-chain challenge
  // this funct ensures that each futurepass can only complete the challenge once by adding it to a SET data structure
  // SET NAME format: OffChainChallenge-<ChallengeId>
  public async addFuturepassToOffChainDataSet(
    dataSetType: 'processed' | 'completion' | 'failure',
    offChainChallengeId: string,
    eoa: string,
    futurepass: string
  ): Promise<boolean> {
    const count = await this.redisClient.sadd(
      `${this.OFF_CHAIN_CHALLENGE_SET_NAME_PREFIX}${offChainChallengeId}-${dataSetType}`,
      JSON.stringify({
        eoa: eoa.toLowerCase(),
        futurepass: futurepass.toLowerCase(),
      })
    )

    return count === 1
  }

  public async getFuturepassFromOffChainDataSet(
    dataSetType: 'processed' | 'completion' | 'failure',
    offChainChallengeId: string
  ): Promise<string[]> {
    return await this.redisClient.smembers(
      `${this.OFF_CHAIN_CHALLENGE_SET_NAME_PREFIX}${offChainChallengeId}-${dataSetType}`
    )
  }

  public async addOffChainTransactionIdForFuturepass(
    offChainChallengeId: string,
    futurepass: string,
    transactionId: string
  ) {
    // if successfully added asset token to the set, then this asset must not be bridged
    const count = await this.redisClient.hset(
      `${this.OFF_CHAIN_CHALLENGE_SET_NAME_PREFIX}${offChainChallengeId}`,
      futurepass.toLowerCase(),
      transactionId.toLowerCase()
    )

    return count === 1
  }

  public async getOffChainTransactionIdForFuturepass(
    offChainChallengeId: string,
    futurepass: string
  ) {
    // if successfully added asset token to the set, then this asset must not be bridged
    return await this.redisClient.hget(
      `${this.OFF_CHAIN_CHALLENGE_SET_NAME_PREFIX}${offChainChallengeId}`,
      futurepass.toLowerCase()
    )
  }
}
