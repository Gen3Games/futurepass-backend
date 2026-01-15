import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'

export default function Index() {
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()
  return (
    <div className="index h-screen w-screen flex flex-col justify-center items-center">
      <div
        id="index__logout"
        className="index__logout absolute top-normal right-normal border border-white rounded-xl py-extraSmall px-small font-ObjektivMk1Medium text-large"
      >
        <Link
          id="index__logout_link"
          className="index__logout_link"
          href="/session/end"
        >
          {translate('index.index__logout_link')}
        </Link>
      </div>

      <img
        className="index__fv_image w-[80px]"
        id="index__fv_image"
        src={`${tenantConfig?.baseUrl}/${tenantConfig?.logoPath}`}
        alt="logo"
      />
    </div>
  )
}
