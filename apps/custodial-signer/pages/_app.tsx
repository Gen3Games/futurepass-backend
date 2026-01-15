import { LoggerProvider } from '@futureverse/stateboss'
import * as L from '@sylo/logger'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProps } from 'next/app'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { SessionProvider } from 'next-auth/react'
import './styles.css'

const queryClient = new QueryClient()

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <></>
      </Head>
      <main>
        <SessionProvider>
          <LoggerProvider logger={L.consoleLogger}>
            <QueryClientProvider client={queryClient}>
              <Component {...pageProps} />
            </QueryClientProvider>
          </LoggerProvider>
        </SessionProvider>
      </main>
    </>
  )
}

export default dynamic(() => Promise.resolve(CustomApp), {
  ssr: false,
})
