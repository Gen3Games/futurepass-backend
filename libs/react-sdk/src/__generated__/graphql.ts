/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T
> = { [_ in K]?: never }
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never
    }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  /** An ethereum address */
  Address: { input: any; output: any }
  /** Chain ID of the chain */
  ChainId: { input: any; output: any }
  /** Location on a blockchain, such as a smart contract address */
  ChainLocation: { input: any; output: any }
  /** The chain type. Either evm or root */
  ChainType: { input: any; output: any }
  /** Generic collection location on a chain */
  GenericTokenLocation: { input: any; output: any }
  MetadataAttributes: { input: any; output: any }
  MetadataProperties: { input: any; output: any }
  MetadataRawAttributes: { input: any; output: any }
}

export type Account = Node & {
  __typename: 'Account'
  address: Scalars['Address']['output']
  id: Scalars['ID']['output']
}

export type BlockchainLocationInput = {
  chainId: Scalars['ChainId']['input']
  chainType: Scalars['ChainType']['input']
  location: Scalars['ChainLocation']['input']
}

export type Collection = Node & {
  __typename: 'Collection'
  chainId: Scalars['ChainId']['output']
  chainType: Scalars['ChainType']['output']
  id: Scalars['ID']['output']
  location: Scalars['ChainLocation']['output']
  name?: Maybe<Scalars['String']['output']>
}

export type GenericToken = Node & {
  __typename: 'GenericToken'
  balance: GenericTokenBalance
  chainId: Scalars['ChainId']['output']
  chainType: Scalars['ChainType']['output']
  decimals: Scalars['Int']['output']
  id: Scalars['ID']['output']
  location: Scalars['GenericTokenLocation']['output']
  symbol: Scalars['String']['output']
}

export type GenericTokenBalanceArgs = {
  address: Scalars['Address']['input']
}

export type GenericTokenBalance = Node & {
  __typename: 'GenericTokenBalance'
  amount: Scalars['String']['output']
  genericToken: GenericToken
  holder: Account
  id: Scalars['ID']['output']
}

export type GenericTokenBalanceConnection = {
  __typename: 'GenericTokenBalanceConnection'
  edges: Array<GenericTokenBalanceEdge>
}

export type GenericTokenBalanceEdge = {
  __typename: 'GenericTokenBalanceEdge'
  node: GenericTokenBalance
}

export type Metadata = Node & {
  __typename: 'Metadata'
  attributes: Scalars['MetadataAttributes']['output']
  id: Scalars['ID']['output']
  properties: Scalars['MetadataProperties']['output']
  rawAttributes?: Maybe<Scalars['MetadataRawAttributes']['output']>
  uri: Scalars['String']['output']
}

export type Nft = {
  assetType: Scalars['String']['output']
  collection: Collection
  id: Scalars['ID']['output']
  metadata?: Maybe<Metadata>
  tokenId: Scalars['String']['output']
  tokenIdNumber?: Maybe<Scalars['Int']['output']>
}

export type Nft721 = Nft &
  Node & {
    __typename: 'NFT721'
    assetType: Scalars['String']['output']
    collection: Collection
    id: Scalars['ID']['output']
    metadata?: Maybe<Metadata>
    owner: Account
    tokenId: Scalars['String']['output']
    tokenIdNumber?: Maybe<Scalars['Int']['output']>
  }

export type Nft1155 = Nft &
  Node & {
    __typename: 'NFT1155'
    assetType: Scalars['String']['output']
    balanceOf?: Maybe<Nft1155Balance>
    balancesOf?: Maybe<Array<Maybe<Nft1155Balance>>>
    collection: Collection
    id: Scalars['ID']['output']
    metadata?: Maybe<Metadata>
    tokenId: Scalars['String']['output']
    tokenIdNumber?: Maybe<Scalars['Int']['output']>
  }

export type Nft1155BalanceOfArgs = {
  address?: InputMaybe<Scalars['Address']['input']>
}

export type Nft1155BalancesOfArgs = {
  addresses?: InputMaybe<Array<InputMaybe<Scalars['Address']['input']>>>
}

export type Nft1155Balance = {
  __typename: 'NFT1155Balance'
  balance: Scalars['Int']['output']
  id: Scalars['ID']['output']
  owner: Account
}

export type NftConnection = {
  __typename: 'NFTConnection'
  edges: Array<NftEdge>
  pageInfo: PageInfo
}

export type NftEdge = {
  __typename: 'NFTEdge'
  node: Nft
}

export type NftInput = {
  chainLocation?: InputMaybe<BlockchainLocationInput>
  /** NFT Token ID */
  tokenId?: InputMaybe<Scalars['String']['input']>
}

export type Node = {
  id: Scalars['ID']['output']
}

export type PageInfo = {
  __typename: 'PageInfo'
  endCursor?: Maybe<Scalars['String']['output']>
  hasNextPage: Scalars['Boolean']['output']
  nextPageCursor?: Maybe<Scalars['String']['output']>
  startCursor?: Maybe<Scalars['String']['output']>
}

