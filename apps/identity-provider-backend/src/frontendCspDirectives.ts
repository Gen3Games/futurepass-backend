import { config as C } from './serverConfig'

export const FRONTEND_CSP_DIRECTIVES = Object.freeze({
  defaultSrc: ["'self'"].concat(
    C.ALLOWED_IDP_DOMAINS.map((domain) => {
      return domain.origin
    })
  ),
  scriptSrc: [
    "'self'",
    'https://*.hcaptcha.com',
    'https://accounts.google.com/gsi/client',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://*.hcaptcha.com',
    'https://accounts.google.com/gsi/style',
    C.CDN_HOSTNAME,
  ],
  imgSrc: [
    "'self'",
    'https://*.hcaptcha.com',
    'https://*.walletconnect.com/',
    'https://xumm.app',
    C.CDN_HOSTNAME,
  ],
  frameSrc: [
    "'self'",
    'https://*.hcaptcha.com',
    'https://accounts.google.com/gsi/',
    'https://verify.walletconnect.com/',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com', C.CDN_HOSTNAME],
  connectSrc: [
    "'self'",
    'https://*.hcaptcha.com',
    'https://accounts.google.com/gsi/',
    'https://*.launchdarkly.com/',
    'https://*.walletconnect.com/',
    'wss://relay.walletconnect.com',
    'https://oauth2.xumm.app',
    'https://xumm.app',
    'wss://xumm.app',
    C.CDN_HOSTNAME,
  ],
})

export const formActionDirectiveDefaultSrcList = [
  "'self'",
  'https://accounts.google.com',
]
