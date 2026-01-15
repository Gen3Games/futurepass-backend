import * as t from '@sylo/io-ts'
import { useRouter } from 'next/router'
import React from 'react'
import { Loading } from '../../components/Loading'
import { hush } from '../../utils'

interface RPCCallContextType {
  pendingRPCCall: unknown
  idpURL: string
}

export const RPCCallContext = React.createContext<
  RPCCallContextType | undefined
>(undefined)

interface RPCCallContextProviderProps {
  children: React.ReactNode
  defaultIdpUrl: string
}

function dumpRPCCall(rpc: unknown) {
  sessionStorage.setItem('request', JSON.stringify(rpc))
}

function restoreRPCCall(): unknown {
  return JSON.parse(sessionStorage.getItem('request') ?? 'null')
}

function base64UrlDecode(encoded: string): string {
  let newEncoded = encoded.replace(/-/g, '+').replace(/_/g, '/')
  while (newEncoded.length % 4) newEncoded += '='
  return atob(encoded)
}

const IdpURLRequest = t.strict({
  payload: t.strict({ idpUrl: t.string }),
})

export const RPCCallContextProvider: React.FC<RPCCallContextProviderProps> = ({
  children,
  defaultIdpUrl,
}) => {
  const router = useRouter()

  const [pendingRPCCall, setPendingRPCCall] = React.useState<unknown>(null)
  const [idpURL, setIdpURL] = React.useState<string | null>(null)

  React.useEffect(() => {
    const rpcCall: unknown =
      router.query['request'] && typeof router.query['request'] === 'string'
        ? JSON.parse(base64UrlDecode(router.query['request']))
        : restoreRPCCall()

    if (!rpcCall) {
      setIdpURL(defaultIdpUrl)
      return
    }

    dumpRPCCall(rpcCall)
    setPendingRPCCall(rpcCall)

    const _idpURL = hush(IdpURLRequest.decode(rpcCall))?.payload.idpUrl
    if (_idpURL) {
      setIdpURL(_idpURL)
    } else {
      setIdpURL(defaultIdpUrl)
    }
  }, [defaultIdpUrl, router.query])

  if (!pendingRPCCall || !idpURL) {
    return <Loading />
  }

  return (
    <RPCCallContext.Provider value={{ pendingRPCCall, idpURL }}>
      {children}
    </RPCCallContext.Provider>
  )
}

export default RPCCallContextProvider

export function useRPCCallContext() {
  const context = React.useContext(RPCCallContext)
  if (context === undefined) {
    throw new Error(
      'useRPCCallContext must be used within a RPCCallContextProvider'
    )
  }
  return context
}
