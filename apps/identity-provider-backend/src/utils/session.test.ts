import { revokeTokens } from './session'
import type { DefaultPolicy, OIDCProvider } from '../oidc-types'

jest.mock('oidc-provider', () => {
  return jest.fn().mockImplementation(() => {
    return {
      Session: {
        find: jest.fn(),
      },
      RefreshToken: {
        revokeByGrantId: jest.fn(),
      },
      AuthorizationCode: {
        revokeByGrantId: jest.fn(),
      },
      DeviceCode: {
        revokeByGrantId: jest.fn(),
      },
      Grant: {
        adapter: {
          destroy: jest.fn(),
        },
      },
    }
  })
})

describe('revokeTokens', () => {
  const mockSessionId = 'mockSessionId'
  let provider

  beforeEach(async () => {
    const { default: OIDCProvider } = (await import('oidc-provider')) as {
      default: new (issuer: string, configuration?) => OIDCProvider
      interactionPolicy: {
        base: () => DefaultPolicy
      }
    }
    provider = new OIDCProvider('')
    jest.clearAllMocks()
  })

  it('should revoke tokens if session and grantId are present', async () => {
    const mockSession = {
      authorizations: {
        client1: { grantId: 'grantId1' },
        client2: { grantId: 'grantId2' },
      },
    };

    // Mock the session data
    (provider.Session.find as jest.Mock).mockResolvedValue(mockSession)

    await revokeTokens({ sessionId: mockSessionId, provider })

    // Verify that revokeByGrantId is called for each grantId
    expect(provider.RefreshToken.revokeByGrantId).toHaveBeenCalledTimes(2)
    expect(provider.AuthorizationCode.revokeByGrantId).toHaveBeenCalledTimes(2)
    expect(provider.DeviceCode.revokeByGrantId).toHaveBeenCalledTimes(2)
    expect(provider.Grant.adapter.destroy).toHaveBeenCalledTimes(2)

    expect(provider.RefreshToken.revokeByGrantId).toHaveBeenCalledWith(
      'grantId1'
    )
    expect(provider.RefreshToken.revokeByGrantId).toHaveBeenCalledWith(
      'grantId2'
    )
    expect(provider.Grant.adapter.destroy).toHaveBeenCalledWith('grantId1')
    expect(provider.Grant.adapter.destroy).toHaveBeenCalledWith('grantId2')
  })

  it('should handle missing session gracefully', async () => {
    // Mock that the session is not found
    (provider.Session.find as jest.Mock).mockResolvedValue(null)

    await revokeTokens({ sessionId: mockSessionId, provider })

    // Verify that none of the revoke or destroy methods are called
    expect(provider.RefreshToken.revokeByGrantId).not.toHaveBeenCalled()
    expect(provider.AuthorizationCode.revokeByGrantId).not.toHaveBeenCalled()
    expect(provider.DeviceCode.revokeByGrantId).not.toHaveBeenCalled()
    expect(provider.Grant.adapter.destroy).not.toHaveBeenCalled()
  })
})
