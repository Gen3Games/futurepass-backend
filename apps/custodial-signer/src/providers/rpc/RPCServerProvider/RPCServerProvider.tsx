import React from 'react'
import { Loading } from '../../../components/Loading'
import { InteractiveSignRequest } from '../../../interfaces/interfaces'
import { useFVSession } from '../../FVSessionProvider'
import { useRPCCallContext } from '../RPCCallProvider'
import { RPCServer } from './RPCServer'

interface RPCServerContextType {
  activeRequest: InteractiveSignRequest
}

export const RPCServerContext = React.createContext<
  RPCServerContextType | undefined
>(undefined)

interface RPCServerContextProviderProps {
  children: React.ReactNode
}

export const RPCServerContextProvider: React.FC<
  RPCServerContextProviderProps
> = ({ children }) => {
  const { idpURL, pendingRPCCall } = useRPCCallContext()
  const { user, initSignIn } = useFVSession()
  const [activeRequest, setActiveRequest] =
    React.useState<InteractiveSignRequest | null>(null)

  React.useEffect(() => {
    if (!pendingRPCCall || !idpURL || !user) {
      return
    }

    const rpcServer = new RPCServer(user, setActiveRequest, initSignIn)

    rpcServer.handle(pendingRPCCall, {
      origin: '',
    })

    return () => {
      rpcServer.dispose()
    }
  }, [idpURL, pendingRPCCall, user, initSignIn, setActiveRequest])

  if (!activeRequest) {
    return <Loading />
  }

  return (
    <RPCServerContext.Provider value={{ activeRequest }}>
      {children}
    </RPCServerContext.Provider>
  )
}

export default RPCServerContextProvider

export function useRPCServerContext() {
  const context = React.useContext(RPCServerContext)
  if (context === undefined) {
    throw new Error(
      'useRPCServerContext must be used within a RPCServerContextProvider'
    )
  }
  return context
}
