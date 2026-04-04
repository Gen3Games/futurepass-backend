import { DescribeTableCommand, DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { ethers } from 'ethers'

import {
  CustodyAccountRecord,
  CustodyProviderHealth,
  CustodyProviderName,
  EnsureCustodyAccountRequest,
  EnsureCustodyAccountResponse,
  SignDigestRequest,
  SignDigestResponse,
} from './types'

export interface CustodyProvider {
  readonly name: CustodyProviderName
  health(): Promise<CustodyProviderHealth>
  ensureAccount(
    request: EnsureCustodyAccountRequest
  ): Promise<EnsureCustodyAccountResponse>
  signDigest(request: SignDigestRequest): Promise<SignDigestResponse>
}

type StoredCustodyItem = {
  iss: string
  userId: string
  keyId: string
  address: string
  publicKey?: string
  privateKey?: string
  status?: string
}

export function normalizeSubject(subject: string): string {
  return subject.trim().toLowerCase()
}

function normalizeIssuer(issuer: string): string {
  return issuer.trim().toLowerCase()
}

function trimSubject(subject: string): string {
  return subject.trim()
}

function assertDigest(digest: string): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(digest)) {
    throw new Error('digest must be a 32-byte hex string')
  }

  return digest.toLowerCase()
}

function withHexPrefix(value: string): string {
  return value.startsWith('0x') ? value : `0x${value}`
}

function buildIssuerCandidates(issuer: string, fallbacks: string[]): string[] {
  const candidates = [issuer.trim(), ...fallbacks.map((value) => value.trim())].filter(
    (value) => value !== ''
  )

  return candidates.filter(
    (candidate, index) =>
      candidates.findIndex(
        (other) => other.toLowerCase() === candidate.toLowerCase()
      ) === index
  )
}

function toAccountRecord(item: StoredCustodyItem): CustodyAccountRecord {
  const privateKey = item.privateKey == null ? null : withHexPrefix(item.privateKey)
  const publicKey =
    item.publicKey ??
    (privateKey == null
      ? null
      : ethers.utils.computePublicKey(privateKey, true))

  if (publicKey == null) {
    throw new Error(`custody record is missing publicKey for ${item.iss}:${item.userId}`)
  }

  const derivedAddress = ethers.utils.computeAddress(publicKey)
  if (derivedAddress.toLowerCase() !== item.address.toLowerCase()) {
    throw new Error(
      `custody record address mismatch for ${item.iss}:${item.userId}`
    )
  }

  return {
    subject: item.userId,
    issuer: item.iss,
    address: item.address,
    publicKey,
    keyId: item.keyId,
  }
}

function parseStoredCustodyItem(item?: Record<string, { S?: string }>): StoredCustodyItem | null {
  if (item == null) {
    return null
  }

  const iss = item['iss']?.S
  const userId = item['userId']?.S
  const keyId = item['keyId']?.S
  const address = item['address']?.S

  if (iss == null || userId == null || keyId == null || address == null) {
    return null
  }

  return {
    iss,
    userId,
    keyId,
    address,
    publicKey: item['publicKey']?.S,
    privateKey: item['privateKey']?.S,
    status: item['status']?.S,
  }
}

function derivePrivateKey(seed: string, subject: string, issuer: string): string {
  return ethers.utils.solidityKeccak256(
    ['string', 'string', 'string'],
    [seed, normalizeIssuer(issuer), normalizeSubject(subject)]
  )
}

function deriveAccount(seed: string, subject: string, issuer: string): CustodyAccountRecord {
  const normalizedSubject = normalizeSubject(subject)
  const normalizedIssuer = normalizeIssuer(issuer)
  const signingKey = new ethers.utils.SigningKey(
    derivePrivateKey(seed, normalizedSubject, normalizedIssuer)
  )
  const publicKey = ethers.utils.computePublicKey(signingKey.privateKey, false)
  const address = ethers.utils.computeAddress(publicKey)

  return {
    subject: normalizedSubject,
    issuer: normalizedIssuer,
    address,
    publicKey,
    keyId: `gen3:${normalizedIssuer}:${normalizedSubject}`,
  }
}

