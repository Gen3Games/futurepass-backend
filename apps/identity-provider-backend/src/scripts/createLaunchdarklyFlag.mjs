/* eslint-disable @typescript-eslint/no-unsafe-call -- script only */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- script only */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- script only */
/* eslint-disable no-console -- script only */
/* eslint-disable no-undef  -- script only */

// Usage: Usage: pnpm createLDFlag <apiToken> <projectName> <flagKey> <flagName> <flagVariations>
// Example usage: pnpm createLDFlag <apiToken> futurepass-identity-provider-frontend test-api-create-flag "Test api create flag" '1' '2'

import { FeatureFlagsApi, Configuration } from 'launchdarkly-api-typescript'

const args = process.argv.slice(2)

if (args.length < 5) {
  console.log(
    'Usage: pnpm createLDFlag <apiToken> <projectName> <flagKey> <flagName> <flagVariations>'
  )
  process.exit(1)
}

const [apiToken, projectName, flagKey, flagName, ...flagVariationsInput] = args

const flagVariations = flagVariationsInput.map((v) => ({
  value: JSON.parse(v),
}))

const config = new Configuration({ apiKey: apiToken })
const apiInstance = new FeatureFlagsApi(config)

const flagBody = {
  name: flagName,
  key: flagKey,
  variations: flagVariations,
}

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
  })
  .catch((err) => {
    if (err?.response?.status === 404) {
      console.log('No flag to cleanup')
    } else {
      errorCallback(err)
    }
  })
  .finally(() => {
    apiInstance
      .postFeatureFlag(projectName, flagBody)
      .then(successCallback, errorCallback)
  })

/* eslint-enable no-undef  -- script only */
/* eslint-enable no-console -- script only */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- script only */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- script only */
/* eslint-enable @typescript-eslint/no-unsafe-call -- script only */
