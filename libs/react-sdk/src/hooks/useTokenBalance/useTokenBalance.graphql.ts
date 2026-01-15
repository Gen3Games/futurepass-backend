import { gql } from '../../__generated__'

export const GET_TOKEN = gql(/* GraphQL */ `
  query GenericTokenBalance(
    $address: Address
    $chainLocation: BlockchainLocationInput
  ) {
    genericTokenBalance(address: $address, chainLocation: $chainLocation) {
      amount
    }
  }
`)
