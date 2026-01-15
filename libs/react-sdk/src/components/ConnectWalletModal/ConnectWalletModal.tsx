import { SocialSSOType } from '@futureverse/experience-sdk'
import { Box, Card, Link, styled } from '@mui/material'
import * as React from 'react'
import { CreatedPayload } from 'xumm-sdk/dist/src/types'
import {
  ConnectorId,
  ILoginAdapter,
  SignMessageCallbacks,
} from '../../interfaces'
import { LoginFn, LoginMethod } from '../../providers'
import {
  Button,
  IconFactory,
  IconFont,
  IconType,
  Loader,
  Typography,
} from '../index'

import UnsupportedNetwork from './UnsupportedNetwork'
import XamanQrCode from './XamanQrCode'

type ConnectWalletOption = {
  name: string
  iconType: IconType
  connectorId: ConnectorId
}

const CONNECT_WALLET_OPTION_LIST: ConnectWalletOption[] = [
  { name: 'MetaMask', iconType: 'Metamask', connectorId: 'MetaMask' },
  {
    name: 'WalletConnect',
    iconType: 'WalletConnect',
    connectorId: 'WalletConnect',
  },
  { name: 'Xaman', iconType: 'Xaman', connectorId: 'Xaman' },
  { name: 'Coinbase Wallet', iconType: 'Coinbase', connectorId: 'Coinbase' },
]

const detectInstalledWeb3Wallets = () => {
  return {
    isWebMetaMaskDetected: !!window.ethereum?.isMetaMask,
    isCoinbaseWalletDetected:
      window.ethereum?.isCoinbaseWallet ??
      !!window.ethereum?.providers?.some(
        (provider) => provider.isCoinbaseWallet
      ),
  }
}

export type Props = {
  isCustodialLoginEnabled: boolean
  isXamanLoginEnabled: boolean
  customClientState?: unknown
  defaultAuthOptions?: 'web2' | 'web3'
  eventTargetRef: React.MutableRefObject<EventTarget>
  showSdkVersion: boolean
  isTwitterLoginEnabled: boolean
  isTikTokLoginEnabled: boolean
  isAppleLoginEnabled: boolean
  handleConnect: (
    connectorId: ConnectorId,
    signMessageCallbacks?: SignMessageCallbacks
  ) => Promise<void>
  handleNoMetamaskInstalled: () => void
  handleLogin: LoginFn
}

