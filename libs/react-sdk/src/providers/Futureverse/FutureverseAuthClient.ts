import { Environment, ENVIRONMENTS } from '@futureverse/experience-sdk'
import { CookieStorage } from 'cookie-storage'
import { jwtDecode } from 'jwt-decode'
import * as _ from 'lodash'
import {
  AsyncStorage,
  ErrorResponse,
  SigninRedirectArgs,
  User,
  UserManager,
  UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts'
import { UserSession } from '../../interfaces'
import { getUserFromToken } from '../../util/token'

const AUTO_ID_TOKEN_RENEW_THRESHOLD_MS = 30 * 1000 // 30 seconds
const MANUAL_ID_TOKEN_RENEW_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour

// Client Cookie Expiry needs to be same as Session TTL on the IDP.
// This is to ensure that the client cookie is valid for the entire session length.
const COOKIE_EXPIRY_MS = 24 * 60 * 60 * 1000 // 7 days

interface AuthClientConfig {
  clientId: string
  redirectUri: string
  environment?: Environment
  responseType?: 'code' | 'id_token'
  userStore?: AsyncStorage | Storage
  clientSecret?: string
}

export enum UserState {
  SignedIn = 'SignedIn',
  SignedOut = 'SignedOut',
  SignInFailed = 'SignInFailed',
}

export type UserStateEventHandler = (
  userState: UserState,
  user: UserSession | null
) => void

export class FutureverseAuthClient {
  private _userManager: UserManager

  private _userStateHandler: UserStateEventHandler[] = []

  environment: Environment
  userState: UserState = UserState.SignedOut
  userSession: UserSession | null
  renewingIdToken: boolean = false

  private idTokenRenewTimer: NodeJS.Timeout | null = null

  constructor(config: AuthClientConfig) {
    this.environment = config.environment ?? ENVIRONMENTS.production

    let userManagerSettings: UserManagerSettings = {
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: config.responseType,
      authority: `${this.environment.idpURL}`,
      scope: 'openid',
      automaticSilentRenew: true,
      userStore: new WebStorageStateStore({
        store:
          config.userStore ??
          new CookieStorage({
            path: '/',
            sameSite: 'Strict',
            expires: new Date(Date.now() + COOKIE_EXPIRY_MS),
          }),
        prefix: 'fv.',
      }),
    }

    if (config.clientSecret != null) {
      userManagerSettings = {
        disablePKCE: true,
        client_secret: config.clientSecret,
        ...userManagerSettings,
      }
    }

    this._userManager = new UserManager(userManagerSettings)

    this.userSession = null
    this._userManager.events.addUserLoaded(this._userLoaded.bind(this))
    this._userManager.events.addUserUnloaded(this._userUnloaded.bind(this))
  }

  async login(args?: SigninRedirectArgs) {
    await this._userManager.signinRedirect(args)
  }

  async silentLogin(args?: SigninRedirectArgs) {
    return await this._userManager.signinSilent(args)
  }

  async logout(opts?: { onBeforeRedirect?: () => Promise<void> }) {
    try {
      await this._userManager.revokeTokens(['access_token'])
    } catch (e) {
      // ignore
    }

    /**
     * Q: Why dd we need two try-catch blocks here ?
     *
     * A: Calling revokeTokens(['access_token']) must throws an exception because of an incompatibility
     *    issue between node-oidc-provider ( the server ) and oidc-client-ts ( the client).
     *
     *    This means if doing  revokeTokens(['access_token', 'refresh_token']), the refresh token will
     *    never be revoked, ( refers to https://github.com/authts/oidc-client-ts/blob/fc1d31c1186f26abb4b54198f9fe65f5c55c00c0/src/UserManager.ts#L708)
     *
     *    What we need to do is ignore the revoke the access token exception and try to revoke the refresh token
     *    in another step before removing the user
     */
    try {
      await this._userManager.revokeTokens(['refresh_token'])
    } catch (e) {
      // ignore
    } finally {
      await this._userManager.removeUser()
      await opts?.onBeforeRedirect?.()
    }

    this.clearWagmiStorage()
    window.location.href = `${this.environment.idpURL}/logout`
  }

  private clearWagmiStorage() {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('wagmi.'))
    keys.forEach((k) => localStorage.removeItem(k))
  }

  async loadUser() {
    let user: User | null = await this._userManager.getUser()
    if (!user) {
      try {
        user = await this._userManager.signinRedirectCallback()
      } catch (error) {
        if (error instanceof ErrorResponse) {
          return this._updateUserSession(UserState.SignInFailed, null)
        }
        return this._updateUserSession(UserState.SignedOut, null)
      }
    }

    if (user) {
      this._userManager.startSilentRenew()
    }

    return this._updateUserSession(
      user ? UserState.SignedIn : UserState.SignedOut,
      user
    )
  }

  addUserStateListener(cb: UserStateEventHandler) {
    this._userStateHandler.push(cb)
  }
  removeUserStateListener(cb: UserStateEventHandler) {
    const index = this._userStateHandler.indexOf(cb)
    if (index > -1) {
      this._userStateHandler.splice(index, 1)
    }
  }

  private _sessionFromUser(user: User | null): UserSession | null {
    if (!user || !user.id_token) {
      return null
    }
    const profile = getUserFromToken(user.id_token)
    if (!profile) {
      return null
    }
    return {
      eoa: profile.eoa,
      chainId: profile.chainId,
      custodian: profile.custodian,
      futurepass: profile.futurepass,
      linked: [{ eoa: profile.eoa, chainId: profile.chainId }],
      user,
    }
  }

  private _userLoaded(user: User) {
    this._updateUserSession(UserState.SignedIn, user)
  }
  private _userUnloaded() {
    this._updateUserSession(UserState.SignedOut, null)
  }

  private _updateUserSession(userState: UserState, user: User | null) {
    if (user) {
      this.startIdTokenRenewTimer(user)
    } else {
      this.stopIdTokenRenewTimer()
    }

    const newUserSession = this._sessionFromUser(user)
    const newUserState = userState

    if (
      this.userSession != null &&
      _.isEqual(this.userSession, newUserSession) &&
      _.isEqual(this.userState, newUserState)
    ) {
      return this.userSession
    } else {
      this.userSession = newUserSession
      this.userState = newUserState
    }

    this._userStateHandler.forEach((handler) => {
      handler(this.userState, this.userSession)
    })

    return this.userSession
  }

  /**
   * Asynchronously renews the ID token.
   *
   * @returns {Promise<string | null>} A Promise that resolves to the renewed ID token or null if the token renewal is ignored or unsuccessful.
   */
  private async renewIdToken(): Promise<string | null> {
    if (this.renewingIdToken) {
      // already renewing token, ignore.
      return null
    }
    try {
      this.renewingIdToken = true
      // attempt to login, i.e. renew IdToken
      const user = await this.silentLogin()
      const newIdToken = user?.id_token
      if (newIdToken == null) {
        throw new Error('cannot renew idToken')
      }
      return newIdToken
    } catch (error) {
      try {
        // grant is expired, idToken cannot be renewed, signing out now
        await this._userManager.signoutSilent()
      } catch (e) {
        // ignore
      } finally {
        this._updateUserSession(UserState.SignedOut, null)
      }
    } finally {
      this.renewingIdToken = false
    }
    return null
  }

  /**
   * Asynchronously renews the ID token if required, based on the expiration time.
   * Renew iD Token if expiry <= 1 hour.
   * Return existing token if expiry is > 1 hour.
   *
   * @returns {Promise<string | null>} A Promise that resolves to the renewed ID token or the existing token if renewal is not required or unsuccessful.
   */
  public async renewIdTokenIfRequired() {
    const idToken = this.userSession?.user?.id_token
    if (idToken == null) {
      return null
    }
    const renewIn = this.getRenewInMS(idToken, 'manual')
    if (renewIn === 0) {
      // renew if expiry <= 1 hour.
      return await this.renewIdToken()
    } else {
      // return existing token as expiry > 1 hour.
      return idToken
    }
  }

  /**
   * Calculates the time, in milliseconds, until the ID token should be renewed.
   *
   * @param {string} idToken - The ID token for which to calculate the renewal time.
   * @param {'auto' | 'manual'} type - The type of renew threshold to use. default: `auto`
   * @returns {number} The time, in milliseconds, until the ID token should be renewed. Returns 0 if the token is expired.
   */
  private getRenewInMS(
    idToken: string,
    type: 'auto' | 'manual' = 'auto'
  ): number {
    const jwt = jwtDecode(idToken)
    const exp = (jwt.exp ?? 0) * 1000
    const now = Date.now()
    const expired = now > exp

    const invokeInMS = expired
      ? 0
      : exp -
        now -
        (type === 'auto'
          ? AUTO_ID_TOKEN_RENEW_THRESHOLD_MS
          : MANUAL_ID_TOKEN_RENEW_THRESHOLD_MS)
    return Math.max(invokeInMS, 0)
  }

  /**
   * Starts a timer that would refresh the ID-Token in future.
   * If it fails to re-new the ID-Token then it would force the application to sign out.
   *
   * @private
   * @param {User} user - The user object containing the ID token and expiration details.
   * @returns {void}
   */
  private startIdTokenRenewTimer(user: User) {
    const existingIdToken = this.userSession?.user?.id_token
    const newIdToken = user.id_token

    if (
      existingIdToken != null &&
      newIdToken != null &&
      existingIdToken == newIdToken &&
      this.idTokenRenewTimer != null
    ) {
      return
    }
    const idToken = user.id_token
    if (idToken == null) {
      return
    }
    const invokeIn = this.getRenewInMS(idToken, 'auto')

    if (this.idTokenRenewTimer != null) {
      clearTimeout(this.idTokenRenewTimer)
    }
    this.idTokenRenewTimer = setTimeout(async () => {
      await this.renewIdToken()
    }, invokeIn)
  }

  /**
   * Stops the timer responsible for renewing the ID token.
   *
   * @private
   * @returns {void}
   */
  private stopIdTokenRenewTimer() {
    if (this.idTokenRenewTimer) {
      clearTimeout(this.idTokenRenewTimer)
    }
  }
}
