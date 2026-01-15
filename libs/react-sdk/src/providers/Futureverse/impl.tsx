import { ApolloClient, InMemoryCache } from '@apollo/client'
import { InMemoryCacheConfig } from '@apollo/client/cache/inmemory/types'
import * as sdk from '@futureverse/experience-sdk'
import { Dialog, useTheme } from '@mui/material'
import * as React from 'react'
import { SiweMessage, generateNonce } from 'siwe'
import { NoMetamaskInstalledModal } from '../../components'
import ConnectWalletModal from '../../components/ConnectWalletModal/ConnectWalletModal'
import { useLocalStorage } from '../../hooks'
import { useXamanLoginAdapter } from '../../hooks/loginAdapters/useXamanLoginAdapter'
import { useXamanClient } from '../../hooks/useXamanClient'
import {
  ConnectorId,
  ILoginAdapter,
  SignMessageCallbacks,
  UserSession,
} from '../../interfaces'
import { FutureverseThemeProvider } from '../FutureverseThemeProvider'
import {
  LoginFn,
  LoginModal,
  LogoutFn,
  ProviderApiKeys,
  RequiredChains,
  Web3ProviderProps,
  context,
} from './context'
import { FutureverseAuthClient, UserState } from './FutureverseAuthClient'

const XAMAN_API_KEYS = {
  production: 'bf2ebdf7-9f18-4c68-bfe3-b647c4da1a9d',
  development: '5376fa18-f6d8-45d6-98df-cfdbc6b3b62b',
}

export type LoginMethod =
  | {
      type: 'eoa'
      address: string
      connector: ConnectorId
    }
  | { type: 'silent'; targetEOA: string | null }
  | { type: 'email' }
  | {
      type: 'social'
      targetSSO: sdk.SocialSSOType
    }
  | { type: 'xaman'; publicKey?: string; eoa?: string; transaction?: string }

type ProviderProps = React.PropsWithChildren<{
  stage: sdk.Stage
  authClient: FutureverseAuthClient
  // Some experiences don't need connected wallets to be able to support TRN yet
  // so we leave it up to the experience to define the chains they need.
  requiredChains?: RequiredChains

  // Each experience will need to provide and manage their own project id. We could consider making this
  // optional and exclude WalletConnect as a connection option if it's undefined.
  walletConnectProjectId: string
  ethereumProviderApiKeys?: ProviderApiKeys
  Web3Provider?: 'web3react' | 'wagmi' | React.ComponentType<Web3ProviderProps>
  graphqlConfig?: {
    uri?: string
    cacheConfig?: InMemoryCacheConfig
  }
  isCustodialLoginEnabled?: boolean
  isXamanLoginEnabled?: boolean
  defaultAuthOptions?: 'web2' | 'web3'
  isTwitterLoginEnabled?: boolean
  isTikTokLoginEnabled?: boolean
  isAppleLoginEnabled?: boolean
}>

