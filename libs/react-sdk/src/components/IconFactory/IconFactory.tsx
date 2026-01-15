/* eslint-disable @typescript-eslint/consistent-type-assertions -- avoid "failed to execute createelement ondocument" error */
/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-var-requires -- this is the only way to get the icons to work with Next, React etc. */
import { css, styled } from '@mui/material'

import { transientPropCheck } from '../../styles/theme/utils'
import AppleLogo from '../assets/icons/AppleLogo'
import { ReactComponent as Coinbase } from '../assets/icons/CoinBase.svg'

import { ReactComponent as FacebookLogo } from '../assets/icons/FacebookLogo.svg'
import { ReactComponent as Fallback } from '../assets/icons/Fallback.svg'
import { ReactComponent as Futureverse } from '../assets/icons/Futureverse.svg'
import { ReactComponent as GoogleLogo } from '../assets/icons/GoogleLogo.svg'
import { ReactComponent as MetaMask } from '../assets/icons/MetaMask.svg'
import TiktokLogo from '../assets/icons/TiktokLogo'
import TwitterLogo from '../assets/icons/TwitterLogo'

import { ReactComponent as WalletConnect } from '../assets/icons/WalletConnect.svg'
import { ReactComponent as Xaman } from '../assets/icons/Xaman.svg'
import { ReactComponent as XRP } from '../assets/icons/XRP.svg'

export type IconName =
  | 'Metamask'
  | 'WalletConnect'
  | 'Coinbase'
  | 'Xaman'
  | 'GoogleLogo'
  | 'FacebookLogo'
  | 'TwitterLogo'
  | 'TiktokLogo'
  | 'AppleLogo'
  | 'FV'

export type CryptoTokenName = 'XRP'

export type IconType = IconName | CryptoTokenName | 'Fallback'

interface IconFactoryProps {
  name: IconType
  color?: string
  width?: string | number
  className?: string
}

const IconWrapper = styled(
  'div',
  transientPropCheck
)(
  ({ $width, $color }: { $width: string; $color?: string }) => css`
    width: ${$width};
    min-width: ${$width};
    display: flex;
    align-items: center;

    > svg,
    img {
      width: 100%;
      height: auto;
    }

    ${$color &&
    css`
      > svg {
        color: ${$color};
      }
    `}
  `
)

const Icon = ({ name }: { name: IconFactoryProps['name'] }) => {
  switch (name) {
    case 'Metamask':
      return <MetaMask />
    case 'WalletConnect':
      return <WalletConnect />
    case 'Coinbase':
      return <Coinbase />
    case 'Xaman':
      return <Xaman />
    case 'GoogleLogo':
      return <GoogleLogo />
    case 'FacebookLogo':
      return <FacebookLogo />
    case 'TwitterLogo':
      return <TwitterLogo />
    case 'TiktokLogo':
      return <TiktokLogo />
    case 'FV':
      return <Futureverse />
    case 'XRP':
      return <XRP />
    case 'AppleLogo':
      return <AppleLogo />
    default:
      return <Fallback />
  }
}

// IconFactory component can be used to centralise the way we import svg icons
//  and make easier to switch between icons just by changing the iconName property.
export const IconFactory: React.FC<IconFactoryProps> = ({
  name,
  color,
  width = '24px',
  ...props
}) => {
  return (
    <IconWrapper
      data-testid={`icon-${name}`}
      role={`icon-${name}`}
      $width={typeof width === 'number' ? `${width}px` : width}
      $color={color}
      {...props}
    >
      <Icon name={name} />
    </IconWrapper>
  )
}

export default IconFactory

export type { IconFactoryProps }
/* eslint-enable @typescript-eslint/no-explicit-any,@typescript-eslint/no-var-requires -- this is the only way to get the icons to work with Next, React etc. */
/* eslint-enable @typescript-eslint/consistent-type-assertions -- avoid "failed to execute createelement ondocument" error */
