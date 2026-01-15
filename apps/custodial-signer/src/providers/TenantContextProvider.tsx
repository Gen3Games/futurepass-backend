import { tenant, TenantConfigWithBaseUrl } from '@futureverse/common'
import { useQuery } from '@tanstack/react-query'
import i18next from 'i18next'
import React from 'react'
import enTranslation from '../assets/i18n/translation-fallback-en.json'
import jpTranslation from '../assets/i18n/translation-fallback-jp.json'
import { Loading } from '../components/Loading'
import { useRPCCallContext } from './rpc'

interface TenantContextType {
  error: Error | null
  initCompleted: boolean
  loading: boolean
  tenantAssetConfig: {
    tenantConfig: TenantConfigWithBaseUrl
    cssFiles: string[]
  } | null
}

export const TenantContext = React.createContext<TenantContextType | undefined>(
  undefined
)

interface TenantContextProviderProps {
  children: React.ReactNode
}

export const TenantContextProvider: React.FC<TenantContextProviderProps> = ({
  children,
}) => {
  const [initCompleted, setInitCompleted] = React.useState<boolean>(false)

  const [i18nInitialized, setI18nInitialized] = React.useState<boolean>(
    i18next.isInitialized
  )

  const { idpURL } = useRPCCallContext()

  React.useEffect(() => {
    if (!i18nInitialized) {
      i18next.on('initialized', () => {
        setI18nInitialized(true)
      })
    }
  }, [i18nInitialized])

  const {
    data: tenantAssetConfig,
    error,
    isLoading: loading,
  } = useQuery({
    queryKey: ['tenantConfig', idpURL],
    queryFn: async () => {
      if (!idpURL) {
        return null
      }
      try {
        const config = await tenant.config.idp.getTenantAssetConfigFromIDP(
          idpURL
        )
        if (!config) {
          throw new Error('Failed to fetch tenant config')
        }
        return config
      } catch (e) {
        // fallback to default tenant config
        return {
          tenantConfig: tenant.config.fallbackTenantConfig,
          cssFiles: [],
        }
      }
    },
  })

  React.useEffect(() => {
    if (tenantAssetConfig) {
      tenant.init(tenantAssetConfig.tenantConfig, tenantAssetConfig.cssFiles, {
        en: {
          fallback: enTranslation,
        },
        jp: {
          fallback: jpTranslation,
        },
      })
      setInitCompleted(true)
    }
  }, [tenantAssetConfig])

  if (!i18nInitialized || !initCompleted) {
    return <Loading />
  }

  return (
    <TenantContext.Provider
      value={{
        error,
        initCompleted,
        loading,
        tenantAssetConfig: tenantAssetConfig ?? null,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export default TenantContextProvider

export function useTenantContext() {
  const context = React.useContext(TenantContext)
  if (context === undefined) {
    throw new Error(
      'useTenantContext must be used within a TenantContextProvider'
    )
  }
  return context
}
