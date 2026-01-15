export interface IdbOperations {
  // for general use only
  saveWallet(
    challengeId: string,
    walletAddress: string,
    futurepass: string
  ): Promise<boolean>
  getWalletsForChallenge(challengeId: string): Promise<string[]>

  // for mint assets challenge
  saveWalletWithMintedAsset(
    challengeId: string,
    walletAddress: string,
    mintedAssetsCount: number
  ): Promise<boolean>
  getWalletsWithMintedAsset(challengeId: string): Promise<string[]>

  // for bridge assets challenge
  isAssetNotBridged(tokenId: string): Promise<boolean>
  getBridgedAssets(): Promise<string[]>

  // used for off-chain challenge along with futurescore service
  addFuturepassToOffChainDataSet(
    dataSetType: 'processed' | 'completion' | 'failure',
    offChainChallengeId: string,
    eoa: string,
    futurepass: string
  ): Promise<boolean>
  getFuturepassFromOffChainDataSet(
    dataSetType: 'processed' | 'completion' | 'failure',
    offChainChallengeId: string
  ): Promise<string[]>
  addOffChainTransactionIdForFuturepass(
    offChainChallengeId: string,
    futurepass: string,
    transactionId: string
  ): Promise<boolean>
  getOffChainTransactionIdForFuturepass(
    offChainChallengeId: string,
    futurepass: string
  ): Promise<string | null>
}
