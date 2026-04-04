import express from 'express'
import helmet from 'helmet'

import { createAuthMiddleware } from './auth'
import { config } from './config'
import { createCustodyProvider } from './provider'
import { createRouter } from './routes'

async function main() {
  const provider = createCustodyProvider({
    provider: config.provider,
    deterministicSignerSeed: config.deterministicSignerSeed,
    dynamodbEndpoint: config.dynamodbEndpoint,
    dynamodbRegion: config.dynamodbRegion,
    dynamodbTable: config.dynamodbTable,
    issuerFallbacks: config.issuerFallbacks,
  })
  const authMiddleware = createAuthMiddleware({
    issuer: config.authIssuer,
    audience: config.authAudience,
    requiredScope: config.authRequiredScope,
  })
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(express.json({ limit: '100kb' }))
  app.use('/v1/custody/accounts/ensure', authMiddleware)
  app.use('/v1/custody/signatures', authMiddleware)
  app.use(createRouter(provider))

  app.listen(config.port, () => {
    console.log(
      `gen3-signer-backend listening on port ${config.port} using ${provider.name}`
    )
  })
}

void main().catch((error: unknown) => {
  console.error('gen3-signer-backend failed to start', error)
  process.exit(1)
})
