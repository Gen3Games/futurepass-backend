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
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
  /** The `DateTime` scalar type represents a DateTime. The DateTime is serialized as an RFC 3339 quoted string */
  DateTime: any
  /** The `Long` scalar type represents non-fractional signed whole numeric values in string format to prevent lossy conversions */
  Long: any
  ObjectId: any
}

export type DeleteManyPayload = {
  __typename: 'DeleteManyPayload'
  deletedCount: Scalars['Int']
}

export type EthAuthSet = {
  __typename: 'EthAuthSet'
  _id?: Maybe<Scalars['ObjectId']>
  createdAt?: Maybe<Scalars['DateTime']>
  setId?: Maybe<Scalars['Long']>
  setValue?: Maybe<Array<Maybe<Scalars['String']>>>
  updatedAt?: Maybe<Scalars['DateTime']>
}

export type EthAuthSetInsertInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  setId?: InputMaybe<Scalars['Long']>
  setValue?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
}

export type EthAuthSetQueryInput = {
  AND?: InputMaybe<Array<EthAuthSetQueryInput>>
  OR?: InputMaybe<Array<EthAuthSetQueryInput>>
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_exists?: InputMaybe<Scalars['Boolean']>
  _id_gt?: InputMaybe<Scalars['ObjectId']>
  _id_gte?: InputMaybe<Scalars['ObjectId']>
  _id_in?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  _id_lt?: InputMaybe<Scalars['ObjectId']>
  _id_lte?: InputMaybe<Scalars['ObjectId']>
  _id_ne?: InputMaybe<Scalars['ObjectId']>
  _id_nin?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_exists?: InputMaybe<Scalars['Boolean']>
  createdAt_gt?: InputMaybe<Scalars['DateTime']>
  createdAt_gte?: InputMaybe<Scalars['DateTime']>
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  createdAt_lt?: InputMaybe<Scalars['DateTime']>
  createdAt_lte?: InputMaybe<Scalars['DateTime']>
  createdAt_ne?: InputMaybe<Scalars['DateTime']>
  createdAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  setId?: InputMaybe<Scalars['Long']>
  setId_exists?: InputMaybe<Scalars['Boolean']>
  setId_gt?: InputMaybe<Scalars['Long']>
  setId_gte?: InputMaybe<Scalars['Long']>
  setId_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  setId_lt?: InputMaybe<Scalars['Long']>
  setId_lte?: InputMaybe<Scalars['Long']>
  setId_ne?: InputMaybe<Scalars['Long']>
  setId_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  setValue?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  setValue_exists?: InputMaybe<Scalars['Boolean']>
  setValue_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  setValue_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_exists?: InputMaybe<Scalars['Boolean']>
  updatedAt_gt?: InputMaybe<Scalars['DateTime']>
  updatedAt_gte?: InputMaybe<Scalars['DateTime']>
  updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  updatedAt_lt?: InputMaybe<Scalars['DateTime']>
  updatedAt_lte?: InputMaybe<Scalars['DateTime']>
  updatedAt_ne?: InputMaybe<Scalars['DateTime']>
  updatedAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
}

export enum EthAuthSetSortByInput {
  CreatedatAsc = 'CREATEDAT_ASC',
  CreatedatDesc = 'CREATEDAT_DESC',
  SetidAsc = 'SETID_ASC',
  SetidDesc = 'SETID_DESC',
  UpdatedatAsc = 'UPDATEDAT_ASC',
  UpdatedatDesc = 'UPDATEDAT_DESC',
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
}

export type EthAuthSetUpdateInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_unset?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_unset?: InputMaybe<Scalars['Boolean']>
  setId?: InputMaybe<Scalars['Long']>
  setId_unset?: InputMaybe<Scalars['Boolean']>
  setValue?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  setValue_unset?: InputMaybe<Scalars['Boolean']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthDeposit = {
  __typename: 'EthDeposit'
  _id?: Maybe<Scalars['ObjectId']>
  createdAt?: Maybe<Scalars['DateTime']>
  erc20Value?: Maybe<EthDepositErc20Value>
  erc721Value?: Maybe<Array<Maybe<EthDepositErc721Value>>>
  ethHash?: Maybe<Scalars['String']>
  ethValue?: Maybe<EthDepositEthValue>
  extrinsicId?: Maybe<Scalars['String']>
  from?: Maybe<Scalars['String']>
  messageData?: Maybe<Scalars['String']>
  messageFee?: Maybe<Scalars['String']>
  messageId?: Maybe<Scalars['Long']>
  status?: Maybe<Scalars['String']>
  to?: Maybe<Scalars['String']>
  updatedAt?: Maybe<Scalars['DateTime']>
}

export type EthDepositErc20Value = {
  __typename: 'EthDepositErc20Value'
  amount?: Maybe<Scalars['String']>
  tokenAddress?: Maybe<Scalars['String']>
}

export type EthDepositErc20ValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenAddress?: InputMaybe<Scalars['String']>
}

