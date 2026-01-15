import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { CHAINS, Constants, Environment } from '@futureverse/experience-sdk'
import { PropsWithChildren, createContext, useContext } from 'react'
import { Xumm } from 'xumm'
import {
  ConnectorId,
  ILoginAdapter,
  SignMessageCallbacks,
  UserSession,
} from '../../interfaces'
import { FutureverseAuthClient } from './FutureverseAuthClient'
import { LoginMethod } from './impl'

// export type SupportedChains = keyof typeof CHAINS;
// we have XRPL supported and added into sdk which needs to be removed here
export type SupportedChains = Exclude<keyof typeof CHAINS, 'XRPL'>

export type RequiredChains = [SupportedChains, ...SupportedChains[]]

// Implemented as an object for when we support more provider options in the future
export type ProviderApiKeys = {
  alchemy?: string
}

export type Web3ProviderProps = React.PropsWithChildren<{
  userSession: UserSession | null
  environment: Environment
  requiredChains: RequiredChains
  walletConnectProjectId: string
  ethereumProviderApiKeys?: ProviderApiKeys
}>

export type LoginModal = {
  adapter: ILoginAdapter
  connect: (
    connectorId: ConnectorId,
    signMessageCallbacks?: SignMessageCallbacks
  ) => Promise<void>
}

export type LoginFn = (opts?: {
  adapter?: ILoginAdapter
  loginMethod?: LoginMethod
  /** Any state data provided by the client in the Authorization request. It will be returned unchanged to the client. */
  customClientState?: unknown
}) => void

export type LogoutFn = (opts?: {
  onBeforeRedirect?: () => Promise<void>
}) => Promise<void>

export type ProviderContext = {
  userSession: UserSession | null
  login: LoginFn
  logout: LogoutFn
  loginModal: LoginModal | null
  apolloClient: ApolloClient<NormalizedCacheObject>
  authClient: FutureverseAuthClient
  CONSTANTS: Constants
  xamanClient: Xumm
  error: Error | null
}

export const context = createContext<ProviderContext | null>(null)

export function useFutureverse() {
  const value = useContext(context)

  if (value === null) {
    throw new Error(`Must be used inside FutureverseProvider`)
  }

  return value
}

export function CustomizeContext(
  props: PropsWithChildren<{
    login: LoginFn
    logout: LogoutFn
  }>
) {
  const parentContext = useFutureverse()
  const value: ProviderContext = {
    ...parentContext,
    login: props.login,
    logout: props.logout,
  }
  return <context.Provider value={value}>{props.children}</context.Provider>
}
