import Provider from 'oidc-provider'

/**
 * Revoke the tokens granted based on the session id
 */
export const revokeTokens = async ({
  sessionId,
  provider,
}: {
  sessionId: string
  provider: Provider
}) => {
  const session = await provider.Session.find(sessionId)
  await Promise.allSettled(
    Object.entries(session?.authorizations || {}).map(
      async ([_, { grantId }]) => {
        if (grantId) {
          await provider.RefreshToken.revokeByGrantId(grantId)
          await provider.AuthorizationCode.revokeByGrantId(grantId)
          await provider.DeviceCode.revokeByGrantId(grantId)
          await provider.Grant.adapter.destroy(grantId)
        }
      }
    )
  )
}
