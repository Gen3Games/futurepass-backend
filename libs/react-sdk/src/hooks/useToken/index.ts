import { QueryHookOptions, useQuery } from '@apollo/client'
import {
  BlockchainLocationInput,
  GenericTokenDocument,
  GenericTokenQuery,
  GenericTokenQueryVariables,
} from '../../__generated__/graphql'
import { tokenConfig } from '../../constants'
import { useFutureverse } from '../../providers'

interface QueryTokenBalanceArgs {
  options?: Omit<
    QueryHookOptions<GenericTokenQuery, GenericTokenQueryVariables>,
    'variables'
  >
  address: string
  chainLocation: BlockchainLocationInput | keyof typeof tokenConfig
}

export function useToken(args: QueryTokenBalanceArgs) {
  const { apolloClient } = useFutureverse()

  if (typeof args.chainLocation === 'string') {
    args.chainLocation = tokenConfig[args.chainLocation]
  }

  const response = useQuery(GenericTokenDocument, {
    client: apolloClient,
    ...args.options,
    variables: {
      address: args.address,
      chainLocation: args.chainLocation,
    },
  })

  return response
}

export default useToken