const ConnectWalletModal = ({
  isCustodialLoginEnabled,
  isXamanLoginEnabled = true,
  customClientState,
  eventTargetRef,
  defaultAuthOptions = 'web3',
  showSdkVersion,
  isTwitterLoginEnabled,
  isTikTokLoginEnabled,
  isAppleLoginEnabled,
  handleConnect,
  handleNoMetamaskInstalled,
  handleLogin,
}: Props): JSX.Element => {
  const [isConnecting, setConnecting] = React.useState(false)
  const [isShowingFuturePassExplanation, setIsShowingFuturePassExplanation] =
    React.useState(false)
  const [selectedWallet, setSelectedWallet] =
    React.useState<ConnectWalletOption | null>(null)
  const [xamanPayload, setXamanPayload] = React.useState<CreatedPayload | null>(
    null
  )
  const [unsupportedChainsError, setUnsupportedChainsError] =
    React.useState(false)
  const { isWebMetaMaskDetected, isCoinbaseWalletDetected } =
    detectInstalledWeb3Wallets()
  const [isShowingWeb3AuthOptionsFirst, setIsShowingWeb3AuthOptionsFirst] =
    React.useState(
      defaultAuthOptions === 'web3' &&
        (isWebMetaMaskDetected || isCoinbaseWalletDetected)
    )

  const isBrowser = typeof window !== 'undefined'
  const userAgent = isBrowser ? navigator.userAgent : ''
  const isAndroid = /(Android)/i.test(userAgent)
  const isIphone = /(iPhone|iPod)/i.test(userAgent)
  const isIpad = /(iPad)/i.test(userAgent)
  const isMobile = isIphone || isAndroid || isIpad
  const isInstagramBrowser = /(Instagram)/i.test(userAgent)

  const handleConnectWallet = React.useCallback(
    async (connectorId: ConnectorId) => {
      setConnecting(true)
      try {
        await handleConnect(connectorId, {
          ...(connectorId === 'Xaman' && {
            onRejected: () => setConnecting(false),
            onCreated: (payload) => setXamanPayload(payload),
          }),
        })
      } catch (error) {
        if (
          error instanceof Error &&
          // Checking the message is the only way to detect the error type
          error.message.includes('Requested chains are not supported')
        ) {
          setUnsupportedChainsError(true)
        }
      } finally {
        setConnecting(false)
      }
    },
    [handleConnect]
  )

  const handleCustodialLogin = React.useCallback(
    (
      custodialLoginMethod: {
        type: 'email' | 'social'
        targetSSO?: SocialSSOType
      },
      custodialClientState?: unknown
    ) => {
      const adapter: ILoginAdapter = {
        // eslint-disable-next-line @typescript-eslint/require-await -- this adapter is never used, but for type checking only
        async connect() {
          throw new Error('Not implemented: connect')
        },
        // eslint-disable-next-line @typescript-eslint/require-await -- this adapter is never used, but for type checking only
        async signMessage() {
          throw new Error('Not implemented: signMessage')
        },
        // eslint-disable-next-line @typescript-eslint/require-await -- this adapter is never used, but for type checking only
        async getEthAccount() {
          throw new Error('Not implemented: getEOA')
        },
      }

      const loginMethod: LoginMethod | undefined =
        custodialLoginMethod.type === 'email'
          ? { type: 'email' }
          : // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- left for clarity
          custodialLoginMethod.type === 'social' &&
            custodialLoginMethod.targetSSO != null
          ? { type: 'social', targetSSO: custodialLoginMethod.targetSSO }
          : undefined

      handleLogin({
        adapter,
        loginMethod,
        customClientState: custodialClientState,
      })
    },
    [handleLogin]
  )

  React.useEffect(() => {
    eventTargetRef.current.addEventListener(
      'startXamanLogin',
      () => {
        setSelectedWallet({
          name: 'Xaman',
          iconType: 'Xaman',
          connectorId: 'Xaman',
        })
        void handleConnectWallet('Xaman')
      },
      {
        once: true,
      }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- left empty on purpose
  }, [])

  const Web3AuthOptions = React.useMemo(
    () => (
      <Box
        id="connect-wallet-modal_box_web3-options"
        display="flex"
        flexDirection="column"
        width={311}
        gap={2}
      >
        {CONNECT_WALLET_OPTION_LIST.filter(
          (walletOption) => walletOption.name !== 'MetaMask' || !isMobile
        ).map(({ name, iconType, connectorId }) => {
          if (name === 'Xaman' && !isXamanLoginEnabled) {
            return
          }

          const isWalletInstalled =
            connectorId === 'MetaMask'
              ? isWebMetaMaskDetected
              : connectorId === 'Coinbase'
              ? isCoinbaseWalletDetected
              : false

          return (
            <CustomButton
              id={`connect-wallet-modal_custom-button_${name
                .toLowerCase()
                .replace(/ /g, '-')}`}
              key={name}
              fullWidth
              variant="text"
              startIcon={<IconFactory width={32} name={iconType} />}
              onClick={() => {
                /* On mobile, we can't detect if MetaMask is installed so we deep link the app - it either opens or leads the user to the AppStore's MetaMask page. */
                if (
                  connectorId === 'MetaMask' &&
                  !isMobile &&
                  !isWalletInstalled
                ) {
                  handleNoMetamaskInstalled()
                } else {
                  setSelectedWallet({ name, iconType, connectorId })
                  void handleConnectWallet(connectorId)
                }
              }}
            >
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="space-between"
                paddingLeft={1}
                width="100%"
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Typography variant="button">{name}</Typography>
                  {isWalletInstalled && (
                    <Typography
                      textAlign="start"
                      variant="caption"
                      color="text.secondary"
                    >
                      Installed
                    </Typography>
                  )}
                </Box>
                <IconFont name="chevron_right" />
              </Box>
            </CustomButton>
          )
        })}
      </Box>
    ),
    [
      handleConnectWallet,
      handleNoMetamaskInstalled,
      isCoinbaseWalletDetected,
      isMobile,
      isWebMetaMaskDetected,
      isXamanLoginEnabled,
    ]
  )

  const Web2AuthOptions = React.useMemo(() => {
    if (isInstagramBrowser) {
      return (
        <Box
          id="connect-wallet-modal_box_web2-options"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <Button
            if="connect-wallet-modal_button_facebook"
            variant="contained"
            size="medium"
            startIcon={<IconFactory name="FacebookLogo" />}
            onClick={() =>
              handleCustodialLogin({
                type: 'social',
                targetSSO: 'facebook',
              })
            }
            disabled={!isCustodialLoginEnabled}
          >
            Facebook
          </Button>
          <Button
            id="connect-wallet-modal_button_email"
            variant={'contained'}
            size="medium"
            startIcon={<IconFont name="email" />}
            onClick={() => {
              handleCustodialLogin({
                type: 'email',
              })
            }}
            disabled={!isCustodialLoginEnabled}
          >
            Email
          </Button>
        </Box>
      )
    }

    return (
      <>
        <Box
          id="connect-wallet-modal_box_web2-options"
          display="flex"
          justifyContent="center"
          gap={2}
          width="100%"
        >
          <Button
            id="connect-wallet-modal_button_google"
            variant="contained"
            size="medium"
            style={{ width: 150 }}
            startIcon={<IconFactory name="GoogleLogo" />}
            onClick={() =>
              handleCustodialLogin(
                { type: 'social', targetSSO: 'google' },
                customClientState
              )
            }
            disabled={!isCustodialLoginEnabled}
          >
            Google
          </Button>

          <Button
            id="connect-wallet-modal_button_facebook"
            variant="contained"
            size="medium"
            style={{ width: 150 }}
            startIcon={<IconFactory name="FacebookLogo" />}
            onClick={() =>
              handleCustodialLogin(
                { type: 'social', targetSSO: 'facebook' },
                customClientState
              )
            }
            disabled={!isCustodialLoginEnabled}
          >
            Facebook
          </Button>
        </Box>

        {(isTwitterLoginEnabled || isTikTokLoginEnabled) && (
          <Box display="flex" justifyContent="left" gap={2} width="100%">
            {isTwitterLoginEnabled && (
              <Button
                variant="contained"
                size="medium"
                style={{ width: 150 }}
                startIcon={<IconFactory name="TwitterLogo" />}
                onClick={() =>
                  handleCustodialLogin(
                    { type: 'social', targetSSO: 'twitter' },
                    customClientState
                  )
                }
                disabled={!isCustodialLoginEnabled}
              >
                X
              </Button>
            )}

            {isTikTokLoginEnabled && (
              <Button
                variant="contained"
                size="medium"
                style={{ width: 150 }}
                startIcon={<IconFactory name="TiktokLogo" />}
                onClick={() =>
                  handleCustodialLogin(
                    { type: 'social', targetSSO: 'tiktok' },
                    customClientState
                  )
                }
                disabled={!isCustodialLoginEnabled}
              >
                TikTok
              </Button>
            )}
          </Box>
        )}

        {isAppleLoginEnabled && (
          <Box display="flex" justifyContent="left" gap={2} width="100%">
            <Button
              variant="contained"
              size="medium"
              style={{ width: 150 }}
              startIcon={<IconFactory name="AppleLogo" />}
              onClick={() =>
                handleCustodialLogin(
                  { type: 'social', targetSSO: 'apple' },
                  customClientState
                )
              }
              disabled={!isCustodialLoginEnabled}
            >
              Apple
            </Button>
          </Box>
        )}

        <Box
          id="connect-wallet-modal_box_email"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <Button
            id="connect-wallet-modal_button_email"
            variant="outlined"
            size="medium"
            startIcon={<IconFont name="email" />}
            onClick={() => {
              handleCustodialLogin({ type: 'email' }, customClientState)
            }}
            disabled={!isCustodialLoginEnabled}
          >
            Continue with email
          </Button>
        </Box>
      </>
    )
  }, [
    isInstagramBrowser,
    isCustodialLoginEnabled,
    isTwitterLoginEnabled,
    isTikTokLoginEnabled,
    isAppleLoginEnabled,
    handleCustodialLogin,
    customClientState,
  ])

  if (unsupportedChainsError) {
    return (
      <UnsupportedNetwork onOkClick={() => setUnsupportedChainsError(false)} />
    )
  }

  if (isConnecting) {
    return (
      <StyledCard
        id="connect-wallet-modal_styled-card_connecting"
        variant="outlined"
      >
        <Box id="connect-wallet-modal_box_connecting">
          {selectedWallet != null && (
            <Typography variant="subtitle1">
              {`Continue with ${selectedWallet.name}${
                selectedWallet.connectorId === 'MetaMask' ? '/EVM' : ''
              }`}
            </Typography>
          )}
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            paddingBlock={4}
            width={311}
            gap={6}
          >
            {selectedWallet?.connectorId === 'Xaman' && xamanPayload != null ? (
              <XamanQrCode payload={xamanPayload} />
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Please accept the connection request in your wallet
                </Typography>
                <Box display="flex" justifyContent="center">
                  <Loader />
                </Box>
              </>
            )}
          </Box>
        </Box>
        <Button
          id="connect-wallet-modal_button_disconnect"
          variant="outlined"
          onClick={() => {
            setConnecting(false)
          }}
        >
          Back
        </Button>
      </StyledCard>
    )
  }

  if (isShowingFuturePassExplanation) {
    return (
      <StyledCard id="connect-wallet-modal_card_explanation" variant="outlined">
        <Typography
          variant="h3"
          sx={{
            marginBlockEnd: '2rem',
          }}
        >
          What is a FuturePass?
        </Typography>

        <Section variant="body2" color="secondary.light">
          The FuturePass is your pass to journey through the Open Metaverse.
        </Section>
        <Section variant="body2" color="secondary.light">
          It connects you to any experience or application, and is unique to
          you. It protects all aspects of your identity and data, it stores your
          assets, manages permissions, helps you build status and safeguards
          your funds as you explore the Open Metaverse. This is the beginning of
          your journey, simpler and safer than ever before.
        </Section>

        <Section variant="body2" color="secondary.light">
          For more information,{' '}
          <Link
            href="https://www.futureverse.com/technology/futurepass"
            target="self"
            sx={{
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            visit website
          </Link>
        </Section>

        <Button
          id="connect-wallet-modal_button_hide-explanation"
          variant="outlined"
          onClick={() => setIsShowingFuturePassExplanation(false)}
          sx={{
            width: '92%',
            marginBlockStart: '0.625rem',
          }}
        >
          Close
        </Button>
      </StyledCard>
    )
  }

  return (
    <StyledCard
      id="connect-wallet-modal_card_select-wallet"
      variant="outlined"
      style={{ justifyContent: 'center' }}
    >
      <Box
        id="connect-wallet-modal_box_select-wallet"
        display="flex"
        flexDirection="column"
        gap={4}
      >
        <Typography
          id="connect-wallet-modal_typography_select-wallet"
          variant="subtitle1"
          textAlign="center"
        >
          Begin your journey.
        </Typography>
        {isShowingWeb3AuthOptionsFirst ? Web3AuthOptions : Web2AuthOptions}

        <Box display="flex" alignItems="center" flexDirection="column" gap={1}>
          <Typography variant="caption" color="secondary.light">
            Alternatively
          </Typography>
          <Button
            variant="text"
            size="medium"
            style={{
              width: 'fit-content',
            }}
            startIcon={<IconFont name="account_balance_wallet" />}
            onClick={() => setIsShowingWeb3AuthOptionsFirst((state) => !state)}
          >
            {isShowingWeb3AuthOptionsFirst
              ? 'Connect email or socials'
              : 'Connect a wallet'}
          </Button>
        </Box>
      </Box>

      <Box
        id="connect-wallet-modal_box_fv-icon"
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        mt={4}
      >
        <Typography variant="caption" color="secondary.light">
          Powered by
        </Typography>
        <FVLogo onClick={() => setIsShowingFuturePassExplanation(true)}>
          <IconFactory name="FV" />
        </FVLogo>
      </Box>

      {showSdkVersion && (
        <Box
          id="connect-wallet-modal_box_sdk-version"
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          mt={4}
        >
          <Typography variant="caption" textAlign="center">
            SDK Version: process.env.REACT_SDK_VERSION
          </Typography>
        </Box>
      )}
    </StyledCard>
  )
}

export default ConnectWalletModal

const StyledCard = styled(Card)(({ theme }) => ({
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 8,
  maxWidth: '600px',
  alignItems: 'flex-start',

  [theme.breakpoints.down('md')]: {
    padding: '32px 0',
    width: '100%',
    height: '100%',
    border: 'none',
    justifyContent: 'space-between',
  },
}))

const CustomButton = styled(Button)({
  justifyContent: 'start',

  borderRadius: '0px !important',
  '&:hover': {
    backgroundColor: 'transparent',
    borderRadius: '0px !important',
  },

  '& .MuiTypography-button': {
    textTransform: 'none',
  },
})

const FVLogo = styled('div')({
  cursor: 'pointer',
})

const Section = styled(Typography)({
  marginBottom: 20,
})
