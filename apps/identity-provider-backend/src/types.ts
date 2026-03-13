import * as sdk from '@futureverse/experience-sdk'
import { isHex } from '@polkadot/util'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'

export type ETHAddress = string

export interface UserDB {
  findUserDataBySub(sub: FVSub): Promise<FVUserData | null> | FVUserData | null
  updateUserData(sub: FVSub, user: FVUserData): Promise<void> | void
  removeUserDataBySub(sub: FVSub): Promise<void> | void
  updateUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void> | void
  findUserProfileBySub(
    sub: FVSub
  ): Promise<FVUserProfile | null> | FVUserProfile | null
}

export type FVAdapter = {
  findOrCreateCustodialAccount(sub: FVSub): Promise<FVCustodialAccount>
  requestFuturepassCreation(eoa: ETHAddress): Promise<void>
  findUserBySub(sub: FVSub): Promise<FVUser | null>
  updateUserData(user: FVUser): Promise<void>
  updateUserProfile(sub: FVSub, profile: FVUserProfile): Promise<void>
  findUserProfileBySub(sub: FVSub): Promise<FVUserProfile | null>
}

export type Custodian = 'fv' | 'self'

export function custodianOf(sub: FVSub): Custodian {
  return sub.type === 'eoa' || sub.type === 'xrpl' ? 'self' : 'fv'
}

export type FVUser = {
  // data provided by user
  sub: FVSub

  // data stored on Foundation API server if in FV custody
  eoa: ETHAddress

  // data stored on this server
  hasAcceptedTerms: boolean
}

export type FVCustodialAccount = ETHAddress

export type FVSmartAccount = ETHAddress

export type FVSub = t.TypeOf<typeof FVSub>
export const FVSub = new t.Type<FVSubImpl, string, string>(
  'FVSub',
  (u): u is FVSubImpl => FVSubImpl.is(u),
  (u, c) => {
    const [type, ...rest] = u.split(':')
    switch (type) {
      case 'email': {
        const email = rest.join(':')
        if (email === '') return t.failure(u, c, 'email is missing')
        return t.success({ type, email })
      }
      case 'idp': {
        const [idp, sub] = rest
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- idp could be undefined at runtime
        if (idp == null) return t.failure(u, c, 'idp is missing')
        const socialIdp = sdk.SocialSSOType.decode(idp)
        if (E.isLeft(socialIdp)) return t.failure(u, c, 'idp is invalid')
        if (sub === '') return t.failure(u, c, 'sub is missing')
        return t.success({ type, idp: socialIdp.right, sub })
      }
      case 'eoa': {
        const eoa = rest.join(':')
        if (eoa === '') return t.failure(u, c, 'eoa is missing')
        return t.success({ type, eoa })
      }
      case 'xrpl': {
        const [publicKey, _, eoa] = rest
        if (
          publicKey === '' ||
          (!isHex(publicKey) && !publicKey.toLowerCase().startsWith('ed'))
        ) {
          return t.failure(u, c, 'publicKey is missing')
        }
        if (eoa === '') return t.failure(u, c, 'eoa is missing')
        return t.success({ type, publicKey, eoa })
      }
      default:
        return t.failure(u, c)
    }
  },
  (v) => {
    if (v.type === 'email') return `email:${v.email}`
    if (v.type === 'idp') return `idp:${v.idp}:${v.sub}`
    if (v.type === 'eoa') return `eoa:${v.eoa}`
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- the condition make the code more readable
    if (v.type === 'xrpl') return `xrpl:${v.publicKey}:eoa:${v.eoa}`
    return unreachable(v)
  }
)

export type FVSubImpl = t.TypeOf<typeof FVSubImpl>
export const FVSubImpl = t.union([
  t.type({
    type: t.literal('email'),
    email: t.string,
  }),
  // e.g. google, facebook
  t.type({
    type: t.literal('idp'),
    idp: sdk.SocialSSOType,
    sub: t.string,
  }),
  // e.g. siwe
  t.type({
    type: t.literal('eoa'),
    eoa: t.string,
  }),
  t.type({
    type: t.literal('xrpl'),
    eoa: t.string,
    publicKey: t.string,
  }),
])

// additional data maintained on this server
export const FVUserProfile = t.type(
  {
    email: t.optional(t.string),
    hd: t.optional(t.string),
  },
  'FVUserProfile'
)
export type FVUserProfile = t.TypeOf<typeof FVUserProfile>

export const FVUserData = t.type(
  {
    sub: FVSubImpl,
    hasAcceptedTerms: t.boolean,
  },
  'FVUserData'
)
export type FVUserData = t.TypeOf<typeof FVUserData>

