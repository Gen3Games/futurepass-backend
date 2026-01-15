import http from 'k6/http'
import { sleep } from 'k6'
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js'
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'
import crypto from 'k6/crypto'
import { b64encode } from 'k6/encoding'
import { Counter } from 'k6/metrics'

const OIDC_URL = 'https://login.futureverse.dev'
const DASHBOARD_URL = 'https://identity-dashboard.futureverse.dev'
// const DASHBOARD_URL = 'http://localhost:4000'
// const OIDC_URL = 'http://localhost:4200'

const authClient = new Counter('auth_client')
const registerEmailErrors = new Counter('register_email_errors')
const validateOtpErrors = new Counter('validate_otp_errors')
const acceptTermsErrors = new Counter('accept_terms_errors')
const authCallErrors = new Counter('auth_call_errors')
const loginDashboardErrors = new Counter('login_dashboard_errors')

export let options = {
  vus: 1000, // Virtual Users
  duration: '60s', // Duration of the test
  iterations: 1000,
}

function generateRandomString(length = 32) {
  const bytes = crypto.randomBytes(length)
  let str = b64encode(bytes, 'base64url')
  return str.substring(0, length)
}

function parseCookies(cookieString) {
  const cookies = cookieString.split(', ')
  const cookieObj = {}

  cookies.forEach((cookie) => {
    const parts = cookie.split(';')
    parts.forEach((item) => {
      const pair = item.split('=')
      const key = pair[0]
      cookieObj[key.trim()] = pair[1] ? pair[1].trim() : ''
    })
  })

  return cookieObj
}

export default async function () {
  const randomNumber = randomIntBetween(1, 9999999)
  const email = `stress_test_user_v7_${__VU}_${randomNumber}@test000000.com`
  console.log('email', email)
  const state = generateRandomString()
  const nonce = generateRandomString(17)

  const url = new URL(`${OIDC_URL}/auth`)

  url.searchParams.append('client_id', 'dashboard')
  url.searchParams.append('redirect_uri', `${DASHBOARD_URL}/login`)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'openid')
  url.searchParams.append('nonce', nonce)
  url.searchParams.append('state', state)
  url.searchParams.append(
    'code_challenge',
    'qv727p5_-U_uBlkMnPkJ4ejyH86kry0DeDEJ0tuP-SE'
  )
  url.searchParams.append('code_challenge_method', 'S256')
  url.searchParams.append('response_mode', 'query')
  url.searchParams.append('prompt', '')
  url.searchParams.append('login_hint', 'email:')

  // Authenticate gainst OIDC
  const auth = http.get(url.toString())

  if (auth.status > 300 || auth.error) {
    authClient.add(1)
    return
  }

  const cookies = parseCookies(auth.headers['Set-Cookie'])

  // Register email
  const registerEmail = http.post(
    `${OIDC_URL}/login/email`,
    JSON.stringify({
      email,
    }),
    {
      cookies: cookies,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  if (registerEmail.status > 300 || registerEmail.error) {
    registerEmailErrors.add(1)
    return
  }
  sleep(3)

  // Validate OTP token
  const verify = http.post(
    `${OIDC_URL}/login/email/verify`,
    JSON.stringify({
      email,
      otp: '000000',
    }),
    {
      cookies: cookies,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  if (verify.status > 300 || verify.error) {
    validateOtpErrors.add(1)
    return
  }
  const verifyResponse = verify.json()

  const redirectUrl = new URL(`${OIDC_URL}${verifyResponse.redirectTo}`)
  const token = redirectUrl.searchParams.get('token')

  sleep(1) // Wait for 1 second between each request

  // Accept terms
  const acceptTerms = http.post(
    `${OIDC_URL}/login/terms`,
    JSON.stringify({
      token,
    }),
    {
      cookies: cookies,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  if (!acceptTerms || acceptTerms.error || acceptTerms.status != 200) {
    acceptTermsErrors.add(1)
    return
  }
  const acceptTermsResponse = acceptTerms.json()

  sleep(1) // Wait for 1 second between each request

  // account is created, authenticate again
  const login = http.get(acceptTermsResponse.redirectTo, {
    cookies: cookies,
    redirects: 'manual',
  })

  if (!login || login.status >= 400 || login.error) {
    authCallErrors.add(1)
  }
  sleep(1)
  const loginUrl = login.headers.Location

  // Login
  if (!loginUrl) {
    return
  }

  const loginSuccessful = http.get(loginUrl, {
    cookies: Object.assign(
      {
        _vercel_jwt:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJieXBhc3MiOiJLRE04WTBRam9vWWxYUzF1bUJQRjFHcjhweVNEenJWbiIsImF1ZCI6ImlkZW50aXR5LWRhc2hib2FyZC5mdXR1cmV2ZXJzZS5kZXYiLCJpYXQiOjE3MTIxOTcxMDgsInN1YiI6InByb3RlY3Rpb24tYnlwYXNzLXVybCJ9.QVoy7pkNroyAbMTxXE1yZck4Zzu_QTQIgaJO93vfnts',
      },
      parseCookies(login.headers['Set-Cookie'])
    ),
  })

  if (
    !loginSuccessful ||
    loginSuccessful.status >= 400 ||
    loginSuccessful.error
  ) {
    loginDashboardErrors.add(1)
  }
}
