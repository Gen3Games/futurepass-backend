import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Input, ProgressIndicator, RoundedButton, Dropdown } from '..'
import { E164PhoneNumber, createIntervalCountdown } from '../../common'
import { COUNTRYCODES } from '../../common/constants'
import { useKeyTrigger } from '../../hooks'

import { useHTMLTenantContext } from '../../providers/HTMLTenantContextProvider'
import VerifyOtp from './VerifyOtp'

// TODO: This type is adapted from IDP Backend - move to internal shared lib once we have it
/**
 * Used by the SmsOtpService which sends the OTPs.
 */
export const SendOtpResponse = t.type(
  {
    isOtpGenerated: t.boolean,
    timestampOfNextRetry: t.number,
  },
  'SendOtpResponse'
)
export type SendOtpResponse = t.TypeOf<typeof SendOtpResponse>

type Props = {
  eoa: string
}

export const CODE_MAX_LENGTH = 6
const emptyOtpArray = Array.from({ length: CODE_MAX_LENGTH }, () => '')

const SmsOtpPage = ({ eoa }: Props): JSX.Element => {
  const navigate = useNavigate()
  const { t: translate } = useTranslation()
  const { tenantConfig } = useHTMLTenantContext()

  const [phoneNumber, setPhoneNumber] = React.useState<string | null>(null)
  const [isSmsOtpSent, setIsSmsOtpSent] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [smsOtpToVerify, setSmsOtpToVerify] =
    React.useState<string[]>(emptyOtpArray)
  const [timestampOfNextSendSmsOtpRetry, setTimestampOfNextSendSmsOtpRetry] =
    React.useState(0)
  const [
    formattedTimeUntilNextSendSmsOtpRetry,
    setFormattedTimeUntilNextSendSmsOtpRetry,
  ] = React.useState('')
  const [sendSmsOtpErrorType, setSendSmsOtpErrorType] = React.useState<
    | undefined
    | 'invalidPhoneNumber'
    | 'maxAttemptsReached'
    | 'wrongCodeLength'
    | 'generic'
    | 'incorrectCode'
  >(undefined)
  const [selectedCountryCode, setSelectedCountryCode] =
    React.useState<string>('64')
  const [countryCodeAndPhoneNumber, setCountryCodeAndPhoneNumber] =
    React.useState<string>(`+${selectedCountryCode}${phoneNumber}`)

  const onPhoneNumberChange = React.useCallback((ip: string) => {
    if (!/^\d{1,13}$/.test(ip)) {
      setSendSmsOtpErrorType('invalidPhoneNumber')
    } else {
      setSendSmsOtpErrorType(undefined)
    }
    setPhoneNumber(ip)
  }, [])

  /**
   * SendOtp Countdown Timer
   */
  React.useEffect(
    () =>
      createIntervalCountdown({
        timestampOfNextRetry: timestampOfNextSendSmsOtpRetry,
        clearState: () => {
          setFormattedTimeUntilNextSendSmsOtpRetry('')
          setSendSmsOtpErrorType(undefined)
        },
        setFormattedDuration: setFormattedTimeUntilNextSendSmsOtpRetry,
      }),
    [timestampOfNextSendSmsOtpRetry]
  )

  React.useEffect(() => {
    setCountryCodeAndPhoneNumber(`+${selectedCountryCode}${phoneNumber}`)
  }, [selectedCountryCode, phoneNumber])

  const sendSmsOtpErrorMessage = React.useMemo(() => {
    switch (sendSmsOtpErrorType) {
      case 'generic':
        return translate('sms-otp-page.sms-otp-page__errors.generic')
      case 'invalidPhoneNumber':
        return translate('sms-otp-page.sms-otp-page__errors.invalidPhoneNumber')
      case 'maxAttemptsReached':
        return translate('sms-otp-page.sms-otp-page__errors.maxAttemptsReached')
      case 'wrongCodeLength':
        return translate('sms-otp-page.sms-otp-page__errors.wrongCodeLength')
      case 'incorrectCode':
        return translate('sms-otp-page.sms-otp-page__errors.incorrectCode')
      default:
        return undefined
    }
  }, [sendSmsOtpErrorType, translate])

  const requestSendSmsOtp = React.useCallback(async () => {
    if (sendSmsOtpErrorType === 'invalidPhoneNumber') {
      return
    }

    if (Date.now() < timestampOfNextSendSmsOtpRetry) return

    const phoneNumberR = E164PhoneNumber.decode(countryCodeAndPhoneNumber)
    if (E.isLeft(phoneNumberR)) {
      setSendSmsOtpErrorType('invalidPhoneNumber')
      return
    }

    try {
      setSendSmsOtpErrorType(undefined)
      setTimestampOfNextSendSmsOtpRetry(0)

      setSmsOtpToVerify(emptyOtpArray)

      setIsLoading(true)

      const requestSendSmsOtpResponse = await fetch(
        `${window.location.pathname}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber: countryCodeAndPhoneNumber }),
        }
      )
      const retryAfterHeader = parseInt(
        requestSendSmsOtpResponse.headers.get('Retry-After') ?? '0'
      )

      switch (requestSendSmsOtpResponse.status) {
        case 200: {
          setTimestampOfNextSendSmsOtpRetry(retryAfterHeader)
          setPhoneNumber(phoneNumber)
          setIsSmsOtpSent(true)
          return
        }

        case 400: {
          const requestSendSmsOtpResponseR = t
            .type({
              error: t.literal('Invalid phone number'),
            })
            .decode(requestSendSmsOtpResponse)

          if (E.isRight(requestSendSmsOtpResponseR)) {
            setSendSmsOtpErrorType('invalidPhoneNumber')
          } else {
            setSendSmsOtpErrorType('generic')
          }
          return
        }

        case 429: {
          setTimestampOfNextSendSmsOtpRetry(retryAfterHeader)
          setSendSmsOtpErrorType('maxAttemptsReached')
          return
        }

        default: {
          setSendSmsOtpErrorType('generic')
          return
        }
      }
    } catch (e) {
      setSendSmsOtpErrorType('generic')
    } finally {
      setIsLoading(false)
    }
  }, [
    sendSmsOtpErrorType,
    timestampOfNextSendSmsOtpRetry,
    countryCodeAndPhoneNumber,
    phoneNumber,
  ])

  const requrestVerifySmsOtp = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setSendSmsOtpErrorType(undefined)
      const otp = smsOtpToVerify.join('').toString()

      if (otp.length < CODE_MAX_LENGTH) {
        setIsLoading(false)
        setSendSmsOtpErrorType('wrongCodeLength')
        return
      }

      const requestVerifySmsOtpResponse = await fetch(
        `${window.location.pathname}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: countryCodeAndPhoneNumber,
            otp,
            eoa,
          }),
        }
      )
      const retryAfterHeader = parseInt(
        requestVerifySmsOtpResponse.headers.get('Retry-After') ?? '0'
      )

      switch (requestVerifySmsOtpResponse.status) {
        case 200: {
          const requestVerifySmsOtpResponseR = t
            .type({ redirectTo: t.string })
            .decode(await requestVerifySmsOtpResponse.json())

          if (E.isLeft(requestVerifySmsOtpResponseR)) {
            setSendSmsOtpErrorType('generic')
            return
          }

          window.location.href = requestVerifySmsOtpResponseR.right.redirectTo
          return
        }

        case 401: {
          setIsLoading(false)
          setSendSmsOtpErrorType('incorrectCode')
          return
        }

        case 429: {
          setIsLoading(false)
          setTimestampOfNextSendSmsOtpRetry(retryAfterHeader)
          setSendSmsOtpErrorType('maxAttemptsReached')
          return
        }

        case 500: {
          setIsLoading(false)
          setSendSmsOtpErrorType('generic')
          return
        }

        default: {
          setIsLoading(false)
          setSendSmsOtpErrorType('generic')
          return
        }
      }
    } catch (e) {
      setSendSmsOtpErrorType('generic')
    }
  }, [smsOtpToVerify, countryCodeAndPhoneNumber, eoa])

  useKeyTrigger({
    key: 'Enter',
    onKeyDown: isSmsOtpSent ? requrestVerifySmsOtp : requestSendSmsOtp,
  })

  if (isLoading) {
    return <ProgressIndicator />
  }

  if (isSmsOtpSent && phoneNumber != null) {
    return (
      <div className="page">
        <VerifyOtp
          type="sms"
          otp={smsOtpToVerify}
          connectInfo={countryCodeAndPhoneNumber}
          errorMessage={sendSmsOtpErrorMessage}
          formattedTimeUntilNextRetry={formattedTimeUntilNextSendSmsOtpRetry}
          areMaxAttemptsReached={sendSmsOtpErrorType === 'maxAttemptsReached'}
          isLoading={isLoading}
          setOtp={setSmsOtpToVerify}
          onSendNewCode={requestSendSmsOtp}
          onVerifyCode={requrestVerifySmsOtp}
          onCancel={() => {
            setIsSmsOtpSent(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <div
        id="sms-otp-page"
        className="sms-otp-page flex flex-col items-center h-[100svh] w-screen px-7 py-7 border-none gap-extraLarge font-ObjektivMk1Thin md:h-fit md:w-[600px] md:rounded-md md:border-[1px] md:border-solid md:border-colorQuaternary"
      >
        <div
          id="sms-otp-page__header"
          className="sms-otp-page__header flex flex-col w-full font-ObjektivMk1Thin gap-extraLarge"
        >
          <h1
            id="sms-opt-page__header_verification-required"
            className="sms-opt-page__header_verification-required text-fontHead font-ObjektivMk1XBold"
          >
            {translate(
              'sms-otp-page.sms-opt-page__header_verification-required'
            )}
          </h1>
          <p
            id="sms-otp-page__header_message"
            className="sms-otp-page__header_message max-w-[296px] text-colorTertiary text-fontMedium leading-[1.48] md:max-w-fit"
          >
            {translate('sms-otp-page.sms-otp-page__header_message', {
              tenantName: tenantConfig?.name,
            })}
          </p>

          <div
            id="sms-otp-page__input"
            className="sms-otp-page__input flex flex-col content-stretch gap-normal w-full md:flex-row"
          >
            <div
              id="sms-otp-page__input_dropdown"
              className="sms-otp-page__input_dropdown"
            >
              <Dropdown
                onChange={setSelectedCountryCode}
                options={COUNTRYCODES}
                label={translate(
                  'sms-otp-page.sms-otp-page__input_dropdown-label'
                )}
                selectedValue={selectedCountryCode}
              />
            </div>
            <div
              id="sms-otp-page__input_phone-number"
              className="sms-otp-page__input_phone-number w-full"
            >
              <Input
                type="text"
                value={phoneNumber ?? ''}
                placeHolder={translate(
                  'sms-otp-page.sms-otp-page__input_phone-number-placeholder'
                )}
                errorMessage={sendSmsOtpErrorMessage}
                setValue={(e) => {
                  onPhoneNumberChange(e)
                }}
                className="sms-otp-page__input_phone"
              />
            </div>
          </div>
        </div>
        {formattedTimeUntilNextSendSmsOtpRetry !== '' && (
          <div className="w-full">
            <p
              id="sms-otp-page__resend-time"
              className="sms-otp-page__resend-time"
            >
              {translate('sms-otp-page.sms-otp-page__resend-time', {
                formattedTimeUntilNextSendSmsOtpRetry,
              })}
            </p>
          </div>
        )}
        <div
          id="sms-otp-page__buttons"
          className="sms-otp-page__buttons flex flex-row justify-end items-center gap-small min-w-full mt-auto md:mt-10 "
        >
          <div
            id="sms-otp-page__buttons_back-button"
            className="sms-otp-page__buttons_back-button w-full md:w-fit"
          >
            <RoundedButton
              variant="outlined"
              onClick={() => {
                navigate(-1)
              }}
              className="w-full md:w-fit"
            >
              {translate('sms-otp-page.sms-otp-page__buttons_back-button')}
            </RoundedButton>
          </div>

          <div
            id="sms-otp-page__buttons_next-button"
            className="sms-otp-page__buttons_next-button w-full md:w-fit"
          >
            <RoundedButton
              variant="contained"
              disabled={
                !E164PhoneNumber.is(countryCodeAndPhoneNumber) ||
                sendSmsOtpErrorType === 'invalidPhoneNumber'
              }
              onClick={() => {
                void requestSendSmsOtp()
              }}
              className="w-full md:w-fit"
            >
              {translate('sms-otp-page.sms-otp-page__buttons_next-button')}
            </RoundedButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmsOtpPage
