import * as sdk from '@futureverse/experience-sdk'
import { NativeFuturePassIdentityRegistry__factory } from '@futureverse/identity-contract-bindings'
import { ethers, providers } from 'ethers'
import { either as E } from 'fp-ts'
import * as t from 'io-ts'
import reporter from 'io-ts-reporters'
import React, { useMemo } from 'react'
import { useFutureverse } from '../providers'

export function useFuturePassAccountAddress(): {
  data: string | null
  isLinkedFuturepass: boolean
  isLoading: boolean
} {
  const { userSession, CONSTANTS } = useFutureverse()

  const eoaRef = React.useRef<string | null>(null)

  const [isLoading, setIsLoading] = React.useState<boolean>(true)
  const [address, setAddress] = React.useState<string | null>(null)
  const [isLinkedFuturepass, setIsLinkedFuturepass] =
    React.useState<boolean>(false)

  const identityContract = useMemo(() => {
    /**
     * Until the constants work is finished, this is a solution that doesn't require any changes inside the monorepo while
     * also allowing other experiences to use it without depending on our env vars names.
     */

    const rpcUrl = CONSTANTS.CHAINS.TRN.rpcUrls.default.http[0]

    // In this case we initialise a separate provider instance because it always needs to be pointing to TRN, regardless of the user's choice.
    const provider = new providers.JsonRpcProvider(rpcUrl)

    const contract = NativeFuturePassIdentityRegistry__factory.connect(
      CONSTANTS.CONTRACTS.TRN.FUTUREPASS_REGISTRAR,
      provider
    )

    return contract
  }, [
    CONSTANTS.CHAINS.TRN.rpcUrls.default.http,
    CONSTANTS.CONTRACTS.TRN.FUTUREPASS_REGISTRAR,
  ])

  const getLinkedFuturePass = async (eoa: string) => {
    const linkedFuturepassUrl = `${CONSTANTS.ENDPOINTS.ACCOUNTS_INDEXER_URL}/linked-futurepass?eoa=${CONSTANTS.CHAINS.ETHEREUM.id}:evm:${eoa}`

    const linkedFuturepassR = await sdk.io.fetchDecoded(
      () => fetch(linkedFuturepassUrl),
      {
        200: (raw) => {
          const r = sdk.io.fromJSONString(
            DelegatedAccountLinkedFuturepassResponse,
            raw
          )
          const out: E.Either<
            string,
            t.TypeOf<typeof DelegatedAccountLinkedFuturepassResponse>
          > = (() => {
            if (E.isLeft(r)) {
              return E.left(reporter.report(r).join(', '))
            }
            return E.right(r.right)
          })()
          return out
        },
      }
    )

    if (E.isLeft(linkedFuturepassR)) {
      // invalid index response, return to creating new account
      return null
    }

    return linkedFuturepassR.right.linkedFuturepass
  }

  const fetchFuturePassAddress = React.useCallback(
    async (eoa: string) => {
      try {
        setIsLoading(true)

        const accountAddress = await identityContract.futurepassOf(eoa)

        if (accountAddress !== ethers.constants.AddressZero) {
          setAddress(accountAddress)
        } else {
          // check if account has linked futurepass
          const linkedFuturepass = await getLinkedFuturePass(eoa)

          if (linkedFuturepass != null) {
            setAddress(linkedFuturepass)
            setIsLinkedFuturepass(true)
          } else {
            // this should never happen
            setAddress(null)
          }
        }

        eoaRef.current = eoa
      } catch (e) {
        setAddress(null)
      } finally {
        setIsLoading(false)
      }
    },
    [identityContract]
  )

  React.useEffect(() => {
    if (
      userSession == null ||
      (address != null && userSession.eoa === eoaRef.current)
    )
      return

    void fetchFuturePassAddress(userSession.eoa)
  }, [userSession, address, fetchFuturePassAddress])

  return React.useMemo(() => {
    return {
      data: address,
      isLoading,
      isLinkedFuturepass,
    }
  }, [isLoading, address, isLinkedFuturepass])
}

export const DelegatedAccountLinkedFuturepassResponse = t.type({
  eoa: sdk.ChainLocationString,
  ownedFuturepass: t.union([t.null, sdk.ChainLocationString]),
  linkedFuturepass: t.union([t.null, sdk.ChainLocationString]),
})

export type DelegatedAccountLinkedFuturepassResponse = t.TypeOf<
  typeof DelegatedAccountLinkedFuturepassResponse
>
