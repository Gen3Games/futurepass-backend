import { gql } from '../../__generated__'

export const GET_TOKEN = gql(/* GraphQL */ `
  query GenericToken(
    $chainLocation: BlockchainLocationInput
    $address: Address!
  ) {
    genericToken(chainLocation: $chainLocation) {
      id
      location
      chainId
      chainType
      balance(address: $address) {
        id
        holder {
          id
          address
        }
        amount
      }
      symbol
      decimals
    }
  }
`)
