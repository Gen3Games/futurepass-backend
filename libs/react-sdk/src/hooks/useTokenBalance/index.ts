import { QueryHookOptions, useQuery } from '@apollo/client'
import {
  BlockchainLocationInput,
  GenericTokenBalanceDocument,
  GenericTokenBalanceQuery,
  GenericTokenBalanceQueryVariables,
} from '../../__generated__/graphql'
import { tokenConfig } from '../../constants'
import { useFutureverse } from '../../providers'

interface QueryTokenBalanceProps {
  options?: Omit<
    QueryHookOptions<
      GenericTokenBalanceQuery,
      GenericTokenBalanceQueryVariables
    >,
    'variables'
  >
  address: string
  chainLocation: BlockchainLocationInput | keyof typeof tokenConfig
}

export function useTokenBalance(args: QueryTokenBalanceProps) {
  const { apolloClient } = useFutureverse()

  if (typeof args.chainLocation === 'string') {
    args.chainLocation = tokenConfig[args.chainLocation]
  }

  const response = useQuery(GenericTokenBalanceDocument, {
    client: apolloClient,
    ...args.options,
    variables: {
      address: args.address,
      chainLocation: args.chainLocation,
    },
  })

  return response
}

export default useTokenBalance
