import { gql } from '@apollo/client'

export const BRIDGE_STATUS_QUERY = gql(/* GraphQL */ `
  query GetBridgeStatus($hash: String!) {
    ethDeposits(query: { ethHash: $hash }) {
      status
    }
  }
`)