export const FutureverseProvider = (props: ProviderProps) => {
  const {
    stage,
    authClient,
    graphqlConfig,
    requiredChains,
    walletConnectProjectId,
    ethereumProviderApiKeys,
    isCustodialLoginEnabled,
    isXamanLoginEnabled = true,
    defaultAuthOptions = 'web3',
    isTwitterLoginEnabled = false,
    isTikTokLoginEnabled = false,
    isAppleLoginEnabled = false,
  } = props
  const [loginModal, setLoginModal] = React.useState<LoginModal | null>(null)
  const [userSession, setUserSession] = React.useState<UserSession | null>(null)

  const eventTargetRef = React.useRef(new EventTarget())

  const [customClientState, setCustomClientState] =
    React.useState<unknown>(null)
  const theme = useTheme()

  const XamanApiKey = React.useMemo(() => {
    if (authClient.environment.idpURL === sdk.ENVIRONMENTS.production.idpURL) {
      return XAMAN_API_KEYS.production
    } else {
      return XAMAN_API_KEYS.development
    }
  }, [authClient.environment.idpURL])

  //pass the error to user
  const [error, setError] = React.useState<Error | null>(null)
  const [xamanEoa, setXamanEoa, removeXamanEoa] = useLocalStorage<
    sdk.Address | undefined
  >('xamanEoa', undefined)
  //TODO: we can expose those event handlers to user as well
  const xamanErrorHandler = React.useCallback(
    (err: Error) => {
      setError(err)
    },
    [setError]
  )

  const { xamanClient } = useXamanClient(XamanApiKey, {
    xummPkceEvents: {
      error: xamanErrorHandler,
    },
  })

  const { xamanLoginAdapter } = useXamanLoginAdapter(xamanClient, {
    xummPkceEventKeys: ['error'],
  })

  /**
   * A React hook callback that attempts to get the Xaman user account with a specified timeout.
   *
   * This function returns a promise that races between the resolution of `xamanClient.user.account` and a timeout.
   * If `xamanClient.user.account` resolves before the timeout, the promise resolves with the user account.
   * If the timeout occurs first, the promise rejects with an error.
   *
   * The reason we need this timeout is because `xamanClient.user.account` doesn't timeout itself
   *
   * @param {number} ms - The timeout duration in milliseconds.
   * @returns {Promise<any>} A promise that resolves with the user account if obtained within the timeout duration, or rejects with an error if the timeout occurs first.
   */

  const getXamanUserWithTimeout = React.useCallback(
    async (ms: number) => {
      return Promise.race([
        xamanClient.user.account,
        new Promise((_, reject) => setTimeout(() => reject(new Error()), ms)),
      ])
    },
    [xamanClient.user.account]
  )

  /**
   * A React effect that handles the Xaman user authentication process.
   * This process includes two different steps.
   * 1. User signs the login request ( by scanning the QR code on desktop or sign directly on mobile using the xaman wallet app)
   * 2. User sgins the sign-in request
   *
   * This effect performs the following actions:
   * 1. Calls `getXamanUserWithTimeout` with a timeout of 5000ms.
   * 2. If the user has signed in (i.e., `xamanClient.user.account` exists):
   *    - If `xamanEoa` is null, the user has not signed the sign-in request. Dispatches an event to start the Xaman login process.
   *    - Otherwise, if `xamanEoa` is not null, the user has already signed the sign-in request. No action is taken.
   * 3. If the user has not scanned the QR code, catches the error and displays the login modal UI to start the normal login process.
   *
   * Dependencies: None, so this hook must be called only once
   */
  React.useEffect(() => {
    void (async () => {
      await getXamanUserWithTimeout(5000)
        .then(() => {
          // user has already scanned the qr code and signed, since the xamanClient.user.account exist
          if (xamanEoa == null) {
            // user has not signed sigin request
            // send signin request, and updatet the UI
            eventTargetRef.current.dispatchEvent(new Event('startXamanLogin'))
          } else {
            // user has already signed sigin request, since the xamanClient eoa exist in local storage
            // do nothing
          }

          return
        })
        .catch(() => {
          // user has not scanned the qr code, we don't care about the error
          // show login modal UI and start the normal login process
          return
        })
    })()
  }, [])

  const CONSTANTS = sdk.getConstantsForStage(stage)

  const apolloClient = React.useMemo(() => {
    return new ApolloClient({
      uri: graphqlConfig?.uri ?? CONSTANTS.ENDPOINTS.ASSET_INDEXER_GRAPHQL_URL,
      cache: new InMemoryCache(graphqlConfig?.cacheConfig),
    })
  }, [
    CONSTANTS.ENDPOINTS.ASSET_INDEXER_GRAPHQL_URL,
    graphqlConfig?.cacheConfig,
    graphqlConfig?.uri,
  ])

  React.useEffect(() => {
    const userStateChange = (
      _: UserState,
      userSessionArg: UserSession | null
    ) => {
      setUserSession(userSessionArg)
    }
    authClient.addUserStateListener(userStateChange)
    return () => {
      authClient.removeUserStateListener(userStateChange)
    }
  }, [authClient])

  const logout: LogoutFn = React.useCallback(
    async (opts?: { onBeforeRedirect?: () => Promise<void> }) => {
      await xamanLoginAdapter.logout()
      removeXamanEoa()
      await authClient.logout(opts)
    },
    [authClient, xamanLoginAdapter, removeXamanEoa]
  )

  const loginImpl = React.useCallback(
    async (
      adapter: ILoginAdapter,
      method: LoginMethod,
      customClientState?: unknown
    ) => {
      const nonce = generateNonce()

      let login_hint: string | undefined
      if (method.type === 'eoa' && method.connector !== 'Xaman') {
        const msg = new SiweMessage({
          version: '1',
          nonce: generateNonce(),
          issuedAt: new Date().toISOString(),
          address: method.address,
          uri: authClient.environment.idpURL,
          domain: typeof window === 'undefined' ? '' : window.location.host,
          chainId: authClient.environment.chain.id,
        })

        const signatureResponse = await adapter.signMessage({
          connectorId: method.connector,
          body: {
            message: msg.toMessage(),
          },
        })

        // capture all params the server needs to reconstruct this SIWE message.
        const params = new URLSearchParams({
          nonce: msg.nonce,
          address: msg.address,
          issuedAt: msg.issuedAt,
          domain: msg.domain, // TODO this should be inferred by client id instead (shortcut!)
          signature: signatureResponse.signature,
        })

        login_hint = 'eoa:' + params.toString()
      }

      if (method.type === 'email') {
        login_hint = 'email:'
      }

      if (method.type === 'social') {
        login_hint = `social:${method.targetSSO}`
      }

      if (method.type === 'xaman') {
        login_hint = `xrpl:${method.publicKey}:eoa:${method.eoa}:transaction:${method.transaction}`
      }

      await authClient.login({
        prompt:
          method.type === 'silent'
            ? 'none'
            : method.type === 'eoa' || method.type === 'xaman'
            ? 'login' // REQUIRED for login_hint to work
            : '',
        nonce,
        login_hint:
          method.type === 'silent' ? method.targetEOA ?? '' : login_hint ?? '',
        scope: 'openid',
        state: customClientState,
      })
    },
    [authClient]
  )

  const login: LoginFn = React.useCallback(
    async (opts) => {
      const adapter = opts?.adapter
      if (adapter == null) {
        throw new Error('login adapter is required')
      }

      setCustomClientState(opts?.customClientState)

      const loginMethod = opts?.loginMethod

      if (loginMethod?.type === 'silent') {
        await loginImpl(
          adapter,
          {
            type: 'silent',
            targetEOA: loginMethod.targetEOA,
          },
          opts?.customClientState
        )
        return
      }

      if (loginMethod?.type === 'email') {
        await loginImpl(adapter, { type: 'email' }, opts?.customClientState)
        return
      }

      if (loginMethod?.type === 'social') {
        await loginImpl(
          adapter,
          {
            type: 'social',
            targetSSO: loginMethod.targetSSO,
          },
          opts?.customClientState
        )
        return
      }

      setLoginModal({
        adapter,
        connect: async (
          connectorId,
          signMessageCallbacks?: SignMessageCallbacks
        ) => {
          if (connectorId === 'Xaman') {
            await xamanLoginAdapter.connect(connectorId)
            const { eoa, publicKey, transaction } =
              await xamanLoginAdapter.getEthAccount(
                connectorId,
                signMessageCallbacks
              )

            if (publicKey == null) throw new Error('publicKey is null')
            if (transaction == null) throw new Error('transaction is null')
            setXamanEoa(eoa)
            await loginImpl(
              adapter,
              {
                type: 'xaman',
                publicKey,
                eoa,
                transaction,
              },
              opts?.customClientState
            )
          } else {
            const address = await adapter.connect(connectorId)
            await loginImpl(
              adapter,
              {
                type: 'eoa',
                address,
                connector: connectorId,
              },
              opts?.customClientState
            )
          }
        },
      })
    },
    [loginImpl, xamanLoginAdapter, setXamanEoa]
  )

  const [isNoMetamaskInstalledModalOpen, setIsNoMetamaskInstalledModalOpen] =
    React.useState(false)

  const [Web3Provider, setWeb3Provider] =
    React.useState<React.ComponentType<Web3ProviderProps> | null>(null)

  React.useEffect(() => {
    if (
      props.Web3Provider === 'wagmi' ||
      props.Web3Provider == null /* default */
    ) {
      void import('./wagmi').then((x) => {
        setWeb3Provider(() => x.WagmiWeb3Provider)
      })
      return
    }

    if (props.Web3Provider === 'web3react') {
      void import('./web3react').then((x) => {
        setWeb3Provider(() => x.Web3ReactWeb3Provider)
      })
      return
    }

    const provider = props.Web3Provider ?? NoWeb3Provider
    setWeb3Provider(() => provider)
  }, [props.Web3Provider])

  React.useEffect(() => {
    if (Web3Provider == null) return
    void authClient.loadUser()
  }, [Web3Provider, authClient])

  return (
    <context.Provider
      value={{
        userSession,
        logout,
        login,
        loginModal,
        apolloClient,
        authClient,
        CONSTANTS,
        xamanClient,
        error,
      }}
    >
      <FutureverseThemeProvider>
        <Dialog
          id="connect-wallet-dialog"
          PaperProps={{
            sx: {
              [theme.breakpoints.down('md')]: {
                alignItems: 'flex-start',
                height: '100%',
              },
            },
          }}
          open={loginModal != null && !isNoMetamaskInstalledModalOpen}
          slotProps={{
            root: {
              style: {
                /**
                 * We set this to one less than default WalletConnect Web3Modal zIndex so that the
                 * qrCode isn't hidden by the "Waiting to connect..." UI.
                 * See https://github.com/WalletConnect/web3modal/blob/c1fa14b4e1425695a6cafb98185fa162574b6e56/packages/ui/src/utils/ThemeUtil.ts#LL35C27-L35C27
                 */
                background: 'black',
                zIndex: 88,
              },
            },
          }}
        >
          <ConnectWalletModal
            isCustodialLoginEnabled={!!isCustodialLoginEnabled}
            isXamanLoginEnabled={!!isXamanLoginEnabled}
            handleConnect={async (connectorId, signMessageCallbacks) => {
              await loginModal?.connect(connectorId, signMessageCallbacks)
            }}
            handleNoMetamaskInstalled={() =>
              setIsNoMetamaskInstalledModalOpen(true)
            }
            handleLogin={login}
            customClientState={customClientState}
            eventTargetRef={eventTargetRef}
            defaultAuthOptions={defaultAuthOptions}
            showSdkVersion={stage !== 'production'}
            isTwitterLoginEnabled={isTwitterLoginEnabled}
            isTikTokLoginEnabled={isTikTokLoginEnabled}
            isAppleLoginEnabled={isAppleLoginEnabled}
          />
        </Dialog>
        <Dialog open={isNoMetamaskInstalledModalOpen}>
          <NoMetamaskInstalledModal
            handleGoBack={() => setIsNoMetamaskInstalledModalOpen(false)}
          />
        </Dialog>
      </FutureverseThemeProvider>

      {/* wait for it to load */}
      {Web3Provider == null ? null : (
        <Web3Provider
          userSession={userSession}
          environment={authClient.environment}
          requiredChains={
            requiredChains == null || requiredChains.length === 0
              ? ['ETHEREUM']
              : requiredChains
          }
          walletConnectProjectId={walletConnectProjectId}
          ethereumProviderApiKeys={ethereumProviderApiKeys}
        >
          {props.children}
        </Web3Provider>
      )}
    </context.Provider>
  )
}

const NoWeb3Provider: React.FC<Web3ProviderProps> = (props) => {
  return <div>{props.children}</div>
}
