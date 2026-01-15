import { tenant, TenantConfigWithBaseUrl } from '@futureverse/common'
import React from 'react'
import enTranslations from '../assets/i18n/translation-fallback-en.json'
import jpTranslations from '../assets/i18n/translation-fallback-jp.json'

interface HTMLTenantContextType {
  initCompleted: boolean
  loading: boolean
  tenantConfig: TenantConfigWithBaseUrl | null
}

export const HTMLTenantContext = React.createContext<
  HTMLTenantContextType | undefined
>(undefined)

interface HTMLTenantContextProviderProps {
  children: React.ReactNode
}

export const HTMLTenantContextProvider: React.FC<
  HTMLTenantContextProviderProps
> = ({ children }) => {
  const [initCompleted, setInitCompleted] = React.useState<boolean>(false)
  const [loading, setLoading] = React.useState<boolean>(true)
  const [tenantConfig, setTenantConfig] =
    React.useState<TenantConfigWithBaseUrl | null>(null)

  const getHTMLTenantAssetConfig = React.useCallback(async () => {
    const config = await tenant.config.html.getTenantConfigFromHTML()
    if (!config) {
      throw new Error('Failed to fetch tenant config')
    }
    return config
  }, [])

  React.useEffect(() => {
    setLoading(true)
    getHTMLTenantAssetConfig()
      .then((config) => {
        setTenantConfig(config)
      })
      .catch(() => {
        setTenantConfig(tenant.config.fallbackTenantConfig)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [getHTMLTenantAssetConfig])

  React.useEffect(() => {
    if (tenantConfig) {
      tenant.init(tenantConfig, undefined, {
        en: {
          fallback: enTranslations,
        },
        jp: {
          fallback: jpTranslations,
        },
      })
      setInitCompleted(true)
    }
  }, [tenantConfig])

  return (
    <HTMLTenantContext.Provider
      value={{
        initCompleted,
        loading,
        tenantConfig: tenantConfig ?? null,
      }}
    >
      {children}
    </HTMLTenantContext.Provider>
  )
}

export default HTMLTenantContextProvider

export function useHTMLTenantContext() {
  const context = React.useContext(HTMLTenantContext)
  if (context === undefined) {
    throw new Error(
      'useHTMLTenantContext must be used within a HTMLTenantContextProvider'
    )
  }
  return context
}
