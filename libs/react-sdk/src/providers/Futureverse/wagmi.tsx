import { JsonRpcProvider } from '@ethersproject/providers'
import * as sdk from '@futureverse/experience-sdk'
import { FutureverseConnector } from '@futureverse/experience-sdk/wagmi'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import * as Wagmi from 'wagmi'
import { WagmiConfig } from 'wagmi'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { useWagmiLoginAdapter } from '../../hooks/loginAdapters/useWagmiLoginAdapter'
import {
  CustomizeContext,
  LoginFn,
  LogoutFn,
  Web3ProviderProps,
  useFutureverse,
} from './context'

export const WagmiWeb3Provider = (props: Web3ProviderProps): JSX.Element => {
  const { userSession, environment, walletConnectProjectId } = props

  const { CONSTANTS } = useFutureverse()

  const wagmiClient = useMemo(() => {
    const wagmiConfig = Wagmi.configureChains(
      [
        sdk.CHAINS.ETHEREUM.SEPOLIA,
        sdk.CHAINS.ETHEREUM.HOMESTEAD,
        sdk.CHAINS.TRN.PORCINI,
        sdk.CHAINS.TRN.MAINNET,
        // sdk.CHAINS.TRN.DEVNET_PORCINI,
      ],
      [
        jsonRpcProvider({
          rpc: (chain) => ({
            http:
              chain.rpcUrls.public.http[0] ??
              /**
               * This will throw if it sees an invalid chainId. Should never happen as we define chain.rpcUrls.public.http[0]
               * for each supported chain. If it does something is seriously wrong with the config.
               */
              sdk.resolveSupportedChainRpcHttpUrl(chain.id),
          }),
          priority: 0,
        }),
        // TODO: add these in when we have api keys
        // infuraProvider({ apiKey: '', priority: 1 }),
        // alchemyProvider({
        //   apiKey: '',
        //   priority: 2,
        // }),
      ]
    )

    // WalletConnectV2 implements session restrictions based on chain requirements so we have a separate config for it.
    const walletConnectWagmiConfig = Wagmi.configureChains(
      props.requiredChains.map((chain) => CONSTANTS.CHAINS[chain]),
      [
        jsonRpcProvider({
          rpc: (chain) => ({
            http:
              chain.rpcUrls.public.http[0] ??
              /**
               * This will throw if it sees an invalid chainId. Should never happen as we define chain.rpcUrls.public.http[0]
               * for each supported chain. If it does something is seriously wrong with the config.
               */
              sdk.resolveSupportedChainRpcHttpUrl(chain.id),
          }),
          priority: 0,
        }),
      ]
    )
    return Wagmi.createClient({
      autoConnect: true,
      connectors: [
        new MetaMaskConnector({
          chains: wagmiConfig.chains,
          options: {
            shimDisconnect: true,
            // Allows selecting a different account when reconnecting to MetaMask
            UNSTABLE_shimOnConnectSelectAccount: true,
          },
        }),
        new CoinbaseWalletConnector({
          chains: wagmiConfig.chains,
          options: {
            appName: 'FuturePass', // TODO should experience app control this?
            appLogoUrl: '',
          },
        }),
        new WalletConnectConnector({
          chains: walletConnectWagmiConfig.chains,
          options: {
            projectId: walletConnectProjectId,
          },
        }),
        ...(userSession?.eoa == null || userSession.custodian !== 'fv'
          ? []
          : [
              new FutureverseConnector({
                chains: wagmiConfig.chains,
                options: {
                  user: {
                    // we reconstruct this to have only primitives in
                    // the hook input deps
                    eoa: userSession.eoa,
                    chainId: userSession.chainId,
                    custodian: userSession.custodian,
                    futurepass: userSession.futurepass,
                  },
                  environment,
                  getProvider(config) {
                    const chain =
                      config?.chainId == null
                        ? environment.chain
                        : (() => {
                            const chainId =
                              config.chainId ?? this.environment.chain.id
                            for (const chain of Object.values({
                              ...sdk.CHAINS.ETHEREUM,
                              ...sdk.CHAINS.TRN,
                            })) {
                              if (chain.id === chainId) return chain
                            }
                            throw new Error(
                              'Chain not supported; id=' + config.chainId
                            )
                          })()
                    return new JsonRpcProvider(
                      sdk.resolveSupportedChainRpcHttpUrl(chain.id) ??
                        chain.rpcUrls.default.http[0]
                    )
                  },
                },
              }),
            ]),
      ],
      // We can leave config provider as the general one as if the user is using WalletConnect the selected chains will be a subset of all chains
      provider: wagmiConfig.provider,
    })
  }, [
    props.requiredChains,
    walletConnectProjectId,
    userSession?.eoa,
    userSession?.custodian,
    userSession?.chainId,
    environment,
    CONSTANTS.CHAINS,
  ])
  return (
    <WagmiConfig client={wagmiClient}>
      <WagmiWeb3ProviderInner>{props.children}</WagmiWeb3ProviderInner>
    </WagmiConfig>
  )
}

function WagmiWeb3ProviderInner(props: PropsWithChildren) {
  const { adapter: loginAdapter } = useWagmiLoginAdapter()
  const { disconnectAsync } = Wagmi.useDisconnect()

  const value = useFutureverse()

  const parentLogoutFn = value.logout
  const logout: LogoutFn = useCallback(async () => {
    await parentLogoutFn({
      async onBeforeRedirect() {
        console.info('[wagmi] disconnecting due to logout')
        await disconnectAsync().catch((e) => {
          console.warn('[wagmi] failed to disconnect', e)
        })
      },
    })
  }, [parentLogoutFn, disconnectAsync])

  const parentLoginFn = value.login
  const login: LoginFn = useCallback(
    (opts) => {
      parentLoginFn({ ...opts, adapter: loginAdapter })
    },
    [parentLoginFn, loginAdapter]
  )

  return (
    <CustomizeContext login={login} logout={logout}>
      {props.children}
    </CustomizeContext>
  )
}
