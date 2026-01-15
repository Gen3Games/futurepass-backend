import * as t from 'io-ts'
import { config as C } from '../../serverConfig'

const CUSTODIAL_AUTH_OPTION_API_RESPONSE = t.strict({
  id: t.string,
  name: t.string,
  loginHint: t.string,
  iconUrls: t.strict({
    white: t.string,
    fullcolor: t.union([t.string, t.undefined]),
  }),
})

export type CUSTODIAL_AUTH_OPTION_API_RESPONSE = t.TypeOf<
  typeof CUSTODIAL_AUTH_OPTION_API_RESPONSE
>

const CUSTODIAL_AUTH_OPTION = t.strict({
  configId: t.string,
  apiResponse: CUSTODIAL_AUTH_OPTION_API_RESPONSE,
})

export type CUSTODIAL_AUTH_OPTION = t.TypeOf<typeof CUSTODIAL_AUTH_OPTION>

const CUSTODIAL_AUTH_OPTIONS = t.array(CUSTODIAL_AUTH_OPTION)

type CUSTODIAL_AUTH_OPTIONS = t.TypeOf<typeof CUSTODIAL_AUTH_OPTIONS>

const AUTH_OPTION_CDN_URL = `${C.CDN_HOSTNAME}/custodial-auth-option-icons`

export const ALL_AUTH_OPTIONS: CUSTODIAL_AUTH_OPTIONS = [
  {
    configId: 'google',
    apiResponse: {
      id: 'futureverseCustodialGoogle',
      name: 'Google',
      loginHint: 'social:google',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/google-white.svg`,
        fullcolor: `${AUTH_OPTION_CDN_URL}/google-full-color.svg`,
      },
    },
  },
  {
    configId: 'facebook',
    apiResponse: {
      id: 'futureverseCustodialFacebook',
      name: 'Facebook',
      loginHint: 'social:facebook',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/facebook-white.svg`,
        fullcolor: `${AUTH_OPTION_CDN_URL}/facebook-full-color.svg`,
      },
    },
  },
  {
    configId: 'tiktok',
    apiResponse: {
      id: 'futureverseCustodialTikTok',
      name: 'TikTok',
      loginHint: 'social:tiktok',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/tiktok-white.svg`,
        fullcolor: `${AUTH_OPTION_CDN_URL}/tiktok-full-color.svg`,
      },
    },
  },
  {
    configId: 'twitter',
    apiResponse: {
      id: 'futureverseCustodialX',
      name: 'X',
      loginHint: 'social:twitter',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/x-white.svg`,
        fullcolor: `${AUTH_OPTION_CDN_URL}/x-full-color.svg`,
      },
    },
  },
  {
    configId: 'apple',
    apiResponse: {
      id: 'futureverseCustodialApple',
      name: 'Apple',
      loginHint: 'social:apple',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/apple-white.svg`,
        fullcolor: `${AUTH_OPTION_CDN_URL}/apple-full-color.svg`,
      },
    },
  },
  {
    configId: 'email',
    apiResponse: {
      id: 'futureverseCustodialEmail',
      name: 'Email',
      loginHint: 'email:',
      iconUrls: {
        white: `${AUTH_OPTION_CDN_URL}/email-white.svg`,
        fullcolor: undefined,
      },
    },
  },
]
