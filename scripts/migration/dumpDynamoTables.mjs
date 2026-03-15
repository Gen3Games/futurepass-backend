/* eslint-disable no-console -- CLI migration script */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

import {
  DescribeTableCommand,
  DescribeTimeToLiveCommand,
  DynamoDBClient,
  ListTablesCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb'
import dotenv from 'dotenv'

const DEFAULT_SOURCE_REGION = 'us-west-2'
const CHUNK_FILE_PATTERN = /^page-(\d{6})\.ndjson$/
const PROGRESS_FILE_NAME = '.dump-progress.json'
const RUN_LOG_FILE_NAME = 'dump.log'

const usage = `Usage:
  pnpm dumpDynamoTables [options]

Exports DynamoDB table schemas and raw items into a local dump directory.

Options:
  --output-dir <path>          Directory where dump files will be written
  --append                     Reuse an existing dump directory, resume interrupted tables, and skip completed tables
  --restart-tables <a,b,c>     In append mode, discard the listed tables and dump them again from page 1
  --env-file <path>            Load environment variables from a dotenv file
  --tables <a,b,c>             Only dump the listed tables
  --exclude-tables <a,b,c>     Skip the listed tables
  --scan-limit <count>         Limit items per scan page to reduce throttling
  --page-delay-ms <ms>         Delay between scan pages to reduce throttling
  --progress-every-pages <n>   Log progress every N scan pages per table
  --source-region <region>     Override source AWS region
  --source-endpoint <url>      Override source DynamoDB endpoint
  --source-access-key <key>    Override source AWS access key id
  --source-secret-key <key>    Override source AWS secret access key
  --source-session-token <t>   Override source AWS session token
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
    outputDir: undefined,
    append: false,
    restartTables: [],
    envFile: undefined,
    includeTables: undefined,
    excludeTables: [],
    scanLimit: undefined,
    pageDelayMs: 0,
    progressEveryPages: 100,
    sourceRegion: undefined,
    sourceEndpoint: undefined,
    sourceAccessKeyId: undefined,
    sourceSecretAccessKey: undefined,
    sourceSessionToken: undefined,
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
      case '--output-dir':
        index += 1
        options.outputDir = readOptionValue('--output-dir', index)
        break
      case '--append':
        options.append = true
        break
      case '--restart-tables':
        index += 1
        options.restartTables = parseList(readOptionValue('--restart-tables', index))
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
      case '--scan-limit':
        index += 1
        options.scanLimit = parseIntegerOption('--scan-limit', readOptionValue('--scan-limit', index))
        break
      case '--page-delay-ms':
        index += 1
        options.pageDelayMs = parseIntegerOption('--page-delay-ms', readOptionValue('--page-delay-ms', index))
        break
      case '--progress-every-pages':
        index += 1
        options.progressEveryPages = parseIntegerOption(
          '--progress-every-pages',
          readOptionValue('--progress-every-pages', index)
        )
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
      case '--help':
      case '-h':
        console.log(usage)
        process.exit(0)
        break
      default:
        fail(`Unknown option: ${arg}\n\n${usage}`)
    }
  }

  if (!options.outputDir) {
    fail(`Missing required option --output-dir\n\n${usage}`)
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

function isRetryableError(error) {
  return [
    'ProvisionedThroughputExceededException',
    'RequestLimitExceeded',
    'ThrottlingException',
    'InternalServerError',
  ].includes(error?.name)
}

function createLogger(logPath) {
  return {
    info(message) {
      console.log(message)
      fs.appendFileSync(logPath, `${new Date().toISOString()} INFO ${message}\n`, 'utf8')
    },
    warn(message) {
      console.warn(message)
      fs.appendFileSync(logPath, `${new Date().toISOString()} WARN ${message}\n`, 'utf8')
    },
    error(message) {
      console.error(message)
      fs.appendFileSync(logPath, `${new Date().toISOString()} ERROR ${message}\n`, 'utf8')
    },
  }
}

async function sendWithRetry(client, command, description, logger) {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      return await client.send(command)
    } catch (error) {
      if (!isRetryableError(error) || attempt === 10) {
        throw error
      }

      const waitMs = Math.min(500 * 2 ** (attempt - 1), 10000)
      logger.warn(`${description} throttled (${error.name}), retrying in ${waitMs}ms`)
      await delay(waitMs)
    }
  }

  fail(`Exhausted retries for ${description}`)
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
    const response = await sendWithRetry(
      client,
      new ListTablesCommand({
        ExclusiveStartTableName: lastEvaluatedTableName,
      }),
      'ListTables',
      { warn: console.warn }
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

async function describeTable(client, tableName, logger) {
  const response = await sendWithRetry(
    client,
    new DescribeTableCommand({
      TableName: tableName,
    }),
    `DescribeTable ${tableName}`,
    logger
  )

  if (response.Table == null) {
    fail(`Failed to describe source table: ${tableName}`)
  }

  return response.Table
}

async function describeTtl(client, tableName, logger) {
  const response = await sendWithRetry(
    client,
    new DescribeTimeToLiveCommand({
      TableName: tableName,
    }),
    `DescribeTimeToLive ${tableName}`,
    logger
  )

  return response.TimeToLiveDescription ?? null
}

function ensureCleanDirectory(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return undefined
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function removeFileIfExists(filePath) {
  fs.rmSync(filePath, { force: true })
}

function chunkFileName(pageNumber) {
  return `page-${String(pageNumber).padStart(6, '0')}.ndjson`
}

function listChunkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return []
  }

  return fs
    .readdirSync(dirPath)
    .filter((fileName) => CHUNK_FILE_PATTERN.test(fileName))
    .sort((left, right) => left.localeCompare(right))
}

function buildChunkFiles(pageCount) {
  return Array.from({ length: pageCount }, (_, index) => chunkFileName(index + 1))
}

function getProgressPath(tableDataDir) {
  return path.join(tableDataDir, PROGRESS_FILE_NAME)
}

function writeProgressFile(progressPath, progress) {
  writeJson(progressPath, progress)
}

function normalizeProgress(progress, tableName) {
  if (progress == null) {
    return undefined
  }

  if (progress.tableName !== tableName) {
    fail(`Progress file table mismatch for ${tableName}: found ${progress.tableName}`)
  }

  if (!Number.isInteger(progress.pageCount) || progress.pageCount < 0) {
    fail(`Invalid pageCount in progress file for ${tableName}`)
  }

  if (!Number.isInteger(progress.itemCount) || progress.itemCount < 0) {
    fail(`Invalid itemCount in progress file for ${tableName}`)
  }

  return progress
}

function validateChunkSequence(fileNames) {
  for (const [index, fileName] of fileNames.entries()) {
    const expected = chunkFileName(index + 1)
    if (fileName !== expected) {
      return {
        valid: false,
        reason: `expected ${expected} but found ${fileName}`,
      }
    }
  }

  return { valid: true }
}

function validateCompletedTableOnDisk(tableDataDir, manifestEntry) {
  const chunkFiles = listChunkFiles(tableDataDir)
  const expectedPageCount = manifestEntry.pageCount ?? manifestEntry.chunkFiles?.length ?? 0

  if (chunkFiles.length !== expectedPageCount) {
    return {
      valid: false,
      reason: `expected ${expectedPageCount} chunk file(s) but found ${chunkFiles.length}`,
    }
  }

  return validateChunkSequence(chunkFiles)
}

function validateProgressOnDisk(tableDataDir, progress) {
  const chunkFiles = listChunkFiles(tableDataDir)

  if (chunkFiles.length !== progress.pageCount) {
    return {
      valid: false,
      reason: `progress says ${progress.pageCount} page(s) but disk has ${chunkFiles.length}`,
    }
  }

  return validateChunkSequence(chunkFiles)
}

function resolveTableAction({
  tableName,
  tableDataDir,
  existingManifestEntry,
  append,
  restartTables,
}) {
  const progressPath = getProgressPath(tableDataDir)
  const restartRequested = restartTables.includes(tableName)

  if (!append) {
    ensureCleanDirectory(tableDataDir)
    removeFileIfExists(progressPath)
    return {
      mode: 'fresh',
      progressPath,
      resumeState: undefined,
    }
  }

  if (restartRequested) {
    ensureCleanDirectory(tableDataDir)
    removeFileIfExists(progressPath)
    return {
      mode: 'restart',
      progressPath,
      resumeState: undefined,
    }
  }

  const progress = normalizeProgress(readJsonIfExists(progressPath), tableName)
  if (progress) {
    const validation = validateProgressOnDisk(tableDataDir, progress)
    if (!validation.valid) {
      fail(
        `Cannot resume ${tableName}: ${validation.reason}. Use --restart-tables ${tableName} to restart that table.`
      )
    }

    return {
      mode: 'resume',
      progressPath,
      resumeState: progress,
    }
  }

  if (existingManifestEntry) {
    const validation = validateCompletedTableOnDisk(tableDataDir, existingManifestEntry)
    if (validation.valid) {
      return {
        mode: 'skip',
        progressPath,
        resumeState: undefined,
      }
    }

    fail(
      `Table ${tableName} has inconsistent completed metadata: ${validation.reason}. Use --restart-tables ${tableName} to rebuild it from page 1.`
    )
  }

  const chunkFiles = listChunkFiles(tableDataDir)
  if (chunkFiles.length > 0) {
    fail(
      `Table ${tableName} has ${chunkFiles.length} existing chunk file(s) but no resumable checkpoint. Use --restart-tables ${tableName} to rebuild it from page 1.`
    )
  }

  fs.mkdirSync(tableDataDir, { recursive: true })
  return {
    mode: 'fresh',
    progressPath,
    resumeState: undefined,
  }
}

function createManifest({ sourceRegion, sourceEndpoint, scanLimit, pageDelayMs, existingManifest }) {
  return {
    generatedAt: existingManifest?.generatedAt ?? new Date().toISOString(),
    sourceRegion,
    sourceEndpoint: sourceEndpoint ?? null,
    scanLimit: scanLimit ?? null,
    pageDelayMs,
    completedAt: undefined,
    tables: existingManifest?.tables ?? [],
  }
}

function upsertManifestTable(manifest, tableEntry) {
  const remainingTables = manifest.tables.filter((existing) => existing.tableName !== tableEntry.tableName)
  manifest.tables = [...remainingTables, tableEntry].sort((left, right) =>
    left.tableName.localeCompare(right.tableName)
  )
}

async function dumpTableData(
  client,
  tableName,
  outputDir,
  progressPath,
  scanLimit,
  pageDelayMs,
  progressEveryPages,
  expectedItemCount,
  logger,
  resumeState
) {
  fs.mkdirSync(outputDir, { recursive: true })

  let exclusiveStartKey = resumeState?.lastEvaluatedKey
  let pageCount = resumeState?.pageCount ?? 0
  let itemCount = resumeState?.itemCount ?? 0
  const startedAt = resumeState?.startedAt ?? new Date().toISOString()

  if (resumeState) {
    logger.info(
      `[${tableName}] resuming from page ${pageCount + 1} after ${itemCount} item(s)`
    )
  }

  while (true) {
    const response = await sendWithRetry(
      client,
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
        ...(scanLimit ? { Limit: scanLimit } : {}),
      }),
      `Scan ${tableName} page ${pageCount + 1}`,
      logger
    )

    const items = response.Items ?? []
    pageCount += 1
    itemCount += items.length

    const chunkName = chunkFileName(pageCount)
    const chunkPath = path.join(outputDir, chunkName)
    const lines = items.map((item) => JSON.stringify(item)).join('\n')
    fs.writeFileSync(chunkPath, lines.length > 0 ? `${lines}\n` : '', 'utf8')

    exclusiveStartKey = response.LastEvaluatedKey
    writeProgressFile(progressPath, {
      tableName,
      startedAt,
      updatedAt: new Date().toISOString(),
      pageCount,
      itemCount,
      lastEvaluatedKey: exclusiveStartKey ?? null,
    })

    const shouldLogProgress =
      pageCount <= 3 ||
      exclusiveStartKey == null ||
      pageCount % progressEveryPages === 0

    if (shouldLogProgress) {
      const progressSuffix =
        expectedItemCount != null && expectedItemCount > 0
          ? `, ${((itemCount / expectedItemCount) * 100).toFixed(2)}% of expected ${expectedItemCount}`
          : ''
      logger.info(
        `[${tableName}] page ${pageCount}, dumped ${itemCount} item(s) so far${progressSuffix}`
      )
    }

    if (exclusiveStartKey == null) {
      break
    }

    if (pageDelayMs > 0) {
      await delay(pageDelayMs)
    }
  }

  return {
    itemCount,
    pageCount,
  }
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

  const sourceCredentials = buildCredentials(
    sourceAccessKeyId,
    sourceSecretAccessKey,
    sourceSessionToken
  )

  const client = createClient({
    region: sourceRegion,
    endpoint: sourceEndpoint,
    credentials: sourceCredentials,
  })

  const outputDir = path.resolve(options.outputDir)
  const manifestPath = path.join(outputDir, 'manifest.json')
  const completionPath = path.join(outputDir, 'dump-complete.json')
  const runLogPath = path.join(outputDir, RUN_LOG_FILE_NAME)
  const schemaDir = path.join(outputDir, 'tables')
  const dataDir = path.join(outputDir, 'data')

  fs.mkdirSync(outputDir, { recursive: true })
  fs.mkdirSync(schemaDir, { recursive: true })
  fs.mkdirSync(dataDir, { recursive: true })
  const logger = createLogger(runLogPath)

  removeFileIfExists(completionPath)
  logger.info('Starting dump run')

  const allTables = await listAllTables(client)
  const tableNames = selectTables(allTables, options.includeTables, options.excludeTables)

  if (tableNames.length === 0) {
    fail('No tables selected for dump')
  }

  const existingManifest = options.append ? readJsonIfExists(manifestPath) : undefined
  const manifest = createManifest({
    sourceRegion,
    sourceEndpoint,
    scanLimit: options.scanLimit,
    pageDelayMs: options.pageDelayMs,
    existingManifest,
  })
  manifest.completedAt = undefined

  logger.info(`${options.append ? 'Appending' : 'Dumping'} ${tableNames.length} table(s) into ${outputDir}`)
  logger.info(`Selected tables: ${tableNames.join(', ')}`)
  if (options.restartTables.length > 0) {
    logger.info(`Restarting selected tables from page 1: ${options.restartTables.join(', ')}`)
  }

  for (const [index, tableName] of tableNames.entries()) {
    logger.info(`\n=== [${index + 1}/${tableNames.length}] ${tableName} ===`)

    const table = await describeTable(client, tableName, logger)
    const ttl = await describeTtl(client, tableName, logger)
    const tableSchemaPath = path.join(schemaDir, `${tableName}.schema.json`)
    const tableDataDir = path.join(dataDir, tableName)
    const existingManifestEntry = manifest.tables.find((entry) => entry.tableName === tableName)
    const tableAction = resolveTableAction({
      tableName,
      tableDataDir,
      existingManifestEntry,
      append: options.append,
      restartTables: options.restartTables,
    })

    logger.info(
      `[${tableName}] source metadata: itemCount=${table.ItemCount ?? 0}, keySchema=${table.KeySchema.map((key) => `${key.AttributeName}:${key.KeyType}`).join(',')}`
    )

    writeJson(tableSchemaPath, {
      table,
      ttl,
    })
    logger.info(`[${tableName}] wrote schema to ${tableSchemaPath}`)

    if (tableAction.mode === 'skip') {
      logger.info(`[${tableName}] already complete on disk; skipping`)
      continue
    }

    if (tableAction.mode === 'restart') {
      logger.info(`[${tableName}] restarting from page 1 and discarding previous chunk files`)
    }

    const stats = await dumpTableData(
      client,
      tableName,
      tableDataDir,
      tableAction.progressPath,
      options.scanLimit,
      options.pageDelayMs,
      options.progressEveryPages,
      table.ItemCount,
      logger,
      tableAction.resumeState
    )

    removeFileIfExists(tableAction.progressPath)

    upsertManifestTable(manifest, {
      tableName,
      schemaFile: path.relative(outputDir, tableSchemaPath),
      dataDir: path.relative(outputDir, tableDataDir),
      chunkFiles: buildChunkFiles(stats.pageCount),
      itemCount: stats.itemCount,
      pageCount: stats.pageCount,
    })

    writeJson(manifestPath, manifest)
    logger.info(
      `[${tableName}] completed with ${stats.itemCount} item(s) across ${stats.pageCount} page(s); manifest updated at ${manifestPath}`
    )
  }

  manifest.completedAt = new Date().toISOString()
  writeJson(manifestPath, manifest)
  writeJson(completionPath, {
    completedAt: manifest.completedAt,
    tableCount: manifest.tables.length,
  })
  logger.info(`Wrote completion marker to ${completionPath}`)

  logger.info('\nDump completed')
}

main().catch((error) => {
  console.error('Dump failed')
  console.error(error)
  process.exit(1)
})