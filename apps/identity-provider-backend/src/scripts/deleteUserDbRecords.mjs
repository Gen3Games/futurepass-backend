/* eslint-disable no-console -- CLI script */

import fs from 'node:fs'

const DEFAULT_TABLE_NAME = 'futureverse-user'
const DEFAULT_REGION = 'us-west-2'

const usage = `Usage:
  pnpm deleteUserDbRecords [options] <account> [account...]

Accounts:
  - Ethereum EOA, e.g. 0x68D99e952cF3D4faAa6411C1953979F54552A8F7
  - Encoded sub, e.g. eoa:0x68D99e952cF3D4faAa6411C1953979F54552A8F7
  - Encoded sub, e.g. email:user@example.com
  - Encoded sub, e.g. idp:google:some-subject

Options:
  --dry-run           Show matching keys without deleting them
  --env-file <path>   Load environment variables from a dotenv file
  --table <name>      Override DynamoDB table name
  --endpoint <url>    Override DynamoDB endpoint
  --region <name>     Override AWS region
  --access-key <key>  Override AWS access key id
  --secret-key <key>  Override AWS secret access key
  --help              Show this help

Environment defaults:
  DYNAMODB_USER_TABLE / DYNAMODB_ENDPOINT / AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY

Examples:
  pnpm deleteUserDbRecords --dry-run 0x68D99e952cF3D4faAa6411C1953979F54552A8F7
  pnpm deleteUserDbRecords --env-file /opt/futurepass/shared/idp-backend.mainnet.env eoa:0x68D99e952cF3D4faAa6411C1953979F54552A8F7
  pnpm deleteUserDbRecords email:user@example.com idp:google:abc123
`

function fail(message) {
  console.error(message)
  process.exit(1)
}

function isEthereumAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

function loadEnvFile(path) {
  const content = fs.readFileSync(path, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    envFile: undefined,
    tableName: undefined,
    endpoint: undefined,
    region: undefined,
    accessKeyId: undefined,
    secretAccessKey: undefined,
    accounts: [],
  }

  const readOptionValue = (optionName, nextIndex) => {
    const value = argv[nextIndex]
    if (value == null || value.startsWith('--')) {
      fail(`Missing value for ${optionName}\n\n${usage}`)
    }
    return value
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    switch (arg) {
      case '--dry-run':
        options.dryRun = true
        break
      case '--env-file':
        index += 1
        options.envFile = readOptionValue('--env-file', index)
        break
      case '--table':
        index += 1
        options.tableName = readOptionValue('--table', index)
        break
      case '--endpoint':
        index += 1
        options.endpoint = readOptionValue('--endpoint', index)
        break
      case '--region':
        index += 1
        options.region = readOptionValue('--region', index)
        break
      case '--access-key':
        index += 1
        options.accessKeyId = readOptionValue('--access-key', index)
        break
      case '--secret-key':
        index += 1
        options.secretAccessKey = readOptionValue('--secret-key', index)
        break
      case '--help':
      case '-h':
        console.log(usage)
        process.exit(0)
        break
      default:
        if (arg.startsWith('--')) {
          fail(`Unknown option: ${arg}\n\n${usage}`)
        }
        options.accounts.push(arg)
    }
  }

  return options
}

function normalizeSub(account) {
  if (isEthereumAddress(account)) {
    return `eoa:${account}`
  }

  if (account.startsWith('eoa:')) {
    const eoa = account.slice(4)
    if (!isEthereumAddress(eoa)) {
      fail(`Invalid EOA sub: ${account}`)
    }
    return `eoa:${eoa}`
  }

  if (account.startsWith('email:')) {
    const email = account.slice(6)
    if (email.length === 0) {
      fail(`Invalid email sub: ${account}`)
    }
    return account
  }

  if (account.startsWith('idp:')) {
    const parts = account.split(':')
    if (parts.length < 3 || parts[1].length === 0 || parts.slice(2).join(':').length === 0) {
      fail(`Invalid idp sub: ${account}`)
    }
    return account
  }

  if (account.startsWith('xrpl:')) {
    const parts = account.split(':')
    if (parts.length < 4 || parts[1].length === 0 || parts[3].length === 0) {
      fail(`Invalid xrpl sub: ${account}`)
    }
    return account
  }

  fail(`Unsupported account identifier: ${account}`)
}

