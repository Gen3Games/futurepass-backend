import { useQuery } from '@apollo/client'
import { QueryHookOptions } from '@apollo/client/react/types/types'
import {
  GetBridgeStatusDocument,
  GetBridgeStatusQuery,
  GetBridgeStatusQueryVariables,
} from '../../__generated_bridging__/graphql'
import { useMongoDbApolloClient } from '../useMongoDbApolloClient'

export const useBridgeTransaction = (
  hash: string,
  options?: Omit<
    QueryHookOptions<GetBridgeStatusQuery, GetBridgeStatusQueryVariables>,
    'variables'
  >
) => {
  const apolloClient = useMongoDbApolloClient()

  const result = useQuery(GetBridgeStatusDocument, {
    variables: { hash },
    ...options,
    skip: !hash,
    client: apolloClient,
  })

  return result
}
