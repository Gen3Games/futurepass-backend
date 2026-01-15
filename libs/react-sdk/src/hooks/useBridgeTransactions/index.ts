import { useQuery } from '@apollo/client'
import { QueryHookOptions } from '@apollo/client/react/types/types'
import {
  GetEthTransactionsBySenderDocument,
  GetEthTransactionsBySenderQuery,
  GetEthTransactionsBySenderQueryVariables,
} from '../../__generated_bridging__/graphql'
import { useMongoDbApolloClient } from '../useMongoDbApolloClient'

// TODO: confirm query still works evm root -> eth bridgng

export const useBridgeTransactions = (
  address: string[],
  options?: Omit<
    QueryHookOptions<
      GetEthTransactionsBySenderQuery,
      GetEthTransactionsBySenderQueryVariables
    >,
    'variables'
  >
) => {
  const apolloClient = useMongoDbApolloClient()

  // TODO: type return value
  const result = useQuery(GetEthTransactionsBySenderDocument, {
    variables: { address },
    ...options,
    skip: !address,
    client: apolloClient,
  })

  return result
}
