import { arrayify } from '@ethersproject/bytes'
import { JsonRpcSigner } from '@ethersproject/providers'
import {
  EstimateAction,
  ExtrinsicEvent,
  FVPrefixCustodialType,
  PartialWrapper,
  SignDispatcher,
  XRP_ASSET_ID,
  createDispatcher,
  ethereumWalletSigner,
  feeProxyWrapper,
  filterExtrinsicEvents,
  futurepassWrapper,
  hush,
  xrplWalletSigner,
} from '@futureverse/experience-sdk'
import { ApiPromise } from '@polkadot/api'
import {
  ApiOptions,
  SignerOptions,
  SubmittableExtrinsic,
} from '@polkadot/api/types'
import { BN, hexToU8a } from '@polkadot/util'
import * as t from '@sylo/io-ts'
import * as L from '@sylo/logger'
import { getApiOptions, getPublicProvider } from '@therootnetwork/api'
import '@therootnetwork/api-types'
import { Signer } from 'ethers'
import * as E from 'fp-ts/Either'
import * as React from 'react'
import { useFuturePassAccountAddress } from '../hooks'
import { useXamanLoginAdapter } from '../hooks/loginAdapters/useXamanLoginAdapter'
import { useAuthenticationMethod } from '../hooks/useAuthenticationMethod'
import { HexString, SignMessageCallbacks } from '../interfaces'
import { ConcatIfArray } from '../util'
import { createContainer } from '../util/container'
import { useFutureverse } from './Futureverse'

type CreateDispatcher = {
  feeOptions?: {
    assetId: number
    slippage?: number
  }
  wrapWithFuturePass?: boolean
  onSignatureSuccess?: () => void
  wagmiOptions?: {
    signerOptions?: Partial<SignerOptions>
    signer?: Signer | JsonRpcSigner
  }
  xamanOptions?: {
    instruction?: string
    signMessageCallbacks?: SignMessageCallbacks
  }
}

type SubmittedExtrinsicData = {
  extrinsicId: string
  transactionHash: string
}

type Result<T, E = Error> = { ok: true; value: T } | { ok: false; value: E }

type TrnDispatcher = {
  signAndSend: (extrinsic: SubmittableExtrinsic<'promise'>) => Promise<
    Result<
      SubmittedExtrinsicData & {
        events: ExtrinsicEvent[]
      },
      Error
    >
  >
  estimate: EstimateAction
}

const ProxyOkResult = t.type({
  ok: t.nullType,
})
const ProxyErrResult = t.type({
  err: t.type({
    module: t.type({
      error: t.string,
      index: t.number,
    }),
  }),
})
const ProxyResult = t.union([ProxyOkResult, ProxyErrResult])
type ProxyResult = t.TypeOf<typeof ProxyResult>

type UseTrnApiProps = {
  provider?: ApiOptions['provider']
}

type TrnApi = {
  trnApi: ApiPromise | null
  createTrnDispatcher: (options: CreateDispatcher) => TrnDispatcher
}

