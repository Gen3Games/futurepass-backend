import { QueryHookOptions, useQuery } from '@apollo/client'
import {
  BlockchainLocationInput,
  NftDocument,
  NftQuery,
  NftQueryVariables,
} from '../../__generated__/graphql'

import { collectionConfig } from '../../constants'
import { useFutureverse } from '../../providers'

interface QueryNftProps {
  tokenId: string
  chainLocation: BlockchainLocationInput | keyof typeof collectionConfig
  options?: Omit<QueryHookOptions<NftQuery, NftQueryVariables>, 'variables'>
}

export function useNft(args: QueryNftProps) {
  const { apolloClient } = useFutureverse()

  if (typeof args.chainLocation === 'string') {
    args.chainLocation = collectionConfig[args.chainLocation]
  }

  const response = useQuery(NftDocument, {
    client: apolloClient,
    ...args.options,
    variables: { chainLocation: args.chainLocation, tokenId: args.tokenId },
  })

  return response
}

export default useNft
