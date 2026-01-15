import useragent from 'express-useragent'
import Provider from 'oidc-provider'
import { getClientIp } from 'request-ip'
import { identityProviderBackendLogger } from './logger'
import { config as C } from './serverConfig'

export const startEventListening = (provider: Provider) => {
  // Events issued from /auth endpoint
  provider.on('authorization.success', () => {
    identityProviderBackendLogger.stream(`Authentication success`, 2001001)
  })

  provider.on('authorization.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `Authentication failed: ${err.message}`,
      2001002
    )
  })

  provider.on('interaction.started', (ctx, prompt) => {
    const clientIp = C.isDevelopment
      ? C.LOCALHOST_IP
      : getClientIp(ctx.request) ?? C.LOCALHOST_IP

    identityProviderBackendLogger.stream(
      `Interaction.started with prompt ${prompt.name} from ip: ${clientIp}`,
      2005004
    )
    identityProviderBackendLogger.stream(
      `Interaction.started with user agent ${JSON.stringify(
        useragent.parse(ctx.req.headers['user-agent'] ?? '')
      )}`,
      4003001
    )
  })

  // Events issued from /token endpoint
  provider.on('grant.success', () => {
    identityProviderBackendLogger.stream(`Authorization success`, 2002001)
  })

  provider.on('grant.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `Authorization failed: ${err.message}`,
      2002002
    )
  })

  provider.on('backchannel.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `backchannel.error: ${err.message}`,
      4006010,
      JSON.stringify(ctx)
    )
  })

  provider.on('jwks.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `jwks.error: ${err.message}`,
      4006011,
      JSON.stringify(ctx)
    )
  })

  provider.on('server_error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `server_error: ${err.message}`,
      4006012,
      JSON.stringify(ctx)
    )
  })

  provider.on('userinfo.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `userinfo.error: ${err.message}`,
      4006013,
      JSON.stringify(ctx)
    )
  })

  provider.on('discovery.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `discovery.error: ${err.message}`,
      4006014,
      JSON.stringify(ctx)
    )
  })

  provider.on('revocation.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `revocation.error: ${err.message}`,
      4006015,
      JSON.stringify(ctx)
    )
  })

  provider.on('end_session.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `end_session.error: ${err.message}`,
      4006016,
      JSON.stringify(ctx)
    )
  })

  provider.on('introspection.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `introspection.error: ${err.message}`,
      4006017,
      JSON.stringify(ctx)
    )
  })

  provider.on('registration_read.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `registration_read.error: ${err.message}`,
      4006020,
      JSON.stringify(ctx)
    )
  })

  provider.on('registration_create.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `registration_create.error: ${err.message}`,
      4006021,
      JSON.stringify(ctx)
    )
  })

  provider.on('registration_delete.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `registration_delete.error: ${err.message}`,
      4006022,
      JSON.stringify(ctx)
    )
  })

  provider.on('registration_update.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `registration_update.error: ${err.message}`,
      4006023,
      JSON.stringify(ctx)
    )
  })

  provider.on('pushed_authorization_request.error', (ctx, err) => {
    identityProviderBackendLogger.error(
      `pushed_authorization_request.error: ${err.message}`,
      4006018,
      JSON.stringify(ctx)
    )
  })
}
