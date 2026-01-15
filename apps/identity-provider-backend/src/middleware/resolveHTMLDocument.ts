import * as path from 'path'
import * as ejs from 'ejs'
import { Request, Response } from 'express'
import { getTenantAssets } from '../services/tenant/getTenantAssets'

export async function resolveHTMLDocument(req: Request, res: Response) {
  const assets = await getTenantAssets(req.hostname)

  return ejs.renderFile(
    path.join(__dirname, '..', 'identity-provider-frontend', 'index.html'),
    {
      cssFiles: assets?.cssFiles ?? [],
      tenantConfig: JSON.stringify(assets?.tenantConfig ?? {}),
    },
    (err, str) => {
      if (err) {
        return res.status(500).send('Error rendering page')
      }
      res.send(str)
    }
  )
}
