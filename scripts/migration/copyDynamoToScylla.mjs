/* eslint-disable no-console -- CLI migration script */

import fs from 'node:fs'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

import {
  CreateTableCommand,
  DescribeTableCommand,
  DescribeTimeToLiveCommand,
  DynamoDBClient,
  ListTablesCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb'
import { BatchWriteCommand, DynamoDBDocument, ScanCommand } from '@aws-sdk/lib-dynamodb'
import dotenv from 'dotenv'

const DEFAULT_SOURCE_REGION = 'us-west-2'
const DEFAULT_TARGET_REGION = 'ap-southeast-2'
const DEFAULT_TARGET_ENDPOINT = 'http://127.0.0.1:8000'
const DEFAULT_TARGET_ACCESS_KEY_ID = 'alternator'
const DEFAULT_TARGET_SECRET_ACCESS_KEY = 'alternator'
const ACTIVE_STATE = 'ACTIVE'
const BATCH_WRITE_SIZE = 25

const usage = `Usage:
  pnpm copyDynamoToScylla [options]

Copies DynamoDB tables and items from an AWS source account into a ScyllaDB
Alternator target using the DynamoDB-compatible API.

Options:
  --env-file <path>            Load environment variables from a dotenv file
  --tables <a,b,c>             Only migrate the listed tables
  --exclude-tables <a,b,c>     Skip the listed tables
  --schema-only                Create target tables only, do not copy data
  --dry-run                    Print the migration plan without creating/copying
  --source-region <region>     Override source AWS region
  --source-endpoint <url>      Override source DynamoDB endpoint
  --source-access-key <key>    Override source AWS access key id
  --source-secret-key <key>    Override source AWS secret access key
  --source-session-token <t>   Override source AWS session token
  --target-region <region>     Override target AWS region
  --target-endpoint <url>      Override target Alternator endpoint
  --target-access-key <key>    Override target AWS access key id
  --target-secret-key <key>    Override target AWS secret access key
  --target-session-token <t>   Override target AWS session token
  --help                       Show this help

Environment defaults:
  SOURCE_AWS_REGION / SOURCE_DYNAMODB_ENDPOINT / SOURCE_AWS_ACCESS_KEY_ID /
  SOURCE_AWS_SECRET_ACCESS_KEY / SOURCE_AWS_SESSION_TOKEN

  TARGET_AWS_REGION / TARGET_DYNAMODB_ENDPOINT / TARGET_AWS_ACCESS_KEY_ID /
  TARGET_AWS_SECRET_ACCESS_KEY / TARGET_AWS_SESSION_TOKEN

  AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
  DYNAMODB_ENDPOINT (used as target fallback)

Examples:
  pnpm copyDynamoToScylla --dry-run
  pnpm copyDynamoToScylla --tables futureverse-user,futureverse-oauth
  pnpm copyDynamoToScylla --env-file /opt/futurepass/shared/idp-backend.mainnet.env --source-region us-west-2 --target-endpoint http://127.0.0.1:8000
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

function loadEnvFile(path) {
  if (!fs.existsSync(path)) {
    fail(`Env file not found: ${path}`)
  }

  const result = dotenv.config({ path, override: false })
  if (result.error) {
    fail(`Failed to load env file ${path}: ${result.error.message}`)
  }
}

function parseArgs(argv) {
  const options = {
    envFile: undefined,
    includeTables: undefined,
    excludeTables: [],
    schemaOnly: false,
    dryRun: false,
    sourceRegion: undefined,
    sourceEndpoint: undefined,
    sourceAccessKeyId: undefined,
    sourceSecretAccessKey: undefined,
    sourceSessionToken: undefined,
    targetRegion: undefined,
    targetEndpoint: undefined,
    targetAccessKeyId: undefined,
    targetSecretAccessKey: undefined,
    targetSessionToken: undefined,
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
      case '--schema-only':
        options.schemaOnly = true
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--source-region':
        index += 1
        options.sourceRegion = readOptionValue('--source-region', index)
        break
      case '--source-endpoint':
        index += 1
        options.sourceEndpoint = readOptionValue('--source-endpoint', index)
        break
      case '--source-access-key':
        index += 1
        options.sourceAccessKeyId = readOptionValue('--source-access-key', index)
        break
      case '--source-secret-key':
        index += 1
        options.sourceSecretAccessKey = readOptionValue('--source-secret-key', index)
        break
      case '--source-session-token':
        index += 1
        options.sourceSessionToken = readOptionValue('--source-session-token', index)
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
      case '--help':
      case '-h':
        console.log(usage)
        process.exit(0)
        break
      default:
        fail(`Unknown option: ${arg}\n\n${usage}`)
    }
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

function createLowLevelClient({ region, endpoint, credentials }) {
  return new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
    ...(credentials ? { credentials } : {}),
  })
}

function createDocumentClient(client) {
  return DynamoDBDocument.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
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

function selectTables(tableNames, includeTables, excludeTables) {
  const excludeSet = new Set(excludeTables)
  const selected = includeTables == null ? tableNames : includeTables

  const missingIncludedTables = (includeTables ?? []).filter(
    (tableName) => !tableNames.includes(tableName)
  )

  if (missingIncludedTables.length > 0) {
    fail(`Source tables not found: ${missingIncludedTables.join(', ')}`)
  }

  return selected.filter((tableName) => !excludeSet.has(tableName))
}

async function describeTable(client, tableName) {
  const response = await client.send(
    new DescribeTableCommand({
      TableName: tableName,
    })
  )

  if (response.Table == null) {
    fail(`Failed to describe source table: ${tableName}`)
  }

  return response.Table
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

async function ensureTargetTable(sourceClient, targetClient, sourceTable, dryRun) {
  const tableName = sourceTable.TableName

  try {
    const existing = await describeTable(targetClient, tableName)
    console.log(`Table ${tableName} already exists on target (${existing.TableStatus})`)
    return
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      throw error
    }
  }

  const createRequest = buildCreateTableRequest(sourceTable)

  if (dryRun) {
    console.log(`Would create target table ${tableName}`)
    return
  }

  console.log(`Creating target table ${tableName}`)
  await targetClient.send(new CreateTableCommand(createRequest))
  await waitForActiveTable(targetClient, tableName)

  const ttlResponse = await sourceClient.send(
    new DescribeTimeToLiveCommand({
      TableName: tableName,
    })
  )
  const ttlAttribute = ttlResponse.TimeToLiveDescription?.AttributeName
  const ttlStatus = ttlResponse.TimeToLiveDescription?.TimeToLiveStatus

  if (ttlAttribute && (ttlStatus === 'ENABLED' || ttlStatus === 'ENABLING')) {
    try {
      await targetClient.send(
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

async function batchWriteAll(targetDocClient, tableName, items) {
  let pendingRequests = items.map((item) => ({
    PutRequest: {
      Item: item,
    },
  }))

  let attempt = 0
  while (pendingRequests.length > 0) {
    const response = await targetDocClient.send(
      new BatchWriteCommand({
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

async function copyTableData(sourceDocClient, targetDocClient, tableName, dryRun) {
  let exclusiveStartKey
  let pageCount = 0
  let itemCount = 0

  do {
    const response = await sourceDocClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
      })
    )

    const items = response.Items ?? []
    pageCount += 1
    itemCount += items.length

    if (items.length > 0) {
      if (dryRun) {
        console.log(`Would copy ${items.length} items from ${tableName} (page ${pageCount})`)
      } else {
        for (let index = 0; index < items.length; index += BATCH_WRITE_SIZE) {
          const chunk = items.slice(index, index + BATCH_WRITE_SIZE)
          await batchWriteAll(targetDocClient, tableName, chunk)
        }
      }
    }

    exclusiveStartKey = response.LastEvaluatedKey
  } while (exclusiveStartKey != null)

  console.log(`${dryRun ? 'Planned' : 'Copied'} ${itemCount} items across ${pageCount} scan page(s) for ${tableName}`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.envFile) {
    loadEnvFile(options.envFile)
  }

  const sourceRegion = options.sourceRegion ?? process.env.SOURCE_AWS_REGION ?? process.env.AWS_REGION ?? DEFAULT_SOURCE_REGION
  const sourceEndpoint = options.sourceEndpoint ?? process.env.SOURCE_DYNAMODB_ENDPOINT
  const sourceAccessKeyId = options.sourceAccessKeyId ?? process.env.SOURCE_AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID
  const sourceSecretAccessKey =
    options.sourceSecretAccessKey ?? process.env.SOURCE_AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY
  const sourceSessionToken =
    options.sourceSessionToken ?? process.env.SOURCE_AWS_SESSION_TOKEN ?? process.env.AWS_SESSION_TOKEN

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

  const sourceCredentials = buildCredentials(
    sourceAccessKeyId,
    sourceSecretAccessKey,
    sourceSessionToken
  )
  const targetCredentials = buildCredentials(
    targetAccessKeyId,
    targetSecretAccessKey,
    targetSessionToken
  )

  const sourceClient = createLowLevelClient({
    region: sourceRegion,
    endpoint: sourceEndpoint,
    credentials: sourceCredentials,
  })
  const sourceDocClient = createDocumentClient(sourceClient)

  const targetClient = createLowLevelClient({
    region: targetRegion,
    endpoint: targetEndpoint,
    credentials: targetCredentials,
  })
  const targetDocClient = createDocumentClient(targetClient)

  console.log(`Source region: ${sourceRegion}${sourceEndpoint ? ` (${sourceEndpoint})` : ''}`)
  console.log(`Target region: ${targetRegion} (${targetEndpoint})`)

  const allSourceTables = await listAllTables(sourceClient)
  const tableNames = selectTables(
    allSourceTables,
    options.includeTables,
    options.excludeTables
  )

  if (tableNames.length === 0) {
    fail('No tables selected for migration')
  }

  console.log(`Selected ${tableNames.length} table(s): ${tableNames.join(', ')}`)

  for (const tableName of tableNames) {
    console.log(`\n=== ${tableName} ===`)
    const sourceTable = await describeTable(sourceClient, tableName)

    await ensureTargetTable(sourceClient, targetClient, sourceTable, options.dryRun)

    if (!options.schemaOnly) {
      await copyTableData(sourceDocClient, targetDocClient, tableName, options.dryRun)
    }
  }

  console.log(`\n${options.dryRun ? 'Dry run completed' : 'Migration completed'}`)
}

main().catch((error) => {
  console.error('Migration failed')
  console.error(error)
  process.exit(1)
})