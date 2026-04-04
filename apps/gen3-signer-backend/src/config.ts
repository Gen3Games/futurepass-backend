import fs from 'fs'
import path from 'path'

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

import { CustodyProviderName } from './types'

const envConfigPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'apps/gen3-signer-backend/.env'),
  path.resolve(process.cwd(), 'apps/gen3-signer-backend/.env.local'),
]

const loadedEnvPaths = new Set<string>()

for (const envConfigPath of envConfigPaths) {
  if (!fs.existsSync(envConfigPath) || loadedEnvPaths.has(envConfigPath)) {
    continue
  }

  dotenvExpand.expand(
    dotenv.config({
      path: envConfigPath,
      override: true,
    })
  )

  loadedEnvPaths.add(envConfigPath)
}

function fromEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback

  if (value == null || value === '') {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function providerFromEnv(name: string, fallback: CustodyProviderName): CustodyProviderName {
  const value = fromEnv(name, fallback)

  if (value === 'alternator' || value === 'deterministic-local') {
    return value
  }

  throw new Error(`Unsupported custody provider: ${value}`)
}

export const config = {
  port: parseInt(process.env['PORT'] ?? '4300', 10),
  provider: providerFromEnv('GEN3_SIGNER_PROVIDER', 'alternator'),
  deterministicSignerSeed: fromEnv(
    'DETERMINISTIC_SIGNER_SEED',
    'futurepass-local-gen3-signer'
  ),
  dynamodbEndpoint: process.env['GEN3_SIGNER_DYNAMODB_ENDPOINT'] ?? process.env['DYNAMODB_ENDPOINT'] ?? 'http://127.0.0.1:8000',
  dynamodbRegion:
    process.env['GEN3_SIGNER_DYNAMODB_REGION'] ??
    process.env['AWS_REGION'] ??
    process.env['AWS_DEFAULT_REGION'] ??
    'us-west-2',
  dynamodbTable:
    process.env['GEN3_SIGNER_DYNAMODB_TABLE'] ?? 'foundation-key-ownership',
  issuerFallbacks: (
    process.env['GEN3_SIGNER_ISSUER_FALLBACKS'] ??
    'https://login.futureverse.app,https://login.pass.online'
  )
    .split(',')
    .map((issuer) => issuer.trim())
    .filter((issuer) => issuer !== ''),
  authIssuer: fromEnv(
    'GEN3_SIGNER_AUTH_ISSUER',
    'https://futurepass.gen3labs.tech'
  ),
  authAudience: fromEnv(
    'GEN3_SIGNER_AUTH_AUDIENCE',
    'https://api.futureverse.com'
  ),
  authRequiredScope: fromEnv(
    'GEN3_SIGNER_AUTH_REQUIRED_SCOPE',
    'foundation:sign'
  ),
}
