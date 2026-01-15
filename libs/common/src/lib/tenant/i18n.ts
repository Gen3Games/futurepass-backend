import i18next, { ResourceLanguage } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import ChainedBackend from 'i18next-chained-backend'
import HttpBackend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { TenantConfigWithBaseUrl } from '.'

export function initI18n(
  tenantConfig: TenantConfigWithBaseUrl | null,
  fallbackTenantConfig: TenantConfigWithBaseUrl,
  defaultTranslations?: Record<string, ResourceLanguage>
): void {
  const withFallback = tenantConfig ?? fallbackTenantConfig

  const hasTenantTranslations =
    withFallback.translations !== fallbackTenantConfig.translations

  const supportedLngs: string[] = withFallback.translations.map(
    (t: { locale: string }) => t.locale
  )
  void i18next
    .use(ChainedBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      debug: true,
      resources: defaultTranslations,
      backend: hasTenantTranslations
        ? {
            backends: [HttpBackend],
            backendOptions: [
              {
                loadPath: `${tenantConfig?.baseUrl}/i18n/translation-{{ns}}-{{lng}}.json`, // try to load from tenant cdn, `tenant` ns
              },
            ],
          }
        : undefined,
      ns: ['tenant', 'fallback'],
      defaultNS: 'tenant',
      fallbackNS: 'fallback',
      supportedLngs,
    })
}
