import * as t from 'io-ts'

export const BaseTenantConfig = t.strict(
  {
    name: t.string,
    logoPath: t.string,
    faviconPath: t.string,
    translations: t.array(
      t.type({
        locale: t.string,
        localePath: t.string,
      })
    ),
  },
  'BaseTenantConfig'
)
export type BaseTenantConfig = t.TypeOf<typeof BaseTenantConfig>

export const TenantConfigWithBaseUrl = t.intersection([
  BaseTenantConfig,
  t.strict({ baseUrl: t.string }),
])
export type TenantConfigWithBaseUrl = t.TypeOf<typeof TenantConfigWithBaseUrl>

export const TenantFileManifest = t.strict({
  files: t.record(t.string, t.string),
})
export type TenantFileManifest = typeof TenantFileManifest

export const TenantConfigWithAssets = t.intersection([
  t.strict({
    tenantConfig: TenantConfigWithBaseUrl,
  }),
  t.strict({ cssFiles: t.array(t.string) }),
])
export type TenantConfigWithAssets = t.TypeOf<typeof TenantConfigWithAssets>
