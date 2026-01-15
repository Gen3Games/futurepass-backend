import { QueryHookOptions, useQuery } from '@apollo/client'
import {
  BlockchainLocationInput,
  NftsDocument,
  NftsQuery,
  NftsQueryVariables,
} from '../../__generated__/graphql'
import { collectionConfig } from '../../constants'
import { useFutureverse } from '../../providers'

interface QueryNftsProps {
  options?: Omit<QueryHookOptions<NftsQuery, NftsQueryVariables>, 'variables'>
  addresses: string[]
  /**
   * If we have more than 4 accounts linked this query fails if we define a list of assets to fetch so we keep it undefined to
   * fetch all assets. Leaving in in case we have a use for filtering once the indexer is fixed.
   */
  chainLocations?: (BlockchainLocationInput | keyof typeof collectionConfig)[]
  first?: number
  after?: string
}

export function useNfts(args: QueryNftsProps) {
  const { userSession: user, apolloClient } = useFutureverse()

  // Leaving in in case we have a use for filtering once the indexer is fixed.
  const chainLocations = args.chainLocations?.map((chainLocation) => {
    if (typeof chainLocation === 'string') {
      return collectionConfig[chainLocation]
    }
    return chainLocation
  })

  const response = useQuery(NftsDocument, {
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
      first: args.first,
      after: args.after,
    },
  })

  return response
}

export default useNfts
