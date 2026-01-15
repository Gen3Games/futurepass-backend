/* eslint-disable @typescript-eslint/no-floating-promises -- '' */
import { Loader } from '@futureverse/component-library'
import i18Next from 'i18next'
import { asyncWithLDProvider } from 'launchdarkly-react-client-sdk'
import React, { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import App from './app/app'
import { getLaunchDarklyHash } from './common'
import { environment } from './environments/environment'
import { HTMLTenantContextProvider } from './providers/HTMLTenantContextProvider'

const launchdarklyClientSideId = environment.NX_PUBLIC_LAUNCHDARKLY_SIDE_ID

const LAUNCHDARKLY_DEFAULT_CONTEXT = {
  kind: 'User',
  key: 'identity-provider-anonymous',
  anonymous: true,
}

;(async () => {
  const LDProvider = await asyncWithLDProvider({
    clientSideID: launchdarklyClientSideId,
    context: LAUNCHDARKLY_DEFAULT_CONTEXT,
    options: {
      hash: getLaunchDarklyHash(),
    },
    reactOptions: {
      useCamelCaseFlagKeys: true,
    },
    flags: {
      'disabled-xaman-auth-client-ids': [],
      'disabled-custodial-on-fvlogin-client-ids': [],
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- it is safe since we know that the root exists
  const root = ReactDOM.createRoot(document.getElementById('root')!)
  root.render(
    <StrictMode>
      <LDProvider>
        <HTMLTenantContextProvider>
          <WaitForI18Next>
            <App />
          </WaitForI18Next>
        </HTMLTenantContextProvider>
      </LDProvider>
    </StrictMode>
  )
})()

function WaitForI18Next(props: { children: React.ReactNode }) {
  const [i18nInitialized, setI18nInitialized] = React.useState(
    i18Next.isInitialized
  )
  React.useEffect(() => {
    if (!i18nInitialized) {
      i18Next.on('initialized', () => {
        setI18nInitialized(true)
      })
    }
  }, [i18nInitialized])

  if (!i18nInitialized) {
    return (
      <div className="main h-[100-svh] w-full">
        <div className="page">
          <Loader className="main__loader" />
        </div>
      </div>
    )
  }
  return props.children
}

/* eslint-enable @typescript-eslint/no-floating-promises -- '' */
