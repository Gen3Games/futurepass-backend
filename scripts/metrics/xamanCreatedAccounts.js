/**
 * To run the script: aws-vault exec fv-identity-prod -- node xamanCreatedAccounts.js
 *
 * NOTE: If you want to use a different profile, make sure to adjust the Account Indexer URL used.
 * It defaults to production.
 */
const AWS = require('aws-sdk')
const { deriveAddress } = require('ripple-keypairs')
const { createObjectCsvWriter } = require('csv-writer')

AWS.config.update({ region: 'us-west-2' })

const dynamodb = new AWS.DynamoDB.DocumentClient()

const queryDynamoDB = async () => {
  const params = {
    TableName: 'futureverse-user',
    FilterExpression: 'contains(#id, :id_substring)',
    ExpressionAttributeNames: {
      '#id': 'id',
    },
    ExpressionAttributeValues: {
      ':id_substring': 'USER:xrpl',
    },
  }

  let items = []
  let data

  do {
    data = await dynamodb.scan(params).promise()
    items = items.concat(data.Items)

    // Set the exclusiveStartKey for the next scan to continue from where the last one left off
    params.ExclusiveStartKey = data.LastEvaluatedKey
  } while (typeof data.LastEvaluatedKey !== 'undefined')

  return items
}

const deriveRAddress = (publicKey) => {
  return deriveAddress(
    publicKey.toLowerCase().startsWith('0x') ? publicKey.slice(2) : publicKey
  )
}

const main = async () => {
  try {
    const items = await queryDynamoDB()
    const itemsToExport = []

    for (const item of items) {
      const eoa = item.sub.eoa
      const publicKey = item.sub.publicKey

      // Using the Account Indexer to avoid the complexity of handling the Ethers Wallet
      const accountIndexerResponse = await fetch(
        `https://account-indexer.api.futurepass.futureverse.app/api/v1/linked-futurepass?eoa=1:evm:${eoa}`
      )
      const responseData = await accountIndexerResponse.json()

      const rAddress = deriveRAddress(publicKey)

      itemsToExport.push({
        futurePass: responseData.ownedFuturepass?.split(':')[2],
        rAddress,
      })
    }

    // Write to CSV
    const csvWriter = createObjectCsvWriter({
      path: 'xamanCreatedAccounts.csv',
      header: [
        { id: 'futurePass', title: 'FuturePass' },
        { id: 'rAddress', title: 'RAddress' },
      ],
    })

    await csvWriter.writeRecords(itemsToExport)
    console.log('Data successfully exported to xamanCreatedAccounts.csv')
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
