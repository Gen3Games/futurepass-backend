import * as sdk from '@futureverse/experience-sdk'
import { ResourceLanguage } from 'i18next'
import { initI18n } from './i18n'
import { TenantConfigWithAssets, TenantConfigWithBaseUrl } from './tenant.types'

const fallbackTenantConfig: TenantConfigWithBaseUrl = {
  name: 'Pass',
  logoPath: 'images/logo.png',
  faviconPath: 'images/favicon.png',
  translations: [
    { locale: 'en', localePath: 'i18n/translation-fallback-en.json' },
    { locale: 'jp', localePath: 'i18n/translation-fallback-jp.json' },
  ],
  baseUrl: '/assets',
}

async function getTenantConfigFromHTML() {
  try {
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve)
      })
    }

    const tenantConfig = document.getElementById('tenant-config')?.textContent
    if (!tenantConfig) {
      return null
    }

    return sdk.hush(TenantConfigWithBaseUrl.decode(JSON.parse(tenantConfig)))
  } catch (e) {
    return null
  }
}

async function getTenantAssetConfigFromIDP(idpUrl: string) {
  const response = await fetch(`${idpUrl}/tenant`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch tenant config')
  }
  const config: unknown = await response.json()

  return sdk.hush(TenantConfigWithAssets.decode(config))
}

function init(
  tenantConfig: TenantConfigWithBaseUrl,
  CSSFiles: string[] = [],
  defaultTranslations?: Record<string, ResourceLanguage>
) {
  // set favicon
  const fav = document.createElement('link')
  fav.rel = 'icon'
  fav.type = 'image/x-icon'
  fav.href = `${tenantConfig.baseUrl}/${tenantConfig.faviconPath}`
  document.head.appendChild(fav)

  // set title
  document.title = tenantConfig.name

  initI18n(tenantConfig, fallbackTenantConfig, defaultTranslations)

  CSSFiles.forEach((cssFile) => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = cssFile
    document.head.appendChild(css)
  })
}

export const tenant = {
  config: {
    html: {
      getTenantConfigFromHTML,
    },
    idp: {
      getTenantAssetConfigFromIDP,
    },
    fallbackTenantConfig,
  },
  init,
}
