import { cn } from '@futureverse/component-library'
import Icon, { IconType } from './Icon'

type Props = {
  text: string
  subText?: string
  icon?: IconType
  comingSoon?: boolean
  className?: string
  onClick?: () => void
}

const WalletButton = ({
  text,
  subText,
  icon,
  comingSoon,
  className = 'wallet-button',
  onClick,
}: Props): JSX.Element => {
  const conditionalOnClick = () => {
    if (comingSoon) {
      return null
    }
    onClick?.()
  }

  return (
    <div
      id={className}
      className={cn(
        className,
        'flex flex-row hover:text-colorTertiary hover:cursor-pointer w-full px-[10px] my-[10px]'
      )}
      onClick={conditionalOnClick}
    >
      <div className="flex flex-col justify-center items-center w-[40px]">
        {icon != null && <Icon icon={icon} size={30} />}
      </div>
      <div className="flex flex-col ml-[10px] justify-center items-center">
        <p
          id="wallet-button__text"
          className="wallet-button__text font-ObjektivMk1Medium text-fontSmall font-bold"
        >
          {text}
        </p>
        {subText != null && (
          <p
            id="wallet-button__subtext"
            className="wallet-button__subtext font-ObjektivMk1Thin text-fontExtraSmall font-normal w-full"
          >
            {subText}
          </p>
        )}
      </div>
      <Icon
        id="wallet-button__icon"
        className="wallet-button__icon ml-auto self-center"
        icon="ChevronRight"
        size={15}
      ></Icon>
    </div>
  )
}

export default WalletButton
