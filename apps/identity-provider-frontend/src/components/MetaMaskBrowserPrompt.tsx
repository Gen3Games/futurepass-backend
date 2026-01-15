import { useTranslation } from 'react-i18next'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'
import { Icon, RoundedButton } from './'

const MetaMaskBrowserPrompt = (): JSX.Element => {
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div className="page">
      <div
        id="metamask-prompt"
        className="metamask-prompt flex flex-col items-center pt-extraLarge w-fit m-[16px] border-colorQuaternary border-[1px] border-solid md:min-w-[648px]"
      >
        <div className="flex flex-col w-full text-fontMedium leading-[1.48]">
          <div
            id="metamask-prompt__header_message"
            className="metamask-prompt__header_message flex flex-row items-center gap-small pr-extraLarge pb-extraLarge pl-extraLarge font-ObjektivMk1Medium"
          >
            <Icon
              icon="Warning"
              size={20}
              id="metamask-prompt__header_icon"
              className="metamask-prompt__header_icon"
            />
            {translate('metamask-prompt.metamask-prompt__header_icon')}
          </div>
          <div
            id="metamask-prompt__header_divider"
            className="metamask-prompt__header_divider border-solid border-colorTertiary border-[1px]"
          />
          <div
            id="metamask-prompt__content"
            className="metamask-prompt__content flex flex-col justify-center content-center p-extraLarge to-colorTertiary font-ObjektivMk1Medium gap-extraLarge"
          >
            <p
              id="metamask-prompt__content_message-1"
              className="metamask-prompt__content_message-1 text-colorTertiary"
            >
              {translate('metamask-prompt.metamask-prompt__content_message-1', {
                tenantName: tenantConfig?.name,
              })}
            </p>
            <p
              id="metamask-prompt__content_message-2"
              className="metamask-prompt__content_message-2 text-colorTertiary"
            >
              {translate('metamask-prompt.metamask-prompt__content_message-2')}
            </p>
            <div
              id="metamask-prompt__content_button"
              className="metamask-prompt__content_button flex flex-col-reverse justify-center items-center gap-normal md:flex-row md:items-end md:justify-end"
            >
              <RoundedButton
                variant="outlined"
                onClick={() => window.history.back()}
                id="metamask-prompt__content_back-button"
                className="metamask-prompt__content_back-button"
              >
                {translate(
                  'metamask-prompt.metamask-prompt__content_back-button'
                )}
              </RoundedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetaMaskBrowserPrompt
