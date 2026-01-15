import type Provider from 'oidc-provider'

type OIDCProviderMiddleware = Parameters<typeof Provider.prototype.use>[0]

/**
 * Middleware function to return openid configuration
 * with removed registration endpoint because we don't want anyone to use it directly.
 * It can only be accessible through /manageclients page.
 *
 * @param ctx - The context object.
 * @param next - The next middleware function.
 */

export const openIdConfigurationMiddleware: OIDCProviderMiddleware = async (
  ctx,
  next
) => {
  if (ctx.request.url !== '/.well-known/openid-configuration') {
    return next()
  }

  // allow response.body to be populated.
  await next()

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the body is untyped, however, it fits the Record<string, unknown> interface
  delete (ctx.response.body as Record<string, unknown>).registration_endpoint
}
