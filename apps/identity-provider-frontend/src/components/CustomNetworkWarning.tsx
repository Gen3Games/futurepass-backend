import { useTranslation } from 'react-i18next'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'
import Icon from './Icon'
import RoundedButton from './RoundedButton'

type Props = {
  onClick: (supportsCustomNetworks: boolean) => void
}

const CustomNetworkWarning = ({ onClick }: Props): JSX.Element => {
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div
      id="custom-network-warning"
      className="custom-network-warning flex flex-col m-[16px] text-fontMedium leading-[1.48] pt-[40px] border-colorQuaternary border-[1px] border-solid md:min-w-[648px]"
    >
      <div
        id="custom-network-warning__header"
        className="custom-network-warning__header flex flex-row items-center pr-extraLarge pb-extraLarge pl-extraLarge gap-small font-ObjektivMk1Medium"
      >
        <Icon
          icon="Warning"
          size={20}
          id="custom-network-warning__header_icon"
          className="custom-network-warning__header_icon"
        />
        {translate('custom-network-warning.custom-network-warning__header')}
      </div>
      <div
        id="custom-network-warning__header_divider"
        className="custom-network-warning__header_divider border-solid border-colorTertiary border-[1px]"
      />
      <div
        id="custom-network-warning__content"
        className="custom-network-warning__content flex flex-col justify-between items-center p-extraLarge text-colorTertiary gap-[128px]"
      >
        {translate('custom-network-warning.custom-network-warning__content', {
          tenantName: tenantConfig?.name,
        })}
        <div
          id="custom-network-warning__content_buttons"
          className="custom-network-warning__content_buttons flex flex-col-reverse w-full justify-center items-center gap-normal md:flex-row md:items-end md:justify-end"
        >
          <RoundedButton
            id="custom-network-warning__content_back-button"
            className="custom-network-warning__content_back-button"
            onClick={() => onClick(false)}
            variant="no-border"
          >
            {translate(
              'custom-network-warning.custom-network-warning__content_back-button'
            )}
          </RoundedButton>
          <RoundedButton
            id="custom-network-warning__content_support-button"
            className="custom-network-warning__content_support-button"
            onClick={() => onClick(true)}
          >
            {translate(
              'custom-network-warning.custom-network-warning__content_support-button'
            )}
          </RoundedButton>
        </div>
      </div>
    </div>
  )
}

export default CustomNetworkWarning
