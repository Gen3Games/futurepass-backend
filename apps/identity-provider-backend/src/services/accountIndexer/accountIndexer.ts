import * as sdk from '@futureverse/experience-sdk'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { FuturePassAccount, FuturePassForEoaResponse } from '../../types'

export const getLinkedFuturePassForEoa = async (
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
                methodName: `${getLinkedFuturePassForEoa.name}`,
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
        methodName: `${getLinkedFuturePassForEoa.name}`,
        code: 4004101,
      }
    )

    return null
  }

  return linkedFuturepassR.right
}

export const getLinkedEoasForFuturePass = async (
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
                methodName: `${getLinkedEoasForFuturePass.name}`,
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
        methodName: `${getLinkedEoasForFuturePass.name}`,
        code: 4004102,
      }
    )

    return null
  }

  return delegatedAccountLinkedEoasR.right
}
