import { LoginClientIdConfig } from '../../types'

export default class AuthOptionService {
  private static authOptionService: AuthOptionService

  public static getInstance() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- a private static field is not always falsy
    if (!AuthOptionService.authOptionService) {
      AuthOptionService.authOptionService = new AuthOptionService()
    }

    return AuthOptionService.authOptionService
  }

  /**
   * Determines whether custodial authentication login is enabled for a specific client.
   *
   * @param {LoginClientIdConfig} config - Configuration object containing enable/disable settings.
   * @param {string} clientId - The client identifier to check.
   * @returns {boolean} - Returns true if custodial auth login is enabled for the client, otherwise false.
   */
  public isCustodialAuthLoginEnabledForTarget(
    config: LoginClientIdConfig,
    clientId: string
  ): boolean {
    return (
      // Check if custodial auth login is globally enabled for all clients
      config.enableAll ||
      // Check if custodial auth login is explicitly enabled for the given client
      config.enableSelected?.includes(clientId) ||
      // Check if custodial auth login is not explicitly disabled for the given client
      !config.disableSelected?.includes(clientId)
    )
  }
}
