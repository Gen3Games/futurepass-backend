import { cn } from '@futureverse/component-library'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { TenantLogo } from './TenantLogo'

type Props = {
  onConfirm: () => void
  onCancel: () => void
  message?: string
}

const CustodialSigner = ({
  onConfirm,
  onCancel,
  message,
}: Props): JSX.Element => {
  const [isLoading, setIsLoading] = React.useState(false)
  const { t: translate } = useTranslation()
  const [isCollapsibleOpen, setIsCollapsibleOpen] = React.useState(false)
  const collapsibleContentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (collapsibleContentRef.current) {
      if (isCollapsibleOpen) {
        collapsibleContentRef.current.style.maxHeight =
          collapsibleContentRef.current.scrollHeight + 'px'
      } else {
        collapsibleContentRef.current.style.maxHeight = '0px'
      }
    }
  }, [isCollapsibleOpen, collapsibleContentRef])

  return (
    <div
      id="page"
      className="page w-full px-6 py-5 flex flex-col text-colorBrand"
    >
      <div
        id="custodial-signer__tenant-logo"
        className="custodial-signer__tenant-logo"
      >
        <TenantLogo />
      </div>

      {isLoading ? (
        <div
          id="custodial-signer__loader"
          className="custodial-signer__loader flex flex-col w-full h-full pt-10"
        >
          <div id="loader" className="loader mx-auto mt-7" />
        </div>
      ) : (
        <>
          <div
            id="custodial-signer__content"
            className="custodial-signer__content h-full py-3"
          >
            {message && (
              <div className="custodial-signer__collapsible_container mt-10 rounded-3xl py-3 border-secondary border-2 py-2 px-3 sm:px-10 lg:px-16">
                <div
                  className="cursor-pointer p-2 flex justify-between font-ObjektivMk1WBold text-colorBrand "
                  onClick={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
                >
                  <header>
                    {translate(
                      'custodial-signer.custodial-signer__content_message_title'
                    )}
                  </header>
                  <div
                    className={cn(
                      `duration-500 ease-in-out flex items-center`,
                      {
                        'rotate-180': isCollapsibleOpen,
                      }
                    )}
                  >
                    <svg
                      width="16"
                      height="10"
                      viewBox="0 0 16 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 8L8 2L2 8"
                        stroke="black"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  ref={collapsibleContentRef}
                  className=" height-auto overflow-hidden transition-max-height duration-500 ease-in-out break-words"
                >
                  <p className="text-colorBrand w-full text-fontSmall text-center py-3">
                    {message}
                  </p>
                </div>
              </div>
            )}
          </div>
          <div
            id="custodial-signer__buttons"
            className="custodial-signer__buttons mt-auto flex flex-row gap-3"
          >
            <button
              id="custodial-signer__buttons_cancel-button"
              className="custodial-signer__buttons_cancel-button w-full bg-colorPrimary border-red-700 border text-red-700 rounded-full p-3 font-ObjektivMk1WBold text-fontSmall"
              onClick={() => {
                onCancel()
                setIsLoading(true)
              }}
            >
              {translate(
                'custodial-signer.custodial-signer__buttons_cancel-button'
              )}
            </button>
            <button
              id="custodial-signer__buttons_confirm-button"
              className="custodial-signer__buttons_confirm-button w-full bg-colorBrand text-colorPrimary rounded-full p-3 font-ObjektivMk1WBold text-fontSmall"
              onClick={() => {
                onConfirm()
                setIsLoading(true)
              }}
            >
              {translate(
                'custodial-signer.custodial-signer__buttons_confirm-button'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default CustodialSigner