function useTrnApiImpl(
  _logger: L.Logger,
  { provider }: UseTrnApiProps
): TrnApi {
  const isCreatingTrnApi = React.useRef(false)
  const [trnApi, setTrnApiState] = React.useState<ApiPromise | null>(null)

  const {
    userSession,
    CONSTANTS,
    /**
     * TODO: consider creating a wrapping context to expose the xamanClient or expose it from useFutureverse so that developers can
     * utilise it if needed.
     */
    xamanClient,
  } = useFutureverse()
  const authenticationMethod = useAuthenticationMethod()
  const { xamanLoginAdapter: contextXamanLoginAdapter } =
    useXamanLoginAdapter(xamanClient)
  const { data: futurePassAccount, isLinkedFuturepass } =
    useFuturePassAccountAddress()

  const createApiForNetwork = React.useCallback(async () => {
    isCreatingTrnApi.current = true
    const api = await ApiPromise.create({
      ...getApiOptions(),
      provider:
        provider ??
        getPublicProvider(
          CONSTANTS.CHAINS.TRN.testnet ? 'porcini' : 'root',
          true,
          false
        ).provider,
    })
    setTrnApiState(api)
    isCreatingTrnApi.current = false
  }, [provider, CONSTANTS.CHAINS.TRN.testnet])

  React.useEffect(() => {
    if (trnApi != null || isCreatingTrnApi.current) return

    void createApiForNetwork()
  }, [createApiForNetwork, trnApi])

  /**
   * Creates a TRN transaction dispatcher for Wagmi or Xaman based on the detected authentication method.
   *
   * @param {Object} options - The options for creating the dispatcher.
   * @param {Object} options.wagmiOptions - The options for the Wagmi signer.
   * @param {Object} options.wagmiOptions.signer - The Wagmi signer instance.
   * @param {Object} [options.wagmiOptions.signerOptions] - Additional options for the Wagmi signer.
   * @param {Object} options.xamanOptions - The options for the Xaman signer.
   * @param {Function} [options.xamanOptions.signMessageCallbacks] - Callbacks for the sign message.
   * @param {string} [options.xamanOptions.instruction='Sign extrinsic'] - Custom instruction for the Xaman signer.
   * @param {Function} [options.onSignatureSuccess] - Callback to be called on successful signature.
   * @param {string} [options.feeAssetId=XRP_ASSET_ID] - The asset ID to be used for fees.
   * @param {boolean} [options.wrapWithFuturePass=false] - Flag to wrap with Futurepass.
   *
   * @returns {Object|null} - Returns the dispatcher object with `estimate` and `signAndSend` methods, or null if the detected authentication method is custodial.
   *
   * @throws {Error} - Throws an error if the API or user session is not ready.
   * @throws {Error} - Throws an error if the Wagmi signer is not provided.
   * @throws {Error} - Throws an error if the authentication method is unsupported.
   */
  const createTrnDispatcher = React.useCallback(
    ({
      wagmiOptions,
      xamanOptions,
      onSignatureSuccess,
      feeOptions,
      wrapWithFuturePass = false,
    }: CreateDispatcher) => {
      if (trnApi == null || userSession?.eoa == null) {
        throw new Error(`${trnApi == null ? 'API' : 'User session'} not ready`)
      }

      const wrappers = new ConcatIfArray<PartialWrapper>()
        .concatIf(
          isLinkedFuturepass || wrapWithFuturePass,
          futurepassWrapper(futurePassAccount ?? undefined)
        )
        .concatIf(
          !!feeOptions && feeOptions.assetId !== XRP_ASSET_ID,
          feeProxyWrapper(
            /* eslint-disable @typescript-eslint/no-non-null-assertion -- checked above */
            feeOptions!.assetId,
            {
              slippage: feeOptions!.slippage,
              /* eslint-enable @typescript-eslint/no-non-null-assertion -- checked above */
              isXrplDispatcher: authenticationMethod?.method === 'xaman',
            }
          )
        )

      const create = createDispatcher.bind(
        null,
        trnApi,
        userSession.eoa,
        wrappers.value
      )

      let dispatcher: SignDispatcher | undefined

      if (authenticationMethod?.method === 'xaman') {
        dispatcher = create(
          xrplWalletSigner(async (Memos) => {
            const { transactionHex, signResponseData } =
              await contextXamanLoginAdapter.signPayload(
                {
                  txjson: {
                    Memos,
                    TransactionType: 'SignIn',
                    // Confirmed by TRN team - this value is not validated, but is expected to be there
                    AccountTxnID:
                      '0000000000000000000000000000000000000000000000000000000000000000',
                  },
                  custom_meta: {
                    instruction: xamanOptions?.instruction ?? 'Sign extrinsic',
                  },
                },
                xamanOptions?.signMessageCallbacks
              )

            onSignatureSuccess?.()

            return {
              signature: signResponseData.TxnSignature,
              message: transactionHex,
            }
          }),
          {
            isXrplDispatcher: true,
          }
        )
      }

      /**
       * Custodial Signer uses Wagmi with FutureverseConnector as one of the connectors.
       * This means we can use the same logic for both Wagmi and Custodial transactions.
       */
      if (
        authenticationMethod?.method === 'wagmi' ||
        E.isRight(FVPrefixCustodialType.decode(authenticationMethod?.method))
      ) {
        if (wagmiOptions?.signer == null) {
          throw new Error('Wagmi signer not provided')
        }

        const signer = wagmiOptions.signer

        dispatcher = create(
          ethereumWalletSigner(async (message) => {
            const signature = await signer.signMessage(arrayify(message))
            const signatureR = HexString.decode(signature)
            if (E.isLeft(signatureR)) {
              throw new Error('Expected signature to start with 0x')
            }

            onSignatureSuccess?.()

            return signatureR.right
          }, wagmiOptions.signerOptions)
        )
      }

      if (dispatcher == null) {
        throw new Error('Unsupported authentication method')
      }

      const signAndSend = dispatcher.signAndSend

      return {
        /**
         * Estimates the fee for an extrinsic.
         *
         * @async
         * @param {Extrinsic} extrinsic - The extrinsic to be estimated.
         * @param {number|undefined} assetId - The asset ID to be used for fees.
         * @returns {Promise<bigint>} The estimated fee.
         *
         * @throws {Error} If an error occurs during the estimation process.
         */
        estimate: dispatcher.estimate,
        /**
         * Signs and sends a given extrinsic, handling specific proxy events for FuturePass or XRPL.
         *
         * @async
         * @param {SubmittableExtrinsic<'promise'>} extrinsic - The extrinsic to be signed and sent.
         * @returns {Promise<Object>} The result of the transaction.
         * @returns {boolean} return.ok - Indicates if the transaction was successful.
         * @returns {Object} [return.value] - Contains details of the transaction if successful.
         * @returns {string} return.value.extrinsicId - The ID of the extrinsic.
         * @returns {string} return.value.transactionHash - The hash of the transaction.
         * @returns {ExtrinsicEvent[]} return.value.events - The extrinsic events of the transaction.
         * @returns {Error} [return.value] - An error object if the transaction failed.
         *
         * @throws {Error} If an error occurs during the signing or sending process.
         */
        signAndSend: async (extrinsic: SubmittableExtrinsic<'promise'>) => {
          const result = await signAndSend(extrinsic)
          if (!result.ok) return result

          /*
           * In FuturePass or XRPL proxied calls, we need to check each of the events for an error.
           */
          const proxyEvents = filterExtrinsicEvents(result.value.events, [
            'proxy.ProxyExecuted',
            'xrpl.XRPLExtrinsicExecuted',
          ]).filter((event): event is ExtrinsicEvent => !!event)

          proxyEvents.forEach((event) => {
            const proxyType = event.name.startsWith('xrpl')
              ? 'XRPL'
              : 'FuturePass'

            const proxyResult = hush(ProxyResult.decode(event.data.result))

            if (ProxyErrResult.is(proxyResult)) {
              const { section, name, docs } = trnApi.registry.findMetaError({
                index: new BN(proxyResult.err.module.index),
                error: hexToU8a(proxyResult.err.module.error),
              })

              return {
                ok: false,
                value: new Error(
                  `${proxyType} proxied extrinsic sending failed, [${section}.${name}]: ${docs.join(
                    ', '
                  )}`
                ),
              }
            }
          })

          return {
            ok: true as const,
            value: {
              extrinsicId: result.value.id,
              transactionHash: result.value.result.txHash.toString(),
              events: result.value.events,
            },
          }
        },
      }
    },
    [
      trnApi,
      userSession,
      authenticationMethod,
      contextXamanLoginAdapter,
      futurePassAccount,
      isLinkedFuturepass,
    ]
  )

  return {
    trnApi,
    createTrnDispatcher,
  }
}

export const { Provider: TrnApiProvider, useContainer: useTrnApi } =
  createContainer(useTrnApiImpl, {
    componentName: 'TrnApiProvider',
  })
