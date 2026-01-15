import { gql } from '@apollo/client'

export const BRIDGE_TRANSACTIONS_QUERY = gql(/* GraphQL */ `
  query GetETHTransactionsBySender($address: [String]!) {
    ethDeposits(query: { to_in: $address }) {
      createdAt
      ethHash
      extrinsicId
      status
      updatedAt
      ethValue {
        amount
        tokenAddress
      }
      erc20Value {
        amount
        tokenAddress
      }
      erc721Value {
        tokenIds
        tokenAddress
      }
    }
    ethWithdrawals(query: { to_in: $address }) {
      from
      to
      createdAt
      extrinsicId
      ethHash
      status
      updatedAt
      ethValue {
        amount
        tokenAddress
      }
      erc20Value {
        amount
        tokenAddress
      }
      erc721Value {
        tokenIds
        tokenAddress
      }
      eventInfo {
        source
        message
        destination
      }
    }
  }
`)
