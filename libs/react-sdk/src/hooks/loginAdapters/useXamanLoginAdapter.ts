import {
  Address,
  PublicKey,
  decodedOrThrow,
  hush,
  deriveAddressPair,
} from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import * as React from 'react'
import { decode } from 'xrpl-binary-codec-prerelease'
import {
  XummJsonTransaction,
  XummPostPayloadBodyBlob,
  XummPostPayloadBodyJson,
} from 'xumm-sdk/dist/src/types'

import {
  ConnectorId,
  ILoginAdapter,
  SignMessageCallbacks,
  XamanSignInTxResponse,
} from '../../interfaces'
import {
  XummPkceEventKey,
  UniversalSdkEventKey,
  FvXaman,
} from '../useXamanClient'

type XamanSignRequestResponse = {
  transactionHex: string
  signResponseData: XamanSignInTxResponse
}

type XamanPayload =
  | XummPostPayloadBodyJson
  | XummPostPayloadBodyBlob
  | XummJsonTransaction

export interface IXamanLoginAdapter {
  connect: ILoginAdapter['connect']
  getEthAccount: ILoginAdapter['getEthAccount']
  signPayload: (
    payload: XamanPayload,
    signMessageCallbacks?: SignMessageCallbacks
  ) => Promise<XamanSignRequestResponse>
  logout: () => Promise<void>
}

export function useXamanLoginAdapter(
  xamanClient: FvXaman,
  eventKeysToUnsub?: {
    universalSdkEventKeys?: UniversalSdkEventKey[]
    xummPkceEventKeys?: XummPkceEventKey[]
  }
): {
  xamanLoginAdapter: IXamanLoginAdapter
} {
  const signPayload = React.useCallback(
    async (
      payload: XamanPayload,
      signMessageCallbacks?: SignMessageCallbacks
    ): Promise<XamanSignRequestResponse> => {
      if (xamanClient.payload == null) {
        throw new Error('Xaman client not found')
      }

      const { onCreated, onOpened, onRejected } = signMessageCallbacks ?? {}

      const { created, resolved } =
        await xamanClient.payload.createAndSubscribe(
          payload,
          async (eventMessage) => {
            if (Object.keys(eventMessage.data).indexOf('opened') > -1) {
              onOpened?.()
            }

            if (Object.keys(eventMessage.data).indexOf('signed') > -1) {
              // The `signed` property is present, true (signed) / false (rejected)
              const signed = hush(t.boolean.decode(eventMessage.data.signed))

              if (!signed) {
                await xamanClient.logout()
                return onRejected?.()
              }

              const hexEncodedTransaction = eventMessage.payload.response.hex

              // TODO: confirm this approach works for error handling
              if (hexEncodedTransaction == null) {
                throw new Error('Transaction hex data was null after signing.')
              }

              const signRequestResponseValidation =
                XamanSignInTxResponse.decode(decode(hexEncodedTransaction))

              if (E.isLeft(signRequestResponseValidation)) {
                throw new Error('Failed to decode transaction')
              }

              const returnData: XamanSignRequestResponse = {
                transactionHex: hexEncodedTransaction,
                signResponseData: signRequestResponseValidation.right,
              }

              return returnData
            }
          }
        )

      onCreated?.(created)

      const signatureResponse = await resolved

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- we validate the return date within createAndSubscribe above
      return signatureResponse as XamanSignRequestResponse
    },
    [xamanClient]
  )

  const xamanLoginAdapter = React.useMemo(() => {
    const xamanAdapter: IXamanLoginAdapter = {
      connect: async (_) => {
        const authorizeResponse = await xamanClient.authorize()

        if (authorizeResponse instanceof Error || authorizeResponse == null) {
          throw new Error(
            authorizeResponse?.message ?? 'Xaman Wallet Failed to authorize'
          )
        }
        const rAddress = await xamanClient.user.account

        if (rAddress == null) throw new Error('cannot resolve rAddress') // TODO: when would this be null?

        return rAddress
      },

      signPayload,

      getEthAccount: async (
        connectorId: ConnectorId,
        signMessageCallbacks?: SignMessageCallbacks
      ) => {
        if (connectorId !== 'Xaman') {
          throw new Error(
            `Invalid connectorId passed to XamanAdapter.getEthAccount, expected Xaman`
          )
        }

        const signedTx = await signPayload(
          {
            custom_meta: {
              instruction: 'Sign In',
            },
            txjson: {
              TransactionType: 'SignIn',
            },
          },
          signMessageCallbacks
        )
        const signingPubKey = signedTx.signResponseData.SigningPubKey

        const [eoa] = deriveAddressPair(signingPubKey)

        return {
          eoa: decodedOrThrow(Address.decode(eoa)),
          publicKey: decodedOrThrow(PublicKey.decode(signingPubKey)),
          transaction: signedTx.transactionHex,
        }
      },

      logout: async () => {
        if (eventKeysToUnsub != null) {
          /**
           * `xamanClient.off` has a type warning if we have all event keys in one array
           * and try to unsubscribe for each.
           *
           * QUERY: Any reason we can't use `xamanClient.removeAllListeners` instead of removing key by key?
           */
          const { universalSdkEventKeys, xummPkceEventKeys } = eventKeysToUnsub

          if (universalSdkEventKeys?.length) {
            universalSdkEventKeys.forEach((universalSdkEventKey) => {
              xamanClient.off(universalSdkEventKey, () => null)
            })
          }

          if (xummPkceEventKeys?.length) {
            xummPkceEventKeys.forEach((xummPkceEventKey) => {
              xamanClient.off(xummPkceEventKey, () => null)
            })
          }

          // we know there must be an error handling events and we must have it unregistered
          xamanClient.off('error', () => null)
        }

        await xamanClient.logout()
      },
    }
    return xamanAdapter
  }, [xamanClient, signPayload, eventKeysToUnsub])

  return { xamanLoginAdapter }
}
