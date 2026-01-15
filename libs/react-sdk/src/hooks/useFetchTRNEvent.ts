import * as sdk from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import asyncRetry from 'async-retry'
import { either as E } from 'fp-ts'
import reporter from 'io-ts-reporters'
import React from 'react'
import { useFutureverse } from '../providers'
import { useRealmApp } from './useRealmApp'

const GetETHWithdrawalByExtrinsicId = `
query GetETHWithdrawalByExtrinsicId($extrinsicId: String!) {
  ethWithdrawals(query: { extrinsicId: $extrinsicId }) {
    eventId
    eventInfo {
      source
      destination
      message
    }
    eventSignature {
      v
      r
      s
    }
    eventAuthSetId {
      setId
      setValue
    }
  }
}
`

/**
 * We could further refine these types for the byte data but it doesn't give use much as
 * this data is consumed by an ethers contract call which takes BytesLike so handles
 * the inputs as they are.
 */
const TRNEvent = t.type(
  {
    eventId: t.string,
    eventInfo: t.type({
      destination: t.string,
      message: t.string,
      source: t.string,
    }),
    eventAuthSetId: t.type({
      setId: t.string,
      setValue: t.array(t.string),
    }),
    eventSignature: t.type({
      v: t.array(t.string),
      r: t.array(t.string),
      s: t.array(t.string),
    }),
  },
  'TRNEvent'
)

type TRNEvent = t.TypeOf<typeof TRNEvent>

const BridgeResponse = t.type(
  {
    ethWithdrawals: t.array(TRNEvent),
  },
  'BridgeResponse'
)

type BridgeResponse = t.TypeOf<typeof BridgeResponse>

export function useFetchTRNEvent(): {
  fetchTRNEvent: (extrinsicId: string, attempts?: number) => Promise<TRNEvent>
} {
  const getAccessToken = useRealmApp()
  const [accessToken, setAccessToken] = React.useState<string>()
  const { CONSTANTS } = useFutureverse()

  const resolveAccessToken = React.useCallback(async () => {
    if (accessToken) return accessToken

    const newAccessToken = await getAccessToken()

    setAccessToken(newAccessToken)

    return newAccessToken
  }, [accessToken, getAccessToken])

  const fetchTRNEvent = React.useCallback(
    async (extrinsicId: string): Promise<TRNEvent> => {
      // Ensure access token has been fetched before attempting query
      const accessTokenToUse = await resolveAccessToken()

      const trnEvent = await asyncRetry(
        async (bail) => {
          const { data, errors } = await sdk.io.executeGraphQuery(
            CONSTANTS.ENDPOINTS.BRIDGE_GRAPHQL_URL,
            GetETHWithdrawalByExtrinsicId,
            { extrinsicId },
            accessTokenToUse
          )

          if (errors) {
            bail(errors[0])
            return
          }

          const resR = BridgeResponse.decode(data)

          if (E.isLeft(resR)) {
            bail(
              new Error(
                `Invalid response data ${reporter.report(resR).join(', ')}`
              )
            )
            return
          }

          if (
            !resR.right.ethWithdrawals.length ||
            resR.right.ethWithdrawals[0] == null
          ) {
            throw new Error('Failed to fetch root event')
          }

          return resR.right.ethWithdrawals[0]
        },
        {
          retries: 5,
          minTimeout: 5000,
          randomize: false,
        }
      )

      if (trnEvent == null) {
        throw new Error('Failed to fetch root event')
      }

      return trnEvent
    },
    [CONSTANTS.ENDPOINTS.BRIDGE_GRAPHQL_URL, resolveAccessToken]
  )

  return {
    fetchTRNEvent,
  }
}
