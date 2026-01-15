# Identity Provider Backend

## Documentation

### OTP Rate Limiting

- **How does the Rate Limiting work ?** User is allowed to retry sending the request 6 times ( 1st time send plus 5 times of retries ) with a short period of timeout to Twilio SMS service ( using a valid phone number ) including sending otp and verifying otp. During each request, there is blocking time window preventing users from sending the same request. If user keeps send requests more than 5 time, the timeout window is going up to an hour, this mean after 5 times retry, user has to wait 24 hours to use the service again.
  The retry timeout is set as follows

```
const DEFAULT_SEND_RETRY_TIMEOUTS = Object.freeze({
  1: 60,
  2: 90,
  3: 120,
  4: 300,
  5: 600,
  6: 60 * 60 * 24,
} as const)

const DEFAULT_VERIFY_RETRY_TIMEOUTS = Object.freeze({
  1: 0,
  2: 0,
  3: 0,
  4: 60,
  5: 600,
  6: 60 * 60 * 24,
} as const)
```

for Email we have different timeouts for sending OTP. this allows users to send max 5 OTPs in a day to an email address. Email OTP expiry is set to 5 minutes, so each timeout is valid for 5 minutes.
```
const EMAIL_SEND_OTP_RETRIES = Object.freeze({
  1: 300,
  2: 300,
  3: 300,
  4: 300,
  5: 300,
  6: 60 * 60 * 24,
})

const EMAIL_VERIFY_OTP_RETRIES = Object.freeze({
  1: 0,
  2: 0,
  3: 0,
  4: 60,
  5: 60,
  6: 60 * 60 * 24,
})
```



The code and its logic how to get the `getNextRetryRemainingTime` locates at OtpRateLimiter.ts

Apart from the rate limiter used by Twilio SMS and Email OTP service, there is another top level rate limiter implemented to prevent user from creating too many furtherpass which is called `ip rate limiter`. It allows each ip address to create up to 5 futurepass within 24 hours. The ip rate limiter configurations are set in `main.tf`

We also have a twilio based rate-limiting that prevent users from sending more than 20 sms per day from same IP and to same Phone Number. This was added to avoid race conditions, and provide us extra safety. The logic is in `initRateLimit` of TwilioSmsOtpService.ts

- **Why not blocking the IP ?** We’ve decided against blocking users by IP, even if they submit a suspiciously high number of requests. This is because in the past we’ve noticed that exploiters can easily change their IP and since there can be a single IP for quite a large group of people, this doesn’t help with the issue but can hurt real users., instead of blocking the ip, we block the phone number and email address. If user sent more than 5 times using the same email address or valid phone number, this email address or phone number cannot be used in next 24 hours.

- **How do the alerts work ?** We are logging how many requests are sent using AWS CloudWatch, based on that logs, we are able to setup an alert to notify us if any of the services are abused or unavailable. We can setup a threshold in AWS CloudWatch to monitor certain logs which triggers the alarm if the total number of requests exceeds the threshold.
  In this case, the logs for Twilio SMS service and Email OTP services have their own log id, AWS CloudWatch filters log using their ids and determines how many requests are sent. If there are too many requests using Twilio or Email services, AWS CloudWatch sends the alarm email to us.

### Using Launchdarkly

Launchdarkly is integrated into the identity provider backend, it means it is possible to use Launchdarkly flags to enable / disable some of the features without deploying the service.

- **How to add a feature flag ?**

1. Using Launchdarkly console

2. Using the script created at ./identity-provider-backend/src/scripts

   To add the feature flag, run `pnpm createLDFlag <apiToken> <projectName> <flagKey> <flagName> <flagVariations>`

   Example usage: `pnpm createLDFlag <apiToken> futurepass-identity-provider-frontend test-api-create-flag "Test api create flag" '1' '2'`

notice: feature flags in Launchdarkly cannot be duplicated, this means create a feature flag using an existing flag key will always have the existing flag to be removed first

- **How to use a feature flag ?**

1. Creating a flag either using the Launchdarkly console or the script
2. Add created flag to LAUNCHDARKLY_FLAG_LIST and set its default value
3. Create a codec for this feature flag. The codec is used to decode the feature flag variation response, so it should be able to decode the flag default value as well
4. Get the instance of LaunchdarklyService and call its variation function, here is an example usage:

```
  const launchdarklyService = await LaunchdarklyService.getInstance()

  const response = await launchdarklyService.variation(
    'test-api-create-flag',
     t.number
  )
```

- **How to remove a feature flag ?**

1. Using Launchdarkly console

2. Using the script created at ./identity-provider-backend/src/scripts

   To add the feature flag, run `pnpm deleteLDFlag <apiToken> <projectName> <flagKey>`

   Example usage: `pnpm deleteLDFlag <apiToken> futurepass-identity-provider-frontend test-api-create-flag`
