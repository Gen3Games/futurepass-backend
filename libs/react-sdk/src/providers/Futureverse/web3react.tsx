import { CoinbaseWallet as Web3React_CoinbaseWallet } from '@web3-react/coinbase-wallet'
import { initializeConnector, Web3ReactProvider } from '@web3-react/core'
import { MetaMask as Web3React_MetaMask } from '@web3-react/metamask'
import { WalletConnect as Web3React_WalletConnectV2 } from '@web3-react/walletconnect-v2'
import { useCallback, useMemo } from 'react'
import { useWeb3ReactLoginAdapter } from '../../hooks/loginAdapters/useWeb3ReactLoginAdapter'
import {
  CustomizeContext,
  LoginFn,
  LogoutFn,
  useFutureverse,
  Web3ProviderProps,
} from './context'

export const Web3ReactWeb3Provider = (
  props: Web3ProviderProps
): JSX.Element => {
  const { CONSTANTS } = useFutureverse()
  const metaMask = useMemo(
    () => initializeConnector((actions) => new Web3React_MetaMask({ actions })),
    []
  )
  const coinbase = useMemo(
    () =>
      initializeConnector(
        (actions) =>
          new Web3React_CoinbaseWallet({
            actions,
            options: {
              // todo: what is the default url ?
              url: 'https://root.au.rootnet.live/',
              appName: 'Futureverse',
            },
          })
      ),
    []
  )
  const walletConnect = useMemo(() => {
    const supportedChains = props.requiredChains.map(
      (reqChain) => CONSTANTS.CHAINS[reqChain]
    )

    return initializeConnector(
      (actions) =>
        new Web3React_WalletConnectV2({
          actions,
          options: {
            rpcMap: supportedChains.reduce((prev, current) => {
              return {
                ...prev,
                [current.id]: current.rpcUrls.default.http,
              }
            }, {}),
            projectId: props.walletConnectProjectId,
            chains: supportedChains.map((chain) => chain.id),
            showQrModal: true,
          },
        })
    )
  }, [props.requiredChains, props.walletConnectProjectId, CONSTANTS.CHAINS])
  const connectors = useMemo(
    () => [metaMask, coinbase, walletConnect],
    [metaMask, coinbase, walletConnect]
  )

  const loginAdapter = useWeb3ReactLoginAdapter({
    metaMask: metaMask[0],
    coinbase: coinbase[0],
    walletConnect: walletConnect[0],
  })

  const value = useFutureverse()
  const parentLogoutFn = value.logout
  const logout: LogoutFn = useCallback(async () => {
    await parentLogoutFn({
      async onBeforeRedirect() {
        console.info('[web3react] disconnecting due to logout')
        // TODO what to do here?
      },
    })
  }, [parentLogoutFn])

  const parentLoginFn = value.login
  const login: LoginFn = useCallback(
    (opts) => {
      parentLoginFn({ ...opts, adapter: loginAdapter })
    },
    [parentLoginFn, loginAdapter]
  )

  return (
    <Web3ReactProvider key="futurepass" connectors={connectors}>
      <CustomizeContext login={login} logout={logout}>
        {props.children}
      </CustomizeContext>
    </Web3ReactProvider>
  )
}
