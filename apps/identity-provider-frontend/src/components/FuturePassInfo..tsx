import { useTranslation } from 'react-i18next'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'
import RoundedButton from './RoundedButton'

type Props = {
  onClick: () => void
}

const FuturePassInfo = ({ onClick }: Props): JSX.Element => {
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div
      id="futurepass-info"
      className="futurepass-info flex flex-col justify-center items-center p-[48px] gap-extraLarge text-center border-colorQuaternary border-[1px] border-solid md:max-w-[648px]"
    >
      <h1
        id="futurepass-info__header"
        className="futurepass-info__header font-ObjektivMk1Thin font-bold text-fontLarge leading-[1.48] md:text-fontExtraLarge"
      >
        {translate('futurepass-info.futurepass-info__header', {
          tenantName: tenantConfig?.name,
        })}
      </h1>
      <div
        id="futurepass-info__content"
        className="futurepass-info__content flex flex-col font-ObjektivMk1Medium md:font-ObjektivMk1Thin gap-normal leading-[1.48] text-fontMedium text-colorTertiary"
      >
        <p
          id="futurepass-info__content_message-1"
          className="futurepass-info__content_message-1"
        >
          {translate('futurepass-info.futurepass-info__content_message-1', {
            tenantName: tenantConfig?.name,
          })}
        </p>
        <p
          id="futurepass-info__content_message-2"
          className="futurepass-info__content_message-2 font-ObjektivMk1Thin"
        >
          {translate('futurepass-info.futurepass-info__content_message-2')}
        </p>
        <p
          id="futurepass-info__content_message-3"
          className="futurepass-info__content_message-3 font-ObjektivMk1Thin "
        >
          {translate('futurepass-info.futurepass-info__content_message-3')}
          <a
            id="futurepass-info__content_message-3-link"
            href="https://www.futureverse.com/technology/futurepass"
            target="_blank"
            rel="noreferrer"
          >
            {translate(
              'futurepass-info.futurepass-info__content_message-3-link'
            )}
          </a>
        </p>
      </div>
      <RoundedButton
        id="futurepass-info__content_close-button"
        className="futurepass-info__content_close-button w-full"
        variant="outlined"
        onClick={onClick}
      >
        {translate('futurepass-info.futurepass-info__content_close-button')}
      </RoundedButton>
    </div>
  )
}

export default FuturePassInfo
