import React from 'react'
import { useTenantContext } from '../providers/TenantContextProvider'
import { cn } from '../utils'

type TenantLogoProps = {
  width?: number
  logoSrc?: string
}

export function TenantLogo({ width, logoSrc }: TenantLogoProps): JSX.Element {
  const { tenantAssetConfig } = useTenantContext()

  let tenantLogoPath = `${tenantAssetConfig?.tenantConfig.baseUrl}/${tenantAssetConfig?.tenantConfig.logoPath}`

  if (tenantAssetConfig == null && logoSrc == null) {
    tenantLogoPath = '/assets/images/logo.png'
  }

  const twWidth = !width ? 'w-[100px]' : `w-[${width}px]`

  return (
    <div
      id="signer-tenant-logo"
      className="signer-tenant-logo h-20 flex flex-col justify-center"
    >
      <img
        src={logoSrc ?? tenantLogoPath}
        alt="Logo"
        id="signer-tenant-logo__image"
        className={cn('signer-tenant-logo__image ', twWidth)}
      />
    </div>
  )
}
