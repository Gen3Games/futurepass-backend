import { gql } from '../../__generated__'

export const GET_NFTS = gql(/* GraphQL */ `
  query Nfts(
    $addresses: [Address]!
    $chainLocations: [BlockchainLocationInput]
    $first: Int
    $after: String
  ) {
    nfts(
      addresses: $addresses
      chainLocations: $chainLocations
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          tokenId
          collection {
            id
            location
            chainId
            chainType
            name
          }
          assetType
          metadata {
            id
            uri
            attributes
            properties
          }
          ... on NFT721 {
            owner {
              id
              address
            }
          }
          ... on NFT1155 {
            balancesOf(addresses: $addresses) {
              balance
              owner {
                address
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        nextPageCursor
      }
    }
  }
`)
