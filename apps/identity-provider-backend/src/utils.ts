import * as sdk from '@futureverse/experience-sdk'
import { NativeFuturePassIdentityRegistry__factory } from '@futureverse/identity-contract-bindings'
import { deriveAddress } from 'ripple-keypairs'
import { CodeSystem } from './logger'
import { config as C } from './serverConfig'
import { SERVICE_NAME } from './utils/constants'

export const isJwtFormat = (token: string): boolean => {
  // Regular expression to match JWT format
  const jwtRegex = /^[A-Za-z0-9-_]+?\.[A-Za-z0-9-_]+?\.?[A-Za-z0-9-_+/]*$/

  // Check if the token matches the JWT format
  return jwtRegex.test(token)
}

export const deriveRAddress = (publicKey: string): string => {
  return deriveAddress(
    publicKey.toLowerCase().startsWith('0x') ? publicKey.slice(2) : publicKey
  )
}

export const nullAddress = '0x0000000000000000000000000000000000000000'

export const identityRegistry =
  NativeFuturePassIdentityRegistry__factory.connect(
    sdk.FUTUREPASS_REGISTRAR,
    C.wallet
  )

export async function safeIdentityOf(eoa: string): Promise<string | null> {
  if (C.disableExternalDependencies) {
    return null
  }

  const x = await identityRegistry.futurepassOf(eoa)
  if (x === nullAddress) {
    return null
  }
  return x
}

export const generateErrorRouteUri = (errorCode: number) => {
  return `/error/${CodeSystem.getCode(errorCode, 'Log')}`
}

export const getTraceData = () => {
  return {
    xray_trace_id: 'N/A',
  }
}
