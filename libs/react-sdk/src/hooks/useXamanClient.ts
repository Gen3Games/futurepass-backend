import { hush } from '@futureverse/experience-sdk'
import * as t from '@sylo/io-ts'
import * as React from 'react'
import { UniversalSdkEvent, Xumm } from 'xumm'
import { XummPkceEvent } from 'xumm-oauth2-pkce'
import { ILoginAdapter } from '../interfaces'

/**
 * TODO: see if we can extract the keys from the relevant Xaman interfaces rather than maintaining
 * a static definition here
 */
export const UniversalSdkEventKey = t.union(
  [t.literal('logout'), t.literal('ready'), t.literal('retrieving')],
  'UniversalSdkEventKey'
)

export type UniversalSdkEventKey = t.TypeOf<typeof UniversalSdkEventKey>

export const XummPkceEventKey = t.union(
  [
    t.literal('retrieved'),
    t.literal('error'),
    t.literal('success'),
    t.literal('loggedout'),
  ],
  'XummPkceEventKey'
)

export type XummPkceEventKey = t.TypeOf<typeof XummPkceEventKey>

type XamanEvents = {
  universalSdkEvents?: Partial<UniversalSdkEvent>
  xummPkceEvents?: Partial<XummPkceEvent>
}

export interface IXamanLoginAdapter extends ILoginAdapter {
  logout: () => Promise<void>
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- a helper class help us to manager xaman status
class FvXamanHelper {
  private static xamanJwtLocalStorageKey = 'XummPkceJwt'

  public static clearXamanLocalStorage() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FvXamanHelper.xamanJwtLocalStorageKey)
    }
  }
}
export class FvXaman extends Xumm {
  public constructor(apiKey: string) {
    super(apiKey)
  }

  public async logout(): Promise<void> {
    FvXamanHelper.clearXamanLocalStorage()
    await super.logout()
  }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- we just need to add a wrapper which ensures that only one xumm is initalized
class XamanClient {
  private static client: FvXaman | undefined

  private constructor() {}

  public static getXaman(apiKey: string, events?: XamanEvents): FvXaman {
    if (!XamanClient.client) {
      XamanClient.client = new FvXaman(apiKey)

      /**
       * Reference https://docs.xumm.dev/js-ts-sdk/sdk-syntax/xumm.on-event-fn
       *
       * Initializes and configures a Xumm client instance using useMemo hook in React.
       * This setup includes the registration of event listeners based on the provided `events` object.
       * The `events` object may contain two types of event mappings: `universalSdkEvents` and `xummPkceEvents`.
       * Each event mapping is an object where the keys represent event names,
       * and the values are callback functions to be executed when those events occur.
       *
       * If `universalSdkEvents` is provided, it registers its callback functions to the Xumm client.
       * Similarly, `xummPkceEvents` are registered if provided, with an additional check for the 'error' event
       * to ensure error handling is always defined. If no 'error' event handler is defined in `xummPkceEvents`,
       * a default no-op function is registered.
       *
       */
      if (events != null) {
        const { universalSdkEvents, xummPkceEvents } = events

        if (universalSdkEvents) {
          for (const [key, eventFunction] of Object.entries(
            universalSdkEvents
          )) {
            const universalSdkEventKey = hush(UniversalSdkEventKey.decode(key))
            if (universalSdkEventKey) {
              XamanClient.client.on(universalSdkEventKey, eventFunction)
            }
          }
        }

        let hasErrorHandlingEventDefined = false
        if (xummPkceEvents) {
          for (const [key, eventFunction] of Object.entries(xummPkceEvents)) {
            const xummPkceEventKey = hush(XummPkceEventKey.decode(key))
            if (xummPkceEventKey) {
              if (key === 'error') {
                hasErrorHandlingEventDefined = true
              }
              XamanClient.client.on(xummPkceEventKey, eventFunction)
            }
          }
        }

        if (!hasErrorHandlingEventDefined) {
          // we must have error handling event registered
          XamanClient.client.on('error', () => null)
        }
      }

      return XamanClient.client
    }

    return XamanClient.client
  }
}

export function useXamanClient(
  apiKey: string,
  events?: XamanEvents
): { xamanClient: FvXaman } {
  const xamanClient = React.useMemo(() => {
    return XamanClient.getXaman(apiKey, events)
  }, [apiKey, events])

  return { xamanClient }
}