export class DeterministicLocalCustodyProvider implements CustodyProvider {
  readonly name: CustodyProviderName = 'deterministic-local'

  constructor(private readonly seed: string) {}

  async health(): Promise<CustodyProviderHealth> {
    return {
      status: 'ok',
      provider: this.name,
    }
  }

  async ensureAccount(
    request: EnsureCustodyAccountRequest
  ): Promise<EnsureCustodyAccountResponse> {
    return {
      account: deriveAccount(this.seed, request.subject, request.issuer),
      created: true,
      provider: this.name,
    }
  }

  async signDigest(request: SignDigestRequest): Promise<SignDigestResponse> {
    const digest = assertDigest(request.digest)
    const account = deriveAccount(this.seed, request.subject, request.issuer)
    const signingKey = new ethers.utils.SigningKey(
      derivePrivateKey(this.seed, account.subject, account.issuer)
    )
    const signature = ethers.utils.joinSignature(signingKey.signDigest(digest))

    return {
      signature,
      account,
      provider: this.name,
    }
  }
}

export class AlternatorCustodyProvider implements CustodyProvider {
  readonly name: CustodyProviderName = 'alternator'

  constructor(
    private readonly client: DynamoDBClient,
    private readonly tableName: string,
    private readonly issuerFallbacks: string[]
  ) {}

  private async getRecord(
    issuer: string,
    subject: string
  ): Promise<StoredCustodyItem | null> {
    const normalizedSubject = trimSubject(subject)

    for (const candidateIssuer of buildIssuerCandidates(
      normalizeIssuer(issuer),
      this.issuerFallbacks
    )) {
      const response = await this.client.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: {
            iss: { S: candidateIssuer },
            userId: { S: normalizedSubject },
          },
          ConsistentRead: true,
        })
      )

      const parsed = parseStoredCustodyItem(response.Item)
      if (parsed != null) {
        return parsed
      }
    }

    return null
  }

  async health(): Promise<CustodyProviderHealth> {
    try {
      await this.client.send(
        new DescribeTableCommand({
          TableName: this.tableName,
        })
      )

      return {
        status: 'ok',
        provider: this.name,
      }
    } catch {
      return {
        status: 'degraded',
        provider: this.name,
      }
    }
  }

  async ensureAccount(
    request: EnsureCustodyAccountRequest
  ): Promise<EnsureCustodyAccountResponse> {
    const record = await this.getRecord(request.issuer, request.subject)

    if (record == null) {
      if (request.createIfMissing === false) {
        throw new Error('custody account not found')
      }

      throw new Error('custody account creation is not implemented for alternator provider')
    }

    return {
      account: toAccountRecord(record),
      created: false,
      provider: this.name,
    }
  }

  async signDigest(request: SignDigestRequest): Promise<SignDigestResponse> {
    const digest = assertDigest(request.digest)
    const record = await this.getRecord(request.issuer, request.subject)

    if (record == null) {
      throw new Error('custody account not found')
    }

    if (record.privateKey == null || record.privateKey.trim() === '') {
      throw new Error('custody record is missing privateKey')
    }

    const privateKey = withHexPrefix(record.privateKey.trim())
    const signingKey = new ethers.utils.SigningKey(privateKey)

    return {
      signature: ethers.utils.joinSignature(signingKey.signDigest(digest)),
      account: toAccountRecord(record),
      provider: this.name,
    }
  }
}

export function createCustodyProvider(config: {
  provider: CustodyProviderName
  deterministicSignerSeed: string
  dynamodbEndpoint: string
  dynamodbRegion: string
  dynamodbTable: string
  issuerFallbacks: string[]
}): CustodyProvider {
  if (config.provider === 'deterministic-local') {
    return new DeterministicLocalCustodyProvider(config.deterministicSignerSeed)
  }

  return new AlternatorCustodyProvider(
    new DynamoDBClient({
      endpoint: config.dynamodbEndpoint,
      region: config.dynamodbRegion,
      credentials: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] ?? 'dummy',
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] ?? 'dummy',
      },
    }),
    config.dynamodbTable,
    config.issuerFallbacks
  )
}
