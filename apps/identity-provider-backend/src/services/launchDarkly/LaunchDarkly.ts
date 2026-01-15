import * as ld from '@launchdarkly/node-server-sdk'
import * as t from 'io-ts'
import * as CO from '../../common'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import { LAUNCHDARKLY_FLAG, LAUNCHDARKLY_FLAG_LIST } from './LaunchDarklyFlags'

const LaunchdarklyVariationResponse = t.union([
  t.string,
  t.boolean,
  t.number,
  t.type({}),
])

type LaunchdarklyVariationResponse = t.TypeOf<
  typeof LaunchdarklyVariationResponse
>

/**
 * Provides LaunchDarkly services including feature flag evaluation and management.
 */
export default class LaunchdarklyService {
  private static launchdarklyService: LaunchdarklyService
  private launchdarklyClient: ld.LDClient
  private launchdarklyClientForFrontEnd: ld.LDClient

  /**
   * Creates an instance of the LaunchdarklyService.
   * @param launchdarklyClient - The LaunchDarkly client for server-side flag evaluation.
   * @param launchdarklyClientForFrontEnd - The LaunchDarkly client for generating front-end hash.
   */
  private constructor(
    launchdarklyClient: ld.LDClient,
    launchdarklyClientForFrontEnd: ld.LDClient
  ) {
    this.launchdarklyClient = launchdarklyClient
    this.launchdarklyClientForFrontEnd = launchdarklyClientForFrontEnd
  }

  /**
   * Gets the singleton instance of the LaunchdarklyService.
   * @returns The singleton instance of the LaunchdarklyService.
   */
  public static async getInstance() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- a private static field is not always falsy
    if (!LaunchdarklyService.launchdarklyService) {
      try {
        LaunchdarklyService.launchdarklyService = new LaunchdarklyService(
          ld.init(C.LAUNCHDARKLY_SDK_KEY),
          ld.init(C.LAUNCHDARKLY_FRONTEND_SDK_KEY)
        )

        // Initialization complete
        await LaunchdarklyService.launchdarklyService.launchdarklyClient.waitForInitialization()
      } catch (err) {
        identityProviderBackendLogger.error(
          `Failed to initialize Launchdarkly, error: ${JSON.stringify(err)}`,
          4004510
        )

        return null
      }
    }

    return LaunchdarklyService.launchdarklyService
  }

  /**
   * Evaluates a feature flag for a given user context and returns the variation.
   * @param flag - The feature flag to evaluate.
   * @param decoder - The io-ts decoder to validate the response.
   * @param context - Optional. The user context for flag evaluation.
   * @returns The flag variation for the given context, or null if evaluation fails.
   */
  public async variation<T extends LaunchdarklyVariationResponse>(
    flag: LAUNCHDARKLY_FLAG,
    decoder: t.Type<T>,
    context?: ld.LDContext
  ): Promise<T | null> {
    const response = CO.hush(
      decoder.decode(
        await this.launchdarklyClient.variation(
          flag,
          context ?? this.createDefaultContext(),
          this.getFlagDefaultValue(flag)
        )
      )
    )

    if (response == null) {
      identityProviderBackendLogger.error(
        `Invalid launchdarkly variation response`,
        4004511
      )
      return null
    }

    return response
  }

  /**
   * Shuts down the LaunchDarkly clients, ensuring all events are flushed.
   */
  public async shutdown() {
    await this.launchdarklyClient.flush()
    this.launchdarklyClient.close()
    this.launchdarklyClientForFrontEnd.close()
  }

  /**
   * Generates a secure mode hash for the front-end client.
   * @returns The secure mode hash.
   */
  public generateSecureModeHashForFrontend() {
    return this.launchdarklyClientForFrontEnd.secureModeHash(
      this.createDefaultContext()
    )
  }

  /**
   * Creates a default context for LaunchDarkly evaluation.
   * @private
   * @returns The default LaunchDarkly context.
   */
  private createDefaultContext(): ld.LDSingleKindContext {
    return {
      kind: 'User',
      key: 'identity-provider-anonymous',
      anonymous: true,
    }
  }

  /**
   * Retrieves the default value for a given flag.
   * @private
   * @param flag - The flag for which to retrieve the default value.
   * @returns The default value of the flag.
   */
  private getFlagDefaultValue(flag: LAUNCHDARKLY_FLAG): unknown {
    return LAUNCHDARKLY_FLAG_LIST[flag]
  }
}
