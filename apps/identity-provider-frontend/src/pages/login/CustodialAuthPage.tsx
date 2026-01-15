import { SocialSSOType } from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createIntervalCountdown, hush } from '../../common'
import { Input, ProgressIndicator, RoundedButton } from '../../components'
import VerifyOtp from '../../components/OtpVerification/VerifyOtp'
import { useKeyTrigger } from '../../hooks'

// TODO: Should be moved somewhere in the SDK because it's adapted from the backend code
export const VerifyOtpResponse = t.type(
  {
    errorType: t.union([
      t.undefined,
      t.literal('codeNoLongerValid'),
      t.literal('codeIncorrect'),
      t.literal('revalidateTimeout'),
    ]),
  },
  'VerifyOtpResponse'
)
type VerifyOtpResponse = t.TypeOf<typeof VerifyOtpResponse>

type Props = {
  enableCustodialSupport: boolean
}

export const OTP_CODE_MAX_LENGTH = 6
const emptyCodeArray = Array.from({ length: OTP_CODE_MAX_LENGTH }, () => '')

const CustodialAuthPage = ({ enableCustodialSupport }: Props): JSX.Element => {
  const navigate = useNavigate()
  const [URLSearchParams] = useSearchParams()
  const hint = URLSearchParams.get('hint')
  const target = URLSearchParams.get('target')
  const [loginHint, setLoginHint] = React.useState<
    'email' | 'social' | undefined
  >(undefined)
  const [targetSSO, setTargetSSO] = React.useState<SocialSSOType | undefined>(
    undefined
  )

  const [email, setEmail] = React.useState('')
  const [isEmailOtpSent, setIsEmailOtpSent] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [emailOtpToVerify, setEmailOtpToVerify] =
    React.useState<string[]>(emptyCodeArray)
  const [
    timestampOfNextSendEmailOtpRetry,
    setTimestampOfNextSendEmailOtpRetry,
  ] = React.useState(0)
  const [
    timestampOfNextVerifyEmailOtpRetry,
    setTimestampOfNextVerifyEmailOtpRetry,
  ] = React.useState(0)
  const [
    formattedTimeUntilNextSendEmailOtpRetry,
    setFormattedTimeUntilNextSendEmailOtpRetry,
  ] = React.useState('')
  const [
    formattedTimeUntilNextVerifyEmailOtpRetry,
    setFormattedTimeUntilNextVerifyEmailOtpRetry,
  ] = React.useState('')

  const [sendEmailOtpErrorType, setSendEmailOtpErrorType] = React.useState<
    undefined | 'invalidEmail' | 'resendTimeout' | 'generic'
  >(undefined)
  const [verifyEmailOtpErrorType, setVerifyEmailOtpErrorType] = React.useState<
    | undefined
    | 'codeNoLongerValid'
    | 'revalidateTimeout'
    | 'codeIncorrect'
    | 'generic'
  >(undefined)
  const [isRedirecting, setIsRedirecting] = React.useState<boolean>(false)

  const { t: translate } = useTranslation()

  React.useEffect(() => {
    if (hint === 'social') {
      setLoginHint('social')

      const socialSSOtype = SocialSSOType.decode(target)
      if (E.isLeft(socialSSOtype)) {
        return
      }
      setTargetSSO(socialSSOtype.right)
    }

    if (hint === 'email') {
      setLoginHint('email')
    }
  }, [hint, target])

  React.useEffect(() => {
    if (!enableCustodialSupport) {
      return
    }
    if (loginHint === 'social') {
      if (targetSSO == null) {
        return
      }
      setIsLoading(true)
      window.location.href = `/login/social/${targetSSO}`
    }
  }, [enableCustodialSupport, loginHint, targetSSO])

  /**
   * SendOtp Countdown Timer
   */
  React.useEffect(
    () =>
      createIntervalCountdown({
        timestampOfNextRetry: timestampOfNextSendEmailOtpRetry,
        clearState: () => {
          setFormattedTimeUntilNextSendEmailOtpRetry('')
          setSendEmailOtpErrorType(undefined)
        },
        setFormattedDuration: setFormattedTimeUntilNextSendEmailOtpRetry,
      }),
    [timestampOfNextSendEmailOtpRetry]
  )

  /**
   * VerifyOtp Countdown Timer
   */
  React.useEffect(
    () =>
      createIntervalCountdown({
        timestampOfNextRetry: timestampOfNextVerifyEmailOtpRetry,
        clearState: () => {
          setFormattedTimeUntilNextVerifyEmailOtpRetry('')

          if (
            verifyEmailOtpErrorType === 'codeIncorrect' ||
            verifyEmailOtpErrorType === 'revalidateTimeout'
          ) {
            // For other error types we want the error message to remain visible even after timer runs out
            setVerifyEmailOtpErrorType(undefined)
          }
        },
        setFormattedDuration: setFormattedTimeUntilNextVerifyEmailOtpRetry,
      }),
    [timestampOfNextVerifyEmailOtpRetry, verifyEmailOtpErrorType]
  )

  const sendEmailOtpErrorMessage = React.useMemo(() => {
    switch (sendEmailOtpErrorType) {
      case 'generic':
        return translate('email.email__errors.generic')
      case 'invalidEmail':
        return translate('email.email__errors.invalidEmail')
      case 'resendTimeout':
        return translate('email.email__errors.resendTimeout', {
          formattedTimeUntilNextSendEmailOtpRetry,
        })
    }
  }, [
    sendEmailOtpErrorType,
    translate,
    formattedTimeUntilNextSendEmailOtpRetry,
  ])

  const verifyEmailOtpErrorMessage = React.useMemo(() => {
    switch (verifyEmailOtpErrorType) {
      case 'codeIncorrect':
        return timestampOfNextVerifyEmailOtpRetry !== 0
          ? translate('email.email__errors.codeIncorrect', {
              formattedTimeUntilNextVerifyEmailOtpRetry,
            })
          : undefined
      case 'codeNoLongerValid':
        return translate('email.email__errors.codeNoLongerValid')
      case 'revalidateTimeout':
        return translate('email.email__errors.revalidateTimeout', {
          formattedTimeUntilNextVerifyEmailOtpRetry,
        })
      case 'generic':
        return translate('email.email__errors.generic')
    }
  }, [
    verifyEmailOtpErrorType,
    timestampOfNextVerifyEmailOtpRetry,
    t,
    formattedTimeUntilNextVerifyEmailOtpRetry,
  ])

  const requestSendEmailOtp = React.useCallback(async () => {
    if (Date.now() < timestampOfNextSendEmailOtpRetry) return

    try {
      // A new otp warrants new retries, so we clear the old timeout
      setVerifyEmailOtpErrorType(undefined)
      setTimestampOfNextVerifyEmailOtpRetry(0)

      setSendEmailOtpErrorType(undefined)
      setTimestampOfNextSendEmailOtpRetry(0)

      setEmailOtpToVerify(emptyCodeArray)
      const validEmail = hush(t.Email.decode(email))

      if (validEmail == null) {
        setSendEmailOtpErrorType('invalidEmail')
        return
      }

      setIsLoading(true)

      const requestSendEmailOtpResponse = await fetch('/login/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const retryAfterHeader = parseInt(
        requestSendEmailOtpResponse.headers.get('Retry-After') ?? '0'
      )

      switch (requestSendEmailOtpResponse.status) {
        case 200: {
          setTimestampOfNextSendEmailOtpRetry(retryAfterHeader)
          setEmail(email)
          setIsEmailOtpSent(true)
          return
        }

        case 429: {
          setTimestampOfNextSendEmailOtpRetry(retryAfterHeader)
          setSendEmailOtpErrorType('resendTimeout')
          return
        }

        case 500:
        default: {
          setSendEmailOtpErrorType('generic')
          return
        }
      }
    } catch (e) {
      setSendEmailOtpErrorType('generic')
    } finally {
      setIsLoading(false)
    }
  }, [email, timestampOfNextSendEmailOtpRetry])

  const requestVerifyEmailOtp = React.useCallback(async () => {
    if (Date.now() < timestampOfNextVerifyEmailOtpRetry) return

    try {
      setIsLoading(true)
      setVerifyEmailOtpErrorType(undefined)
      setTimestampOfNextVerifyEmailOtpRetry(0)

      const otp = emailOtpToVerify.join('').toString()

      if (otp.length < OTP_CODE_MAX_LENGTH) {
        setIsLoading(false)
        setVerifyEmailOtpErrorType('codeIncorrect')
        return
      }

      const requestVerifyEmailOtpResponse = await fetch('/login/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })
      const retryAfterHeader = parseInt(
        requestVerifyEmailOtpResponse.headers.get('Retry-After') ?? '0'
      )

      switch (requestVerifyEmailOtpResponse.status) {
        case 200: {
          const emailOtpVerifyResponseBodyR = t
            .type({ redirectTo: t.string })
            .decode(await requestVerifyEmailOtpResponse.json())

          if (E.isLeft(emailOtpVerifyResponseBodyR)) {
            setVerifyEmailOtpErrorType('generic')
            return
          }

          setIsRedirecting(true)
          window.location.href = emailOtpVerifyResponseBodyR.right.redirectTo
          return
        }

        case 401: {
          const emailOtpVerifyResponseBodyR = VerifyOtpResponse.decode(
            await requestVerifyEmailOtpResponse.json()
          )

          if (E.isRight(emailOtpVerifyResponseBodyR)) {
            setVerifyEmailOtpErrorType(
              emailOtpVerifyResponseBodyR.right.errorType
            )
            setTimestampOfNextVerifyEmailOtpRetry(retryAfterHeader)
          }
          return
        }

        case 500:
        default: {
          setVerifyEmailOtpErrorType('generic')
          return
        }
      }
    } catch (e) {
      setVerifyEmailOtpErrorType('generic')
    } finally {
      setIsLoading(false)
    }
  }, [email, emailOtpToVerify, timestampOfNextVerifyEmailOtpRetry])

  useKeyTrigger({
    key: 'Enter',
    onKeyDown: isEmailOtpSent ? requestVerifyEmailOtp : requestSendEmailOtp,
  })

  if (isLoading || isRedirecting) {
    return (
      <div className="page">
        <ProgressIndicator
          title={
            targetSSO &&
            translate('progress-indicator.progress-indicator__title', {
              targetSSO,
            })
          }
          text={
            targetSSO &&
            translate('progress-indicator.progress-indicator__text')
          }
        />
      </div>
    )
  }

  if (isEmailOtpSent) {
    return (
      <div className="page h-[100svh] md:h-fit md:w-fit">
        <VerifyOtp
          type="email"
          connectInfo={email}
          otp={emailOtpToVerify}
          setOtp={setEmailOtpToVerify}
          isLoading={isLoading}
          onSendNewCode={requestSendEmailOtp}
          onVerifyCode={requestVerifyEmailOtp}
          onCancel={() => {
            navigate(-1)
          }}
          // TODO: rename this
          formattedTimeUntilNextRetry={formattedTimeUntilNextSendEmailOtpRetry}
          errorMessage={verifyEmailOtpErrorMessage}
        />
      </div>
    )
  }

  return (
    <div className="page h-[100svh] md:h-fit md:w-fit">
      <div className="email flex flex-col border-none gap-extraLarge h-full w-screen px-7 md:w-[375px] md:min-h-fit md:border-colorQuaternary md:border-[1px] md:border-solid md:rounded-lg md:p-extraLarge">
        <div className="email__header flex flex-col gap-[48px]">
          <h1 className="email__header_text font-ObjektivMk1XBold text-fontHead font-bold leading-[1.2rem] mt-[40px] md:mt-0">
            {translate('email.email__header_text')}
          </h1>
          <Input
            type="email"
            value={email}
            placeHolder={translate('email.email__header_input')}
            errorMessage={sendEmailOtpErrorMessage}
            setValue={(e) => {
              if (sendEmailOtpErrorMessage != null) {
                setSendEmailOtpErrorType(undefined)
              }
              setEmail(e)
            }}
            className="email__header_input"
          ></Input>
        </div>
        <div className="email__button-container flex flex-row self-end items-center justify-center min-w-full mt-auto mb-5 gap-small pt-extraLarge md:mb-0 md:content-end md:justify-end">
          <RoundedButton
            variant="outlined"
            onClick={() => {
              navigate(-1)
            }}
            className="email__button-container_back-button w-full md:w-fit"
          >
            {translate('email.email__button-container.back')}
          </RoundedButton>
          <RoundedButton
            variant="contained"
            onClick={requestSendEmailOtp}
            disabled={
              timestampOfNextSendEmailOtpRetry > Date.now() &&
              sendEmailOtpErrorType != null
            }
            className="email__button-container_continue-button w-full md:w-fit"
          >
            {translate('email.email__button-container.continue')}
          </RoundedButton>
        </div>
      </div>
    </div>
  )
}

export default CustodialAuthPage
