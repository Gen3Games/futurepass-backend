import { hush, User } from '@futureverse/experience-sdk'
import { useSession, signIn } from 'next-auth/react'
import React from 'react'
import { getProviderIdForIdpDomain } from '../utils'
import { useRPCCallContext } from './rpc'

interface FVSessionContextType {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  initSignIn: () => Promise<void>
}

export const FVSessionContext = React.createContext<
  FVSessionContextType | undefined
>(undefined)

interface FVSessionContextProviderProps {
  children: React.ReactNode
}

export const FVSessionContextProvider: React.FC<
  FVSessionContextProviderProps
> = ({ children }) => {
  const { status, data } = useSession()

  const user = React.useMemo(() => {
    if (!data?.user) {
      return null
    }

    return hush(User.decode(data.user))
  }, [data])

  const { idpURL } = useRPCCallContext()

  const initSignIn = React.useCallback(async () => {
    const providerId = getProviderIdForIdpDomain(idpURL)

    await signIn(providerId)
  }, [idpURL])

  React.useEffect(() => {
    if (status === 'loading' || status === 'authenticated') {
      return
    }

    void initSignIn()
  }, [status, initSignIn])

  return (
    <FVSessionContext.Provider value={{ user, status, initSignIn }}>
      {children}
    </FVSessionContext.Provider>
  )
}

export default FVSessionContextProvider

export function useFVSession() {
  const context = React.useContext(FVSessionContext)
  if (context === undefined) {
    throw new Error('useFVSession must be used within a FVSessionContext')
  }
  return context
}
