import { HttpLink, ApolloClient } from '@apollo/client'
import { NormalizedCacheObject, InMemoryCache } from '@apollo/client/cache'
import * as React from 'react'
import { useFutureverse } from '../providers'
import { useRealmApp } from './useRealmApp'

// TODO: consider adding this to FutureverseProvider if it's a common endpoint so we're not creating an instance per use
export function useMongoDbApolloClient(): ApolloClient<NormalizedCacheObject> {
  const getAccessToken = useRealmApp()
  const { CONSTANTS } = useFutureverse()

  // Create our own client here instead of using the Futureverse one as we are hitting different endpoints
  return React.useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: CONSTANTS.ENDPOINTS.BRIDGE_GRAPHQL_URL,
        fetch: async (uri, options) => {
          const accessToken = await getAccessToken()
          if (!accessToken || typeof accessToken !== 'string') {
            throw new Error('Could not get access token')
          }
          if (options != null) {
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            }
          }
          return fetch(uri, options)
        },
      }),
      cache: new InMemoryCache(),
    })
  }, [CONSTANTS.ENDPOINTS.BRIDGE_GRAPHQL_URL, getAccessToken])
}
