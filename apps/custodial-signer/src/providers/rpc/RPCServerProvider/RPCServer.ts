import { CustodialAPI, SignRequest, User } from '@futureverse/experience-sdk'
import { HandlerReturn, InfoFor, RPCDelegateFor } from '@futureverse/rpc-kit'
import * as t from '@sylo/io-ts'
import * as E from 'fp-ts/Either'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { InteractiveSignRequest } from '../../../interfaces/interfaces'
import { ARPCServer } from '../../../rpc'

function base64UrlEncode(raw: string) {
  const encoded = btoa(raw || '')
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function isValidURL(url?: string): boolean {
  if (!url) {
    return false
  }
  try {
    const _url = new URL(url)
    return ['http:', 'https:'].includes(_url.protocol)
  } catch (e) {
    return false
  }
}

function getLoginAttempt() {
  const existingLoginAttempt = sessionStorage.getItem('loginAttempt') ?? '0'
  return Number(existingLoginAttempt)
}

function incrementLoginAttempt() {
  const loginAttempt = getLoginAttempt() + 1
  sessionStorage.setItem('loginAttempt', String(loginAttempt))
  return loginAttempt
}

async function closeWindowAfterRPCCall<T>(
  promise: () => Promise<T>
): Promise<T> {
  const out = await promise()
  // close window on next tick to ensure we send any outgoing RPC messages
  // first.
  setTimeout(() => {
    // TODO for some RPC calls this behavior is not desirable; e.g. for the
    // case where there's an invalid signer. In such cases the user should
    // instead be shown a way to resolving the issue or how to report it.
    window.close()
  }, 0)
  return out
}

export class RPCServer
  extends ARPCServer
  implements RPCDelegateFor<ARPCServer>
{
  constructor(
    private user: User | null,
    private setActiveRequest: (request: InteractiveSignRequest) => void,
    private initSignIn: () => Promise<void>
  ) {
    super()
  }

  ['::fv/health'] = this.nonCancel<'fv/health'>(async () =>
    closeWindowAfterRPCCall(async () => {
      return E.right('ready')
    })
  )

  #signAPI(
    payload: SignRequest,
    info: InfoFor<ARPCServer>
  ): Promise<HandlerReturn<CustodialAPI, 'fv/sign-msg' | 'fv/sign-tx'>> {
    return closeWindowAfterRPCCall(async () => {
      if (
        this.user == null ||
        this.user.eoa.toLowerCase() !== payload.account.toLowerCase()
      ) {
        // There is a possibility that signing request does not match with the logged in user(due to signer using outdated access-token).
        // if this is true then we attempt logging in 3 times
        // if user's eoa is still invalid then return `INVALID_SIGNER` to the experience.

        const loginAttempt = getLoginAttempt()

        if (loginAttempt >= 3) {
          return E.left({
            code: 'INVALID_SIGNER',
            expected: payload.account,
            actual: this.user?.eoa ?? 'null',
          })
        }

        incrementLoginAttempt()
        await this.initSignIn()

        return new Promise((_) => {
          /* never */
        })
      }

      return new Promise((resolve) => {
        this.setActiveRequest({
          type: 'sign',
          request: payload,
          accept: async () => {
            // perform the actual signing on backend
            const response = await fetch('/api/sign', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(SignRequest.encode(payload)),
            })

            if (response.status !== 200) {
              // internal error
              throw new Error(
                'failed to sign message; bad status=' + response.status
              )
            }

            const resultR = t
              .type({ signature: t.HexString }, 'Response')
              .decode(await response.json())
            if (E.isLeft(resultR)) {
              // internal error
              throw new Error(
                'failed to sign message; bad response; error=' +
                  PathReporter.report(resultR).join(', ')
              )
            }

            resolve(
              E.right({
                signature: resultR.right.signature,
              })
            )
          },
          reject: () => {
            resolve(
              E.left({
                code: 'USER_REJECTED',
              })
            )
          },
          origin: info.connection?.origin ?? '',
        })
      })
    })
  }

  ['::fv/sign-tx'] = this.nonCancel<'fv/sign-tx'>(async (payload, _, info) => {
    const res = await this.#signAPI(
      {
        type: 'transaction',
        account: payload.account,
        transaction: payload.transaction,
      },
      info
    )

    if (isValidURL(payload.callbackUrl)) {
      const responsePayload = {
        tag: 'fv/sign-tx',
        payload: {
          account: payload.account,
          transaction: payload.transaction,
        },
        result: {
          status: E.isRight(res) ? 'success' : 'error',
          data: E.isRight(res)
            ? { signature: res.right.signature }
            : { error: res.left.code },
        },
      }
      const url = `${payload.callbackUrl}?response=${base64UrlEncode(
        JSON.stringify(responsePayload)
      )}`
      window.open(url)
    }

    return res
  });

  ['::fv/sign-msg'] = this.nonCancel<'fv/sign-msg'>(
    async (payload, _, info) => {
      const res = await this.#signAPI(
        {
          type: 'message',
          account: payload.account,
          message: payload.message,
        },
        info
      )

      if (isValidURL(payload.callbackUrl)) {
        const responsePayload = {
          tag: 'fv/sign-msg',
          payload: {
            account: payload.account,
            message: payload.message,
          },
          result: {
            status: E.isRight(res) ? 'success' : 'error',
            data: E.isRight(res)
              ? { signature: res.right.signature }
              : { error: res.left.code },
          },
        }

        const url = `${payload.callbackUrl}?response=${base64UrlEncode(
          JSON.stringify(responsePayload)
        )}`
        window.open(url)
      }

      return res
    }
  )
}
