import * as t from '@sylo/io-ts'
import { TransactionRequest } from './common'

export { TransactionRequest }

const SharedAPI = {
  health: {
    tag: 'fv/health',
    request: t.undefined,
    error: t.undefined,
    event: t.undefined,
    response: t.literal('ready'),
  },
  signMessage: {
    tag: 'fv/sign-msg',
    request: t.intersection([
      t.type({
        account: t.string,
        message: t.string, // serialized tx
      }),
      t.partial({
        callbackUrl: t.string, // callback URL used by games.
      }),
      t.partial({
        idpUrl: t.string, // IDP url for auth and tenant UI customization
      }),
    ]),
    error: t.union([
      t.type({
        // the requested signer is not the same as the currently logged in user.
        code: t.literal('INVALID_SIGNER'),
        actual: t.optional(t.string), // optional for backwards compatibility
        expected: t.optional(t.string), // optional for backwards compatibility
      }),
      t.type({
        // the user has rejected the request.
        code: t.literal('USER_REJECTED'),
      }),
    ]),
    event: t.union([
      t.type({
        type: t.literal('INTERFACE_REQUIRED'),
      }),
      t.type({
        type: t.literal('PENDING'),
        connector: t.string,
      }),
    ]),
    response: t.type({
      signature: t.string,
    }),
  },
} as const

export const CustodialAPI = {
  ...SharedAPI,
  signTransaction: {
    tag: 'fv/sign-tx',
    request: t.intersection([
      t.type({
        account: t.string,
        transaction: t.string, // serialized tx
      }),
      t.partial({
        callbackUrl: t.string, // callback URL used by games.
      }),
      t.partial({
        idpUrl: t.string, // IDP url for auth and tenant UI customization
      }),
    ]),
    error: t.union([
      t.type({
        // the requested signer is not the same as the currently logged in user.
        code: t.literal('INVALID_SIGNER'),
        actual: t.optional(t.string),
        expected: t.optional(t.string),
      }),
      t.type({
        // the user has rejected the request.
        code: t.literal('USER_REJECTED'),
      }),
    ]),
    event: t.union([
      t.type({
        type: t.literal('INTERFACE_REQUIRED'),
      }),
      t.type({
        type: t.literal('PENDING'),
        connector: t.string,
      }),
    ]),
    response: t.type({
      signature: t.string,
    }),
  },
} as const

export type CustodialAPI = typeof CustodialAPI

export const SelfCustodialAPI = {
  ...SharedAPI,
  switchChain: {
    tag: 'fv/switch-chain',
    request: t.number,
    error: t.type({
      code: t.literal('USER_CANCELLED'),
    }),
    event: t.type({
      type: t.literal('INTERFACE_REQUIRED'),
    }),
    response: t.undefined,
  },
  getChainId: {
    tag: 'fv/get-chain-id',
    request: t.undefined,
    error: t.type({
      code: t.literal('USER_CANCELLED'),
    }),
    event: t.type({
      type: t.literal('INTERFACE_REQUIRED'),
    }),
    response: t.number,
  },
  sendTransaction: {
    tag: 'fv/send-tx',
    request: t.record(t.string, t.unknown),
    error: t.union([
      t.type({
        code: t.literal('INVALID_SIGNER'),
        actual: t.optional(t.string), // optional for backwards compatibility
        expected: t.optional(t.string), // optional for backwards compatibility
      }),
      t.type({
        code: t.literal('USER_CANCELLED'),
      }),
      t.type({
        code: t.literal('USER_REJECTED'),
      }),
    ]),
    event: t.union([
      t.type({
        type: t.literal('INTERFACE_REQUIRED'),
      }),
      t.type({
        type: t.literal('PENDING'),
        connector: t.string,
      }),
    ]),
    response: t.type({
      hash: t.string,
    }),
  },
  connect: {
    tag: 'fv/connect',
    request: t.undefined,
    error: t.type({
      code: t.literal('USER_REJECTED'),
    }),
    event: t.type({
      type: t.literal('INTERFACE_REQUIRED'),
    }),
    response: t.undefined,
  },
  disconnect: {
    tag: 'fv/disconnect',
    request: t.undefined,
    error: t.undefined,
    event: t.undefined,
    response: t.undefined,
  },

  // hold over from previous release of the SDK and no longer in use.
  // we must support this for backwards compatibility until existing projects
  // have updated to the latest version of the SDK.
  legacy_sign: {
    tag: 'fv/sign',
    request: t.union([
      t.type({
        type: t.literal('message'),
        account: t.string,
        message: t.string,
      }),
      t.type({
        type: t.literal('transaction'),
        account: t.string,
        transaction: TransactionRequest,
      }),
    ]),
    error: t.union([
      t.type({
        code: t.literal('INVALID_SIGNER'),
      }),
      t.type({
        code: t.literal('USER_REJECTED'),
      }),
    ]),
    event: t.union([
      t.type({
        type: t.literal('INTERFACE_REQUIRED'),
      }),
      t.type({
        type: t.literal('PENDING'),
        connector: t.string,
      }),
    ]),
    response: t.type({
      signature: t.string,
    }),
  },
} as const

export type SelfCustodialAPI = typeof SelfCustodialAPI

export type SharedAPI = typeof SharedAPI

// this is not part of SDK, strictly speaking
export const SignRequestTransaction = t.strict(
  {
    account: t.string,
    type: t.literal('transaction'),
    transaction: t.string, // serialized tx
  },
  'SignRequestTransaction'
)

export type SignRequestTransaction = t.TypeOf<typeof SignRequestTransaction>

export const SignRequestMessage = t.strict(
  {
    account: t.string,
    type: t.literal('message'),
    message: t.string,
  },
  'SignRequestMessage'
)

export type SignRequestMessage = t.TypeOf<typeof SignRequestMessage>

export const SignRequest = t.union([SignRequestTransaction, SignRequestMessage])
export type SignRequest = t.TypeOf<typeof SignRequest>