function toStorageKeys(account) {
  const normalizedSub = normalizeSub(account)
  const suffix = normalizedSub.toLowerCase()

  return {
    account,
    normalizedSub,
    userKey: `USER:${suffix}`,
    profileKey: `USER_PROFILE:${suffix}`,
  }
}

async function batchGetExistingKeys(client, tableName, keys) {
  const existing = new Set()

  for (let index = 0; index < keys.length; index += 100) {
    const chunk = keys.slice(index, index + 100).map((id) => ({ id }))
    const response = await client
      .batchGet({
        RequestItems: {
          [tableName]: {
            Keys: chunk,
          },
        },
      })
      .promise()

    for (const item of response.Responses?.[tableName] ?? []) {
      existing.add(item.id)
    }
  }

  return existing
}

async function batchDeleteKeys(client, tableName, keys) {
  for (let index = 0; index < keys.length; index += 25) {
    const chunk = keys.slice(index, index + 25)
    await client
      .batchWrite({
        RequestItems: {
          [tableName]: chunk.map((id) => ({
            DeleteRequest: {
              Key: { id },
            },
          })),
        },
      })
      .promise()
  }
}

const options = parseArgs(process.argv.slice(2))

if (options.envFile != null) {
  try {
    loadEnvFile(options.envFile)
  } catch (error) {
    fail(`Failed to load env file: ${options.envFile}\n${error.message}`)
  }
}

if (options.accounts.length === 0) {
  fail(`No accounts provided\n\n${usage}`)
}

const tableName = options.tableName ?? process.env.DYNAMODB_USER_TABLE ?? DEFAULT_TABLE_NAME
const endpoint = options.endpoint ?? process.env.DYNAMODB_ENDPOINT
const region = options.region ?? process.env.AWS_REGION ?? DEFAULT_REGION
const accessKeyId = options.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = options.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY

if (endpoint == null || endpoint.length === 0) {
  fail('Missing DynamoDB endpoint. Provide --endpoint or set DYNAMODB_ENDPOINT.')
}

if (accessKeyId == null || accessKeyId.length === 0) {
  fail('Missing AWS access key id. Provide --access-key or set AWS_ACCESS_KEY_ID.')
}

if (secretAccessKey == null || secretAccessKey.length === 0) {
  fail('Missing AWS secret access key. Provide --secret-key or set AWS_SECRET_ACCESS_KEY.')
}

const accountEntries = options.accounts.map(toStorageKeys)
const requestedKeys = accountEntries.flatMap((entry) => [entry.userKey, entry.profileKey])

const { default: AWS } = await import('aws-sdk')

const client = new AWS.DynamoDB.DocumentClient({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
})

const existingKeys = await batchGetExistingKeys(client, tableName, requestedKeys)
const keysToDelete = requestedKeys.filter((key) => existingKeys.has(key))

console.log(
  JSON.stringify(
    {
      tableName,
      endpoint,
      dryRun: options.dryRun,
      accounts: accountEntries.map((entry) => ({
        account: entry.account,
        normalizedSub: entry.normalizedSub,
        userKey: entry.userKey,
        userKeyExists: existingKeys.has(entry.userKey),
        profileKey: entry.profileKey,
        profileKeyExists: existingKeys.has(entry.profileKey),
      })),
    },
    null,
    2
  )
)

if (options.dryRun) {
  process.exit(0)
}

if (keysToDelete.length === 0) {
  console.log('No matching keys found. Nothing deleted.')
  process.exit(0)
}

await batchDeleteKeys(client, tableName, keysToDelete)

const remainingKeys = await batchGetExistingKeys(client, tableName, keysToDelete)
if (remainingKeys.size > 0) {
  fail(`Deletion incomplete. Remaining keys: ${Array.from(remainingKeys).join(', ')}`)
}

console.log(`Deleted ${keysToDelete.length} record(s).`)

/* eslint-enable no-console -- CLI script */