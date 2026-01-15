export const code_verifier =
  '4e88206bd010496bba39bde1ddda7333ded87c8d29b740bca63a85e7520247b663f40e9a20824b4cb9e5078195d0c9c9'
export const code_challenge = 'DdTbDyrqNR84iScJgFAHAXQzekoObgugwx4p_7PRcR0'
export const code_challenge_method = 'S256'

export const identityProviderOrigin = 'https://login.futureverse.cloud'

export const authBaseUrl = `${identityProviderOrigin}/auth`
export const tokenBaseUrl = `${identityProviderOrigin}/token`

export const responseType = 'code'
export const scope = 'openid'
export const state = '4ef3e70a851d410894aebbba8bc1de79'

// optional fields
export const nonce = '86Etej8ERjVIpq7Ov'
export const response_mode = 'query'
export const prompt = 'login'

export const eoa = '0xA5A5A6e97528a6BA1EE04f27582d37E9b612f6C3'
export const login_hint = `eoa:nonce=hNraSZYmhj7t8h6Ft&address=${eoa}&issuedAt=2023-11-06T01%3A14%3A24.348Z&domain=identity-dashboard.futureverse.cloud&signature=0x4a19cbdff0b033f6ab34bc022cc4db6f3ed0a7f099f25d19f4af0ca29c74f6975ba15358f8e3af5ec88fa704781a2cbe6102c74aac38f2a390c722e7673773311c`

export const loginToIdentityProviderBackend = async (
  clientId: string,
  redirectUri: string,
  isPKCE: boolean
) => {
  const usePKCE = isPKCE
    ? `&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`
    : ''

  const response = await fetch(
    `${authBaseUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=${responseType}&scope=${scope}&nonce=${nonce}&state=${state}&response_mode=${response_mode}&prompt=${prompt}&login_hint=${encodeURIComponent(
      login_hint
    )}${usePKCE}`,
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

export const obtainTokensWithClientSecret = async (
  authorizationCode: string,
  clientId: string,
  redirectUri: string,
  clientSecret: string
) => {
  const params = {
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  }

  const response = await fetch(tokenBaseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })

  if (!response.ok) {
    // Throw an error if the response from the token endpoint is not successful
    const errorDetail = await response.json()
    throw new Error(`Token endpoint error: ${errorDetail.error}`)
  }

  return await response.json()
}