function unreachable(_x: never): never {
  throw new Error(`This should be unreachable!`)
}

export const HCaptchaResponse = t.intersection(
  [
    t.type({
      success: t.boolean,
    }),
    t.partial({
      hostname: t.string,
      score: t.number,
      behavior_counts: t.type({
        ip: t.optional(t.number),
        ip_ua: t.optional(t.number),
        subnet: t.optional(t.number),
        ip_device: t.optional(t.number),
        device: t.optional(t.number),
      }),
    }),
  ],
  'HCaptchaResponse'
)
export type HCaptchaResponse = t.TypeOf<typeof HCaptchaResponse>

const Nft = t.type(
  {
    tokenId: t.string,
  },
  'Nft'
)

const Nfts = t.type(
  {
    edges: t.array(
      t.type({
        node: t.type({
          ...Nft.props,
        }),
      })
    ),
  },
  'Nfts'
)

export const GraphQLNFTSResponse = t.type(
  {
    nfts: Nfts,
  },
  'GraphQLNFTSResponse'
)

export type GraphQLNFTSResponse = t.TypeOf<typeof GraphQLNFTSResponse>

export const JwtPayload = t.type({
  iss: t.string,
  iat: t.number,
  exp: t.number,
  eoa: sdk.Address,
})

export type JwtPayload = t.TypeOf<typeof JwtPayload>

export const FuturePassForEoaResponse = t.type(
  {
    eoa: sdk.ChainLocationString,
    ownedFuturepass: t.union([t.null, sdk.ChainLocationString]),
    linkedFuturepass: t.union([t.null, sdk.ChainLocationString]),
  },
  'FuturePassForEoaResponse'
)

export type FuturePassForEoaResponse = t.TypeOf<typeof FuturePassForEoaResponse>

export const FuturePassAccount = t.type(
  {
    futurepass: sdk.ChainLocationString,
    ownerEoa: sdk.ChainLocationString,
    linkedEoas: t.array(
      t.type({
        eoa: sdk.ChainLocationString,
        proxyType: t.number,
      })
    ),
  },
  'FuturePassAccount'
)

export type FuturePassAccount = t.TypeOf<typeof FuturePassAccount>

export const FuturePassLinkedAccounts = t.type({
  allLinkedAccounts: t.array(t.string),
})

export type FuturePassLinkedAccounts = t.TypeOf<typeof FuturePassLinkedAccounts>

export const RedirectionPayload = t.type(
  {
    nonce: t.string,
    account: t.string,
  },
  'RedirectionPayload'
)
export type RedirectionPayload = t.TypeOf<typeof RedirectionPayload>

export const JwsVerifiedTokenPayload = t.type(
  {
    nonce: t.string,
    account: t.string,
    exp: t.number,
  },
  'JwsVerifiedTokenPayload'
)
export type JwsVerifiedTokenPayload = t.TypeOf<typeof JwsVerifiedTokenPayload>

export const SignInHeaders = t.type({ 'x-csrf-token': t.string })

export const ApiError = t.type({
  status: t.number,
  message: t.string,
})

export type ApiError = t.TypeOf<typeof ApiError>

const RSACodec = t.type({
  kty: t.literal('RSA'),
  kid: t.string,
  alg: t.literal('RS256'),
  e: t.string,
  n: t.string,
  d: t.string,
  p: t.string,
  q: t.string,
  dp: t.string,
  dq: t.string,
  qi: t.string,
})

const KeysArrayCodec = t.array(RSACodec)

export const KeyStore = t.type({
  keys: KeysArrayCodec,
})

export type KeyStore = t.TypeOf<typeof KeyStore>

/**
 * Defines the type structure for a raw profile object returned from Google OAuth.
 *
 * @type {t.TypeC} GoogleOauthUserRawProfile - The runtime type for Google OAuth user's raw profile.
 *
 * @property {t.String} sub - The subject identifier, a unique identifier for the user. It is always a string.
 * @property {t.UnionC} email - The user's email address. This field can be a string or undefined if the email is not available.
 * @property {t.UnionC} email_verified - Boolean indicating whether the user's email address has been verified. Can be true, false, or undefined.
 * @property {t.UnionC} hd - The hosted domain of the user. This field is relevant for Google Workspace users and can be a string or undefined.
 * @property {t.UnionC} picture - The URL to the user's profile picture. Can be a string (URL) or undefined if the picture is not provided.
 */
export const GoogleOauthUserRawProfile = t.type({
  sub: t.string,
  email: t.union([t.string, t.undefined]),
  email_verified: t.union([t.boolean, t.undefined]),
  hd: t.union([t.string, t.undefined]),
  picture: t.union([t.string, t.undefined]),
})

