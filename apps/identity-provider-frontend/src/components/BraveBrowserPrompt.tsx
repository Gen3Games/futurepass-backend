import { useTranslation } from 'react-i18next'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'
import { Icon, RoundedButton } from './'

type Props = {
  onContinue: () => void
}

const BraveBrowserPrompt = ({ onContinue }: Props): JSX.Element => {
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div className="page">
      <div
        id="brave-prompt"
        className="brave-prompt flex flex-col rounded-sm border-colorQuaternary border-solid border-[1px] items-center pt-extraLarge m-[16px] md:max-w-[648px]"
      >
        <div className="flex flex-col w-fit text-fontMedium leading-[1.48]">
          <div
            id="brave-prompt__header_message"
            className="brave-prompt__header_message flex flex-row items-center gap-small pr-extraLarge pb-extraLarge pl-extraLarge font-ObjektivMk1Medium"
          >
            <Icon icon="Warning" size={20} />
            {translate('brave-prompt.brave-prompt__header_message', {
              tenantName: tenantConfig?.name,
            })}
          </div>
          <div
            id="brave-prompt__header_divider"
            className="brave-prompt__header_divider border-solid border-colorTertiary border-[1px]"
          />
          <div
            id="brave-prompt__content"
            className="brave-prompt__content flex flex-col justify-center content-center p-extraLarge to-colorTertiary font-ObjektivMk1Medium gap-extraLarge"
          >
            <p
              id="brave-prompt__content_message-1"
              className="brave-prompt__content_message-1 text-colorTertiary"
            >
              {translate('brave-prompt.brave-prompt__content_message-1')}
            </p>
            <p
              id="brave-prompt__content_message-2"
              className="brave-prompt__content_message-2 text-colorTertiary"
            >
              {translate('brave-prompt.brave-prompt__content_message-2', {
                tenantName: tenantConfig?.name,
              })}
            </p>
            <div
              id="brave-prompt__content_button"
              className="brave-prompt__content_button flex flex-col-reverse justify-center items-center gap-normal md:flex-row md:items-end md:justify-end"
            >
              <RoundedButton
                variant="outlined"
                onClick={onContinue}
                id="brave-prompt__content_continue-button"
                className="brave-prompt__content_continue-button"
              >
                {translate(
                  'brave-prompt.brave-prompt__content_continue-button'
                )}
              </RoundedButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BraveBrowserPrompt
