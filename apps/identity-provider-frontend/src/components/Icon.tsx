import IcoMoon, { IconProps } from 'react-icomoon'
import iconSet from '../styles/iconSelection.json'

// Available icons now ** Can update selection.json to update more icons **  => https://icomoon.io/app/#/select
export const IconOptions = [
  'CheckCircle',
  'ChevronRight',
  'Email',
  'Facebook',
  'FutureverseHalo',
  'FutureverseLogo',
  'Google',
  'Info',
  'MetamaskColor',
  'Sylo',
  'Wallet',
  'WalletconnectBlue',
  'Warning',
  'CoinBase',
  'Xaman',
  'TiktokLogo',
  'TwitterLogo',
  'AppleLogo',
] as const

export type IconType = (typeof IconOptions)[number]

type Props = {
  icon: IconType
} & IconProps

const Icon = ({ ...props }: Props): JSX.Element => {
  return <IcoMoon iconSet={iconSet} {...props} />
}

export default Icon
