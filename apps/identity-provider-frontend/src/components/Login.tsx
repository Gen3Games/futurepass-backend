import * as sdk from '@futureverse/experience-sdk'
import { useXamanClient, Xaman } from '@futureverse/react-sdk'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { SiweMessage } from 'siwe'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { CreatedPayload } from 'xumm-sdk/dist/src/types'
import { a2hex } from '../common'
import { environment } from '../environments/environment'
import XamanQrCode from './XamanQrCode'
import {
  CustomNetworkWarning,
  FuturePassInfo,
  TenantLogo,
  Icon,
  MetamaskInstallPrompt,
  ProgressIndicator,
  RoundedButton,
  WalletButton,
} from '.'

export type ConnectorType =
  | 'metamask'
  | 'walletconnect'
  | 'coinbasewallet'
  | 'xaman'

function getConnectorName(connectorType: ConnectorType): string {
  switch (connectorType) {
    case 'metamask':
      return 'MetaMask/EVM'
    case 'walletconnect':
      return 'WalletConnect'
    case 'coinbasewallet':
      return 'Coinbase Wallet'
    case 'xaman':
      return 'Xaman'
  }
}

type DisabledCustodialProvider = {
  id: string
  icon: React.ComponentProps<typeof Icon>['icon']
  label: string
}

const DISABLED_CUSTODIAL_PROVIDERS: DisabledCustodialProvider[] = [
  {
    id: 'facebook',
    icon: 'Facebook',
    label: 'Facebook',
  },
  {
    id: 'twitter',
    icon: 'TwitterLogo',
    label: 'X',
  },
  {
    id: 'tiktok',
    icon: 'TiktokLogo',
    label: 'TikTok',
  },
  {
    id: 'apple',
    icon: 'AppleLogo',
    label: 'Apple',
  },
]

const detectInstalledWeb3Wallets = () => {
  return {
    isMetamaskDetected: !!window.ethereum?.isMetaMask,
    isCoinbaseWalletDetected:
      window.ethereum?.isCoinbaseWallet ??
      !!window.ethereum?.providers?.some(
        (provider) => provider.isCoinbaseWallet
      ),
  }
}

const XAMAN_API_KEY = environment.NX_PUBLIC_XAMAN_API_KEY

