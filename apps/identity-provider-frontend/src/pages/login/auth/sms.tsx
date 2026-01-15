import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import SmsOtpPage from '../../../components/OtpVerification/SmsOtpPage'

const TwoFactorAuthSms = (): JSX.Element => {
  const [URLSearchParams] = useSearchParams()
  const eoa = React.useMemo(() => {
    const queryEoa = URLSearchParams.get('eoa')
    if (queryEoa != null) {
      return queryEoa.split(',')[0]
    }
    return
  }, [URLSearchParams])

  if (eoa) {
    return <SmsOtpPage eoa={eoa} />
  }
  return <div className="page"></div>
}

export default TwoFactorAuthSms
