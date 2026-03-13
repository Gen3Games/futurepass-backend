import { Tooltip } from '@futureverse/component-library'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { JEN_PASS_NAME } from '../../common/constants'
import {
  TenantLogo,
  Icon,
  ProgressIndicator,
  RoundedButton,
} from '../../components'
import { useHTMLTenantContext } from '../../providers/HTMLTenantContextProvider'
import FutureverseTerms from './futureverseTerms'
import PassonlineTerms from './passonlineTerms'

type Props = {
  sitekey: string
}
export default function Terms(props: Props) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState<boolean>(false)
  const isLoadingRef = React.useRef(isLoading)
  const navigate = useNavigate()
  const [hCaptchaToken, setHCaptchaToken] = React.useState<string | null>(null)
  const hCaptchaRef = React.useRef<HCaptcha | null>(null)
  const { tenantConfig } = useHTMLTenantContext()

  const usePassonlineTerms = React.useMemo(() => {
    // It is the requirement that we only need to enable the Pass T&C for Jen atm
    // We can add more complicated logic here late
    return tenantConfig?.name.toLowerCase() === JEN_PASS_NAME
  }, [tenantConfig?.name])

  const acceptTerms = React.useCallback(() => {
    if (isLoadingRef.current) return
    setIsLoading(true)
    setError(false)
    void (async () => {
      try {
        if (hCaptchaRef.current == null) {
          return
        }
        if (hCaptchaToken == null) {
          return
        }

        const response = await fetch(
          `${window.location.pathname}${window.location.search}`,
          {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: hCaptchaToken }),
          }
        )

        if (response.status === 200) {
          const outR = t
            .type({ redirectTo: t.string }, 'Response')
            .decode(await response.json())
          if (E.isLeft(outR)) {
            // TODO: show error message to user or something
            setError(true)
            return
          }

          setIsSuccess(true)
          setTimeout(() => {
            window.location.replace(outR.right.redirectTo)
          }, 3000)
        } else {
          // TODO: show error message to user or something
          setError(true)
        }
      } catch (e: unknown) {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [hCaptchaToken])

  if (error) {
    return (
      <div className="page">
        <div className="terms flex flex-col h-full justify-center items-center w-full container relative gap-large md:border md:border-colorQuaternary md:gap-extraLarge md:rounded-lg md:max-w-[648px] md:p-[48px]">
          <div className="terms__error-heading flex flex-row gap-normal items-center">
            <Icon
              className="terms__error-heading_icon icon-right"
              icon="Warning"
              size={24}
              color="colorPrimary"
            />
            <h1 className="terms__error-heading_text text-fontMedium font-ObjektivMk1XBold md:text-fontLarge">
              We’ve run into a slight problem.
            </h1>
          </div>
          <div className="terms__error-content_text font-ObjektivMk1Medium text-colorTertiary text-center text-fontSmall md:text-fontMedium">
            We had trouble creating your FuturePass. Let’s try again.
          </div>
          <RoundedButton
            className="terms__error-content_try-again-button"
            variant="outlined"
            onClick={() => {
              setError(false)
              window.localStorage.clear()
              navigate(-1)
            }}
          >
            Try Again
          </RoundedButton>

          <div
            className="terms__error-content_back-button font-ObjektivMk1Medium text-colorPrimary underline hover:cursor-pointer"
            onClick={() => {
              window.localStorage.clear()
              navigate(-1)
            }}
          >
            Back to wallet selection
          </div>
          <div className="terms__error-content_fv-logo flex">
            <TenantLogo />
          </div>
        </div>
      </div>
    )
  }
  if (isLoading || isSuccess) {
    return (
      <div className="page">
        <ProgressIndicator
          title="Creating your account"
          text="One moment please..."
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="terms flex flex-col justify-center items-center h-[100svh] py-[48px] pb-[84px] w-full relative gap-extraLarge px-1 overflow-auto md:max-h-[calc(100vh-100px)] md:max-w-[648px] md:border md:border-colorQuaternary md:rounded-lg">
        <div className="terms__header flex justify-center items-center flex-col self-start pl-small md:pl-10">
          <h1 className="terms__header_title font-ObjektivMk1XBold text-fontHead">
            Terms and Conditions
          </h1>
        </div>

        <div className="terms__content flex flex-col text-left overflow-y-scroll px-10 mb-[22px] pb-[25px] text-colorSecondary font-ObjektivMk1Medium text-fontExtraSmall gap-normal md:text-fontSmall">
          {usePassonlineTerms ? <PassonlineTerms /> : <FutureverseTerms />}

          <div className="terms__content_hcaptcha">
            <HCaptcha
              ref={hCaptchaRef}
              sitekey={props.sitekey}
              theme="dark"
              onVerify={(token: React.SetStateAction<string | null>) =>
                setHCaptchaToken(token)
              }
            />
          </div>
        </div>
        <div className="terms__footer absolute bottom-0 min-w-full border-t-[1px] border-colorQuaternary px-[24px] md:px-0">
          <div className="terms__footer_button-group flex gap-extraSmall w-full justify-center my-extraLarge md:gap-medium md:justify-end md:m-extraLarge md:w-auto">
            <RoundedButton
              onClick={() => {
                window.localStorage.clear()
                navigate(-1)
              }}
              variant="outlined"
              className="terms__footer_back-button"
            >
              Back
            </RoundedButton>
            <Tooltip
              title={
                hCaptchaToken == null
                  ? 'Please read all the terms and conditions and complete the Captcha'
                  : ''
              }
              placement="top"
            >
              <RoundedButton
                className="terms__footer_agree-button"
                variant="contained"
                onClick={acceptTerms}
                disabled={hCaptchaToken == null || isLoading}
              >
                I agree, create my account
              </RoundedButton>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
