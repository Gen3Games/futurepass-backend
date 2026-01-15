import * as sdk from '@futureverse/experience-sdk'
import { ethers } from 'ethers'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { hush, TNL_CHARACTER_ABI } from '../common'
import { IdbOperations, RedisDBImpl } from '../db'
import { config as C } from '../serverConfig'
import { ChallengeResult, IChallenge } from './challengeInterface'

export class MintAssetChallenge implements IChallenge {
  _challengeId: string
  _rewardPerUnit: number

  _eoa: string | null | undefined
  _redis: Redis | null | undefined

  constructor(_challengeId: string, _rewardPerUnit: number) {
    this._challengeId = _challengeId
    this._rewardPerUnit = _rewardPerUnit
  }

  setEOA(eoa: string): IChallenge {
    this._eoa = eoa
    return this
  }
  setFuturePass(): IChallenge {
    return this
  }
  setRedis(redis: Redis | null | undefined): IChallenge {
    this._redis = redis
    return this
  }

  async run(): Promise<boolean> {
    if (this._eoa == null) {
      return false
    }

    // check if user has minted TNL assets
    const tnlAssetsContractMap = new Map<string, string>()
    // tnlAssetsContractMap.set(TNL_BAG_CONTRACT, TNL_BAG_ABI);
    tnlAssetsContractMap.set(C.TNL_CHARACTER_CONTRACT, TNL_CHARACTER_ABI)

    const mintedAssetsCount = await this.countMintedERC721Assets(
      this._eoa,
      tnlAssetsContractMap
    )
    // Add to db for future airdro
    if (this._redis != null && mintedAssetsCount > 0) {
      // Todo: replace redis implementation with dynamodb implementation
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      await dbImpl.saveWalletWithMintedAsset(
        this._challengeId,
        this._eoa,
        mintedAssetsCount
      )
    }

    return mintedAssetsCount > 0
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compilable with the interface
  async check(): Promise<boolean | undefined> {
    return undefined
  }

  async countMintedERC721Assets(
    walletAddress: string,
    contractMap: Map<string, string>
  ): Promise<number> {
    let totalCount = 0

    // Check if wallet address is a valid Ethereum address
    if (!ethers.utils.isAddress(walletAddress)) {
      throw new Error('Invalid Ethereum address')
    }

    // Check if contract addresses array is not empty
    if (contractMap.size === 0) {
      throw new Error('No contract addresses provided')
    }

    // Initialize web3 provider
    const provider = new ethers.providers.JsonRpcProvider(
      sdk.CHAINS.ETHEREUM.HOMESTEAD.rpcUrls.default.http[0] ??
        'https://cloudflare-eth.com'
    )

    // Loop through each contract address
    for (const contractAddress of contractMap.keys()) {
      // Check if contract address is a valid Ethereum address
      if (!ethers.utils.isAddress(contractAddress)) {
        throw new Error(`Invalid Ethereum address: ${contractAddress}`)
      }

      const contractABI = contractMap.get(contractAddress)
      if (contractABI == null) {
        throw new Error(`Contract ABI is not provided: ${contractAddress}`)
      }

      // Initialize ERC721 contract instance
      const erc721Contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider
      )

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --  erc721Contract.filters['Transfer'] could be undefined at runtime
      const tokenEventFilter = erc721Contract.filters['Transfer']?.(
        ethers.constants.AddressZero,
        walletAddress
      )

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition --  tokenEventFilter could be undefined at runtime
      if (tokenEventFilter == null) {
        continue
      }

      try {
        const tokenEvents = await erc721Contract.queryFilter(tokenEventFilter)

        totalCount = tokenEvents.length
      } catch (err) {
        continue
      }
    }

    return totalCount
  }

  async getRewards(): Promise<number | undefined> {
    if (this._eoa != null && this._redis != null) {
      // Todo: replace redis implementation with dynamodb implementation
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const walletsData = await dbImpl.getWalletsWithMintedAsset(
        this._challengeId
      )

      for (const walletData of walletsData) {
        if (walletData.toLowerCase().includes(this._eoa.toLowerCase())) {
          const walletWithMintedAsset = hush(
            WalletWithAssets.decode(JSON.parse(walletData))
          )

          if (walletWithMintedAsset != null) {
            return walletWithMintedAsset.mintedAssetsCount * this._rewardPerUnit
          }
        }
      }
    }

    return 0
  }

  async getChallengeResult(): Promise<ChallengeResult[]> {
    const challengeResult: ChallengeResult[] = []
    if (this._redis != null) {
      // Todo: replace redis implementation with dynamodb implementation
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const walletsData = await dbImpl.getWalletsWithMintedAsset(
        this._challengeId
      )

      for (const walletData of walletsData) {
        const walletWithMintedAsset = hush(
          WalletWithAssets.decode(JSON.parse(walletData))
        )

        if (walletWithMintedAsset != null) {
          challengeResult.push({
            walletAddress: walletWithMintedAsset.walletAddress,
            futurepass: undefined,
            amount: walletWithMintedAsset.mintedAssetsCount,
          })
        }
      }
    }

    return challengeResult
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make the function compilable with the interface
  async getChallengeData(): Promise<unknown> {
    // we don't need this
    return null
  }
}

const WalletWithAssets = t.type({
  walletAddress: t.string,
  mintedAssetsCount: t.number,
})

type WalletWithAssets = t.TypeOf<typeof WalletWithAssets>