const Login = ({
  isXamanEnabled,
  isCustodialOnFvloginEnabled,
}: {
  isXamanEnabled: boolean
  isCustodialOnFvloginEnabled: boolean
}): JSX.Element => {
  const { connectAsync, connectors } = useConnect()
  const { isMetamaskDetected, isCoinbaseWalletDetected } =
    detectInstalledWeb3Wallets()
  const [isWeb3Login, setIsWeb3Login] = React.useState<boolean>(true)

  const [isConnectingTo, setConnectingTo] =
    React.useState<ConnectorType | null>(null)

  const { disconnect } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const [error, setError] = React.useState(false)

  const [xamanPayload, setXamanPayload] = React.useState<CreatedPayload | null>(
    null
  )
  const [showInstallConnector, setShowInstallConnector] =
    React.useState<ConnectorType | null>(null)
  const [showInfo, setShowInfo] = React.useState<boolean>(false)
  const [showNetworkWarning, setShowNetworkWarning] =
    React.useState<boolean>(false)

  const isBrowser = typeof window !== 'undefined'
  const userAgent = isBrowser ? navigator.userAgent : ''
  const isAndroid = /(Android)/i.test(userAgent)
  const isIphone = /(iPhone|iPod)/i.test(userAgent)
  const isIpad = /(iPad)/i.test(userAgent)
  const isMobile = isIphone || isAndroid || isIpad

  const { t: translate } = useTranslation()

  const xamanErrorHandler = React.useCallback(
    (_: Error) => {
      setError(true)
    },
    [setError]
  )

  const { xamanClient } = useXamanClient(XAMAN_API_KEY, {
    xummPkceEvents: {
      error: xamanErrorHandler,
    },
  })
  const { xamanLoginAdapter } = Xaman.useXamanLoginAdapter(xamanClient, {
    xummPkceEventKeys: ['error'],
  })

  const getCsrfToken = React.useCallback(async (type: 'xrpl' | 'siwe') => {
    const res = await fetch(`/login/${type}/nonce`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const dataR = t.type({ nonce: t.string }).decode(await res.json())
    return dataR
  }, [])

  const xamanLogin = React.useCallback(async () => {
    if (!isXamanEnabled) {
      return
    }
    await xamanLoginAdapter.connect('Xaman')
    const { eoa, publicKey, transaction } =
      await xamanLoginAdapter.getEthAccount('Xaman', {
        onCreated: (payload) => setXamanPayload(payload),
      })

    if (transaction == null) throw new Error('transaction is null')

    if (publicKey == null) throw new Error('publicKey is null')

    const csrfToken = await getCsrfToken('xrpl')
    if (E.isLeft(csrfToken)) {
      setError(true)
      return
    }

    const signInRes = await fetch('/login/xrpl/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken.right.nonce,
      },
      body: JSON.stringify({
        eoa,
        transaction,
        publicKey,
      }),
    })
    const signInRedirect = t
      .type({ redirectTo: t.string })
      .decode(await signInRes.json())

    if (E.isLeft(signInRedirect)) {
      setError(true)
      return
    }

    window.location.href = signInRedirect.right.redirectTo
  }, [getCsrfToken, isXamanEnabled, xamanLoginAdapter])

  const connectWallet = React.useCallback(
    async (connectorType: ConnectorType, customNetworksConfirmed?: boolean) => {
      try {
        setConnectingTo(connectorType)
        if (connectorType === 'xaman') {
          await xamanLogin()
          return
        }
        const connector = connectors.find(
          (wallet) => wallet.id.toLowerCase() === connectorType
        )

        if (connector == null) return
        if (connector.id === 'walletConnect' && customNetworksConfirmed)
          return setShowNetworkWarning(true)

        await connectAsync({ connector })
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          connectorType === 'metamask' &&
          e.message === 'Connector not found'
        ) {
          setShowInstallConnector(connectorType)
        }
      } finally {
        setConnectingTo(null)
      }
    },
    [connectors, xamanLogin, connectAsync]
  )

  const signIn = React.useCallback(
    async (address: `0x${string}` | undefined) => {
      try {
        const csrfToken = await getCsrfToken('siwe')
        if (E.isLeft(csrfToken)) {
          // TODO: show error when UI will be ready.
          return
        }

        const message = new SiweMessage({
          domain: window.location.host,
          address,
          statement: 'Sign in with Ethereum to the app.',
          uri: window.location.origin,
          version: '1',
          chainId: sdk.ENVIRONMENTS.production.chain.id,
          nonce: a2hex(csrfToken.right.nonce),
        })

        const signature = await signMessageAsync({
          message: message.prepareMessage(),
        })

        const signInRes = await fetch('/login/siwe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken.right.nonce,
          },
          body: JSON.stringify({
            message: JSON.stringify(message),
            signature,
          }),
        })

        const signInRedirect = t
          .type({ redirectTo: t.string })
          .decode(await signInRes.json())

        if (E.isLeft(signInRedirect)) {
          // TODO: show error;
          return
        }

        window.location.href = signInRedirect.right.redirectTo
      } catch (e) {
        setError(true)
      }
    },
    [getCsrfToken, signMessageAsync]
  )

  const onNetworkWarningClick = React.useCallback(
    (supportsCustomNetworks: boolean) => {
      setShowNetworkWarning(false)
      if (supportsCustomNetworks) {
        void connectWallet('walletconnect', false)
      }
    },
    [connectWallet]
  )

  const { address } = useAccount({
    // eslint-disable-next-line @typescript-eslint/no-shadow, @typescript-eslint/no-misused-promises -- ''
    onConnect: async ({ address }) => signIn(address),
  })

  if (showInstallConnector != null) {
    return (
      <div className="container">
        <MetamaskInstallPrompt
          connectorType={showInstallConnector}
          onClickGoback={() => setShowInstallConnector(null)}
        />
      </div>
    )
  }

  if (showInfo) {
    return (
      <div className="container">
        <FuturePassInfo onClick={() => setShowInfo((state) => !state)} />
      </div>
    )
  }

  if (showNetworkWarning) {
    return (
      <div className="container">
        <CustomNetworkWarning onClick={onNetworkWarningClick} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div
          id="login-error"
          className="login-error flex flex-col flex-grow-1 w-fit h-fit gap-normal md:gap-extraLarge border-colorQuaternary border-[1px] border-solid py-[40px] px-[70px]"
        >
          <div
            id="login-error__header"
            className="login-error__header flex flex-col items-center gap-normal md:gap-small"
          >
            <Icon
              id="login-error__header_icon"
              className="login-error__header_icon icon-right"
              icon="Warning"
              size={32}
              color="colorPrimary"
            />
            <h1
              id="login-error__header_message"
              className="login-error__header_message text-fontLarge md:text-fontExtraLarge text-colorPrimary font-light leading-[1.2] text-center"
            >
              {translate('login-error.login-error__header_message')}
            </h1>
          </div>
          <div
            id="login-error__content"
            className="login-error__content flex flex-col text-center font-ObjektivMk1Medium gap-normal"
          >
            <p
              id="login-error__content_message"
              className="login-error__content_message max-w-[296px] md:max-w-[500px] text-colorTertiary font-ObjektivMk1Medium text-sm font-normal leading-5 mt-[20px]"
            >
              {translate('login-error.login-error__content_message')}
            </p>
          </div>
          <div
            id="login-error__content_buttons"
            className="login-error__content_buttons flex flex-col gap-extraSmall w-full justify-center md:gap-medium md:flex-row"
          >
            <RoundedButton
              id="login-error__content_back-button"
              className="login-error__content_back-button"
              variant="no-border"
              onClick={() => {
                disconnect()
                setError(false)
                setConnectingTo(null)
              }}
            >
              {translate('login-error.login-error__content_back-button')}
            </RoundedButton>
            <RoundedButton
              id="login-error__content_try-again-button"
              className="login-error__content_try-again-button"
              variant="outlined"
              onClick={() => void signIn(address)}
            >
              {translate('login-error.login-error__content_try-again-button')}
            </RoundedButton>
          </div>
          <div
            id="login-error__tenant-logo"
            className="login-error__tenant-logo w-full flex flex-row items-center justify-center"
          >
            <TenantLogo onClick={() => setShowInfo((state) => !state)} />
          </div>
        </div>
      </div>
    )
  }

  if (isConnectingTo != null) {
    if (isConnectingTo === 'xaman' && xamanPayload != null) {
      return <XamanQrCode payload={xamanPayload} />
    }
    return (
      <ProgressIndicator
        title={translate('progress-indicator.progress-indicator__title', {
          targetSSO: getConnectorName(isConnectingTo),
        })}
        text={translate('progress-indicator.progress-indicator__text')}
      />
    )
  }

  // custodial options
  if (!isWeb3Login) {
    return (
      <div
        id="login-custodial"
        className="login-custodial flex container mt-auto mb-auto flex-col min-w-[300px] md:min-w-[400px] rounded-sm p-[20px] border-[2px] border-solid border-colorQuaternary"
      >
        <div
          id="login-custodial__header"
          className="login-custodial__header flex flex-col text-center font-ObjektivMk1Medium gap-normal mb-5"
        >
          <h1
            id="login-custodial__header_message"
            className="login-custodial__header_message text-lg text-colorPrimary font-bold"
          >
            {translate('login-custodial.login-custodial__header_message')}
          </h1>
        </div>

        <div
          id="login-custodial__content"
          className="login-custodial__content flex flex-col w-full gap-medium items-center my-[10px]"
        >
          <RoundedButton
            variant="outlined"
            onClick={() => {
              window.location.href = `/login/email/redirect`
            }}
            id="login-custodial__content_email-button"
            className="login-custodial__content_email-button w-full"
          >
            <div className="flex flex-row items-center justify-center align-middle">
              <Icon icon="Email" size={30} className="mr-2" />
              {translate(
                'login-custodial.login-custodial__content_email-button'
              )}
            </div>
          </RoundedButton>

          <RoundedButton
            variant="contained"
            onClick={() => {
              window.location.href = `/login/social/google`
            }}
            id="login-custodial__content_google-button"
            className="login-custodial__content_google-button w-full"
          >
            <div className="flex flex-row items-center justify-center align-middle">
              <Icon icon="Google" size={30} className="mr-2" />
              {translate(
                'login-custodial.login-custodial__content_google-button'
              )}
            </div>
          </RoundedButton>

          <div className="login-custodial__content_disabled-providers grid w-full grid-cols-1 gap-normal md:grid-cols-2">
            {DISABLED_CUSTODIAL_PROVIDERS.map((provider) => {
              return (
                <RoundedButton
                  key={provider.id}
                  variant="contained"
                  disabled
                  id={`login-custodial__content_${provider.id}-button`}
                  className="w-full border-colorQuaternary bg-colorQuaternary/20 text-colorQuaternary opacity-70"
                >
                  <div className="flex flex-row items-center justify-center align-middle">
                    <Icon icon={provider.icon} size={30} className="mr-2" />
                    {provider.label}
                  </div>
                </RoundedButton>
              )
            })}
          </div>

          <p className="text-center font-ObjektivMk1Medium text-fontExtraSmall text-colorTertiary">
            Other sign-in providers are temporarily unavailable.
          </p>
        </div>

        <div className="flex flex-col items-center gap-normal">
          <div className="max-w-[296px] mt-[20px]">
            <p
              id="login-custodial__content_alternatively"
              className="login-custodial__content_alternatively font-ObjektivMk1Medium font-normal text-xs text-colorTertiary"
            >
              {translate(
                'login-custodial.login-custodial__content_alternatively'
              )}
            </p>
          </div>

          <RoundedButton
            variant="no-border"
            onClick={() => void setIsWeb3Login((s) => !s)}
            id="login-custodial__content_switch-mode-button"
            className="login-custodial__content_switch-mode-button py-[10px]"
          >
            <div className="container gap-extraLarge">
              <Icon icon="Wallet" size={20} className="mr-small" />
              {isWeb3Login
                ? translate(
                    'login-custodial.login-custodial__content_switch-mode-button.custodial'
                  )
                : translate(
                    'login-custodial.login-custodial__content_switch-mode-button.non-custodial'
                  )}
            </div>
          </RoundedButton>
        </div>

        <div
          id="login-custodial__content_fv-logo"
          className="login-custodial__content_fv-logo flex flex-row justify-center items-center mt-[15px] mb-2"
        >
          <TenantLogo />
        </div>
      </div>
    )
  }

  // non-custodial options
  return (
    <div
      id="login-non-custodial"
      className="login-non-custodial flex container mt-auto mb-auto flex-col min-w-[300px] md:min-w-[400px] rounded-sm p-[20px] border-[2px] border-solid border-colorQuaternary"
    >
      <div
        id="login-non-custodial__header"
        className="login-non-custodial__header flex flex-col text-center font-ObjektivMk1Medium gap-normal mb-5"
      >
        <h1
          id="login-non-custodial__header_message"
          className="login-non-custodial__header_message text-lg text-colorPrimary font-bold"
        >
          {translate('login-non-custodial.login-non-custodial__header_message')}
        </h1>
      </div>
      <div className="login-non-custodial__content flex flex-col w-full gap-extraSmall items-center px-[20px]">
        {!isMobile && (
          <WalletButton
            text={translate(
              'login-non-custodial.login-non-custodial__content_metamask-button'
            )}
            subText={
              isMetamaskDetected
                ? translate(
                    'login-non-custodial.login-non-custodial__content_installed'
                  )
                : undefined
            }
            icon="MetamaskColor"
            onClick={() => void connectWallet('metamask')}
            className="login-non-custodial__content_metamask-button"
          />
        )}

        <WalletButton
          text={translate(
            'login-non-custodial.login-non-custodial__content_walletconnect-button'
          )}
          icon="WalletconnectBlue"
          onClick={() => void connectWallet('walletconnect')}
          className="login-non-custodial__content_walletconnect-button"
        />

        {isXamanEnabled && (
          <WalletButton
            text={translate(
              'login-non-custodial.login-non-custodial__content_xaman-button'
            )}
            icon="Xaman"
            onClick={() => void connectWallet('xaman')}
            className="login-non-custodial__content_xaman-button"
          />
        )}

        <WalletButton
          text={translate(
            'login-non-custodial.login-non-custodial__content_coinbase-button'
          )}
          subText={
            isCoinbaseWalletDetected
              ? translate(
                  'login-non-custodial.login-non-custodial__content_installed'
                )
              : undefined
          }
          icon="CoinBase"
          onClick={() => void connectWallet('coinbasewallet')}
          className="login-non-custodial__content_coinbase-button"
        />
      </div>

      {isCustodialOnFvloginEnabled && (
        <div className="flex flex-col items-center gap-normal">
          <div className="max-w-[296px] mt-[20px]">
            <p className="login-non-custodial__content_alternatively font-ObjektivMk1Medium font-normal text-xs text-colorTertiary">
              {translate(
                'login-non-custodial.login-non-custodial__content_alternatively'
              )}
            </p>
          </div>

          <RoundedButton
            variant="no-border"
            onClick={() => void setIsWeb3Login((s) => !s)}
            className="login-non-custodial__content_switch-mode-button hover:bg-colorSecondary"
          >
            <div className="container gap-extraLarge">
              <Icon icon="Wallet" size={20} className="mr-small" />
              {isWeb3Login
                ? translate(
                    'login-non-custodial.login-non-custodial__content_switch-mode-button.custodial'
                  )
                : translate(
                    'login-non-custodial.login-non-custodial__content_switch-mode-button.non-custodial'
                  )}
            </div>
          </RoundedButton>
        </div>
      )}

      <div className="login-non-custodial__content_fv-logo flex flex-row justify-center items-center mt-[15px] mb-2">
        <TenantLogo />
      </div>
    </div>
  )
}

export default Login
