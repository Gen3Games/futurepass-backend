import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'

const SignResponse = t.type(
  {
    signature: t.string,
  },
  'SignResponse'
)

export async function sign(
  baseURL: string,
  authToken: string,
  request: {
    subject: string
    issuer: string
    digest: string
    requestId?: string
  }
): Promise<string> {
  const response = await fetch(`${baseURL}/v1/custody/signatures`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(request),
  })

  if (response.status !== 200) {
    throw new Error('Invalid response code=' + response.status)
  }

  const outR = SignResponse.decode(await response.json())
  if (E.isLeft(outR)) {
    throw new Error(
      'Failed to decode response; error=' + PathReporter.report(outR).join(', ')
    )
  }

  return outR.right.signature
}
