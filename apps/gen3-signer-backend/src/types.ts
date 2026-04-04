export type CustodyProviderName = 'alternator' | 'deterministic-local'

export type CustodyAccountRecord = {
  subject: string
  issuer: string
  address: string
  publicKey: string
  keyId: string
}

export type EnsureCustodyAccountRequest = {
  subject: string
  issuer: string
  createIfMissing?: boolean
}

export type EnsureCustodyAccountResponse = {
  account: CustodyAccountRecord
  created: boolean
  provider: CustodyProviderName
}

export type SignDigestRequest = {
  subject: string
  issuer: string
  digest: string
  requestId?: string
}

export type SignDigestResponse = {
  signature: string
  account: CustodyAccountRecord
  provider: CustodyProviderName
}

export type CustodyProviderHealth = {
  status: 'ok' | 'degraded'
  provider: CustodyProviderName
}
