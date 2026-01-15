/* eslint-disable react/jsx-no-useless-fragment -- '' */
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import React from 'react'
import {
  BraveBrowserPrompt,
  MetaMaskBrowserPrompt,
  ProgressIndicator,
  Login,
} from '../components'
import { useXamanEnabled, useCustodialOnFvloginEnabled } from '../hooks'

function getJWT(token: string) {
  const base64Payload = token.split('.')[1]
  const payload = Buffer.from(base64Payload, 'base64')
  const data: unknown = JSON.parse(payload.toString())
  const dataR = t.type({ clientId: t.string }).decode(data)
  if (E.isLeft(dataR)) {
    return null
  }
  return dataR.right
}

export default function ClientIdWrapper() {
  const [clientId, setClientId] = React.useState<string | null>(null)

  // Backend is passing a JWT as a query parameter that contains clientId,
  // in following react effect we are decoding the JWT and setting the clientId state.
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const _token = url.searchParams.get('token')
    if (!_token) {
      throw new Error('Invalid token')
    }

    const jwt = getJWT(_token)
    if (!jwt) {
      throw new Error('Invalid jwt')
    }
    if (!jwt.clientId) {
      throw new Error('Invalid clientId')
    }

    setClientId(jwt.clientId)
  }, [])

  if (!clientId) {
    return (
      <div className="page">
        <ProgressIndicator />
      </div>
    )
  }
  return <FVLogin clientId={clientId} />
}

function FVLogin({ clientId }: { clientId: string }) {
  const [isBraveBrowser, setIsBraveBrowser] = React.useState<boolean>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-unsafe-member-access -- ''
    (navigator as any)?.brave?.isBrave?.name === 'isBrave'
  )

  const isXamanEnabled = useXamanEnabled(clientId)
  const isCustodialOnFvloginEnabled = useCustodialOnFvloginEnabled(clientId)

  const skipBraveBrowserPrompt = () => {
    setIsBraveBrowser(false)
  }

  const isBrowser = typeof window !== 'undefined'
  const userAgent = isBrowser ? navigator.userAgent : ''
  const hasEthereum = isBrowser && !!window.ethereum
  const isAndroid = /(Android)/i.test(userAgent)
  const isIphone = /(iPhone|iPod)/i.test(userAgent)
  const isIpad = /(iPad)/i.test(userAgent)
  const isMobile = isIphone || isAndroid || isIpad
  // A mobile browser with ethereum we assume it's Metamask Browser
  const isMetamaskBroswer = isMobile && hasEthereum

  return (
    <>
      {isMetamaskBroswer ? (
        <div className="page">
          <MetaMaskBrowserPrompt />
        </div>
      ) : isBraveBrowser ? (
        <div className="page">
          <BraveBrowserPrompt onContinue={skipBraveBrowserPrompt} />
        </div>
      ) : (
        <div className="page">
          <Login
            isXamanEnabled={isXamanEnabled}
            isCustodialOnFvloginEnabled={isCustodialOnFvloginEnabled}
          />
        </div>
      )}
    </>
  )
}
/* eslint-enable react/jsx-no-useless-fragment -- '' */
