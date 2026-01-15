/* eslint-disable @typescript-eslint/no-unsafe-call -- uni test */

const identityProviderOrigin = 'https://login.futureverse.cloud'
const clientOrigin = 'https://identity-dashboard.futureverse.cloud'
// required fields
const baseUrl = `${identityProviderOrigin}/auth`
const clientId = 'dashboard'
const redirectUri = `${clientOrigin}/login`
const responseType = 'code'
const scope = 'openid'
const state = '4ef3e70a851d410894aebbba8bc1de79'

// optional fields
const nonce = '86Etej8ERjVIpq7Ov'
const response_mode = 'query'
const prompt = 'login'
const login_hint =
  'eoa:nonce=36rvy3gsc6VDydYtx&address=0xA5A5A6e97528a6BA1EE04f27582d37E9b612f6C3&issuedAt=2023-11-05T22%3A24%3A00.094Z&domain=identity-dashboard.futureverse.cloud&signature=0xae6aa432f0ccaa53d5b604c27b5b3e28cf579b3e1eb2854bf194aa9ade09ef8932f4050270422c6d2c683c535dd6410b84869b42c80f0bf9eb5c23b07ec43ad61c'
const display = 'page'

const code_challenge = '_81Ha7nnmeEvOSnKLrkbstFB8FaLFwrPENPYviXJmGY'
const code_challenge_method = 'S256'

// FIXME: These can be reenabled after the `custodialBlocker` middleware is deleted
describe.skip('Authorization Endpoint Tests', () => {
  test('should redirect to login page upon successful authorization', async () => {
    const response = await fetch(
      `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).toBe(303)

    // get Location in headers
    const locationHeader = response.headers.get('location')

    // auth endpoint always redirects user to login page
    expect(locationHeader).toBe('/login')
  })

  test(
    'should successfully check the silent login',
    async () => {
      await silentLoginToIdentityProviderBackend()
    },
    1000 * 60
  )

  test('should fail when client_id is missing', async () => {
    const response = await fetch(
      `${baseUrl}?redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).not.toBe(200)
  })

  test('should fail when redirect_uri is missing', async () => {
    const response = await fetch(
      `${baseUrl}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).not.toBe(200)
  })

  test('should fail when responseType is missing', async () => {
    const response = await fetch(
      `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).not.toBe(200)
  })

  test('should fail when scope is missing', async () => {
    const response = await fetch(
      `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).not.toBe(200)
  })

  test('should fail when state is missing', async () => {
    const response = await fetch(
      `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${login_hint}&display=${display}`,
      {
        redirect: 'manual', // prevent auto redirection to capture the response
      }
    )

    expect(response.status).not.toBe(200)
  })

  test('should redirect to client side login page with code', async () => {
    const result = await loginToIdentityProviderBackend()

    expect(result).not.toBeNull()
    expect(result?.serverReturnedCode).not.toBeNull()
    expect(result?.serverReturnedState).toBe(state)
  })
})

const loginToIdentityProviderBackend = async () => {
  const response = await fetch(
    `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${encodeURIComponent(
      login_hint
    )}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`,
    {
      redirect: 'manual', // prevent auto redirection to capture the response
    }
  )

  let cookieHeader = ''
  let setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    cookieHeader = setCookieHeader
      .split(',')
      .map((cookie) => cookie.split(';')[0])
      .join('; ')
  }

  const loginLocation = response.headers.get('location')
  // console.log('loginLocation: ', loginLocation)

  if (loginLocation) {
    const loginRedirectResponse = await fetch(
      `${identityProviderOrigin}${loginLocation}`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
        redirect: 'manual',
      }
    )

    cookieHeader = ''
    setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      cookieHeader = setCookieHeader
        .split(',')
        .map((cookie) => cookie.split(';')[0])
        .join('; ')
    }

    const authLocation = loginRedirectResponse.headers.get('location')
    // console.log('authLocation:', authLocation)

    if (authLocation) {
      const authRedirectResponse = await fetch(authLocation, {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
        redirect: 'manual',
      })

      const clientLoginLocation = authRedirectResponse.headers.get('location')
      // console.log('clientLoginLocation: ', clientLoginLocation)

      if (clientLoginLocation) {
        const redirectUrl = new URL(clientLoginLocation)
        const serverReturnedCode = redirectUrl.searchParams.get('code')
        const serverReturnedState = redirectUrl.searchParams.get('state')

        return { serverReturnedCode, serverReturnedState }
      }
    }
  }

  return null
}

const silentLoginToIdentityProviderBackend = async () => {
  const response = await fetch(
    `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${encodeURIComponent(
      login_hint
    )}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`,
    {
      redirect: 'manual', // prevent auto redirection to capture the response
    }
  )

  let cookieHeader = ''
  let setCookieHeader = response.headers.get('set-cookie')
  if (setCookieHeader) {
    cookieHeader = setCookieHeader
      .split(',')
      .map((cookie) => cookie.split(';')[0])
      .join('; ')
  }

  const loginLocation = response.headers.get('location')
  // console.log('loginLocation: ', loginLocation)

  if (loginLocation) {
    const loginRedirectResponse = await fetch(
      `${identityProviderOrigin}${loginLocation}`,
      {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
        redirect: 'manual',
      }
    )

    cookieHeader = ''
    setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      cookieHeader = setCookieHeader
        .split(',')
        .map((cookie) => cookie.split(';')[0])
        .join('; ')
    }

    const authLocation = loginRedirectResponse.headers.get('location')
    // console.log('authLocation:', authLocation)

    if (authLocation) {
      const authRedirectResponse = await fetch(authLocation, {
        method: 'GET',
        headers: {
          Cookie: cookieHeader,
        },
        redirect: 'manual',
      })

      const clientLoginLocation = authRedirectResponse.headers.get('location')
      // console.log('clientLoginLocation: ', clientLoginLocation)

      if (clientLoginLocation) {
        const redirectUrl = new URL(clientLoginLocation)
        const serverReturnedCode = redirectUrl.searchParams.get('code')
        const serverReturnedState = redirectUrl.searchParams.get('state')

        expect(serverReturnedCode).not.toBeNull()
        expect(serverReturnedState).not.toBeNull()
        // User has successfully logged in here

        // We are about to check silent login afterwards
        cookieHeader = ''
        setCookieHeader = authRedirectResponse.headers.get('set-cookie')
        if (setCookieHeader) {
          cookieHeader = setCookieHeader
            .split(',')
            .map((cookie) => cookie.split(';')[0])
            .join('; ')
        }

        const silentLoginResponse = await fetch(
          `${baseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
          )}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&response_mode=${response_mode}&prompt=none&login_hint=${encodeURIComponent(
            login_hint
          )}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`,
          {
            headers: {
              Cookie: cookieHeader,
            },
            redirect: 'manual', // prevent auto redirection to capture the response
          }
        )

        expect(silentLoginResponse.status).toBe(303)
        const silentLoginResponseLocation =
          silentLoginResponse.headers.get('location')
        expect(silentLoginResponseLocation).not.toBeNull()
        if (silentLoginResponseLocation) {
          const silentLoginResponseLocationUrl = new URL(
            silentLoginResponseLocation
          )
          expect(silentLoginResponseLocationUrl.origin).toBe(clientOrigin)
          expect(silentLoginResponseLocationUrl.pathname).toBe('/login')
        }
      }
    }
  }
}

export {}

/* eslint-enable @typescript-eslint/no-unsafe-call -- uni test */
