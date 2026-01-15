import {
  BaseTenantConfig,
  TenantConfigWithAssets,
  TenantFileManifest,
} from '@futureverse/common'
import * as E from 'fp-ts/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { identityProviderBackendLogger } from '../../logger'
import { config as C } from '../../serverConfig'
import LaunchdarklyService from '../launchDarkly/LaunchDarkly'

const PassOnlineCDNTenantIdVariation = t.strict({
  hosts: t.record(t.string, t.string),
})

async function getTenantCDNId(host: string) {
  const launchdarklyService = await LaunchdarklyService.getInstance()

  if (!launchdarklyService) {
    return null
  }

  const tenantIdVariation = await launchdarklyService.variation(
    'pass-online-tenant-cdn-id',
    PassOnlineCDNTenantIdVariation
  )

  if (tenantIdVariation == null) {
    return null
  }

  if (tenantIdVariation.hosts[host]) {
    return tenantIdVariation.hosts[host]
  }

  return null
}

export async function getTenantAssets(
  host: string
): Promise<TenantConfigWithAssets | null> {
  try {
    const tenantId = await getTenantCDNId(host)
    if (tenantId == null) {
      return null
    }

    const cdnHost = C.CDN_HOSTNAME
    const baseUrl = `${cdnHost}/futurepass/${tenantId}/assets`

    const [tenantFileStructure, baseTenantConfig] = await Promise.all([
      getRemoteJson(`${baseUrl}/manifest.json`, TenantFileManifest),
      getRemoteJson(`${baseUrl}/config/config.json`, BaseTenantConfig),
    ])

    const allFiles = Object.values(tenantFileStructure.files)

    const cssFiles = allFiles.filter((file) =>
      file.toLowerCase().endsWith('.css')
    )

    return {
      tenantConfig: { ...baseTenantConfig, baseUrl },
      cssFiles,
    }
  } catch (e) {
    identityProviderBackendLogger.error(
      `Failed to get tenant assets: ${JSON.stringify(e)}`,
      4004600
    )
    return null
  }
}

async function getRemoteJson<A>(url: string, type: t.Type<A>): Promise<A> {
  const res = await fetch(url)
  return decodeOrThrow(type, await res.json())
}

function decodeOrThrow<A>(type: t.Type<A>, value: unknown): A {
  const result = type.decode(value)
  if (E.isLeft(result)) {
    throw new Error(
      `Failed to decode value: ${JSON.stringify(
        value
      )}  left: ${PathReporter.report(result).join(', ')}`
    )
  }
  return result.right
}
