/* eslint-disable */
import * as types from './graphql'
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
  '\n  query Nft($chainLocation: BlockchainLocationInput, $tokenId: String) {\n    nft(chainLocation: $chainLocation, tokenId: $tokenId) {\n      id\n      tokenId\n      collection {\n        id\n        location\n        chainId\n        chainType\n        name\n      }\n      assetType\n      metadata {\n        id\n        uri\n        attributes\n        properties\n      }\n      tokenIdNumber\n      ... on NFT721 {\n        owner {\n          id\n          address\n        }\n      }\n      ... on NFT1155 {\n        balanceOf {\n          id\n          owner {\n            id\n            address\n          }\n          balance\n        }\n      }\n    }\n  }\n':
    types.NftDocument,
  '\n  query Nfts(\n    $addresses: [Address]!\n    $chainLocations: [BlockchainLocationInput]\n    $first: Int\n    $after: String\n  ) {\n    nfts(\n      addresses: $addresses\n      chainLocations: $chainLocations\n      first: $first\n      after: $after\n    ) {\n      edges {\n        node {\n          id\n          tokenId\n          collection {\n            id\n            location\n            chainId\n            chainType\n            name\n          }\n          assetType\n          metadata {\n            id\n            uri\n            attributes\n            properties\n          }\n          ... on NFT721 {\n            owner {\n              id\n              address\n            }\n          }\n          ... on NFT1155 {\n            balancesOf(addresses: $addresses) {\n              balance\n              owner {\n                address\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        nextPageCursor\n      }\n    }\n  }\n':
    types.NftsDocument,
  '\n  query GenericToken(\n    $chainLocation: BlockchainLocationInput\n    $address: Address!\n  ) {\n    genericToken(chainLocation: $chainLocation) {\n      id\n      location\n      chainId\n      chainType\n      balance(address: $address) {\n        id\n        holder {\n          id\n          address\n        }\n        amount\n      }\n      symbol\n      decimals\n    }\n  }\n':
    types.GenericTokenDocument,
  '\n  query GenericTokenBalance(\n    $address: Address\n    $chainLocation: BlockchainLocationInput\n  ) {\n    genericTokenBalance(address: $address, chainLocation: $chainLocation) {\n      amount\n    }\n  }\n':
    types.GenericTokenBalanceDocument,
  '\n  query GenericTokenBalances(\n    $chainLocations: [BlockchainLocationInput]!\n    $addresses: [Address]!\n  ) {\n    genericTokenBalances(\n      chainLocations: $chainLocations\n      addresses: $addresses\n    ) {\n      edges {\n        node {\n          amount\n          genericToken {\n            id\n            location\n            chainId\n            chainType\n            symbol\n            decimals\n          }\n          holder {\n            id\n            address\n          }\n          id\n        }\n      }\n    }\n  }\n':
    types.GenericTokenBalancesDocument,
}

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Nft($chainLocation: BlockchainLocationInput, $tokenId: String) {\n    nft(chainLocation: $chainLocation, tokenId: $tokenId) {\n      id\n      tokenId\n      collection {\n        id\n        location\n        chainId\n        chainType\n        name\n      }\n      assetType\n      metadata {\n        id\n        uri\n        attributes\n        properties\n      }\n      tokenIdNumber\n      ... on NFT721 {\n        owner {\n          id\n          address\n        }\n      }\n      ... on NFT1155 {\n        balanceOf {\n          id\n          owner {\n            id\n            address\n          }\n          balance\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Nft($chainLocation: BlockchainLocationInput, $tokenId: String) {\n    nft(chainLocation: $chainLocation, tokenId: $tokenId) {\n      id\n      tokenId\n      collection {\n        id\n        location\n        chainId\n        chainType\n        name\n      }\n      assetType\n      metadata {\n        id\n        uri\n        attributes\n        properties\n      }\n      tokenIdNumber\n      ... on NFT721 {\n        owner {\n          id\n          address\n        }\n      }\n      ... on NFT1155 {\n        balanceOf {\n          id\n          owner {\n            id\n            address\n          }\n          balance\n        }\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query Nfts(\n    $addresses: [Address]!\n    $chainLocations: [BlockchainLocationInput]\n    $first: Int\n    $after: String\n  ) {\n    nfts(\n      addresses: $addresses\n      chainLocations: $chainLocations\n      first: $first\n      after: $after\n    ) {\n      edges {\n        node {\n          id\n          tokenId\n          collection {\n            id\n            location\n            chainId\n            chainType\n            name\n          }\n          assetType\n          metadata {\n            id\n            uri\n            attributes\n            properties\n          }\n          ... on NFT721 {\n            owner {\n              id\n              address\n            }\n          }\n          ... on NFT1155 {\n            balancesOf(addresses: $addresses) {\n              balance\n              owner {\n                address\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        nextPageCursor\n      }\n    }\n  }\n'
): (typeof documents)['\n  query Nfts(\n    $addresses: [Address]!\n    $chainLocations: [BlockchainLocationInput]\n    $first: Int\n    $after: String\n  ) {\n    nfts(\n      addresses: $addresses\n      chainLocations: $chainLocations\n      first: $first\n      after: $after\n    ) {\n      edges {\n        node {\n          id\n          tokenId\n          collection {\n            id\n            location\n            chainId\n            chainType\n            name\n          }\n          assetType\n          metadata {\n            id\n            uri\n            attributes\n            properties\n          }\n          ... on NFT721 {\n            owner {\n              id\n              address\n            }\n          }\n          ... on NFT1155 {\n            balancesOf(addresses: $addresses) {\n              balance\n              owner {\n                address\n              }\n            }\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        nextPageCursor\n      }\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GenericToken(\n    $chainLocation: BlockchainLocationInput\n    $address: Address!\n  ) {\n    genericToken(chainLocation: $chainLocation) {\n      id\n      location\n      chainId\n      chainType\n      balance(address: $address) {\n        id\n        holder {\n          id\n          address\n        }\n        amount\n      }\n      symbol\n      decimals\n    }\n  }\n'
): (typeof documents)['\n  query GenericToken(\n    $chainLocation: BlockchainLocationInput\n    $address: Address!\n  ) {\n    genericToken(chainLocation: $chainLocation) {\n      id\n      location\n      chainId\n      chainType\n      balance(address: $address) {\n        id\n        holder {\n          id\n          address\n        }\n        amount\n      }\n      symbol\n      decimals\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GenericTokenBalance(\n    $address: Address\n    $chainLocation: BlockchainLocationInput\n  ) {\n    genericTokenBalance(address: $address, chainLocation: $chainLocation) {\n      amount\n    }\n  }\n'
): (typeof documents)['\n  query GenericTokenBalance(\n    $address: Address\n    $chainLocation: BlockchainLocationInput\n  ) {\n    genericTokenBalance(address: $address, chainLocation: $chainLocation) {\n      amount\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GenericTokenBalances(\n    $chainLocations: [BlockchainLocationInput]!\n    $addresses: [Address]!\n  ) {\n    genericTokenBalances(\n      chainLocations: $chainLocations\n      addresses: $addresses\n    ) {\n      edges {\n        node {\n          amount\n          genericToken {\n            id\n            location\n            chainId\n            chainType\n            symbol\n            decimals\n          }\n          holder {\n            id\n            address\n          }\n          id\n        }\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GenericTokenBalances(\n    $chainLocations: [BlockchainLocationInput]!\n    $addresses: [Address]!\n  ) {\n    genericTokenBalances(\n      chainLocations: $chainLocations\n      addresses: $addresses\n    ) {\n      edges {\n        node {\n          amount\n          genericToken {\n            id\n            location\n            chainId\n            chainType\n            symbol\n            decimals\n          }\n          holder {\n            id\n            address\n          }\n          id\n        }\n      }\n    }\n  }\n']

export function gql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never
