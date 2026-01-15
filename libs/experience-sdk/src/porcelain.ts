import { unreachable } from '@futureverse/rpc-kit'
import { Environment } from './constants'
import { FVCustodialClient } from './rpc/FVCustodialClient'
import { FVSelfCustodialClient } from './rpc/FVSelfCustodialClient'
import { IFVClient } from './rpc/IFVClient'
import { User } from './types'

export function createFVClient(
  user: User,
  environment: Environment
): IFVClient {
  if (user.custodian === 'fv') {
    return new FVCustodialClient(environment.signerURL, environment.chain.id)
  }
  if (user.custodian === 'self') {
    return new FVSelfCustodialClient(environment.idpURL)
  }
  unreachable(user.custodian)
}
