import { User } from '@futureverse/experience-sdk'
import { AppHost, InteractiveSignRequest } from '../interfaces/interfaces'

import CustodialSigner from './CustodialSigner'

export function SignPage(props: {
  user?: User | null
  request: InteractiveSignRequest
  message?: string
  appHost?: AppHost // TODO how to retrieve this? Does it need to come with the request?
}) {
  const { request } = props

  return (
    <CustodialSigner
      onConfirm={request.accept}
      onCancel={request.reject}
      message={props.message}
    />
  )
}
