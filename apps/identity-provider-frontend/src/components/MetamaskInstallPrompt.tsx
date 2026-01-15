import { capitalizeFirstLetter } from '../common'
import { ConnectorType } from './Login'
import { Icon, RoundedButton } from '.'

const METAMASK_INSTALL_LINK = 'https://metamask.io/download/'

type Props = {
  connectorType: ConnectorType
  onClickGoback: () => void
}

const MetamaskInstallPrompt = ({ connectorType, onClickGoback }: Props) => {
  const wallet = capitalizeFirstLetter(connectorType)

  return (
    <div
      id="metamask-install-prompt"
      className="metamask-install-prompt flex flex-col m-[16px] text-fontMedium leading-[1.48] pt-[40px] border-colorQuaternary border-[1px] border-solid md:min-w-[648px]"
    >
      <div
        id="metamask-install-prompt__header"
        className="metamask-install-prompt__header flex flex-row items-center pr-extraLarge pb-extraLarge pl-extraLarge gap-small font-ObjektivMk1Medium"
      >
        <Icon
          id="metamask-install-prompt__header_icon"
          className="metamask-install-prompt__header_icon"
          icon="Warning"
          size={20}
        />
        {`${wallet} not installed.`}
      </div>
      <div
        id="metamask-install-prompt__header_divider"
        className="metamask-install-prompt__header_divider border-solid border-colorTertiary border-[1px]"
      />
      <div
        id="metamask-install-prompt__content"
        className="metamask-install-prompt__content flex flex-col justify-between items-center p-extraLarge text-colorTertiary gap-[128px]"
      >
        {`You need to install ${wallet} to continue. Please install ${wallet} then refresh the page.`}
        <div
          id="metamask-install-prompt__content_buttons"
          className="metamask-install-prompt__content_buttons flex flex-col-reverse w-full justify-center items-center gap-normal md:flex-row md:items-end md:justify-end"
        >
          <RoundedButton
            id="metamask-install-prompt__content_back-button"
            className="metamask-install-prompt__content_back-button"
            onClick={onClickGoback}
            variant="no-border"
          >
            Go back
          </RoundedButton>
          <RoundedButton
            id="metamask-install-prompt__content_install-button"
            className="metamask-install-prompt__content_install-button"
            variant="outlined"
            onClick={() => window.open(METAMASK_INSTALL_LINK)}
          >
            {`Install ${wallet}`}
          </RoundedButton>
        </div>
      </div>
    </div>
  )
}

export default MetamaskInstallPrompt
