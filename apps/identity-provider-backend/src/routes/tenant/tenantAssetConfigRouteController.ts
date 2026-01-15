import express, { Router, Request, Response } from 'express'
import { identityProviderBackendLogger } from '../../logger'
import { getTenantAssets } from '../../services/tenant/getTenantAssets'
import { RouterController } from '../routerController'

export default class TenantAssetConfigRouterController extends RouterController {
  private readonly tenantAssetConfigRouter: Router = express.Router()

  private async getTenantAssetConfig(req: Request, res: Response) {
    try {
      const tenantAssetConfig = await getTenantAssets(req.hostname)
      if (!tenantAssetConfig) {
        return res.status(404).send()
      }
      return res.json(tenantAssetConfig)
    } catch (e: unknown) {
      identityProviderBackendLogger.error(
        `Failed to get tenant assets: ${JSON.stringify(e)}`,
        4004600
      )
      return res.status(500).send()
    }
  }

  public getRouter() {
    this.tenantAssetConfigRouter.get('/', this.getTenantAssetConfig.bind(this))

    return this.tenantAssetConfigRouter
  }
}
