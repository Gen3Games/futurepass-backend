/**
 * To run the script: aws-vault exec custodial-auth-neptune -- node ./swap.js <neptune | prod> <true | false>
 *
 * NOTE: This script only support to be running with custodial auth neptune profile and custodial auth prod profile.
 * Choose to the correct parameter with the profile you are using
 *
 * To run this script, put swap.json in the same directory
 *
 */
const AWS = require('aws-sdk')
const fs = require('fs')

const [, , ENV, DryRun] = process.argv

if (!ENV) {
  console.error('\r\n\r\nPlease provide the env as an argument')
  process.exit(1)
}

const dryRun = DryRun === 'true'
if (dryRun) {
  console.log("\r\ndry run doesn't migrate, generate report only\r\n")
}

if (!['neptune', 'prod'].includes(ENV)) {
  console.error(
    '\r\nInvalid env provided, only "neptune" and "prod" allowed\r\n'
  )
  process.exit(1)
}

AWS.config.update({ region: 'us-west-2' })
const dynamodb = new AWS.DynamoDB.DocumentClient()

const TABLE_CONFIG = {
  neptune: {
    FOUNDATION_KEY_OWNERSHIP_TABLE:
      'fv-neptune-custodialauthneptune-foundation-key-ownership',
  },
  prod: {
    FOUNDATION_KEY_OWNERSHIP_TABLE:
      'fv-prod-custodialauthprod-foundation-key-ownership',
  },
}

const swapAccounts = JSON.parse(fs.readFileSync('./swap.json', 'utf8'))

const report = []
swapAccounts.forEach(async (item) => {
  const from = item.from
  const to = item.to

  ;[from.keyId, to.keyId] = [to.keyId, from.keyId]
  ;[from.publicKey, to.publicKey] = [to.publicKey, from.publicKey]

  report.push({
    from,
    to,
  })

  if (!dryRun) {
    await updateDynamoDB(from)
    await updateDynamoDB(to)
  }
})

async function updateDynamoDB(item) {
  const params = {
    TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
    Key: {
      iss: item.iss,
      userId: item.userId,
    },
    UpdateExpression: 'set keyId = :keyId, publicKey = :publicKey',
    ExpressionAttributeValues: {
      ':keyId': item.keyId,
      ':publicKey': item.publicKey,
    },
  }

  try {
    await dynamodb.update(params).promise()
    console.log(`Updated item with iss: ${item.iss} and userId: ${item.userId}`)
  } catch (error) {
    console.error(
      `Failed to update item with iss: ${item.iss} and userId: ${item.userId}`,
      error
    )
  }
}

fs.writeFileSync('swap-report.json', JSON.stringify(report, null, 2))