export type EthDepositErc20ValueQueryInput = {
  AND?: InputMaybe<Array<EthDepositErc20ValueQueryInput>>
  OR?: InputMaybe<Array<EthDepositErc20ValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthDepositErc20ValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthDepositErc721Value = {
  __typename: 'EthDepositErc721Value'
  tokenAddress?: Maybe<Scalars['String']>
  tokenIds?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type EthDepositErc721ValueInsertInput = {
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthDepositErc721ValueQueryInput = {
  AND?: InputMaybe<Array<EthDepositErc721ValueQueryInput>>
  OR?: InputMaybe<Array<EthDepositErc721ValueQueryInput>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_exists?: InputMaybe<Scalars['Boolean']>
  tokenIds_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthDepositErc721ValueUpdateInput = {
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthDepositEthValue = {
  __typename: 'EthDepositEthValue'
  amount?: Maybe<Scalars['String']>
  tokenAddress?: Maybe<Scalars['String']>
}

export type EthDepositEthValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenAddress?: InputMaybe<Scalars['String']>
}

export type EthDepositEthValueQueryInput = {
  AND?: InputMaybe<Array<EthDepositEthValueQueryInput>>
  OR?: InputMaybe<Array<EthDepositEthValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthDepositEthValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthDepositInsertInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  erc20Value?: InputMaybe<EthDepositErc20ValueInsertInput>
  erc721Value?: InputMaybe<Array<InputMaybe<EthDepositErc721ValueInsertInput>>>
  ethHash?: InputMaybe<Scalars['String']>
  ethValue?: InputMaybe<EthDepositEthValueInsertInput>
  extrinsicId?: InputMaybe<Scalars['String']>
  from?: InputMaybe<Scalars['String']>
  messageData?: InputMaybe<Scalars['String']>
  messageFee?: InputMaybe<Scalars['String']>
  messageId?: InputMaybe<Scalars['Long']>
  status?: InputMaybe<Scalars['String']>
  to?: InputMaybe<Scalars['String']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
}

export type EthDepositQueryInput = {
  AND?: InputMaybe<Array<EthDepositQueryInput>>
  OR?: InputMaybe<Array<EthDepositQueryInput>>
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_exists?: InputMaybe<Scalars['Boolean']>
  _id_gt?: InputMaybe<Scalars['ObjectId']>
  _id_gte?: InputMaybe<Scalars['ObjectId']>
  _id_in?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  _id_lt?: InputMaybe<Scalars['ObjectId']>
  _id_lte?: InputMaybe<Scalars['ObjectId']>
  _id_ne?: InputMaybe<Scalars['ObjectId']>
  _id_nin?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_exists?: InputMaybe<Scalars['Boolean']>
  createdAt_gt?: InputMaybe<Scalars['DateTime']>
  createdAt_gte?: InputMaybe<Scalars['DateTime']>
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  createdAt_lt?: InputMaybe<Scalars['DateTime']>
  createdAt_lte?: InputMaybe<Scalars['DateTime']>
  createdAt_ne?: InputMaybe<Scalars['DateTime']>
  createdAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  erc20Value?: InputMaybe<EthDepositErc20ValueQueryInput>
  erc20Value_exists?: InputMaybe<Scalars['Boolean']>
  erc721Value?: InputMaybe<Array<InputMaybe<EthDepositErc721ValueQueryInput>>>
  erc721Value_exists?: InputMaybe<Scalars['Boolean']>
  erc721Value_in?: InputMaybe<
    Array<InputMaybe<EthDepositErc721ValueQueryInput>>
  >
  erc721Value_nin?: InputMaybe<
    Array<InputMaybe<EthDepositErc721ValueQueryInput>>
  >
  ethHash?: InputMaybe<Scalars['String']>
  ethHash_exists?: InputMaybe<Scalars['Boolean']>
  ethHash_gt?: InputMaybe<Scalars['String']>
  ethHash_gte?: InputMaybe<Scalars['String']>
  ethHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  ethHash_lt?: InputMaybe<Scalars['String']>
  ethHash_lte?: InputMaybe<Scalars['String']>
  ethHash_ne?: InputMaybe<Scalars['String']>
  ethHash_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  ethValue?: InputMaybe<EthDepositEthValueQueryInput>
  ethValue_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId_gt?: InputMaybe<Scalars['String']>
  extrinsicId_gte?: InputMaybe<Scalars['String']>
  extrinsicId_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  extrinsicId_lt?: InputMaybe<Scalars['String']>
  extrinsicId_lte?: InputMaybe<Scalars['String']>
  extrinsicId_ne?: InputMaybe<Scalars['String']>
  extrinsicId_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from?: InputMaybe<Scalars['String']>
  from_exists?: InputMaybe<Scalars['Boolean']>
  from_gt?: InputMaybe<Scalars['String']>
  from_gte?: InputMaybe<Scalars['String']>
  from_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from_lt?: InputMaybe<Scalars['String']>
  from_lte?: InputMaybe<Scalars['String']>
  from_ne?: InputMaybe<Scalars['String']>
  from_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  messageData?: InputMaybe<Scalars['String']>
  messageData_exists?: InputMaybe<Scalars['Boolean']>
  messageData_gt?: InputMaybe<Scalars['String']>
  messageData_gte?: InputMaybe<Scalars['String']>
  messageData_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  messageData_lt?: InputMaybe<Scalars['String']>
  messageData_lte?: InputMaybe<Scalars['String']>
  messageData_ne?: InputMaybe<Scalars['String']>
  messageData_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  messageFee?: InputMaybe<Scalars['String']>
  messageFee_exists?: InputMaybe<Scalars['Boolean']>
  messageFee_gt?: InputMaybe<Scalars['String']>
  messageFee_gte?: InputMaybe<Scalars['String']>
  messageFee_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  messageFee_lt?: InputMaybe<Scalars['String']>
  messageFee_lte?: InputMaybe<Scalars['String']>
  messageFee_ne?: InputMaybe<Scalars['String']>
  messageFee_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  messageId?: InputMaybe<Scalars['Long']>
  messageId_exists?: InputMaybe<Scalars['Boolean']>
  messageId_gt?: InputMaybe<Scalars['Long']>
  messageId_gte?: InputMaybe<Scalars['Long']>
  messageId_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  messageId_lt?: InputMaybe<Scalars['Long']>
  messageId_lte?: InputMaybe<Scalars['Long']>
  messageId_ne?: InputMaybe<Scalars['Long']>
  messageId_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  status?: InputMaybe<Scalars['String']>
  status_exists?: InputMaybe<Scalars['Boolean']>
  status_gt?: InputMaybe<Scalars['String']>
  status_gte?: InputMaybe<Scalars['String']>
  status_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status_lt?: InputMaybe<Scalars['String']>
  status_lte?: InputMaybe<Scalars['String']>
  status_ne?: InputMaybe<Scalars['String']>
  status_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to?: InputMaybe<Scalars['String']>
  to_exists?: InputMaybe<Scalars['Boolean']>
  to_gt?: InputMaybe<Scalars['String']>
  to_gte?: InputMaybe<Scalars['String']>
  to_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to_lt?: InputMaybe<Scalars['String']>
  to_lte?: InputMaybe<Scalars['String']>
  to_ne?: InputMaybe<Scalars['String']>
  to_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_exists?: InputMaybe<Scalars['Boolean']>
  updatedAt_gt?: InputMaybe<Scalars['DateTime']>
  updatedAt_gte?: InputMaybe<Scalars['DateTime']>
  updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  updatedAt_lt?: InputMaybe<Scalars['DateTime']>
  updatedAt_lte?: InputMaybe<Scalars['DateTime']>
  updatedAt_ne?: InputMaybe<Scalars['DateTime']>
  updatedAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
}

export enum EthDepositSortByInput {
  CreatedatAsc = 'CREATEDAT_ASC',
  CreatedatDesc = 'CREATEDAT_DESC',
  EthhashAsc = 'ETHHASH_ASC',
  EthhashDesc = 'ETHHASH_DESC',
  ExtrinsicidAsc = 'EXTRINSICID_ASC',
  ExtrinsicidDesc = 'EXTRINSICID_DESC',
  FromAsc = 'FROM_ASC',
  FromDesc = 'FROM_DESC',
  MessagedataAsc = 'MESSAGEDATA_ASC',
  MessagedataDesc = 'MESSAGEDATA_DESC',
  MessagefeeAsc = 'MESSAGEFEE_ASC',
  MessagefeeDesc = 'MESSAGEFEE_DESC',
  MessageidAsc = 'MESSAGEID_ASC',
  MessageidDesc = 'MESSAGEID_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  ToAsc = 'TO_ASC',
  ToDesc = 'TO_DESC',
  UpdatedatAsc = 'UPDATEDAT_ASC',
  UpdatedatDesc = 'UPDATEDAT_DESC',
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
}

export type EthDepositUpdateInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_unset?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_unset?: InputMaybe<Scalars['Boolean']>
  erc20Value?: InputMaybe<EthDepositErc20ValueUpdateInput>
  erc20Value_unset?: InputMaybe<Scalars['Boolean']>
  erc721Value?: InputMaybe<Array<InputMaybe<EthDepositErc721ValueUpdateInput>>>
  erc721Value_unset?: InputMaybe<Scalars['Boolean']>
  ethHash?: InputMaybe<Scalars['String']>
  ethHash_unset?: InputMaybe<Scalars['Boolean']>
  ethValue?: InputMaybe<EthDepositEthValueUpdateInput>
  ethValue_unset?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_unset?: InputMaybe<Scalars['Boolean']>
  from?: InputMaybe<Scalars['String']>
  from_unset?: InputMaybe<Scalars['Boolean']>
  messageData?: InputMaybe<Scalars['String']>
  messageData_unset?: InputMaybe<Scalars['Boolean']>
  messageFee?: InputMaybe<Scalars['String']>
  messageFee_unset?: InputMaybe<Scalars['Boolean']>
  messageId?: InputMaybe<Scalars['Long']>
  messageId_unset?: InputMaybe<Scalars['Boolean']>
  status?: InputMaybe<Scalars['String']>
  status_unset?: InputMaybe<Scalars['Boolean']>
  to?: InputMaybe<Scalars['String']>
  to_unset?: InputMaybe<Scalars['Boolean']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawal = {
  __typename: 'EthWithdrawal'
  _id?: Maybe<Scalars['ObjectId']>
  createdAt?: Maybe<Scalars['DateTime']>
  erc20Value?: Maybe<EthWithdrawalErc20Value>
  erc721Value?: Maybe<Array<Maybe<EthWithdrawalErc721Value>>>
  ethHash?: Maybe<Scalars['String']>
  ethValue?: Maybe<EthWithdrawalEthValue>
  eventAuthSetId?: Maybe<EthAuthSet>
  eventId?: Maybe<Scalars['Long']>
  eventInfo?: Maybe<EthWithdrawalEventInfo>
  eventSignature?: Maybe<EthWithdrawalEventSignature>
  extrinsicId?: Maybe<Scalars['String']>
  from?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
  to?: Maybe<Scalars['String']>
  updatedAt?: Maybe<Scalars['DateTime']>
}

export type EthWithdrawalErc20Value = {
  __typename: 'EthWithdrawalErc20Value'
  amount?: Maybe<Scalars['String']>
  tokenAddress?: Maybe<Scalars['String']>
}

export type EthWithdrawalErc20ValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenAddress?: InputMaybe<Scalars['String']>
}

export type EthWithdrawalErc20ValueQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalErc20ValueQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalErc20ValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthWithdrawalErc20ValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawalErc721Value = {
  __typename: 'EthWithdrawalErc721Value'
  tokenAddress?: Maybe<Scalars['String']>
  tokenIds?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type EthWithdrawalErc721ValueInsertInput = {
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthWithdrawalErc721ValueQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalErc721ValueQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalErc721ValueQueryInput>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_exists?: InputMaybe<Scalars['Boolean']>
  tokenIds_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthWithdrawalErc721ValueUpdateInput = {
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
  tokenIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenIds_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawalEthValue = {
  __typename: 'EthWithdrawalEthValue'
  amount?: Maybe<Scalars['String']>
  tokenAddress?: Maybe<Scalars['String']>
}

export type EthWithdrawalEthValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenAddress?: InputMaybe<Scalars['String']>
}

export type EthWithdrawalEthValueQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalEthValueQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalEthValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_exists?: InputMaybe<Scalars['Boolean']>
  tokenAddress_gt?: InputMaybe<Scalars['String']>
  tokenAddress_gte?: InputMaybe<Scalars['String']>
  tokenAddress_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenAddress_lt?: InputMaybe<Scalars['String']>
  tokenAddress_lte?: InputMaybe<Scalars['String']>
  tokenAddress_ne?: InputMaybe<Scalars['String']>
  tokenAddress_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthWithdrawalEthValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenAddress?: InputMaybe<Scalars['String']>
  tokenAddress_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawalEventAuthSetIdRelationInput = {
  create?: InputMaybe<EthAuthSetInsertInput>
  link?: InputMaybe<Scalars['Long']>
}

export type EthWithdrawalEventInfo = {
  __typename: 'EthWithdrawalEventInfo'
  destination?: Maybe<Scalars['String']>
  message?: Maybe<Scalars['String']>
  source?: Maybe<Scalars['String']>
}

export type EthWithdrawalEventInfoInsertInput = {
  destination?: InputMaybe<Scalars['String']>
  message?: InputMaybe<Scalars['String']>
  source?: InputMaybe<Scalars['String']>
}

export type EthWithdrawalEventInfoQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalEventInfoQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalEventInfoQueryInput>>
  destination?: InputMaybe<Scalars['String']>
  destination_exists?: InputMaybe<Scalars['Boolean']>
  destination_gt?: InputMaybe<Scalars['String']>
  destination_gte?: InputMaybe<Scalars['String']>
  destination_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  destination_lt?: InputMaybe<Scalars['String']>
  destination_lte?: InputMaybe<Scalars['String']>
  destination_ne?: InputMaybe<Scalars['String']>
  destination_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  message?: InputMaybe<Scalars['String']>
  message_exists?: InputMaybe<Scalars['Boolean']>
  message_gt?: InputMaybe<Scalars['String']>
  message_gte?: InputMaybe<Scalars['String']>
  message_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  message_lt?: InputMaybe<Scalars['String']>
  message_lte?: InputMaybe<Scalars['String']>
  message_ne?: InputMaybe<Scalars['String']>
  message_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  source?: InputMaybe<Scalars['String']>
  source_exists?: InputMaybe<Scalars['Boolean']>
  source_gt?: InputMaybe<Scalars['String']>
  source_gte?: InputMaybe<Scalars['String']>
  source_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  source_lt?: InputMaybe<Scalars['String']>
  source_lte?: InputMaybe<Scalars['String']>
  source_ne?: InputMaybe<Scalars['String']>
  source_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type EthWithdrawalEventInfoUpdateInput = {
  destination?: InputMaybe<Scalars['String']>
  destination_unset?: InputMaybe<Scalars['Boolean']>
  message?: InputMaybe<Scalars['String']>
  message_unset?: InputMaybe<Scalars['Boolean']>
  source?: InputMaybe<Scalars['String']>
  source_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawalEventSignature = {
  __typename: 'EthWithdrawalEventSignature'
  r?: Maybe<Array<Maybe<Scalars['String']>>>
  s?: Maybe<Array<Maybe<Scalars['String']>>>
  v?: Maybe<Array<Maybe<Scalars['Long']>>>
}

export type EthWithdrawalEventSignatureInsertInput = {
  r?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  s?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  v?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
}

export type EthWithdrawalEventSignatureQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalEventSignatureQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalEventSignatureQueryInput>>
  r?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  r_exists?: InputMaybe<Scalars['Boolean']>
  r_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  r_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  s?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  s_exists?: InputMaybe<Scalars['Boolean']>
  s_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  s_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  v?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  v_exists?: InputMaybe<Scalars['Boolean']>
  v_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  v_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
}

export type EthWithdrawalEventSignatureUpdateInput = {
  r?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  r_unset?: InputMaybe<Scalars['Boolean']>
  s?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  s_unset?: InputMaybe<Scalars['Boolean']>
  v?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  v_unset?: InputMaybe<Scalars['Boolean']>
}

export type EthWithdrawalInsertInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  erc20Value?: InputMaybe<EthWithdrawalErc20ValueInsertInput>
  erc721Value?: InputMaybe<
    Array<InputMaybe<EthWithdrawalErc721ValueInsertInput>>
  >
  ethHash?: InputMaybe<Scalars['String']>
  ethValue?: InputMaybe<EthWithdrawalEthValueInsertInput>
  eventAuthSetId?: InputMaybe<EthWithdrawalEventAuthSetIdRelationInput>
  eventId?: InputMaybe<Scalars['Long']>
  eventInfo?: InputMaybe<EthWithdrawalEventInfoInsertInput>
  eventSignature?: InputMaybe<EthWithdrawalEventSignatureInsertInput>
  extrinsicId?: InputMaybe<Scalars['String']>
  from?: InputMaybe<Scalars['String']>
  status?: InputMaybe<Scalars['String']>
  to?: InputMaybe<Scalars['String']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
}

export type EthWithdrawalQueryInput = {
  AND?: InputMaybe<Array<EthWithdrawalQueryInput>>
  OR?: InputMaybe<Array<EthWithdrawalQueryInput>>
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_exists?: InputMaybe<Scalars['Boolean']>
  _id_gt?: InputMaybe<Scalars['ObjectId']>
  _id_gte?: InputMaybe<Scalars['ObjectId']>
  _id_in?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  _id_lt?: InputMaybe<Scalars['ObjectId']>
  _id_lte?: InputMaybe<Scalars['ObjectId']>
  _id_ne?: InputMaybe<Scalars['ObjectId']>
  _id_nin?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_exists?: InputMaybe<Scalars['Boolean']>
  createdAt_gt?: InputMaybe<Scalars['DateTime']>
  createdAt_gte?: InputMaybe<Scalars['DateTime']>
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  createdAt_lt?: InputMaybe<Scalars['DateTime']>
  createdAt_lte?: InputMaybe<Scalars['DateTime']>
  createdAt_ne?: InputMaybe<Scalars['DateTime']>
  createdAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  erc20Value?: InputMaybe<EthWithdrawalErc20ValueQueryInput>
  erc20Value_exists?: InputMaybe<Scalars['Boolean']>
  erc721Value?: InputMaybe<
    Array<InputMaybe<EthWithdrawalErc721ValueQueryInput>>
  >
  erc721Value_exists?: InputMaybe<Scalars['Boolean']>
  erc721Value_in?: InputMaybe<
    Array<InputMaybe<EthWithdrawalErc721ValueQueryInput>>
  >
  erc721Value_nin?: InputMaybe<
    Array<InputMaybe<EthWithdrawalErc721ValueQueryInput>>
  >
  ethHash?: InputMaybe<Scalars['String']>
  ethHash_exists?: InputMaybe<Scalars['Boolean']>
  ethHash_gt?: InputMaybe<Scalars['String']>
  ethHash_gte?: InputMaybe<Scalars['String']>
  ethHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  ethHash_lt?: InputMaybe<Scalars['String']>
  ethHash_lte?: InputMaybe<Scalars['String']>
  ethHash_ne?: InputMaybe<Scalars['String']>
  ethHash_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  ethValue?: InputMaybe<EthWithdrawalEthValueQueryInput>
  ethValue_exists?: InputMaybe<Scalars['Boolean']>
  eventAuthSetId?: InputMaybe<EthAuthSetQueryInput>
  eventAuthSetId_exists?: InputMaybe<Scalars['Boolean']>
  eventId?: InputMaybe<Scalars['Long']>
  eventId_exists?: InputMaybe<Scalars['Boolean']>
  eventId_gt?: InputMaybe<Scalars['Long']>
  eventId_gte?: InputMaybe<Scalars['Long']>
  eventId_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  eventId_lt?: InputMaybe<Scalars['Long']>
  eventId_lte?: InputMaybe<Scalars['Long']>
  eventId_ne?: InputMaybe<Scalars['Long']>
  eventId_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  eventInfo?: InputMaybe<EthWithdrawalEventInfoQueryInput>
  eventInfo_exists?: InputMaybe<Scalars['Boolean']>
  eventSignature?: InputMaybe<EthWithdrawalEventSignatureQueryInput>
  eventSignature_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId_gt?: InputMaybe<Scalars['String']>
  extrinsicId_gte?: InputMaybe<Scalars['String']>
  extrinsicId_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  extrinsicId_lt?: InputMaybe<Scalars['String']>
  extrinsicId_lte?: InputMaybe<Scalars['String']>
  extrinsicId_ne?: InputMaybe<Scalars['String']>
  extrinsicId_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from?: InputMaybe<Scalars['String']>
  from_exists?: InputMaybe<Scalars['Boolean']>
  from_gt?: InputMaybe<Scalars['String']>
  from_gte?: InputMaybe<Scalars['String']>
  from_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from_lt?: InputMaybe<Scalars['String']>
  from_lte?: InputMaybe<Scalars['String']>
  from_ne?: InputMaybe<Scalars['String']>
  from_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status?: InputMaybe<Scalars['String']>
  status_exists?: InputMaybe<Scalars['Boolean']>
  status_gt?: InputMaybe<Scalars['String']>
  status_gte?: InputMaybe<Scalars['String']>
  status_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status_lt?: InputMaybe<Scalars['String']>
  status_lte?: InputMaybe<Scalars['String']>
  status_ne?: InputMaybe<Scalars['String']>
  status_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to?: InputMaybe<Scalars['String']>
  to_exists?: InputMaybe<Scalars['Boolean']>
  to_gt?: InputMaybe<Scalars['String']>
  to_gte?: InputMaybe<Scalars['String']>
  to_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to_lt?: InputMaybe<Scalars['String']>
  to_lte?: InputMaybe<Scalars['String']>
  to_ne?: InputMaybe<Scalars['String']>
  to_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_exists?: InputMaybe<Scalars['Boolean']>
  updatedAt_gt?: InputMaybe<Scalars['DateTime']>
  updatedAt_gte?: InputMaybe<Scalars['DateTime']>
  updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  updatedAt_lt?: InputMaybe<Scalars['DateTime']>
  updatedAt_lte?: InputMaybe<Scalars['DateTime']>
  updatedAt_ne?: InputMaybe<Scalars['DateTime']>
  updatedAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
}

export enum EthWithdrawalSortByInput {
  CreatedatAsc = 'CREATEDAT_ASC',
  CreatedatDesc = 'CREATEDAT_DESC',
  EthhashAsc = 'ETHHASH_ASC',
  EthhashDesc = 'ETHHASH_DESC',
  EventauthsetidAsc = 'EVENTAUTHSETID_ASC',
  EventauthsetidDesc = 'EVENTAUTHSETID_DESC',
  EventidAsc = 'EVENTID_ASC',
  EventidDesc = 'EVENTID_DESC',
  ExtrinsicidAsc = 'EXTRINSICID_ASC',
  ExtrinsicidDesc = 'EXTRINSICID_DESC',
  FromAsc = 'FROM_ASC',
  FromDesc = 'FROM_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  ToAsc = 'TO_ASC',
  ToDesc = 'TO_DESC',
  UpdatedatAsc = 'UPDATEDAT_ASC',
  UpdatedatDesc = 'UPDATEDAT_DESC',
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
}

export type EthWithdrawalUpdateInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_unset?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_unset?: InputMaybe<Scalars['Boolean']>
  erc20Value?: InputMaybe<EthWithdrawalErc20ValueUpdateInput>
  erc20Value_unset?: InputMaybe<Scalars['Boolean']>
  erc721Value?: InputMaybe<
    Array<InputMaybe<EthWithdrawalErc721ValueUpdateInput>>
  >
  erc721Value_unset?: InputMaybe<Scalars['Boolean']>
  ethHash?: InputMaybe<Scalars['String']>
  ethHash_unset?: InputMaybe<Scalars['Boolean']>
  ethValue?: InputMaybe<EthWithdrawalEthValueUpdateInput>
  ethValue_unset?: InputMaybe<Scalars['Boolean']>
  eventAuthSetId?: InputMaybe<EthWithdrawalEventAuthSetIdRelationInput>
  eventAuthSetId_unset?: InputMaybe<Scalars['Boolean']>
  eventId?: InputMaybe<Scalars['Long']>
  eventId_unset?: InputMaybe<Scalars['Boolean']>
  eventInfo?: InputMaybe<EthWithdrawalEventInfoUpdateInput>
  eventInfo_unset?: InputMaybe<Scalars['Boolean']>
  eventSignature?: InputMaybe<EthWithdrawalEventSignatureUpdateInput>
  eventSignature_unset?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_unset?: InputMaybe<Scalars['Boolean']>
  from?: InputMaybe<Scalars['String']>
  from_unset?: InputMaybe<Scalars['Boolean']>
  status?: InputMaybe<Scalars['String']>
  status_unset?: InputMaybe<Scalars['Boolean']>
  to?: InputMaybe<Scalars['String']>
  to_unset?: InputMaybe<Scalars['Boolean']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_unset?: InputMaybe<Scalars['Boolean']>
}

export type InsertManyPayload = {
  __typename: 'InsertManyPayload'
  insertedIds: Array<Maybe<Scalars['ObjectId']>>
}

export type Mutation = {
  __typename: 'Mutation'
  deleteManyEthAuthSets?: Maybe<DeleteManyPayload>
  deleteManyEthDeposits?: Maybe<DeleteManyPayload>
  deleteManyEthWithdrawals?: Maybe<DeleteManyPayload>
  deleteManyXrplDeposits?: Maybe<DeleteManyPayload>
  deleteManyXrplWithdrawals?: Maybe<DeleteManyPayload>
  deleteOneEthAuthSet?: Maybe<EthAuthSet>
  deleteOneEthDeposit?: Maybe<EthDeposit>
  deleteOneEthWithdrawal?: Maybe<EthWithdrawal>
  deleteOneXrplDeposit?: Maybe<XrplDeposit>
  deleteOneXrplWithdrawal?: Maybe<XrplWithdrawal>
  insertManyEthAuthSets?: Maybe<InsertManyPayload>
  insertManyEthDeposits?: Maybe<InsertManyPayload>
  insertManyEthWithdrawals?: Maybe<InsertManyPayload>
  insertManyXrplDeposits?: Maybe<InsertManyPayload>
  insertManyXrplWithdrawals?: Maybe<InsertManyPayload>
  insertOneEthAuthSet?: Maybe<EthAuthSet>
  insertOneEthDeposit?: Maybe<EthDeposit>
  insertOneEthWithdrawal?: Maybe<EthWithdrawal>
  insertOneXrplDeposit?: Maybe<XrplDeposit>
  insertOneXrplWithdrawal?: Maybe<XrplWithdrawal>
  replaceOneEthAuthSet?: Maybe<EthAuthSet>
  replaceOneEthDeposit?: Maybe<EthDeposit>
  replaceOneEthWithdrawal?: Maybe<EthWithdrawal>
  replaceOneXrplDeposit?: Maybe<XrplDeposit>
  replaceOneXrplWithdrawal?: Maybe<XrplWithdrawal>
  updateManyEthAuthSets?: Maybe<UpdateManyPayload>
  updateManyEthDeposits?: Maybe<UpdateManyPayload>
  updateManyEthWithdrawals?: Maybe<UpdateManyPayload>
  updateManyXrplDeposits?: Maybe<UpdateManyPayload>
  updateManyXrplWithdrawals?: Maybe<UpdateManyPayload>
  updateOneEthAuthSet?: Maybe<EthAuthSet>
  updateOneEthDeposit?: Maybe<EthDeposit>
  updateOneEthWithdrawal?: Maybe<EthWithdrawal>
  updateOneXrplDeposit?: Maybe<XrplDeposit>
  updateOneXrplWithdrawal?: Maybe<XrplWithdrawal>
  upsertOneEthAuthSet?: Maybe<EthAuthSet>
  upsertOneEthDeposit?: Maybe<EthDeposit>
  upsertOneEthWithdrawal?: Maybe<EthWithdrawal>
  upsertOneXrplDeposit?: Maybe<XrplDeposit>
  upsertOneXrplWithdrawal?: Maybe<XrplWithdrawal>
}

export type MutationDeleteManyEthAuthSetsArgs = {
  query?: InputMaybe<EthAuthSetQueryInput>
}

export type MutationDeleteManyEthDepositsArgs = {
  query?: InputMaybe<EthDepositQueryInput>
}

export type MutationDeleteManyEthWithdrawalsArgs = {
  query?: InputMaybe<EthWithdrawalQueryInput>
}

export type MutationDeleteManyXrplDepositsArgs = {
  query?: InputMaybe<XrplDepositQueryInput>
}

export type MutationDeleteManyXrplWithdrawalsArgs = {
  query?: InputMaybe<XrplWithdrawalQueryInput>
}

export type MutationDeleteOneEthAuthSetArgs = {
  query: EthAuthSetQueryInput
}

export type MutationDeleteOneEthDepositArgs = {
  query: EthDepositQueryInput
}

export type MutationDeleteOneEthWithdrawalArgs = {
  query: EthWithdrawalQueryInput
}

export type MutationDeleteOneXrplDepositArgs = {
  query: XrplDepositQueryInput
}

export type MutationDeleteOneXrplWithdrawalArgs = {
  query: XrplWithdrawalQueryInput
}

export type MutationInsertManyEthAuthSetsArgs = {
  data: Array<EthAuthSetInsertInput>
}

export type MutationInsertManyEthDepositsArgs = {
  data: Array<EthDepositInsertInput>
}

export type MutationInsertManyEthWithdrawalsArgs = {
  data: Array<EthWithdrawalInsertInput>
}

export type MutationInsertManyXrplDepositsArgs = {
  data: Array<XrplDepositInsertInput>
}

export type MutationInsertManyXrplWithdrawalsArgs = {
  data: Array<XrplWithdrawalInsertInput>
}

export type MutationInsertOneEthAuthSetArgs = {
  data: EthAuthSetInsertInput
}

export type MutationInsertOneEthDepositArgs = {
  data: EthDepositInsertInput
}

export type MutationInsertOneEthWithdrawalArgs = {
  data: EthWithdrawalInsertInput
}

export type MutationInsertOneXrplDepositArgs = {
  data: XrplDepositInsertInput
}

export type MutationInsertOneXrplWithdrawalArgs = {
  data: XrplWithdrawalInsertInput
}

export type MutationReplaceOneEthAuthSetArgs = {
  data: EthAuthSetInsertInput
  query?: InputMaybe<EthAuthSetQueryInput>
}

export type MutationReplaceOneEthDepositArgs = {
  data: EthDepositInsertInput
  query?: InputMaybe<EthDepositQueryInput>
}

export type MutationReplaceOneEthWithdrawalArgs = {
  data: EthWithdrawalInsertInput
  query?: InputMaybe<EthWithdrawalQueryInput>
}

export type MutationReplaceOneXrplDepositArgs = {
  data: XrplDepositInsertInput
  query?: InputMaybe<XrplDepositQueryInput>
}

export type MutationReplaceOneXrplWithdrawalArgs = {
  data: XrplWithdrawalInsertInput
  query?: InputMaybe<XrplWithdrawalQueryInput>
}

export type MutationUpdateManyEthAuthSetsArgs = {
  query?: InputMaybe<EthAuthSetQueryInput>
  set: EthAuthSetUpdateInput
}

export type MutationUpdateManyEthDepositsArgs = {
  query?: InputMaybe<EthDepositQueryInput>
  set: EthDepositUpdateInput
}

export type MutationUpdateManyEthWithdrawalsArgs = {
  query?: InputMaybe<EthWithdrawalQueryInput>
  set: EthWithdrawalUpdateInput
}

export type MutationUpdateManyXrplDepositsArgs = {
  query?: InputMaybe<XrplDepositQueryInput>
  set: XrplDepositUpdateInput
}

export type MutationUpdateManyXrplWithdrawalsArgs = {
  query?: InputMaybe<XrplWithdrawalQueryInput>
  set: XrplWithdrawalUpdateInput
}

export type MutationUpdateOneEthAuthSetArgs = {
  query?: InputMaybe<EthAuthSetQueryInput>
  set: EthAuthSetUpdateInput
}

export type MutationUpdateOneEthDepositArgs = {
  query?: InputMaybe<EthDepositQueryInput>
  set: EthDepositUpdateInput
}

export type MutationUpdateOneEthWithdrawalArgs = {
  query?: InputMaybe<EthWithdrawalQueryInput>
  set: EthWithdrawalUpdateInput
}

export type MutationUpdateOneXrplDepositArgs = {
  query?: InputMaybe<XrplDepositQueryInput>
  set: XrplDepositUpdateInput
}

export type MutationUpdateOneXrplWithdrawalArgs = {
  query?: InputMaybe<XrplWithdrawalQueryInput>
  set: XrplWithdrawalUpdateInput
}

export type MutationUpsertOneEthAuthSetArgs = {
  data: EthAuthSetInsertInput
  query?: InputMaybe<EthAuthSetQueryInput>
}

export type MutationUpsertOneEthDepositArgs = {
  data: EthDepositInsertInput
  query?: InputMaybe<EthDepositQueryInput>
}

export type MutationUpsertOneEthWithdrawalArgs = {
  data: EthWithdrawalInsertInput
  query?: InputMaybe<EthWithdrawalQueryInput>
}

export type MutationUpsertOneXrplDepositArgs = {
  data: XrplDepositInsertInput
  query?: InputMaybe<XrplDepositQueryInput>
}

export type MutationUpsertOneXrplWithdrawalArgs = {
  data: XrplWithdrawalInsertInput
  query?: InputMaybe<XrplWithdrawalQueryInput>
}

export type Query = {
  __typename: 'Query'
  ethAuthSet?: Maybe<EthAuthSet>
  ethAuthSets: Array<Maybe<EthAuthSet>>
  ethDeposit?: Maybe<EthDeposit>
  ethDeposits: Array<Maybe<EthDeposit>>
  ethWithdrawal?: Maybe<EthWithdrawal>
  ethWithdrawals: Array<Maybe<EthWithdrawal>>
  xrplDeposit?: Maybe<XrplDeposit>
  xrplDeposits: Array<Maybe<XrplDeposit>>
  xrplWithdrawal?: Maybe<XrplWithdrawal>
  xrplWithdrawals: Array<Maybe<XrplWithdrawal>>
}

export type QueryEthAuthSetArgs = {
  query?: InputMaybe<EthAuthSetQueryInput>
}

export type QueryEthAuthSetsArgs = {
  limit?: InputMaybe<Scalars['Int']>
  query?: InputMaybe<EthAuthSetQueryInput>
  sortBy?: InputMaybe<EthAuthSetSortByInput>
}

export type QueryEthDepositArgs = {
  query?: InputMaybe<EthDepositQueryInput>
}

export type QueryEthDepositsArgs = {
  limit?: InputMaybe<Scalars['Int']>
  query?: InputMaybe<EthDepositQueryInput>
  sortBy?: InputMaybe<EthDepositSortByInput>
}

export type QueryEthWithdrawalArgs = {
  query?: InputMaybe<EthWithdrawalQueryInput>
}

export type QueryEthWithdrawalsArgs = {
  limit?: InputMaybe<Scalars['Int']>
  query?: InputMaybe<EthWithdrawalQueryInput>
  sortBy?: InputMaybe<EthWithdrawalSortByInput>
}

export type QueryXrplDepositArgs = {
  query?: InputMaybe<XrplDepositQueryInput>
}

export type QueryXrplDepositsArgs = {
  limit?: InputMaybe<Scalars['Int']>
  query?: InputMaybe<XrplDepositQueryInput>
  sortBy?: InputMaybe<XrplDepositSortByInput>
}

export type QueryXrplWithdrawalArgs = {
  query?: InputMaybe<XrplWithdrawalQueryInput>
}

export type QueryXrplWithdrawalsArgs = {
  limit?: InputMaybe<Scalars['Int']>
  query?: InputMaybe<XrplWithdrawalQueryInput>
  sortBy?: InputMaybe<XrplWithdrawalSortByInput>
}

export type UpdateManyPayload = {
  __typename: 'UpdateManyPayload'
  matchedCount: Scalars['Int']
  modifiedCount: Scalars['Int']
}

export type XrplDeposit = {
  __typename: 'XrplDeposit'
  _id?: Maybe<Scalars['ObjectId']>
  createdAt?: Maybe<Scalars['DateTime']>
  extrinsicId?: Maybe<Scalars['String']>
  from?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
  to?: Maybe<Scalars['String']>
  updatedAt?: Maybe<Scalars['DateTime']>
  xrpValue?: Maybe<XrplDepositXrpValue>
  xrplHash?: Maybe<Scalars['String']>
}

export type XrplDepositInsertInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  extrinsicId?: InputMaybe<Scalars['String']>
  from?: InputMaybe<Scalars['String']>
  status?: InputMaybe<Scalars['String']>
  to?: InputMaybe<Scalars['String']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  xrpValue?: InputMaybe<XrplDepositXrpValueInsertInput>
  xrplHash?: InputMaybe<Scalars['String']>
}

export type XrplDepositQueryInput = {
  AND?: InputMaybe<Array<XrplDepositQueryInput>>
  OR?: InputMaybe<Array<XrplDepositQueryInput>>
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_exists?: InputMaybe<Scalars['Boolean']>
  _id_gt?: InputMaybe<Scalars['ObjectId']>
  _id_gte?: InputMaybe<Scalars['ObjectId']>
  _id_in?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  _id_lt?: InputMaybe<Scalars['ObjectId']>
  _id_lte?: InputMaybe<Scalars['ObjectId']>
  _id_ne?: InputMaybe<Scalars['ObjectId']>
  _id_nin?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_exists?: InputMaybe<Scalars['Boolean']>
  createdAt_gt?: InputMaybe<Scalars['DateTime']>
  createdAt_gte?: InputMaybe<Scalars['DateTime']>
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  createdAt_lt?: InputMaybe<Scalars['DateTime']>
  createdAt_lte?: InputMaybe<Scalars['DateTime']>
  createdAt_ne?: InputMaybe<Scalars['DateTime']>
  createdAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId_gt?: InputMaybe<Scalars['String']>
  extrinsicId_gte?: InputMaybe<Scalars['String']>
  extrinsicId_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  extrinsicId_lt?: InputMaybe<Scalars['String']>
  extrinsicId_lte?: InputMaybe<Scalars['String']>
  extrinsicId_ne?: InputMaybe<Scalars['String']>
  extrinsicId_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from?: InputMaybe<Scalars['String']>
  from_exists?: InputMaybe<Scalars['Boolean']>
  from_gt?: InputMaybe<Scalars['String']>
  from_gte?: InputMaybe<Scalars['String']>
  from_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from_lt?: InputMaybe<Scalars['String']>
  from_lte?: InputMaybe<Scalars['String']>
  from_ne?: InputMaybe<Scalars['String']>
  from_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status?: InputMaybe<Scalars['String']>
  status_exists?: InputMaybe<Scalars['Boolean']>
  status_gt?: InputMaybe<Scalars['String']>
  status_gte?: InputMaybe<Scalars['String']>
  status_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status_lt?: InputMaybe<Scalars['String']>
  status_lte?: InputMaybe<Scalars['String']>
  status_ne?: InputMaybe<Scalars['String']>
  status_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to?: InputMaybe<Scalars['String']>
  to_exists?: InputMaybe<Scalars['Boolean']>
  to_gt?: InputMaybe<Scalars['String']>
  to_gte?: InputMaybe<Scalars['String']>
  to_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to_lt?: InputMaybe<Scalars['String']>
  to_lte?: InputMaybe<Scalars['String']>
  to_ne?: InputMaybe<Scalars['String']>
  to_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_exists?: InputMaybe<Scalars['Boolean']>
  updatedAt_gt?: InputMaybe<Scalars['DateTime']>
  updatedAt_gte?: InputMaybe<Scalars['DateTime']>
  updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  updatedAt_lt?: InputMaybe<Scalars['DateTime']>
  updatedAt_lte?: InputMaybe<Scalars['DateTime']>
  updatedAt_ne?: InputMaybe<Scalars['DateTime']>
  updatedAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  xrpValue?: InputMaybe<XrplDepositXrpValueQueryInput>
  xrpValue_exists?: InputMaybe<Scalars['Boolean']>
  xrplHash?: InputMaybe<Scalars['String']>
  xrplHash_exists?: InputMaybe<Scalars['Boolean']>
  xrplHash_gt?: InputMaybe<Scalars['String']>
  xrplHash_gte?: InputMaybe<Scalars['String']>
  xrplHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  xrplHash_lt?: InputMaybe<Scalars['String']>
  xrplHash_lte?: InputMaybe<Scalars['String']>
  xrplHash_ne?: InputMaybe<Scalars['String']>
  xrplHash_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export enum XrplDepositSortByInput {
  CreatedatAsc = 'CREATEDAT_ASC',
  CreatedatDesc = 'CREATEDAT_DESC',
  ExtrinsicidAsc = 'EXTRINSICID_ASC',
  ExtrinsicidDesc = 'EXTRINSICID_DESC',
  FromAsc = 'FROM_ASC',
  FromDesc = 'FROM_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  ToAsc = 'TO_ASC',
  ToDesc = 'TO_DESC',
  UpdatedatAsc = 'UPDATEDAT_ASC',
  UpdatedatDesc = 'UPDATEDAT_DESC',
  XrplhashAsc = 'XRPLHASH_ASC',
  XrplhashDesc = 'XRPLHASH_DESC',
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
}

export type XrplDepositUpdateInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_unset?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_unset?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_unset?: InputMaybe<Scalars['Boolean']>
  from?: InputMaybe<Scalars['String']>
  from_unset?: InputMaybe<Scalars['Boolean']>
  status?: InputMaybe<Scalars['String']>
  status_unset?: InputMaybe<Scalars['Boolean']>
  to?: InputMaybe<Scalars['String']>
  to_unset?: InputMaybe<Scalars['Boolean']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_unset?: InputMaybe<Scalars['Boolean']>
  xrpValue?: InputMaybe<XrplDepositXrpValueUpdateInput>
  xrpValue_unset?: InputMaybe<Scalars['Boolean']>
  xrplHash?: InputMaybe<Scalars['String']>
  xrplHash_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplDepositXrpValue = {
  __typename: 'XrplDepositXrpValue'
  amount?: Maybe<Scalars['String']>
  tokenName?: Maybe<Scalars['String']>
}

export type XrplDepositXrpValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenName?: InputMaybe<Scalars['String']>
}

export type XrplDepositXrpValueQueryInput = {
  AND?: InputMaybe<Array<XrplDepositXrpValueQueryInput>>
  OR?: InputMaybe<Array<XrplDepositXrpValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenName?: InputMaybe<Scalars['String']>
  tokenName_exists?: InputMaybe<Scalars['Boolean']>
  tokenName_gt?: InputMaybe<Scalars['String']>
  tokenName_gte?: InputMaybe<Scalars['String']>
  tokenName_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenName_lt?: InputMaybe<Scalars['String']>
  tokenName_lte?: InputMaybe<Scalars['String']>
  tokenName_ne?: InputMaybe<Scalars['String']>
  tokenName_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type XrplDepositXrpValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenName?: InputMaybe<Scalars['String']>
  tokenName_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawal = {
  __typename: 'XrplWithdrawal'
  _id?: Maybe<Scalars['ObjectId']>
  auxData?: Maybe<XrplWithdrawalAuxDatum>
  createdAt?: Maybe<Scalars['DateTime']>
  eventBlob?: Maybe<Scalars['String']>
  eventId?: Maybe<Scalars['Long']>
  eventSigners?: Maybe<Array<Maybe<XrplWithdrawalEventSigner>>>
  extrinsicId?: Maybe<Scalars['String']>
  from?: Maybe<Scalars['String']>
  status?: Maybe<Scalars['String']>
  to?: Maybe<Scalars['String']>
  updatedAt?: Maybe<Scalars['DateTime']>
  xrpValue?: Maybe<XrplWithdrawalXrpValue>
  xrplHash?: Maybe<Scalars['String']>
}

export type XrplWithdrawalAuxDatum = {
  __typename: 'XrplWithdrawalAuxDatum'
  xrplResponse?: Maybe<XrplWithdrawalAuxDatumXrplResponse>
}

export type XrplWithdrawalAuxDatumInsertInput = {
  xrplResponse?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseInsertInput>
}

export type XrplWithdrawalAuxDatumQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalAuxDatumQueryInput>>
  OR?: InputMaybe<Array<XrplWithdrawalAuxDatumQueryInput>>
  xrplResponse?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseQueryInput>
  xrplResponse_exists?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumUpdateInput = {
  xrplResponse?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseUpdateInput>
  xrplResponse_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponse = {
  __typename: 'XrplWithdrawalAuxDatumXrplResponse'
  engine_result?: Maybe<Scalars['String']>
  engine_result_code?: Maybe<Scalars['Int']>
  engine_result_message?: Maybe<Scalars['String']>
  tx_blob?: Maybe<Scalars['String']>
  tx_json?: Maybe<XrplWithdrawalAuxDatumXrplResponseTx_Json>
}

export type XrplWithdrawalAuxDatumXrplResponseInsertInput = {
  engine_result?: InputMaybe<Scalars['String']>
  engine_result_code?: InputMaybe<Scalars['Int']>
  engine_result_message?: InputMaybe<Scalars['String']>
  tx_blob?: InputMaybe<Scalars['String']>
  tx_json?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonInsertInput>
}

export type XrplWithdrawalAuxDatumXrplResponseQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalAuxDatumXrplResponseQueryInput>>
  OR?: InputMaybe<Array<XrplWithdrawalAuxDatumXrplResponseQueryInput>>
  engine_result?: InputMaybe<Scalars['String']>
  engine_result_code?: InputMaybe<Scalars['Int']>
  engine_result_code_exists?: InputMaybe<Scalars['Boolean']>
  engine_result_code_gt?: InputMaybe<Scalars['Int']>
  engine_result_code_gte?: InputMaybe<Scalars['Int']>
  engine_result_code_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  engine_result_code_lt?: InputMaybe<Scalars['Int']>
  engine_result_code_lte?: InputMaybe<Scalars['Int']>
  engine_result_code_ne?: InputMaybe<Scalars['Int']>
  engine_result_code_nin?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  engine_result_exists?: InputMaybe<Scalars['Boolean']>
  engine_result_gt?: InputMaybe<Scalars['String']>
  engine_result_gte?: InputMaybe<Scalars['String']>
  engine_result_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  engine_result_lt?: InputMaybe<Scalars['String']>
  engine_result_lte?: InputMaybe<Scalars['String']>
  engine_result_message?: InputMaybe<Scalars['String']>
  engine_result_message_exists?: InputMaybe<Scalars['Boolean']>
  engine_result_message_gt?: InputMaybe<Scalars['String']>
  engine_result_message_gte?: InputMaybe<Scalars['String']>
  engine_result_message_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  engine_result_message_lt?: InputMaybe<Scalars['String']>
  engine_result_message_lte?: InputMaybe<Scalars['String']>
  engine_result_message_ne?: InputMaybe<Scalars['String']>
  engine_result_message_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  engine_result_ne?: InputMaybe<Scalars['String']>
  engine_result_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tx_blob?: InputMaybe<Scalars['String']>
  tx_blob_exists?: InputMaybe<Scalars['Boolean']>
  tx_blob_gt?: InputMaybe<Scalars['String']>
  tx_blob_gte?: InputMaybe<Scalars['String']>
  tx_blob_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tx_blob_lt?: InputMaybe<Scalars['String']>
  tx_blob_lte?: InputMaybe<Scalars['String']>
  tx_blob_ne?: InputMaybe<Scalars['String']>
  tx_blob_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tx_json?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonQueryInput>
  tx_json_exists?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_Json = {
  __typename: 'XrplWithdrawalAuxDatumXrplResponseTx_json'
  Account?: Maybe<Scalars['String']>
  Amount?: Maybe<Scalars['String']>
  Destination?: Maybe<Scalars['String']>
  Fee?: Maybe<Scalars['String']>
  Flags?: Maybe<Scalars['Long']>
  Sequence?: Maybe<Scalars['Int']>
  Signers?: Maybe<Array<Maybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSigner>>>
  SigningPubKey?: Maybe<Scalars['String']>
  TicketSequence?: Maybe<Scalars['Int']>
  TransactionType?: Maybe<Scalars['String']>
  hash?: Maybe<Scalars['String']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonInsertInput = {
  Account?: InputMaybe<Scalars['String']>
  Amount?: InputMaybe<Scalars['String']>
  Destination?: InputMaybe<Scalars['String']>
  Fee?: InputMaybe<Scalars['String']>
  Flags?: InputMaybe<Scalars['Long']>
  Sequence?: InputMaybe<Scalars['Int']>
  Signers?: InputMaybe<
    Array<
      InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerInsertInput>
    >
  >
  SigningPubKey?: InputMaybe<Scalars['String']>
  TicketSequence?: InputMaybe<Scalars['Int']>
  TransactionType?: InputMaybe<Scalars['String']>
  hash?: InputMaybe<Scalars['String']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonQueryInput>>
  Account?: InputMaybe<Scalars['String']>
  Account_exists?: InputMaybe<Scalars['Boolean']>
  Account_gt?: InputMaybe<Scalars['String']>
  Account_gte?: InputMaybe<Scalars['String']>
  Account_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Account_lt?: InputMaybe<Scalars['String']>
  Account_lte?: InputMaybe<Scalars['String']>
  Account_ne?: InputMaybe<Scalars['String']>
  Account_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Amount?: InputMaybe<Scalars['String']>
  Amount_exists?: InputMaybe<Scalars['Boolean']>
  Amount_gt?: InputMaybe<Scalars['String']>
  Amount_gte?: InputMaybe<Scalars['String']>
  Amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Amount_lt?: InputMaybe<Scalars['String']>
  Amount_lte?: InputMaybe<Scalars['String']>
  Amount_ne?: InputMaybe<Scalars['String']>
  Amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Destination?: InputMaybe<Scalars['String']>
  Destination_exists?: InputMaybe<Scalars['Boolean']>
  Destination_gt?: InputMaybe<Scalars['String']>
  Destination_gte?: InputMaybe<Scalars['String']>
  Destination_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Destination_lt?: InputMaybe<Scalars['String']>
  Destination_lte?: InputMaybe<Scalars['String']>
  Destination_ne?: InputMaybe<Scalars['String']>
  Destination_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Fee?: InputMaybe<Scalars['String']>
  Fee_exists?: InputMaybe<Scalars['Boolean']>
  Fee_gt?: InputMaybe<Scalars['String']>
  Fee_gte?: InputMaybe<Scalars['String']>
  Fee_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Fee_lt?: InputMaybe<Scalars['String']>
  Fee_lte?: InputMaybe<Scalars['String']>
  Fee_ne?: InputMaybe<Scalars['String']>
  Fee_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Flags?: InputMaybe<Scalars['Long']>
  Flags_exists?: InputMaybe<Scalars['Boolean']>
  Flags_gt?: InputMaybe<Scalars['Long']>
  Flags_gte?: InputMaybe<Scalars['Long']>
  Flags_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  Flags_lt?: InputMaybe<Scalars['Long']>
  Flags_lte?: InputMaybe<Scalars['Long']>
  Flags_ne?: InputMaybe<Scalars['Long']>
  Flags_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  OR?: InputMaybe<Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonQueryInput>>
  Sequence?: InputMaybe<Scalars['Int']>
  Sequence_exists?: InputMaybe<Scalars['Boolean']>
  Sequence_gt?: InputMaybe<Scalars['Int']>
  Sequence_gte?: InputMaybe<Scalars['Int']>
  Sequence_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  Sequence_lt?: InputMaybe<Scalars['Int']>
  Sequence_lte?: InputMaybe<Scalars['Int']>
  Sequence_ne?: InputMaybe<Scalars['Int']>
  Sequence_nin?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  Signers?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput>>
  >
  Signers_exists?: InputMaybe<Scalars['Boolean']>
  Signers_in?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput>>
  >
  Signers_nin?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput>>
  >
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_exists?: InputMaybe<Scalars['Boolean']>
  SigningPubKey_gt?: InputMaybe<Scalars['String']>
  SigningPubKey_gte?: InputMaybe<Scalars['String']>
  SigningPubKey_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  SigningPubKey_lt?: InputMaybe<Scalars['String']>
  SigningPubKey_lte?: InputMaybe<Scalars['String']>
  SigningPubKey_ne?: InputMaybe<Scalars['String']>
  SigningPubKey_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TicketSequence?: InputMaybe<Scalars['Int']>
  TicketSequence_exists?: InputMaybe<Scalars['Boolean']>
  TicketSequence_gt?: InputMaybe<Scalars['Int']>
  TicketSequence_gte?: InputMaybe<Scalars['Int']>
  TicketSequence_in?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  TicketSequence_lt?: InputMaybe<Scalars['Int']>
  TicketSequence_lte?: InputMaybe<Scalars['Int']>
  TicketSequence_ne?: InputMaybe<Scalars['Int']>
  TicketSequence_nin?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>
  TransactionType?: InputMaybe<Scalars['String']>
  TransactionType_exists?: InputMaybe<Scalars['Boolean']>
  TransactionType_gt?: InputMaybe<Scalars['String']>
  TransactionType_gte?: InputMaybe<Scalars['String']>
  TransactionType_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TransactionType_lt?: InputMaybe<Scalars['String']>
  TransactionType_lte?: InputMaybe<Scalars['String']>
  TransactionType_ne?: InputMaybe<Scalars['String']>
  TransactionType_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  hash?: InputMaybe<Scalars['String']>
  hash_exists?: InputMaybe<Scalars['Boolean']>
  hash_gt?: InputMaybe<Scalars['String']>
  hash_gte?: InputMaybe<Scalars['String']>
  hash_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  hash_lt?: InputMaybe<Scalars['String']>
  hash_lte?: InputMaybe<Scalars['String']>
  hash_ne?: InputMaybe<Scalars['String']>
  hash_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSigner = {
  __typename: 'XrplWithdrawalAuxDatumXrplResponseTx_jsonSigner'
  Signer?: Maybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSigner>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerInsertInput = {
  Signer?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerInsertInput>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput = {
  AND?: InputMaybe<
    Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput>
  >
  OR?: InputMaybe<
    Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerQueryInput>
  >
  Signer?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerQueryInput>
  Signer_exists?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSigner = {
  __typename: 'XrplWithdrawalAuxDatumXrplResponseTx_jsonSignerSigner'
  Account?: Maybe<Scalars['String']>
  SigningPubKey?: Maybe<Scalars['String']>
  TxnSignature?: Maybe<Scalars['String']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerInsertInput = {
  Account?: InputMaybe<Scalars['String']>
  SigningPubKey?: InputMaybe<Scalars['String']>
  TxnSignature?: InputMaybe<Scalars['String']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerQueryInput = {
  AND?: InputMaybe<
    Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerQueryInput>
  >
  Account?: InputMaybe<Scalars['String']>
  Account_exists?: InputMaybe<Scalars['Boolean']>
  Account_gt?: InputMaybe<Scalars['String']>
  Account_gte?: InputMaybe<Scalars['String']>
  Account_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Account_lt?: InputMaybe<Scalars['String']>
  Account_lte?: InputMaybe<Scalars['String']>
  Account_ne?: InputMaybe<Scalars['String']>
  Account_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  OR?: InputMaybe<
    Array<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerQueryInput>
  >
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_exists?: InputMaybe<Scalars['Boolean']>
  SigningPubKey_gt?: InputMaybe<Scalars['String']>
  SigningPubKey_gte?: InputMaybe<Scalars['String']>
  SigningPubKey_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  SigningPubKey_lt?: InputMaybe<Scalars['String']>
  SigningPubKey_lte?: InputMaybe<Scalars['String']>
  SigningPubKey_ne?: InputMaybe<Scalars['String']>
  SigningPubKey_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TxnSignature?: InputMaybe<Scalars['String']>
  TxnSignature_exists?: InputMaybe<Scalars['Boolean']>
  TxnSignature_gt?: InputMaybe<Scalars['String']>
  TxnSignature_gte?: InputMaybe<Scalars['String']>
  TxnSignature_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TxnSignature_lt?: InputMaybe<Scalars['String']>
  TxnSignature_lte?: InputMaybe<Scalars['String']>
  TxnSignature_ne?: InputMaybe<Scalars['String']>
  TxnSignature_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerUpdateInput = {
  Account?: InputMaybe<Scalars['String']>
  Account_unset?: InputMaybe<Scalars['Boolean']>
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_unset?: InputMaybe<Scalars['Boolean']>
  TxnSignature?: InputMaybe<Scalars['String']>
  TxnSignature_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerUpdateInput = {
  Signer?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerSignerUpdateInput>
  Signer_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponseTx_JsonUpdateInput = {
  Account?: InputMaybe<Scalars['String']>
  Account_unset?: InputMaybe<Scalars['Boolean']>
  Amount?: InputMaybe<Scalars['String']>
  Amount_unset?: InputMaybe<Scalars['Boolean']>
  Destination?: InputMaybe<Scalars['String']>
  Destination_unset?: InputMaybe<Scalars['Boolean']>
  Fee?: InputMaybe<Scalars['String']>
  Fee_unset?: InputMaybe<Scalars['Boolean']>
  Flags?: InputMaybe<Scalars['Long']>
  Flags_unset?: InputMaybe<Scalars['Boolean']>
  Sequence?: InputMaybe<Scalars['Int']>
  Sequence_inc?: InputMaybe<Scalars['Int']>
  Sequence_unset?: InputMaybe<Scalars['Boolean']>
  Signers?: InputMaybe<
    Array<
      InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonSignerUpdateInput>
    >
  >
  Signers_unset?: InputMaybe<Scalars['Boolean']>
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_unset?: InputMaybe<Scalars['Boolean']>
  TicketSequence?: InputMaybe<Scalars['Int']>
  TicketSequence_inc?: InputMaybe<Scalars['Int']>
  TicketSequence_unset?: InputMaybe<Scalars['Boolean']>
  TransactionType?: InputMaybe<Scalars['String']>
  TransactionType_unset?: InputMaybe<Scalars['Boolean']>
  hash?: InputMaybe<Scalars['String']>
  hash_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalAuxDatumXrplResponseUpdateInput = {
  engine_result?: InputMaybe<Scalars['String']>
  engine_result_code?: InputMaybe<Scalars['Int']>
  engine_result_code_inc?: InputMaybe<Scalars['Int']>
  engine_result_code_unset?: InputMaybe<Scalars['Boolean']>
  engine_result_message?: InputMaybe<Scalars['String']>
  engine_result_message_unset?: InputMaybe<Scalars['Boolean']>
  engine_result_unset?: InputMaybe<Scalars['Boolean']>
  tx_blob?: InputMaybe<Scalars['String']>
  tx_blob_unset?: InputMaybe<Scalars['Boolean']>
  tx_json?: InputMaybe<XrplWithdrawalAuxDatumXrplResponseTx_JsonUpdateInput>
  tx_json_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalEventSigner = {
  __typename: 'XrplWithdrawalEventSigner'
  Signer?: Maybe<XrplWithdrawalEventSignerSigner>
}

export type XrplWithdrawalEventSignerInsertInput = {
  Signer?: InputMaybe<XrplWithdrawalEventSignerSignerInsertInput>
}

export type XrplWithdrawalEventSignerQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalEventSignerQueryInput>>
  OR?: InputMaybe<Array<XrplWithdrawalEventSignerQueryInput>>
  Signer?: InputMaybe<XrplWithdrawalEventSignerSignerQueryInput>
  Signer_exists?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalEventSignerSigner = {
  __typename: 'XrplWithdrawalEventSignerSigner'
  Account?: Maybe<Scalars['String']>
  SigningPubKey?: Maybe<Scalars['String']>
  TxnSignature?: Maybe<Scalars['String']>
}

export type XrplWithdrawalEventSignerSignerInsertInput = {
  Account?: InputMaybe<Scalars['String']>
  SigningPubKey?: InputMaybe<Scalars['String']>
  TxnSignature?: InputMaybe<Scalars['String']>
}

export type XrplWithdrawalEventSignerSignerQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalEventSignerSignerQueryInput>>
  Account?: InputMaybe<Scalars['String']>
  Account_exists?: InputMaybe<Scalars['Boolean']>
  Account_gt?: InputMaybe<Scalars['String']>
  Account_gte?: InputMaybe<Scalars['String']>
  Account_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  Account_lt?: InputMaybe<Scalars['String']>
  Account_lte?: InputMaybe<Scalars['String']>
  Account_ne?: InputMaybe<Scalars['String']>
  Account_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  OR?: InputMaybe<Array<XrplWithdrawalEventSignerSignerQueryInput>>
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_exists?: InputMaybe<Scalars['Boolean']>
  SigningPubKey_gt?: InputMaybe<Scalars['String']>
  SigningPubKey_gte?: InputMaybe<Scalars['String']>
  SigningPubKey_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  SigningPubKey_lt?: InputMaybe<Scalars['String']>
  SigningPubKey_lte?: InputMaybe<Scalars['String']>
  SigningPubKey_ne?: InputMaybe<Scalars['String']>
  SigningPubKey_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TxnSignature?: InputMaybe<Scalars['String']>
  TxnSignature_exists?: InputMaybe<Scalars['Boolean']>
  TxnSignature_gt?: InputMaybe<Scalars['String']>
  TxnSignature_gte?: InputMaybe<Scalars['String']>
  TxnSignature_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  TxnSignature_lt?: InputMaybe<Scalars['String']>
  TxnSignature_lte?: InputMaybe<Scalars['String']>
  TxnSignature_ne?: InputMaybe<Scalars['String']>
  TxnSignature_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type XrplWithdrawalEventSignerSignerUpdateInput = {
  Account?: InputMaybe<Scalars['String']>
  Account_unset?: InputMaybe<Scalars['Boolean']>
  SigningPubKey?: InputMaybe<Scalars['String']>
  SigningPubKey_unset?: InputMaybe<Scalars['Boolean']>
  TxnSignature?: InputMaybe<Scalars['String']>
  TxnSignature_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalEventSignerUpdateInput = {
  Signer?: InputMaybe<XrplWithdrawalEventSignerSignerUpdateInput>
  Signer_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalInsertInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  auxData?: InputMaybe<XrplWithdrawalAuxDatumInsertInput>
  createdAt?: InputMaybe<Scalars['DateTime']>
  eventBlob?: InputMaybe<Scalars['String']>
  eventId?: InputMaybe<Scalars['Long']>
  eventSigners?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalEventSignerInsertInput>>
  >
  extrinsicId?: InputMaybe<Scalars['String']>
  from?: InputMaybe<Scalars['String']>
  status?: InputMaybe<Scalars['String']>
  to?: InputMaybe<Scalars['String']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  xrpValue?: InputMaybe<XrplWithdrawalXrpValueInsertInput>
  xrplHash?: InputMaybe<Scalars['String']>
}

export type XrplWithdrawalQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalQueryInput>>
  OR?: InputMaybe<Array<XrplWithdrawalQueryInput>>
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_exists?: InputMaybe<Scalars['Boolean']>
  _id_gt?: InputMaybe<Scalars['ObjectId']>
  _id_gte?: InputMaybe<Scalars['ObjectId']>
  _id_in?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  _id_lt?: InputMaybe<Scalars['ObjectId']>
  _id_lte?: InputMaybe<Scalars['ObjectId']>
  _id_ne?: InputMaybe<Scalars['ObjectId']>
  _id_nin?: InputMaybe<Array<InputMaybe<Scalars['ObjectId']>>>
  auxData?: InputMaybe<XrplWithdrawalAuxDatumQueryInput>
  auxData_exists?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_exists?: InputMaybe<Scalars['Boolean']>
  createdAt_gt?: InputMaybe<Scalars['DateTime']>
  createdAt_gte?: InputMaybe<Scalars['DateTime']>
  createdAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  createdAt_lt?: InputMaybe<Scalars['DateTime']>
  createdAt_lte?: InputMaybe<Scalars['DateTime']>
  createdAt_ne?: InputMaybe<Scalars['DateTime']>
  createdAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  eventBlob?: InputMaybe<Scalars['String']>
  eventBlob_exists?: InputMaybe<Scalars['Boolean']>
  eventBlob_gt?: InputMaybe<Scalars['String']>
  eventBlob_gte?: InputMaybe<Scalars['String']>
  eventBlob_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  eventBlob_lt?: InputMaybe<Scalars['String']>
  eventBlob_lte?: InputMaybe<Scalars['String']>
  eventBlob_ne?: InputMaybe<Scalars['String']>
  eventBlob_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  eventId?: InputMaybe<Scalars['Long']>
  eventId_exists?: InputMaybe<Scalars['Boolean']>
  eventId_gt?: InputMaybe<Scalars['Long']>
  eventId_gte?: InputMaybe<Scalars['Long']>
  eventId_in?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  eventId_lt?: InputMaybe<Scalars['Long']>
  eventId_lte?: InputMaybe<Scalars['Long']>
  eventId_ne?: InputMaybe<Scalars['Long']>
  eventId_nin?: InputMaybe<Array<InputMaybe<Scalars['Long']>>>
  eventSigners?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalEventSignerQueryInput>>
  >
  eventSigners_exists?: InputMaybe<Scalars['Boolean']>
  eventSigners_in?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalEventSignerQueryInput>>
  >
  eventSigners_nin?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalEventSignerQueryInput>>
  >
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_exists?: InputMaybe<Scalars['Boolean']>
  extrinsicId_gt?: InputMaybe<Scalars['String']>
  extrinsicId_gte?: InputMaybe<Scalars['String']>
  extrinsicId_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  extrinsicId_lt?: InputMaybe<Scalars['String']>
  extrinsicId_lte?: InputMaybe<Scalars['String']>
  extrinsicId_ne?: InputMaybe<Scalars['String']>
  extrinsicId_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from?: InputMaybe<Scalars['String']>
  from_exists?: InputMaybe<Scalars['Boolean']>
  from_gt?: InputMaybe<Scalars['String']>
  from_gte?: InputMaybe<Scalars['String']>
  from_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  from_lt?: InputMaybe<Scalars['String']>
  from_lte?: InputMaybe<Scalars['String']>
  from_ne?: InputMaybe<Scalars['String']>
  from_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status?: InputMaybe<Scalars['String']>
  status_exists?: InputMaybe<Scalars['Boolean']>
  status_gt?: InputMaybe<Scalars['String']>
  status_gte?: InputMaybe<Scalars['String']>
  status_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  status_lt?: InputMaybe<Scalars['String']>
  status_lte?: InputMaybe<Scalars['String']>
  status_ne?: InputMaybe<Scalars['String']>
  status_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to?: InputMaybe<Scalars['String']>
  to_exists?: InputMaybe<Scalars['Boolean']>
  to_gt?: InputMaybe<Scalars['String']>
  to_gte?: InputMaybe<Scalars['String']>
  to_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  to_lt?: InputMaybe<Scalars['String']>
  to_lte?: InputMaybe<Scalars['String']>
  to_ne?: InputMaybe<Scalars['String']>
  to_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_exists?: InputMaybe<Scalars['Boolean']>
  updatedAt_gt?: InputMaybe<Scalars['DateTime']>
  updatedAt_gte?: InputMaybe<Scalars['DateTime']>
  updatedAt_in?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  updatedAt_lt?: InputMaybe<Scalars['DateTime']>
  updatedAt_lte?: InputMaybe<Scalars['DateTime']>
  updatedAt_ne?: InputMaybe<Scalars['DateTime']>
  updatedAt_nin?: InputMaybe<Array<InputMaybe<Scalars['DateTime']>>>
  xrpValue?: InputMaybe<XrplWithdrawalXrpValueQueryInput>
  xrpValue_exists?: InputMaybe<Scalars['Boolean']>
  xrplHash?: InputMaybe<Scalars['String']>
  xrplHash_exists?: InputMaybe<Scalars['Boolean']>
  xrplHash_gt?: InputMaybe<Scalars['String']>
  xrplHash_gte?: InputMaybe<Scalars['String']>
  xrplHash_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  xrplHash_lt?: InputMaybe<Scalars['String']>
  xrplHash_lte?: InputMaybe<Scalars['String']>
  xrplHash_ne?: InputMaybe<Scalars['String']>
  xrplHash_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export enum XrplWithdrawalSortByInput {
  CreatedatAsc = 'CREATEDAT_ASC',
  CreatedatDesc = 'CREATEDAT_DESC',
  EventblobAsc = 'EVENTBLOB_ASC',
  EventblobDesc = 'EVENTBLOB_DESC',
  EventidAsc = 'EVENTID_ASC',
  EventidDesc = 'EVENTID_DESC',
  ExtrinsicidAsc = 'EXTRINSICID_ASC',
  ExtrinsicidDesc = 'EXTRINSICID_DESC',
  FromAsc = 'FROM_ASC',
  FromDesc = 'FROM_DESC',
  StatusAsc = 'STATUS_ASC',
  StatusDesc = 'STATUS_DESC',
  ToAsc = 'TO_ASC',
  ToDesc = 'TO_DESC',
  UpdatedatAsc = 'UPDATEDAT_ASC',
  UpdatedatDesc = 'UPDATEDAT_DESC',
  XrplhashAsc = 'XRPLHASH_ASC',
  XrplhashDesc = 'XRPLHASH_DESC',
  IdAsc = '_ID_ASC',
  IdDesc = '_ID_DESC',
}

export type XrplWithdrawalUpdateInput = {
  _id?: InputMaybe<Scalars['ObjectId']>
  _id_unset?: InputMaybe<Scalars['Boolean']>
  auxData?: InputMaybe<XrplWithdrawalAuxDatumUpdateInput>
  auxData_unset?: InputMaybe<Scalars['Boolean']>
  createdAt?: InputMaybe<Scalars['DateTime']>
  createdAt_unset?: InputMaybe<Scalars['Boolean']>
  eventBlob?: InputMaybe<Scalars['String']>
  eventBlob_unset?: InputMaybe<Scalars['Boolean']>
  eventId?: InputMaybe<Scalars['Long']>
  eventId_unset?: InputMaybe<Scalars['Boolean']>
  eventSigners?: InputMaybe<
    Array<InputMaybe<XrplWithdrawalEventSignerUpdateInput>>
  >
  eventSigners_unset?: InputMaybe<Scalars['Boolean']>
  extrinsicId?: InputMaybe<Scalars['String']>
  extrinsicId_unset?: InputMaybe<Scalars['Boolean']>
  from?: InputMaybe<Scalars['String']>
  from_unset?: InputMaybe<Scalars['Boolean']>
  status?: InputMaybe<Scalars['String']>
  status_unset?: InputMaybe<Scalars['Boolean']>
  to?: InputMaybe<Scalars['String']>
  to_unset?: InputMaybe<Scalars['Boolean']>
  updatedAt?: InputMaybe<Scalars['DateTime']>
  updatedAt_unset?: InputMaybe<Scalars['Boolean']>
  xrpValue?: InputMaybe<XrplWithdrawalXrpValueUpdateInput>
  xrpValue_unset?: InputMaybe<Scalars['Boolean']>
  xrplHash?: InputMaybe<Scalars['String']>
  xrplHash_unset?: InputMaybe<Scalars['Boolean']>
}

export type XrplWithdrawalXrpValue = {
  __typename: 'XrplWithdrawalXrpValue'
  amount?: Maybe<Scalars['String']>
  tokenName?: Maybe<Scalars['String']>
}

export type XrplWithdrawalXrpValueInsertInput = {
  amount?: InputMaybe<Scalars['String']>
  tokenName?: InputMaybe<Scalars['String']>
}

export type XrplWithdrawalXrpValueQueryInput = {
  AND?: InputMaybe<Array<XrplWithdrawalXrpValueQueryInput>>
  OR?: InputMaybe<Array<XrplWithdrawalXrpValueQueryInput>>
  amount?: InputMaybe<Scalars['String']>
  amount_exists?: InputMaybe<Scalars['Boolean']>
  amount_gt?: InputMaybe<Scalars['String']>
  amount_gte?: InputMaybe<Scalars['String']>
  amount_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  amount_lt?: InputMaybe<Scalars['String']>
  amount_lte?: InputMaybe<Scalars['String']>
  amount_ne?: InputMaybe<Scalars['String']>
  amount_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenName?: InputMaybe<Scalars['String']>
  tokenName_exists?: InputMaybe<Scalars['Boolean']>
  tokenName_gt?: InputMaybe<Scalars['String']>
  tokenName_gte?: InputMaybe<Scalars['String']>
  tokenName_in?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
  tokenName_lt?: InputMaybe<Scalars['String']>
  tokenName_lte?: InputMaybe<Scalars['String']>
  tokenName_ne?: InputMaybe<Scalars['String']>
  tokenName_nin?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type XrplWithdrawalXrpValueUpdateInput = {
  amount?: InputMaybe<Scalars['String']>
  amount_unset?: InputMaybe<Scalars['Boolean']>
  tokenName?: InputMaybe<Scalars['String']>
  tokenName_unset?: InputMaybe<Scalars['Boolean']>
}

export type GetBridgeStatusQueryVariables = Exact<{
  hash: Scalars['String']
}>

export type GetBridgeStatusQuery = {
  __typename: 'Query'
  ethDeposits: Array<{
    __typename: 'EthDeposit'
    status?: string | null
  } | null>
}

export type GetEthTransactionsBySenderQueryVariables = Exact<{
  address: Array<InputMaybe<Scalars['String']>> | InputMaybe<Scalars['String']>
}>

export type GetEthTransactionsBySenderQuery = {
  __typename: 'Query'
  ethDeposits: Array<{
    __typename: 'EthDeposit'
    createdAt?: any | null
    ethHash?: string | null
    extrinsicId?: string | null
    status?: string | null
    updatedAt?: any | null
    ethValue?: {
      __typename: 'EthDepositEthValue'
      amount?: string | null
      tokenAddress?: string | null
    } | null
    erc20Value?: {
      __typename: 'EthDepositErc20Value'
      amount?: string | null
      tokenAddress?: string | null
    } | null
    erc721Value?: Array<{
      __typename: 'EthDepositErc721Value'
      tokenIds?: Array<string | null> | null
      tokenAddress?: string | null
    } | null> | null
  } | null>
  ethWithdrawals: Array<{
    __typename: 'EthWithdrawal'
    from?: string | null
    to?: string | null
    createdAt?: any | null
    extrinsicId?: string | null
    ethHash?: string | null
    status?: string | null
    updatedAt?: any | null
    ethValue?: {
      __typename: 'EthWithdrawalEthValue'
      amount?: string | null
      tokenAddress?: string | null
    } | null
    erc20Value?: {
      __typename: 'EthWithdrawalErc20Value'
      amount?: string | null
      tokenAddress?: string | null
    } | null
    erc721Value?: Array<{
      __typename: 'EthWithdrawalErc721Value'
      tokenIds?: Array<string | null> | null
      tokenAddress?: string | null
    } | null> | null
    eventInfo?: {
      __typename: 'EthWithdrawalEventInfo'
      source?: string | null
      message?: string | null
      destination?: string | null
    } | null
  } | null>
}

export const GetBridgeStatusDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetBridgeStatus' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'hash' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'String' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'ethDeposits' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'ethHash' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'hash' },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  GetBridgeStatusQuery,
  GetBridgeStatusQueryVariables
>
export const GetEthTransactionsBySenderDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetETHTransactionsBySender' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: {
            kind: 'Variable',
            name: { kind: 'Name', value: 'address' },
          },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: {
                kind: 'NamedType',
                name: { kind: 'Name', value: 'String' },
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
            name: { kind: 'Name', value: 'ethDeposits' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'to_in' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'address' },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ethHash' } },
                { kind: 'Field', name: { kind: 'Name', value: 'extrinsicId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ethValue' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'amount' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'erc20Value' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'amount' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'erc721Value' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenIds' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'ethWithdrawals' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: {
                  kind: 'ObjectValue',
                  fields: [
                    {
                      kind: 'ObjectField',
                      name: { kind: 'Name', value: 'to_in' },
                      value: {
                        kind: 'Variable',
                        name: { kind: 'Name', value: 'address' },
                      },
                    },
                  ],
                },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'from' } },
                { kind: 'Field', name: { kind: 'Name', value: 'to' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createdAt' } },
                { kind: 'Field', name: { kind: 'Name', value: 'extrinsicId' } },
                { kind: 'Field', name: { kind: 'Name', value: 'ethHash' } },
                { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updatedAt' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ethValue' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'amount' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'erc20Value' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'amount' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'erc721Value' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenIds' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'tokenAddress' },
                      },
                    ],
                  },
                },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'eventInfo' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'source' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'message' },
                      },
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'destination' },
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
  GetEthTransactionsBySenderQuery,
  GetEthTransactionsBySenderQueryVariables
>
