import { cn } from '@futureverse/component-library'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Icon, RoundedButton } from '..'

export const CODE_MAX_LENGTH = 6

type Props = {
  type: 'sms' | 'email'
  otp: string[]
  isLoading: boolean
  connectInfo: string
  errorMessage?: string
  formattedTimeUntilNextRetry: string
  areMaxAttemptsReached?: boolean
  onVerifyCode: () => void
  onSendNewCode: () => void
  setOtp: React.Dispatch<React.SetStateAction<string[]>>
  onCancel: () => void
}

const VerifyOtp = ({
  type,
  connectInfo,
  otp,
  isLoading,
  errorMessage,
  formattedTimeUntilNextRetry,
  areMaxAttemptsReached,
  onVerifyCode,
  onSendNewCode,
  setOtp,
  onCancel,
}: Props): JSX.Element => {
  const [wasOtpReentered, setWasOtpReentered] = React.useState(false)
  const { t: translate } = useTranslation()

  const isOtpReadyToBeVerified = React.useMemo(
    () =>
      otp.filter((x) => x.trim() !== '').length >= CODE_MAX_LENGTH &&
      !areMaxAttemptsReached,
    [otp, areMaxAttemptsReached]
  )

  const onChange = React.useCallback(
    (idx: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim()
      if (!/^\d+$/.test(value) && value !== '') {
        return
      }

      const newCode = [...otp]
      newCode[idx] = value.slice(-1)
      setOtp(newCode)
      setWasOtpReentered(true)

      if (value.length === CODE_MAX_LENGTH) {
        setOtp(value.split(''))
      }

      if (value !== '') {
        const nextElementSibling = event.target.nextElementSibling
        if (nextElementSibling instanceof HTMLInputElement) {
          nextElementSibling.focus()
        }
      }
    },
    [otp, setOtp]
  )

  const onKeyDown = React.useCallback(
    (idx: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      const { key, currentTarget, metaKey, ctrlKey } = event

      // Check for a numeric value or if the ctrlKey/metaKey is held for paste
      const isNumericInput = /^\d$/.test(key)
      const isPaste = key === 'v' && (ctrlKey || metaKey)

      const isControlKey = [
        'Backspace',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Delete',
      ].includes(key)

      if (!isNumericInput && !isControlKey && !isPaste) {
        event.preventDefault()
        return
      }

      // Special handling for backspace
      if (key === 'Backspace' && currentTarget.value === '' && idx > 0) {
        const newCode = [...otp]
        newCode[idx - 1] = ''
        setOtp(newCode)
        const previousInput = event.currentTarget.previousElementSibling
        if (previousInput instanceof HTMLInputElement) {
          previousInput.focus()
        }
      }
    },
    [otp, setOtp]
  )

  React.useEffect(() => {
    if (isOtpReadyToBeVerified && !isLoading && wasOtpReentered) {
      onVerifyCode()
      setWasOtpReentered(false)
    }
  }, [isOtpReadyToBeVerified, wasOtpReentered, isLoading, onVerifyCode])

  return (
    <div
      id="verify-otp"
      className="verify-otp flex flex-col border-none px-7 h-full w-full gap-extraLarge md:h-fit md:w-[450px] md:border-colorQuaternary md:border-[1px] md:border-solid md:rounded-lg md:p-extraLarge"
    >
      <div className="flex flex-col gap-extraLarge">
        <h1
          id="verify-otp__header_message"
          className="verify-otp__header_message font-ObjektivMk1XBold text-fontHead mt-[40px] md:mt-0"
        >
          {type === 'sms'
            ? translate('verify-otp.verify-otp__header_message.sms')
            : translate('verify-otp.verify-otp__header_message.email')}
        </h1>
        <p
          id="verify-otp__instruction"
          className="verify-otp__instruction text-colorTertiary font-ObjektivMk1Thin leading-[1.48]"
        >
          {translate('verify-otp.verify-otp__instruction', { connectInfo })}
        </p>

        <div>
          <div
            id="verify-otp__otp"
            className="verify-otp__otp flex gap-[8px] max-w-[200px] md:gap-[10px] "
          >
            {Array.from({ length: CODE_MAX_LENGTH }).map((_, index) => (
              <input
                key={index}
                value={otp[index]?.toString()}
                type="number"
                onChange={onChange(index)}
                inputMode="numeric"
                autoComplete="one-time-code"
                onKeyDown={onKeyDown(index)}
                id="verify-otp__otp_input"
                className={cn(
                  'verify-otp__otp_input bg-transparent w-[42px] md:w-[48px] h-[48px] p-[12px] border-colorPrimary border-solid border-[1px] text-fontMedium text-colorSecondary text-center rounded-[2px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  {
                    'bg-gray-800': errorMessage != null,
                  }
                )}
              />
            ))}
          </div>
          <div
            id="verify-otp__otp_error"
            className={cn(
              'verify-otp__otp_error flex flex-row justify-center items-center mt-normal font-ObjektivMk1Thin text-fontExtraSmall gap-extraSmall leading-[1.48]',
              {
                '': errorMessage != null,
              },
              {
                'hidden ': errorMessage == null,
              }
            )}
          >
            <Icon icon="Info" size={12} />
            <p
              id="verify-otp__otp_error-message"
              className="verify-otp__otp_error-message max-w-[300px]"
            >
              {errorMessage}
            </p>
          </div>
        </div>

        {!areMaxAttemptsReached && (
          <div
            id="verify-otp__resend"
            className="verify-otp__resend flex flex-col justify-start items-start gap-[8px] md:gap-[10px] text-colorTertiary w-[100%]"
          >
            <p
              id="verify-otp__resend_message"
              className="verify-otp__resend_message font-ObjektivMk1Thin"
            >
              {translate('verify-otp.verify-otp__resend_message')}

              {type === 'email' &&
                translate('verify-otp.verify-otp__resend_message-email')}
            </p>
            <button
              onClick={onSendNewCode}
              disabled={formattedTimeUntilNextRetry !== ''}
              id="verify-otp__resend_resend-button"
              className="verify-otp__resend_resend-button font-ObjektivMk1Medium"
            >
              {formattedTimeUntilNextRetry !== ''
                ? translate(
                    'verify-otp.verify-otp__resend_resend-button.resendIn',
                    {
                      formattedTimeUntilNextRetry,
                    }
                  )
                : translate(
                    'verify-otp.verify-otp__resend_resend-button.resend'
                  )}
            </button>{' '}
          </div>
        )}
      </div>
      <div
        id="verify-otp__back-buttons"
        className="verify-otp__back-buttons flex min-w-full mt-auto mb-10 md:mb-0 md:min-w-fit md:mt-0"
      >
        <RoundedButton
          variant="outlined"
          id="verify-otp__back-button-container_back-button"
          className="verify-otp__back-button-container_back-button"
          onClick={
            areMaxAttemptsReached ? () => window.history.back() : onCancel
          }
        >
          {translate(
            'verify-otp.verify-otp__back-button-container_back-button'
          )}
        </RoundedButton>
      </div>
    </div>
  )
}

export default VerifyOtp
