/* eslint-disable @typescript-eslint/no-unsafe-argument -- unit test */
/* eslint-disable @typescript-eslint/restrict-template-expressions -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-return -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- unit test */
/* eslint-disable @typescript-eslint/no-unsafe-call -- unit test */

import * as t from 'io-ts'
import LaunchdarklyService from '../services/launchDarkly/LaunchDarkly'

describe('Launchdarkly flag test', () => {
  let launchdarklyService: LaunchdarklyService | null
  beforeAll(async () => {
    launchdarklyService = await LaunchdarklyService.getInstance()
  })

  afterAll(async () => {
    if (launchdarklyService) {
      await launchdarklyService.shutdown()
    }
  })
  it('should return false when testing test-setup-launchdarkly-boolean-flag', async () => {
    if (launchdarklyService) {
      // this flag is set on launchdarkly, if change its value, update the unit test accordingly
      const response = await launchdarklyService.variation(
        'test-setup-launchdarkly-boolean-flag',
        t.boolean
      )

      expect(response).toBeFalsy()
    }
  })

  it('should return `string flag variation 1` when testing test-setup-launchdarkly-string-flag', async () => {
    if (launchdarklyService) {
      // this flag is set on launchdarkly, if change its value, update the unit test accordingly
      const response = await launchdarklyService.variation(
        'test-setup-launchdarkly-string-flag',
        t.string
      )

      expect(response).toStrictEqual('string flag variation 1')
    }
  })

  it('should return 1 when testing test-setup-launchdarkly-number-flag', async () => {
    if (launchdarklyService) {
      // this flag is set on launchdarkly, if change its value, update the unit test accordingly
      const response = await launchdarklyService.variation(
        'test-setup-launchdarkly-number-flag',
        t.number
      )

      expect(response).toBe(1)
    }
  })

  it('should return 1 when testing test-setup-launchdarkly-json-flag', async () => {
    const UserType = t.type({
      age: t.number,
      name: t.string,
    })

    if (launchdarklyService) {
      // this flag is set on launchdarkly, if change its value, update the unit test accordingly
      const response = await launchdarklyService.variation(
        'test-setup-launchdarkly-json-flag',
        UserType
      )

      expect(response?.age).toBe(30)
      expect(response?.name).toStrictEqual('John')
    }
  })
})
export {}

/* eslint-enable @typescript-eslint/no-unsafe-argument -- unit test */
/* eslint-enable @typescript-eslint/restrict-template-expressions -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-return -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- unit test */
/* eslint-enable @typescript-eslint/no-unsafe-call -- unit test */
