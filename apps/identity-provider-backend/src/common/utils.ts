import * as sdk from '@futureverse/experience-sdk'
import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'

interface OTPErrorObject {
  error: string
}

export function hush<A, B>(v: E.Either<A, B> | null): B | null {
  if (v == null || E.isLeft(v)) return null
  return v.right
}

export function a2hex(str: string) {
  const arr: string[] = []
  for (let i = 0, l = str.length; i < l; i++) {
    const hex = Number(str.charCodeAt(i)).toString(16)
    arr.push(hex)
  }
  return arr.join('')
}

export const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const getOtpErrorMessage = <T extends OTPErrorObject>(
  e: E.Left<t.Errors>
): string => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- e.left[0] could be undefined at runtime
  const errorObject = e.left[0]?.context[0]?.actual
  if (isErrorObject<T>(errorObject)) {
    return errorObject.error
  } else {
    return String(errorObject)
  }
}

function isErrorObject<T extends OTPErrorObject>(obj: unknown): obj is T {
  return obj != null && typeof obj === 'object' && 'error' in obj
}

export const parseClientRedirectUrls = (
  configuredRedirectUrls: string
): string[] => {
  const urlArray = configuredRedirectUrls.split(',')

  const validURLs: string[] = []

  for (const url of urlArray) {
    const validUrl = sdk.hush(sdk.Url.decode(url.trim()))

    if (validUrl != null) {
      validURLs.push(validUrl)
    }
  }

  return validURLs
}
