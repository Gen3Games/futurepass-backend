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
  '\n  query GetBridgeStatus($hash: String!) {\n    ethDeposits(query: { ethHash: $hash }) {\n      status\n    }\n  }\n':
    types.GetBridgeStatusDocument,
  '\n  query GetETHTransactionsBySender($address: [String]!) {\n    ethDeposits(query: { to_in: $address }) {\n      createdAt\n      ethHash\n      extrinsicId\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n    }\n    ethWithdrawals(query: { to_in: $address }) {\n      from\n      to\n      createdAt\n      extrinsicId\n      ethHash\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n      eventInfo {\n        source\n        message\n        destination\n      }\n    }\n  }\n':
    types.GetEthTransactionsBySenderDocument,
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
  source: '\n  query GetBridgeStatus($hash: String!) {\n    ethDeposits(query: { ethHash: $hash }) {\n      status\n    }\n  }\n'
): (typeof documents)['\n  query GetBridgeStatus($hash: String!) {\n    ethDeposits(query: { ethHash: $hash }) {\n      status\n    }\n  }\n']
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(
  source: '\n  query GetETHTransactionsBySender($address: [String]!) {\n    ethDeposits(query: { to_in: $address }) {\n      createdAt\n      ethHash\n      extrinsicId\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n    }\n    ethWithdrawals(query: { to_in: $address }) {\n      from\n      to\n      createdAt\n      extrinsicId\n      ethHash\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n      eventInfo {\n        source\n        message\n        destination\n      }\n    }\n  }\n'
): (typeof documents)['\n  query GetETHTransactionsBySender($address: [String]!) {\n    ethDeposits(query: { to_in: $address }) {\n      createdAt\n      ethHash\n      extrinsicId\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n    }\n    ethWithdrawals(query: { to_in: $address }) {\n      from\n      to\n      createdAt\n      extrinsicId\n      ethHash\n      status\n      updatedAt\n      ethValue {\n        amount\n        tokenAddress\n      }\n      erc20Value {\n        amount\n        tokenAddress\n      }\n      erc721Value {\n        tokenIds\n        tokenAddress\n      }\n      eventInfo {\n        source\n        message\n        destination\n      }\n    }\n  }\n']

export function gql(source: string) {
  return (documents as any)[source] ?? {}
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never
