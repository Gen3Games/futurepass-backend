import { gql } from '../../__generated__'

export const GET_NFT = gql(/* GraphQL */ `
  query Nft($chainLocation: BlockchainLocationInput, $tokenId: String) {
    nft(chainLocation: $chainLocation, tokenId: $tokenId) {
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
      tokenIdNumber
      ... on NFT721 {
        owner {
          id
          address
        }
      }
      ... on NFT1155 {
        balanceOf {
          id
          owner {
            id
            address
          }
          balance
        }
      }
    }
  }
`)
