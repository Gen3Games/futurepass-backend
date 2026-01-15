import { request, gql } from 'graphql-request'
import * as t from 'io-ts'
import { Redis } from 'ioredis'
import { hush } from '../common'
import { IdbOperations, RedisDBImpl } from '../db'
import { config as C } from '../serverConfig'
import {
  ChallengeCheckParams,
  ChallengeResult,
  IChallenge,
} from './challengeInterface'

export class BridgingAssetChallenge implements IChallenge {
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

  async run(parameter?: ChallengeCheckParams): Promise<boolean> {
    // nothing to check, just record the challenge
    if (
      this._eoa != null &&
      this._futurepass != null &&
      this._redis != null &&
      parameter?.tokenId != null
    ) {
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const isAssetNotBridged = await dbImpl.isAssetNotBridged(
        parameter.tokenId
      )

      if (isAssetNotBridged) {
        return await dbImpl.saveWallet(
          this._challengeId,
          this._eoa,
          this._futurepass
        )
      }
    }

    return false
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make it compatible with the interface
  async check(): Promise<boolean | undefined> {
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- async make it compatible with the interface
  async getRewards(): Promise<number | undefined> {
    // if (this._eoa != null && this._redis != null) {
    //   // Todo: replace redis implementation with dynamodb implementation
    //   const dbImpl: IdbOperations = new RedisDBImpl(this._redis);
    //   const walletsData = await dbImpl.getWalletsForChallenge(
    //     this._challengeId
    //   );

    //   for (const walletData of walletsData) {
    //     if (walletData.toLowerCase().indexOf(this._eoa.toLowerCase()) !== -1) {
    //       const ownedTNLBoxers = await this.fetchOwnedTNLBoxers();
    //       return ownedTNLBoxers * this._rewardPerUnit;
    //     }
    //   }
    // }

    // we don't know how much rewards for the given wallet, it will be calculated at the end of the challenge
    return undefined
  }

  async getChallengeResult(): Promise<ChallengeResult[]> {
    const challengeResult: ChallengeResult[] = []
    if (this._redis != null) {
      // Todo: replace redis implementation with dynamodb implementation
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)
      const walletsData = await dbImpl.getWalletsForChallenge(this._challengeId)

      for (const walletData of walletsData) {
        const walletWithFuturepass = hush(
          WalletWithFuturepass.decode(JSON.parse(walletData))
        )

        if (walletWithFuturepass != null) {
          const ownedTNLBoxers = await this.fetchOwnedTNLBoxers({
            eoa: walletWithFuturepass.walletAddress,
            futurepass: walletWithFuturepass.futurepass,
          })

          if (ownedTNLBoxers > 0) {
            challengeResult.push({
              walletAddress: walletWithFuturepass.walletAddress,
              futurepass: walletWithFuturepass.futurepass,
              amount: ownedTNLBoxers,
            })
          }
        }
      }
    }

    return challengeResult
  }

  async fetchOwnedTNLBoxers(owner?: {
    eoa: string
    futurepass: string
  }): Promise<number> {
    const _owner = owner ?? {
      eoa: this._eoa,
      futurepass: this._futurepass,
    }

    let hasNextPage = true
    let after: string | null = null
    let totalOwnedTNLBoxers = 0

    const getQuery = (hasNextCursor: string | null) => {
      const nextCursor = hasNextCursor ? `"${hasNextCursor}"` : null
      return gql`
      query {
        nfts(
          addresses: [
            "${_owner.eoa}",
            "${_owner.futurepass}"
          ],
          chainLocations: [
            { chainId: 1, chainType: "evm", location: "${C.TNL_CHARACTER_CONTRACT}" }
            { chainId: 7668, chainType: "root", location: "1124" }
          ],
          first: 500
          after: ${nextCursor}
        ) {
          edges {
            node {
              tokenId
            }
          }
          pageInfo {
            hasNextPage
            nextPageCursor
          }
        }
      }
    `
    }

    try {
      do {
        const result: unknown = await request(
          C.GRAPHQL_ENDPOINT,
          getQuery(after)
        )
        const nftsData: NftsData | null = hush(NftsData.decode(result))

        if (nftsData == null) {
          break
        }

        totalOwnedTNLBoxers += nftsData.nfts.edges.length
        hasNextPage = nftsData.nfts.pageInfo.hasNextPage
        after = nftsData.nfts.pageInfo.nextPageCursor
      } while (hasNextPage)

      return totalOwnedTNLBoxers
    } catch (error) {
      return 0
    }
  }

  async getChallengeData(): Promise<unknown> {
    if (this._redis != null) {
      const dbImpl: IdbOperations = new RedisDBImpl(this._redis)

      return {
        bridgedAssets: await dbImpl.getBridgedAssets(),
        walletsData: await dbImpl.getWalletsForChallenge(this._challengeId),
      }
    }

    return null
  }
}

const WalletWithFuturepass = t.type({
  walletAddress: t.string,
  futurepass: t.string,
})

type WalletWithFuturepass = t.TypeOf<typeof WalletWithFuturepass>

const Node = t.type({
  tokenId: t.string,
})

const Edge = t.type({
  node: Node,
})

const PageInfo = t.type({
  hasNextPage: t.boolean,
  nextPageCursor: t.union([t.string, t.null]),
})

const NftsData = t.type({
  nfts: t.type({
    edges: t.array(Edge),
    pageInfo: PageInfo,
  }),
})

type NftsData = t.TypeOf<typeof NftsData>
