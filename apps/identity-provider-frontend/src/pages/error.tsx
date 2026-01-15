import React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { ErrorContext } from '../components/ErrorContextProvider'
import TenantLogo from '../components/TenantLogo'
import { useHTMLTenantContext } from '../providers/HTMLTenantContextProvider'

export default function ErrorHandler() {
  const navigate = useNavigate()
  const { errorCode } = useParams()
  const { setErrorCode } = React.useContext(ErrorContext)!

  React.useEffect(() => {
    if (errorCode) {
      setErrorCode(errorCode)
      navigate('/error', { replace: true })
    }
  }, [errorCode, setErrorCode, navigate])

  return <ErrorPage />
}

function ErrorPage() {
  const { errorCode } = React.useContext(ErrorContext)!
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()

  return (
    <div className="page">
      <div
        id="error"
        className="error flex justify-center items-center flex-col text-center border border-gray-700 rounded-lg p-12 box-border gap-8 container lg:min-w-[648px]"
      >
        <img
          src={`${tenantConfig?.baseUrl}/${tenantConfig?.logoPath}`}
          alt="error"
        />
        <div>
          <div
            id="error__message"
            className="error__message text-fontLarge font-light"
          >
            {translate('error.error__message')}
          </div>
          {errorCode != null && (
            <div
              id="error__code"
              className="error__code text-base text-colorTertiary font-light mt-medium"
            >
              {translate(`error.error__code`, { errorCode })}
            </div>
          )}
        </div>

        <div
          id="error__footer"
          className="error__footer mt-6 flex items-center justify-center m-y-small"
        >
          <TenantLogo />
        </div>
      </div>
    </div>
  )
}
