export const LAUNCHDARKLY_FLAG_LIST = {
  'test-setup-launchdarkly-boolean-flag': false,
  'test-setup-launchdarkly-string-flag': 'default',
  'test-setup-launchdarkly-number-flag': 3,
  'test-setup-launchdarkly-json-flag': [],
  'custodial-auth-client-ids': [],
  'custom-otp-email-templates': {},
  'custodial-auth-login-client-id-config': [],
  'pass-online-tenant-cdn-id': {},
  'custom-otp-email-senders': {},
}

export type LAUNCHDARKLY_FLAG = keyof typeof LAUNCHDARKLY_FLAG_LIST
