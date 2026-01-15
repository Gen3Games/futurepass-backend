import { gql } from '../../__generated__'

export const GET_TOKEN_BALANCES = gql(/* GraphQL */ `
  query GenericTokenBalances(
    $chainLocations: [BlockchainLocationInput]!
    $addresses: [Address]!
  ) {
    genericTokenBalances(
      chainLocations: $chainLocations
      addresses: $addresses
    ) {
      edges {
        node {
          amount
          genericToken {
            id
            location
            chainId
            chainType
            symbol
            decimals
          }
          holder {
            id
            address
          }
          id
        }
      }
    }
  }
`)