export type Query = {
  __typename: 'Query'
  account?: Maybe<Account>
  genericToken?: Maybe<GenericToken>
  genericTokenBalance?: Maybe<GenericTokenBalance>
  genericTokenBalances?: Maybe<GenericTokenBalanceConnection>
  nft?: Maybe<Nft>
  nfts?: Maybe<NftConnection>
  nftsByTokenIds?: Maybe<Array<Maybe<Nft>>>
  node?: Maybe<Node>
}

export type QueryAccountArgs = {
  address: Scalars['Address']['input']
}

export type QueryGenericTokenArgs = {
  chainLocation?: InputMaybe<BlockchainLocationInput>
}

export type QueryGenericTokenBalanceArgs = {
  address?: InputMaybe<Scalars['Address']['input']>
  chainLocation?: InputMaybe<BlockchainLocationInput>
}

export type QueryGenericTokenBalancesArgs = {
  addresses: Array<InputMaybe<Scalars['Address']['input']>>
  chainLocations: Array<InputMaybe<BlockchainLocationInput>>
}

export type QueryNftArgs = {
  chainLocation?: InputMaybe<BlockchainLocationInput>
  tokenId?: InputMaybe<Scalars['String']['input']>
}

export type QueryNftsArgs = {
  addresses: Array<InputMaybe<Scalars['Address']['input']>>
  after?: InputMaybe<Scalars['String']['input']>
  chainLocations?: InputMaybe<Array<InputMaybe<BlockchainLocationInput>>>
  first?: InputMaybe<Scalars['Int']['input']>
}

export type QueryNftsByTokenIdsArgs = {
  nfts?: InputMaybe<Array<InputMaybe<NftInput>>>
}

export type QueryNodeArgs = {
  id: Scalars['ID']['input']
}

export type NftQueryVariables = Exact<{
  chainLocation?: InputMaybe<BlockchainLocationInput>
  tokenId?: InputMaybe<Scalars['String']['input']>
}>

export type NftQuery = {
  __typename: 'Query'
  nft?:
    | {
        __typename: 'NFT721'
        id: string
        tokenId: string
        assetType: string
        tokenIdNumber?: number | null
        owner: { __typename: 'Account'; id: string; address: any }
        collection: {
          __typename: 'Collection'
          id: string
          location: any
          chainId: any
          chainType: any
          name?: string | null
        }
        metadata?: {
          __typename: 'Metadata'
          id: string
          uri: string
          attributes: any
          properties: any
        } | null
      }
    | {
        __typename: 'NFT1155'
        id: string
        tokenId: string
        assetType: string
        tokenIdNumber?: number | null
        balanceOf?: {
          __typename: 'NFT1155Balance'
          id: string
          balance: number
          owner: { __typename: 'Account'; id: string; address: any }
        } | null
        collection: {
          __typename: 'Collection'
          id: string
          location: any
          chainId: any
          chainType: any
          name?: string | null
        }
        metadata?: {
          __typename: 'Metadata'
          id: string
          uri: string
          attributes: any
          properties: any
        } | null
      }
    | null
}

export type NftsQueryVariables = Exact<{
  addresses:
    | Array<InputMaybe<Scalars['Address']['input']>>
    | InputMaybe<Scalars['Address']['input']>
  chainLocations?: InputMaybe<
    | Array<InputMaybe<BlockchainLocationInput>>
    | InputMaybe<BlockchainLocationInput>
  >
  first?: InputMaybe<Scalars['Int']['input']>
  after?: InputMaybe<Scalars['String']['input']>
}>

export type NftsQuery = {
  __typename: 'Query'
  nfts?: {
    __typename: 'NFTConnection'
    edges: Array<{
      __typename: 'NFTEdge'
      node:
        | {
            __typename: 'NFT721'
            id: string
            tokenId: string
            assetType: string
            owner: { __typename: 'Account'; id: string; address: any }
            collection: {
              __typename: 'Collection'
              id: string
              location: any
              chainId: any
              chainType: any
              name?: string | null
            }
            metadata?: {
              __typename: 'Metadata'
              id: string
              uri: string
              attributes: any
              properties: any
            } | null
          }
        | {
            __typename: 'NFT1155'
            id: string
            tokenId: string
            assetType: string
            balancesOf?: Array<{
              __typename: 'NFT1155Balance'
              balance: number
              owner: { __typename: 'Account'; address: any }
            } | null> | null
            collection: {
              __typename: 'Collection'
              id: string
              location: any
              chainId: any
              chainType: any
              name?: string | null
            }
            metadata?: {
              __typename: 'Metadata'
              id: string
              uri: string
              attributes: any
              properties: any
            } | null
          }
    }>
    pageInfo: {
      __typename: 'PageInfo'
      hasNextPage: boolean
      nextPageCursor?: string | null
    }
  } | null
}

export type GenericTokenQueryVariables = Exact<{
  chainLocation?: InputMaybe<BlockchainLocationInput>
  address: Scalars['Address']['input']
}>

export type GenericTokenQuery = {
  __typename: 'Query'
  genericToken?: {
    __typename: 'GenericToken'
    id: string
    location: any
    chainId: any
    chainType: any
    symbol: string
    decimals: number
    balance: {
      __typename: 'GenericTokenBalance'
      id: string
      amount: string
      holder: { __typename: 'Account'; id: string; address: any }
    }
  } | null
}

