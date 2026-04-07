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
]
