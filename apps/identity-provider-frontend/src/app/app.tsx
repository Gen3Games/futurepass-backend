// App.js
import '../styles/global.css'
import * as sdk from '@futureverse/experience-sdk'
import { LoggerProvider } from '@futureverse/stateboss'
import * as L from '@sylo/logger'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import {
  configureChains,
  createClient,
  mainnet,
  sepolia,
  WagmiConfig,
} from 'wagmi'

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'

import { Layout, ErrorContextProvider } from '../components'
import { environment } from '../environments/environment'
import Index from '../pages'

import ErrorHandler from '../pages/error'
import FVLogin from '../pages/fvlogin'
import FVLogout from '../pages/fvlogout'
import TwoFactorAuthSms from '../pages/login/auth/sms'
import CustodialAuthPage from '../pages/login/CustodialAuthPage'
import Terms from '../pages/login/terms'
import ManageClients from '../pages/manageclients'
import UnsupportedBrowser from '../pages/unsupported-browser'

const hcaptchaSiteKey = environment.NX_PUBLIC_HCAPTCHA_SITE_KEY
const walletConnectProjectId = environment.NX_PUBLIC_WALLET_CONNECT_PROJECT_ID
const enableCustodialSupport = environment.NX_PUBLIC_ENABLE_CUSTODIAL_SUPPORT

// TODO: is this still used? Do we need to refine the chains here? If so how?
const { chains, provider, webSocketProvider } = configureChains(
  [sdk.CHAINS.TRN.PORCINI, sdk.CHAINS.TRN.MAINNET, sepolia, mainnet],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        const http = chain.rpcUrls.default.http[0]
        return { http }
      },
    }),
  ]
)

const client = createClient({
  // TODO which connectors will we support?
  // TODO remember which connector we used during login and auto-connect to it
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: walletConnectProjectId,
      },
    }),
    new CoinbaseWalletConnector({ chains, options: { appName: 'FuturePass' } }),
  ],
  provider,
  webSocketProvider,
})

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Index />,
    },
    {
      path: '/fvlogin',
      element: <FVLogin />,
    },
    {
      path: '/login/social',
      element: (
        <CustodialAuthPage enableCustodialSupport={enableCustodialSupport} />
      ),
    },
    {
      path: '/login/email',
      element: (
        <CustodialAuthPage enableCustodialSupport={enableCustodialSupport} />
      ),
    },
    {
      path: '/login/terms',
      element: <Terms sitekey={hcaptchaSiteKey} />,
    },
    {
      path: '/login/auth/sms',
      element: <TwoFactorAuthSms />,
    },
    {
      path: '/logout',
      element: <FVLogout />,
    },
    {
      path: '/manageclients',
      element: <ManageClients />,
    },
    {
      path: '/unsupported-browser',
      element: <UnsupportedBrowser />,
    },
    {
      path: '/error/:errorCode?',
      element: <ErrorHandler />,
    },
  ])

  return (
    <main>
      <ErrorContextProvider>
        <LoggerProvider logger={L.consoleLogger}>
          <WagmiConfig client={client}>
            <Layout>
              <RouterProvider router={router} />
            </Layout>
          </WagmiConfig>
        </LoggerProvider>
      </ErrorContextProvider>
    </main>
  )
}

export default App
