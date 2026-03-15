/* eslint-disable no-console -- CLI migration script */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { setTimeout as delay } from 'node:timers/promises'

import {
  BatchWriteItemCommand,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ListTablesCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb'
import dotenv from 'dotenv'

const DEFAULT_TARGET_REGION = 'ap-southeast-2'
const DEFAULT_TARGET_ENDPOINT = 'http://127.0.0.1:8000'
const DEFAULT_TARGET_ACCESS_KEY_ID = 'alternator'
const DEFAULT_TARGET_SECRET_ACCESS_KEY = 'alternator'
const ACTIVE_STATE = 'ACTIVE'
const BATCH_WRITE_SIZE = 25
const DEFAULT_CHUNK_CONCURRENCY = 16
const DEFAULT_PROGRESS_EVERY_CHUNKS = 100

const usage = `Usage:
  pnpm restoreDynamoDump [options]

Restores a previously dumped DynamoDB export into a ScyllaDB Alternator target.

Options:
  --input-dir <path>           Directory containing manifest.json, tables/, and data/
  --env-file <path>            Load environment variables from a dotenv file
  --tables <a,b,c>             Only restore the listed tables
  --exclude-tables <a,b,c>     Skip the listed tables
  --chunk-concurrency <count>  Number of chunk files to restore concurrently per table
  --progress-every-chunks <n>  Log restore progress every N completed chunk files per table
  --target-region <region>     Override target AWS region
  --target-endpoint <url>      Override target Alternator endpoint
  --target-access-key <key>    Override target AWS access key id
  --target-secret-key <key>    Override target AWS secret access key
  --target-session-token <t>   Override target AWS session token
  --reset-target               Delete existing target tables before restoring
  --help                       Show this help
`

function fail(message) {
  console.error(message)
  process.exit(1)
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function parseIntegerOption(optionName, value) {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    fail(`Invalid numeric value for ${optionName}: ${value}`)
  }

  return parsed
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Env file not found: ${filePath}`)
  }

  const result = dotenv.config({ path: filePath, override: false })
  if (result.error) {
    fail(`Failed to load env file ${filePath}: ${result.error.message}`)
  }
}

function parseArgs(argv) {
  const options = {
    inputDir: undefined,
    envFile: undefined,
    includeTables: undefined,
    excludeTables: [],
    chunkConcurrency: DEFAULT_CHUNK_CONCURRENCY,
    progressEveryChunks: DEFAULT_PROGRESS_EVERY_CHUNKS,
    targetRegion: undefined,
    targetEndpoint: undefined,
    targetAccessKeyId: undefined,
    targetSecretAccessKey: undefined,
    targetSessionToken: undefined,
    resetTarget: false,
  }

  const readOptionValue = (optionName, index) => {
    const value = argv[index]
    if (value == null || value.startsWith('--')) {
      fail(`Missing value for ${optionName}\n\n${usage}`)
    }
    return value
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    switch (arg) {
      case '--input-dir':
        index += 1
        options.inputDir = readOptionValue('--input-dir', index)
        break
      case '--env-file':
        index += 1
        options.envFile = readOptionValue('--env-file', index)
        break
      case '--tables':
        index += 1
        options.includeTables = parseList(readOptionValue('--tables', index))
        break
      case '--exclude-tables':
        index += 1
        options.excludeTables = parseList(readOptionValue('--exclude-tables', index))
        break
      case '--chunk-concurrency':
        index += 1
        options.chunkConcurrency = parseIntegerOption(
          '--chunk-concurrency',
          readOptionValue('--chunk-concurrency', index)
        )
        break
      case '--progress-every-chunks':
        index += 1
        options.progressEveryChunks = parseIntegerOption(
          '--progress-every-chunks',
          readOptionValue('--progress-every-chunks', index)
        )
        break
      case '--target-region':
        index += 1
        options.targetRegion = readOptionValue('--target-region', index)
        break
      case '--target-endpoint':
        index += 1
        options.targetEndpoint = readOptionValue('--target-endpoint', index)
        break
      case '--target-access-key':
        index += 1
        options.targetAccessKeyId = readOptionValue('--target-access-key', index)
        break
      case '--target-secret-key':
        index += 1
        options.targetSecretAccessKey = readOptionValue('--target-secret-key', index)
        break
      case '--target-session-token':
        index += 1
        options.targetSessionToken = readOptionValue('--target-session-token', index)
        break
      case '--reset-target':
        options.resetTarget = true
        break
      case '--help':
      case '-h':
        console.log(usage)
        process.exit(0)
        break
      default:
        fail(`Unknown option: ${arg}\n\n${usage}`)
    }
  }

  if (!options.inputDir) {
    fail(`Missing required option --input-dir\n\n${usage}`)
  }

  return options
}

function buildCredentials(accessKeyId, secretAccessKey, sessionToken) {
  if (accessKeyId == null || accessKeyId.length === 0) {
    return undefined
  }

  if (secretAccessKey == null || secretAccessKey.length === 0) {
    fail('Missing secret access key for provided access key id')
  }

  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  }
}

function createClient({ region, endpoint, credentials }) {
  return new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
    ...(credentials ? { credentials } : {}),
  })
}

async function listAllTables(client) {
  const names = []
  let lastEvaluatedTableName

  do {
    const response = await client.send(
      new ListTablesCommand({
        ExclusiveStartTableName: lastEvaluatedTableName,
      })
    )

    names.push(...(response.TableNames ?? []))
    lastEvaluatedTableName = response.LastEvaluatedTableName
  } while (lastEvaluatedTableName != null)

  return names
}

function buildCreateTableRequest(table) {
  return {
    TableName: table.TableName,
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: table.AttributeDefinitions,
    KeySchema: table.KeySchema,
    ...(table.LocalSecondaryIndexes && table.LocalSecondaryIndexes.length > 0
      ? {
          LocalSecondaryIndexes: table.LocalSecondaryIndexes.map((index) => ({
            IndexName: index.IndexName,
            KeySchema: index.KeySchema,
            Projection: index.Projection,
          })),
        }
      : {}),
    ...(table.GlobalSecondaryIndexes && table.GlobalSecondaryIndexes.length > 0
      ? {
          GlobalSecondaryIndexes: table.GlobalSecondaryIndexes.map((index) => ({
            IndexName: index.IndexName,
            KeySchema: index.KeySchema,
            Projection: index.Projection,
          })),
        }
      : {}),
  }
}

async function describeTable(client, tableName) {
  const response = await client.send(
    new DescribeTableCommand({
      TableName: tableName,
    })
  )

  if (response.Table == null) {
    fail(`Failed to describe table: ${tableName}`)
  }

  return response.Table
}

async function waitForActiveTable(client, tableName) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const table = await describeTable(client, tableName)
    const gsiStatuses = (table.GlobalSecondaryIndexes ?? []).map((index) => index.IndexStatus)
    const isActive = table.TableStatus === ACTIVE_STATE
    const allIndexesActive = gsiStatuses.every((status) => status === ACTIVE_STATE || status == null)

    if (isActive && allIndexesActive) {
      return
    }

    await delay(2000)
  }

  fail(`Timed out waiting for target table ${tableName} to become ACTIVE`)
}

async function waitForDeletedTable(client, tableName) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      await describeTable(client, tableName)
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        return
      }

      throw error
    }

    await delay(2000)
  }

  fail(`Timed out waiting for target table ${tableName} to be deleted`)
}

async function deleteTableIfExists(client, tableName) {
  try {
    await describeTable(client, tableName)
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      return false
    }

    throw error
  }

  console.log(`Deleting existing target table ${tableName}`)
  await client.send(
    new DeleteTableCommand({
      TableName: tableName,
    })
  )
  await waitForDeletedTable(client, tableName)
  return true
}

async function ensureTargetTable(client, schema, resetTarget) {
  const tableName = schema.table.TableName

  if (resetTarget) {
    await deleteTableIfExists(client, tableName)
  } else {
    try {
      const existing = await describeTable(client, tableName)
      console.log(`Table ${tableName} already exists on target (${existing.TableStatus})`)
      return
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error
      }
    }
  }

  console.log(`Creating target table ${tableName}`)
  await client.send(new CreateTableCommand(buildCreateTableRequest(schema.table)))
  await waitForActiveTable(client, tableName)

  const ttlAttribute = schema.ttl?.AttributeName
  const ttlStatus = schema.ttl?.TimeToLiveStatus

  if (ttlAttribute && (ttlStatus === 'ENABLED' || ttlStatus === 'ENABLING')) {
    try {
      await client.send(
        new UpdateTimeToLiveCommand({
          TableName: tableName,
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: ttlAttribute,
          },
        })
      )
      console.log(`Enabled TTL for ${tableName} on attribute ${ttlAttribute}`)
    } catch (error) {
      console.warn(`Skipping TTL enable for ${tableName}: ${error.message}`)
    }
  }
}

async function batchWriteAll(client, tableName, writeRequests) {
  let pendingRequests = [...writeRequests]
  let attempt = 0

  while (pendingRequests.length > 0) {
    const response = await client.send(
      new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: pendingRequests.slice(0, BATCH_WRITE_SIZE),
        },
      })
    )

    const unprocessed = response.UnprocessedItems?.[tableName] ?? []
    pendingRequests = unprocessed.concat(pendingRequests.slice(BATCH_WRITE_SIZE))

    if (unprocessed.length > 0) {
      attempt += 1
      await delay(Math.min(1000 * 2 ** attempt, 10000))
    } else {
      attempt = 0
    }
  }
}

async function restoreChunkFile(client, tableName, chunkPath) {
  const input = fs.createReadStream(chunkPath, 'utf8')
  const rl = readline.createInterface({
    input,
    crlfDelay: Infinity,
  })

  let batch = []
  let itemCount = 0

  for await (const line of rl) {
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }

    batch.push({
      PutRequest: {
        Item: JSON.parse(trimmed),
      },
    })
    itemCount += 1

    if (batch.length === BATCH_WRITE_SIZE) {
      await batchWriteAll(client, tableName, batch)
      batch = []
    }
  }

  if (batch.length > 0) {
    await batchWriteAll(client, tableName, batch)
  }

  return itemCount
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0

  async function runWorker() {
    while (true) {
      const currentIndex = nextIndex
      nextIndex += 1

      if (currentIndex >= items.length) {
        return
      }

      await worker(items[currentIndex], currentIndex)
    }
  }

  const workerCount = Math.min(items.length, concurrency)
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()))
}

function selectManifestTables(manifestTables, includeTables, excludeTables) {
  const excludeSet = new Set(excludeTables)
  const manifestTableNames = manifestTables.map((table) => table.tableName)
  const selectedNames = includeTables ?? manifestTableNames
  const missingIncludedTables = (includeTables ?? []).filter(
    (tableName) => !manifestTableNames.includes(tableName)
  )

  if (missingIncludedTables.length > 0) {
    fail(`Dump tables not found: ${missingIncludedTables.join(', ')}`)
  }

  return manifestTables.filter(
    (table) => selectedNames.includes(table.tableName) && !excludeSet.has(table.tableName)
  )
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.envFile) {
    loadEnvFile(options.envFile)
  }

  const targetRegion = options.targetRegion ?? process.env.TARGET_AWS_REGION ?? process.env.AWS_REGION ?? DEFAULT_TARGET_REGION
  const targetEndpoint =
    options.targetEndpoint ??
    process.env.TARGET_DYNAMODB_ENDPOINT ??
    process.env.DYNAMODB_ENDPOINT ??
    DEFAULT_TARGET_ENDPOINT
  const targetAccessKeyId =
    options.targetAccessKeyId ??
    process.env.TARGET_AWS_ACCESS_KEY_ID ??
    process.env.AWS_ACCESS_KEY_ID ??
    DEFAULT_TARGET_ACCESS_KEY_ID
  const targetSecretAccessKey =
    options.targetSecretAccessKey ??
    process.env.TARGET_AWS_SECRET_ACCESS_KEY ??
    process.env.AWS_SECRET_ACCESS_KEY ??
    DEFAULT_TARGET_SECRET_ACCESS_KEY
  const targetSessionToken =
    options.targetSessionToken ?? process.env.TARGET_AWS_SESSION_TOKEN ?? process.env.AWS_SESSION_TOKEN

  const inputDir = path.resolve(options.inputDir)
  const manifestPath = path.join(inputDir, 'manifest.json')

  if (!fs.existsSync(manifestPath)) {
    fail(`Manifest not found: ${manifestPath}`)
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const manifestTables = selectManifestTables(manifest.tables ?? [], options.includeTables, options.excludeTables)

  if (manifestTables.length === 0) {
    fail('No tables selected for restore')
  }

  const targetCredentials = buildCredentials(
    targetAccessKeyId,
    targetSecretAccessKey,
    targetSessionToken
  )

  const client = createClient({
    region: targetRegion,
    endpoint: targetEndpoint,
    credentials: targetCredentials,
  })

  if (options.resetTarget) {
    const existingTables = await listAllTables(client)
    console.log(`Target currently has ${existingTables.length} table(s)`)
  }

  console.log(`Restoring ${manifestTables.length} table(s) from ${inputDir}`)
  console.log(
    `Chunk concurrency per table: ${options.chunkConcurrency}, progress every ${options.progressEveryChunks} completed chunk(s)`
  )

  for (const tableEntry of manifestTables) {
    console.log(`\n=== ${tableEntry.tableName} ===`)

    const schemaPath = path.join(inputDir, tableEntry.schemaFile)
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))

    await ensureTargetTable(client, schema, options.resetTarget)

    let restoredItems = 0
    let completedChunks = 0
    const totalChunks = tableEntry.chunkFiles.length

    await runWithConcurrency(tableEntry.chunkFiles, options.chunkConcurrency, async (chunkFile) => {
      const chunkPath = path.join(inputDir, tableEntry.dataDir, chunkFile)
      const count = await restoreChunkFile(client, tableEntry.tableName, chunkPath)
      restoredItems += count
      completedChunks += 1

      const shouldLogProgress =
        completedChunks <= 3 ||
        completedChunks === totalChunks ||
        completedChunks % options.progressEveryChunks === 0

      if (shouldLogProgress) {
        console.log(
          `[${tableEntry.tableName}] completed ${completedChunks}/${totalChunks} chunk(s), restored ${restoredItems} item(s) so far`
        )
      }
    })

    console.log(`Restored ${restoredItems} total items for ${tableEntry.tableName}`)
  }

  console.log('\nRestore completed')
}

main().catch((error) => {
  console.error('Restore failed')
  console.error(error)
  process.exit(1)
})