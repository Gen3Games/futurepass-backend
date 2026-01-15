import * as sdk from '@futureverse/experience-sdk'
import { NativeFuturePassIdentityRegistry__factory } from '@futureverse/identity-contract-bindings'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import * as CO from '../common'
import { identityProviderBackendLogger } from '../logger'
import { config as C } from '../serverConfig'
import { FuturePassAccount, FuturePassForEoaResponse } from '../types'

const nullAddress = '0x0000000000000000000000000000000000000000'

const identityRegistry = NativeFuturePassIdentityRegistry__factory.connect(
  sdk.FUTUREPASS_REGISTRAR,
  C.wallet
)

async function safeIdentityOf(eoa: string): Promise<string | null> {
  const x = await identityRegistry.futurepassOf(eoa)
  if (x === nullAddress) {
    return null
  }
  return x
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we don't need to instantiate this class
abstract class RouterService {
  public static async getFuturePass(eoa: sdk.Address) {
    let futurepass = CO.hush(sdk.Address.decode(await safeIdentityOf(eoa)))

    if (futurepass == null) {
      // user probably login with delegated accounts
      const delegatedAccount = CO.hush(sdk.Address.decode(eoa))
      if (delegatedAccount != null) {
        const delegatedAccountlinkedFuturepassResponse =
          await RouterService.getDelegatedAccountLinkedFuturepassResponse(
            delegatedAccount
          )

        if (
          delegatedAccountlinkedFuturepassResponse != null &&
          delegatedAccountlinkedFuturepassResponse.ownedFuturepass == null &&
          delegatedAccountlinkedFuturepassResponse.linkedFuturepass != null
        ) {
          // found linked futurepass, we need to get the owner eoa as well
          const delegatedAccountLinkedEoasResponse =
            await RouterService.getDelegatedAccountLinkedEoasResponse(
              delegatedAccountlinkedFuturepassResponse.linkedFuturepass
            )

          if (delegatedAccountLinkedEoasResponse != null) {
            // found owner eoa
            futurepass =
              delegatedAccountlinkedFuturepassResponse.linkedFuturepass
            eoa = delegatedAccountLinkedEoasResponse.ownerEoa
          }
        }
      }
    }

    return futurepass
  }

  private static getDelegatedAccountLinkedFuturepassResponse = async (
    eoa: sdk.Address
  ): Promise<FuturePassForEoaResponse | null> => {
    const linkedFuturepassUrl = `${C.DELEGATED_ACCOUNT_INDEXER_API_BASE_URL}/api/v1/linked-futurepass?eoa=${C.EVM_CHAIN_ID}:evm:${eoa}`

    const linkedFuturepassR = await sdk.io.fetchDecoded(
      () => fetch(linkedFuturepassUrl),
      {
        200: (raw) => {
          const r = sdk.io.fromJSONString(FuturePassForEoaResponse, raw)
          const out: E.Either<
            string,
            t.TypeOf<typeof FuturePassForEoaResponse>
          > = (() => {
            if (E.isLeft(r)) {
              identityProviderBackendLogger.warn(
                `failed to decode delegated account linked-futurepass api response; raw=` +
                  raw,
                {
                  methodName: `${this.getDelegatedAccountLinkedFuturepassResponse.name}`,
                  code: 4004700,
                }
              )
              return E.left(PathReporter.report(r).join(', '))
            }
            return E.right(r.right)
          })()
          return out
        },
      }
    )

    if (E.isLeft(linkedFuturepassR)) {
      // invalid index response, return to creating new account
      identityProviderBackendLogger.warn(
        `invalid delegated account linked-futurepass api response: ${linkedFuturepassR.left}`,
        {
          methodName: `${this.getDelegatedAccountLinkedFuturepassResponse.name}`,
          code: 4004101,
        }
      )

      return null
    }

    return linkedFuturepassR.right
  }

  private static getDelegatedAccountLinkedEoasResponse = async (
    futurepass: sdk.Address
  ): Promise<FuturePassAccount | null> => {
    const linkedEoaUrl = `${C.DELEGATED_ACCOUNT_INDEXER_API_BASE_URL}/api/v1/linked-eoa?futurepass=${C.ETH_CHAIN_ID}:root:${futurepass}`

    const delegatedAccountLinkedEoasR = await sdk.io.fetchDecoded(
      () => fetch(linkedEoaUrl),
      {
        200: (raw) => {
          const r = sdk.io.fromJSONString(FuturePassAccount, raw)
          const out: E.Either<
            string,
            t.TypeOf<typeof FuturePassAccount>
          > = (() => {
            if (E.isLeft(r)) {
              identityProviderBackendLogger.warn(
                `failed to decode delegated account linked-eoa api response; raw=${raw} `,
                {
                  methodName: `${this.getDelegatedAccountLinkedEoasResponse.name}`,
                  code: 4004700,
                }
              )
              return E.left(PathReporter.report(r).join(', '))
            }
            return E.right(r.right)
          })()
          return out
        },
      }
    )

    if (E.isLeft(delegatedAccountLinkedEoasR)) {
      // invalid index response, return to creating new account
      identityProviderBackendLogger.warn(
        `invalid delegated account linked-eoa api response: ${delegatedAccountLinkedEoasR.left}`,
        {
          methodName: `${this.getDelegatedAccountLinkedEoasResponse.name}`,
          code: 4004102,
        }
      )

      return null
    }

    return delegatedAccountLinkedEoasR.right
  }
}

export default RouterService
