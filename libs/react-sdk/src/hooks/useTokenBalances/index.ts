import { QueryHookOptions, useQuery } from '@apollo/client'
import * as sdk from '@futureverse/experience-sdk'
import {
  BlockchainLocationInput,
  GenericTokenBalancesDocument,
  GenericTokenBalancesQuery,
  GenericTokenBalancesQueryVariables,
} from '../../__generated__/graphql'
import { tokenConfig } from '../../constants'
import { useFutureverse } from '../../providers'

interface QueryTokenBalancesProps {
  options?: Omit<
    QueryHookOptions<
      GenericTokenBalancesQuery,
      GenericTokenBalancesQueryVariables
    >,
    'variables'
  >
  addresses: string[]
  chainLocations: (BlockchainLocationInput | keyof typeof tokenConfig)[]
}

export function useTokenBalances(args: QueryTokenBalancesProps) {
  const { userSession: user } = useFutureverse()

  const { apolloClient } = useFutureverse()

  const chainLocations = args.chainLocations.map((chainLocation) => {
    if (typeof chainLocation === 'string') {
      return tokenConfig[chainLocation]
    }
    return chainLocation
  })

  const response = useQuery(GenericTokenBalancesDocument, {
    client: apolloClient,
    ...args.options,
    variables: {
      addresses:
        args.addresses.length > 0
          ? args.addresses
          : user
          ? user.linked.map((address) => address.eoa)
          : [],
      chainLocations,
    },
  })

  return {
    ...response,
    data: response.data?.genericTokenBalances?.edges.filter((token) => {
      // TODO: Hot fix for removing sepolia assets so we don't get unexpected crashes.
      // Long term we need to add support for Sepolia to FuturePass
      try {
        // sdk.chainIdToName throws if the chainId is not one we expect
        sdk.chainIdToName(Number(token.node.genericToken.chainId))
        return true
      } catch {
        return false
      }
    }),
  }
}

export default useTokenBalances
