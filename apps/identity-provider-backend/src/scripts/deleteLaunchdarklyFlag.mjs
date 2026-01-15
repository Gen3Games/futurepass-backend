/* eslint-disable @typescript-eslint/no-unsafe-member-access -- script only */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- script only */
/* eslint-disable no-console -- script only */
/* eslint-disable no-undef  -- script only */

// Usage: Usage: pnpm deleteLDFlag <apiToken> <projectName> <flagKey>
// Example usage: pnpm deleteLDFlag <apiToken> futurepass-identity-provider-frontend test-api-create-flag

import { FeatureFlagsApi, Configuration } from 'launchdarkly-api-typescript'

const args = process.argv.slice(2)

if (args.length < 3) {
  console.log(
    'Usage: Usage: pnpm deleteLDFlag <apiToken> <projectName> <flagKey>'
  )
  process.exit(1)
}

const [apiToken, projectName, flagKey] = args

const config = new Configuration({ apiKey: apiToken })
const apiInstance = new FeatureFlagsApi(config)

const successCallback = function (res) {
  console.log(
    'API called successfully. Returned data: ' + JSON.stringify(res.data)
  )
}

const errorCallback = function (error) {
  console.error('Error!', error)
  process.exit(1)
}

apiInstance
  .deleteFeatureFlag(projectName, flagKey)
  .then(() => {
    console.log('Flag deleted')
  }, successCallback)
  .catch((err) => {
    if (err?.response?.status === 404) {
      console.log('No flag to cleanup')
    } else {
      errorCallback(err)
    }
  })

/* eslint-enable no-undef  -- script only */
/* eslint-enable no-console -- script only */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- script only */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- script only */