export type GenericTokenBalanceQueryVariables = Exact<{
  address?: InputMaybe<Scalars['Address']['input']>
  chainLocation?: InputMaybe<BlockchainLocationInput>
}>

export type GenericTokenBalanceQuery = {
  __typename: 'Query'
  genericTokenBalance?: {
    __typename: 'GenericTokenBalance'
    amount: string
  } | null
}

export type GenericTokenBalancesQueryVariables = Exact<{
  chainLocations:
    | Array<InputMaybe<BlockchainLocationInput>>
    | InputMaybe<BlockchainLocationInput>
  addresses:
    | Array<InputMaybe<Scalars['Address']['input']>>
    | InputMaybe<Scalars['Address']['input']>
}>

export type GenericTokenBalancesQuery = {
  __typename: 'Query'
  genericTokenBalances?: {
    __typename: 'GenericTokenBalanceConnection'
    edges: Array<{
      __typename: 'GenericTokenBalanceEdge'
      node: {
        __typename: 'GenericTokenBalance'
        amount: string
        id: string
        genericToken: {
          __typename: 'GenericToken'
          id: string
          location: any
          chainId: any
          chainType: any
          symbol: string
          decimals: number
        }
        holder: { __typename: 'Account'; id: string; address: any }
      }
    }>
  } | null
}

export const NftDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Nft' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'chainLocation' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BlockchainLocationInput' },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'tokenId' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'nft' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chainLocation' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'chainLocation' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'tokenId' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'tokenId' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'tokenId' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'collection' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'location' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chainId' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'chainType' },
                      },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'assetType' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'metadata' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'uri' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'attributes' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'properties' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'tokenIdNumber' },
                },
                {
                  kind: 'InlineFragment',
                  typeCondition: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'NFT721' },
                  },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'owner' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'address' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'InlineFragment',
                  typeCondition: {
                    kind: 'NamedType',
                    name: { kind: 'Name', value: 'NFT1155' },
                  },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'balanceOf' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'owner' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'address' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'balance' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<NftQuery, NftQueryVariables>
export const NftsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'Nfts' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'addresses' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'Address' },
              },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'chainLocations' },
          },
          type: {
            kind: 'ListType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'BlockchainLocationInput' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'first' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'after' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'nfts' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'addresses' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'addresses' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chainLocations' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'chainLocations' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'first' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'first' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'after' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'after' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'tokenId' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'collection' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'location' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'chainId' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'chainType' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'name' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'assetType' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'uri' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'attributes' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'properties' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'InlineFragment',
                              typeCondition: {
                                kind: 'NamedType',
                                name: { kind: 'Name', value: 'NFT721' },
                              },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'owner' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'id' },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'address',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'InlineFragment',
                              typeCondition: {
                                kind: 'NamedType',
                                name: { kind: 'Name', value: 'NFT1155' },
                              },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'balancesOf' },
                                    arguments: [
                                      {
                                        kind: 'Argument',
                                        name: {
                                          kind: 'Name',
                                          value: 'addresses',
                                        },
                                        value: {
                                          kind: 'Variable',
                                          name: {
                                            kind: 'Name',
                                            value: 'addresses',
                                          },
                                        },
                                      },
                                    ],
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'balance',
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: {
                                            kind: 'Name',
                                            value: 'owner',
                                          },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: {
                                                  kind: 'Name',
                                                  value: 'address',
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'pageInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'hasNextPage' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'nextPageCursor' },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<NftsQuery, NftsQueryVariables>
export const GenericTokenDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GenericToken' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'chainLocation' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BlockchainLocationInput' },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'address' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'Address' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'genericToken' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chainLocation' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'chainLocation' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'location' } },
                { kind: 'Field', name: { kind: 'Name', value: 'chainId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'chainType' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'balance' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'address' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'address' },
                      },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'holder' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'address' },
                            },
                          ],
                        },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'amount' },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'symbol' } },
                { kind: 'Field', name: { kind: 'Name', value: 'decimals' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GenericTokenQuery, GenericTokenQueryVariables>
export const GenericTokenBalanceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GenericTokenBalance' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'address' },
          },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Address' } },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'chainLocation' },
          },
          type: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'BlockchainLocationInput' },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'genericTokenBalance' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'address' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'address' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chainLocation' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'chainLocation' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'amount' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GenericTokenBalanceQuery,
  GenericTokenBalanceQueryVariables
>
export const GenericTokenBalancesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GenericTokenBalances' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'chainLocations' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'BlockchainLocationInput' },
              },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'addresses' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'Address' },
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'genericTokenBalances' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'chainLocations' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'chainLocations' },
                },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'addresses' },
                value: {
                  kind: 'Variable',
                  name: { kind: 'Name', value: 'addresses' },
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'edges' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'node' },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'amount' },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'genericToken' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'location' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'chainId' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'chainType' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'symbol' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'decimals' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'holder' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'id' },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'address' },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'id' },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GenericTokenBalancesQuery,
  GenericTokenBalancesQueryVariables
>
