import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'

type Props = {
  text?: string
  onClick?: () => void
}

const TenantLogo = ({ text = 'Powered by', onClick }: Props): JSX.Element => {
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div
      id="tenant-logo"
      className="futureverse-logo flex flex-row items-center"
      onClick={onClick}
    >
      <span
        id="tenant-logo__message"
        className="tenant-logo__message text-fontExtraSmall mr-[2px] text-colorTertiary"
      >
        {text}
      </span>
      <img
        src={`${tenantConfig?.baseUrl}/${tenantConfig?.logoPath}`}
        alt="logo"
        id="tenant-logo__image"
        className="tenant-logo__image w-[30px]"
      />
    </div>
  )
}

export default TenantLogo
