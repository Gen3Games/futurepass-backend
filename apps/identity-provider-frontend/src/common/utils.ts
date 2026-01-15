import * as sdk from '@futureverse/experience-sdk'
import { CookieStorage } from 'cookie-storage'
import { formatDuration, intervalToDuration } from 'date-fns'
import * as E from 'fp-ts/lib/Either'

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

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function parseClientRedirectUrls(
  configuredRedirectUrls: string
): string[] {
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

export const getLaunchDarklyHash = () => {
  const cookieStorage = new CookieStorage()
  return cookieStorage.getItem('ld_hash') ?? undefined
}

export function createIntervalCountdown({
  timestampOfNextRetry,
  clearState,
  setFormattedDuration,
}: {
  timestampOfNextRetry: number
  clearState: () => void
  setFormattedDuration: (formattedDuration: string) => void
}) {
  function updateRetryCountdown() {
    if (Date.now() >= timestampOfNextRetry) {
      clearState()
      clearInterval(retryCountdownInterval)
      return
    }

    const durationBetweenNowAndTimestamp = intervalToDuration({
      start: Date.now(),
      end: timestampOfNextRetry,
    })

    setFormattedDuration(
      formatDuration({
        days: durationBetweenNowAndTimestamp.days,
        hours: durationBetweenNowAndTimestamp.hours,
        minutes: durationBetweenNowAndTimestamp.minutes,
        seconds: durationBetweenNowAndTimestamp.seconds,
      })
    )
  }

  const retryCountdownInterval = setInterval(updateRetryCountdown, 1000)

  return () => clearInterval(retryCountdownInterval)
}