export type GoogleOauthUserRawProfile = t.TypeOf<
  typeof GoogleOauthUserRawProfile
>

/**
 * Defines the type structure for a raw profile object returned from Facebook OAuth.
 *
 * @type {t.TypeC} FacebookOauthUserRawProfile - The runtime type for Facebook OAuth user's raw profile.
 *
 * @property {t.String} id - The unique identifier for the Facebook user. Always a string.
 * @property {t.UnionC} email - The user's email address. This field can either be a string representing the email
 *   address or undefined if the email address is not provided or accessible.
 *
 */
export const FacebookOauthUserRawProfile = t.type({
  id: t.string,
  email: t.union([t.string, t.undefined]),
})

export type FacebookOauthUserRawProfile = t.TypeOf<
  typeof FacebookOauthUserRawProfile
>

/**
 * Defines the type structure for a raw profile object returned from Twitter OAuth.
 *
 * @type {t.TypeC} TwitterOauthUserRawProfile - The runtime type for Twitter OAuth user's raw profile.
 *
 * @property {t.String} id - The unique identifier for the Twitter user. Always a string.
 * @property {t.UnionC} username - The username showing on Twitter login
 *
 */
export const TwitterOauthUserRawProfile = t.type({
  id: t.string,
  username: t.string,
})

export type TwitterOauthUserRawProfile = t.TypeOf<
  typeof TwitterOauthUserRawProfile
>

/**
 * Defines the type structure for a raw profile object returned from TikTok OAuth.
 *
 * @type {t.TypeC} TiktokOauthUserRawProfile - The runtime type for TikTok OAuth user's raw profile.
 *
 * @property {t.String} open_id - The unique identifier for the TikTok user. Always a string.
 * @property {t.String} display_name - The username showing on TikTok login
 *
 * @property {t.String} code - The error code if user failed to login. Return 'ok' for a successful login
 * @property {t.String} message - The error message if user failed to login. Return '' for a successful login
 * @property {t.String} log_id - The log id can be used to check details for a failed login
 *
 */
export const TiktokOauthUserRawProfile = t.type({
  data: t.type({
    user: t.type({
      open_id: t.string,
      display_name: t.string,
    }),
  }),
  error: t.type({
    code: t.string,
    message: t.string,
    log_id: t.string,
  }),
})

export type TiktokOauthUserRawProfile = t.TypeOf<
  typeof TiktokOauthUserRawProfile
>

/**
 * Defines the type structure for a raw profile object returned from Apple OAuth.
 *
 * @type {t.TypeC} AppleOauthUserRawProfile - The runtime type for Apple OAuth user's raw profile.
 *
 * @property {t.String} sub - The unique identifier for the Apple user. Always a string.
 * @property {t.UnionC} email - The user's email address. This field can either be a string representing the email
 *   address or undefined if the email address is not provided or accessible.
 *
 */
export const AppleOauthUserRawProfile = t.type({
  sub: t.string,
  email: t.union([t.string, t.undefined]),
})

export type AppleOauthUserRawProfile = t.TypeOf<typeof AppleOauthUserRawProfile>

export class InvalidStateError extends Error {
  constructor(message: string) {
    super('Invalid State: ' + message)
    this.name = 'InvalidStateError'
  }
}

export const InteractionParams = t.type({
  client_id: t.string,
  code_challenge: t.string,
  code_challenge_method: t.string,
  login_hint: t.optional(t.string),
  nonce: t.string,
  redirect_uri: t.string,
  response_mode: t.optional(t.string),
  response_type: t.string,
  scope: t.string,
  state: t.string,
})

export type InteractionParams = t.TypeOf<typeof InteractionParams>

export const CustodialLoginAuthResponse = t.type({
  error: t.union([t.undefined, t.string]),
  code: t.union([t.undefined, t.string]),
})

export type CustodialLoginAuthResponse = t.TypeOf<
  typeof CustodialLoginAuthResponse
>

export const ExperienceData = t.type({
  experienceClientId: t.string,
  experienceHost: t.string,
})

export type ExperienceData = t.TypeOf<typeof ExperienceData>

export const LoginClientIdConfig = t.type({
  enableAll: t.boolean,
  enableSelected: t.union([t.undefined, t.array(t.string)]),
  disableSelected: t.union([t.undefined, t.array(t.string)]),
})

export type LoginClientIdConfig = t.TypeOf<typeof LoginClientIdConfig>

export const CustodialAuthLoginClientIdConfig = t.record(
  sdk.SocialSSOType,
  LoginClientIdConfig
)

export type CustodialAuthLoginClientIdConfig = t.TypeOf<
  typeof CustodialAuthLoginClientIdConfig
>
