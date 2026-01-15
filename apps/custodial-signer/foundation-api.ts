import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'

export async function sign(
  baseURL: string,
  authToken: string,
  digest: string
): Promise<string /* signature in hex */ | null> {
  const response = await fetch(`${baseURL}/sign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      payload: digest,
      type: 'DIGEST',
    }),
  })
  console.log('debug: sign', response.status, response.statusText)
  if (response.status !== 200) {
    throw new Error('Invalid response code=' + response.status)
  }
  const value = await response.json()
  const outR = t.type({ signature: t.string }, 'Response').decode(value)
  if (E.isLeft(outR)) {
    throw new Error(
      'Failed to decode response; error=' + PathReporter.report(outR).join(', ')
    )
  }

  return outR.right.signature
}
