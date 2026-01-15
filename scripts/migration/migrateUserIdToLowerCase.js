/**
 * To run the script: aws-vault exec custodial-auth-neptune -- node ./migrateUserIdToLowerCase.js <neptune | prod> <true | false>
 *
 * NOTE: This script only support to be running with custodial auth neptune profile and custodial auth prod profile.
 * Choose to the correct parameter with the profile you are using
 *
 */
const AWS = require('aws-sdk')
const fs = require('fs')
const ethers = require('ethers')
const { ApolloClient, InMemoryCache, gql } = require('@apollo/client')

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

const NETWORK_CONFIG = {
  neptune: {
    accountIndexer:
      'https://13c0i9cv8a.execute-api.us-west-2.amazonaws.com/api/v1/linked-futurepass?eoa=11155111:evm:',
    accountLinker:
      'https://a2wpm8fl1b.execute-api.us-west-2.amazonaws.com/api/v1/linked-accounts?futurepass=',
    assetsGraphQL: 'https://w1jv6xw3jh.execute-api.us-west-2.amazonaws.com/',
    futurescoreUrl:
      'https://pljs0td9ya.execute-api.us-west-2.amazonaws.com/api/v2/internal-get-futurescore-dposjqeken?futurepass=',
  },
  prod: {
    accountIndexer:
      'https://account-indexer.api.futurepass.futureverse.app/api/v1/linked-futurepass?eoa=1:evm:',
    accountLinker:
      'https://account-linker.api.futurepass.futureverse.app/api/v1/linked-accounts?futurepass=',
    assetsGraphQL: 'https://adx1wewtnh.execute-api.us-west-2.amazonaws.com/',
    futurescoreUrl:
      'https://ynw1ud7uyb.execute-api.us-west-2.amazonaws.com/api/v2/internal-get-futurescore-dposjqeken?futurepass=',
  },
}

const CHAIN_LOCATION_CONFIG = {
  neptune: {
    TRN_ID: 17672,
    TOKENS_CHAIN_LOCATIONS: [
      '17672:ROOT',
      '17672:XRP',
      '17672:ASTO',
      '17672:ETH',
      '17672:SYLO',
      '17672:USDC',
      '17672:PORKJET',
      '17672:VTX',
    ],
  },
  prod: {
    TRN_ID: 7668,
    TOKENS_CHAIN_LOCATIONS: [
      '7668:ROOT',
      '7668:XRP',
      '7668:ASTO',
      '7668:ETH',
      '7668:SYLO',
      '7668:USDC',
      '7668:PRYSM',
      '7668:PORKJET',
      '7668:VTX',
      '7668:USDT',
      '7668:DAI',
    ],
  },
}

const TOKEN_CONFIG = {
  // TRN Devnet Porcini
  '17672:ROOT': {
    chainId: 17672,
    chainType: 'root',
    location: '0',
  },
  '17672:XRP': {
    chainId: 17672,
    chainType: 'root',
    location: '2',
  },
  '17672:VTX': {
    chainId: 17672,
    chainType: 'root',
    location: '3',
  },
  '17672:ETH': {
    chainId: 17672,
    chainType: 'root',
    location: '1124',
  },
  '17672:PORKJET': {
    chainId: 17672,
    chainType: 'root',
    location: '59492',
  },

  // TRN Mainnet
  '7668:ETH': {
    chainId: 7668,
    chainType: 'root',
    location: '1124',
  },
  '7668:VTX': {
    chainId: 7668,
    chainType: 'root',
    location: '3',
  },
  '7668:XRP': {
    chainId: 7668,
    chainType: 'root',
    location: '2',
  },
  '7668:ROOT': {
    chainId: 7668,
    chainType: 'root',
    location: '0',
  },
  '7668:SYLO': {
    chainId: 7668,
    chainType: 'root',
    location: '2148',
  },
  '17672:SYLO': {
    chainId: 17672,
    chainType: 'root',
    location: '3172',
  },
  '7668:USDC': {
    chainId: 7668,
    chainType: 'root',
    location: '3172',
  },
  '17672:USDC': {
    chainId: 17672,
    chainType: 'root',
    location: '2148',
  },
  '7668:ASTO': {
    chainId: 7668,
    chainType: 'root',
    location: '4196',
  },
  '17672:ASTO': {
    chainId: 17672,
    chainType: 'root',
    location: '17508',
  },

  '7668:USDT': {
    chainId: 7668,
    chainType: 'root',
    location: '6244',
  },
  '7668:IMX': {
    chainId: 7668,
    chainType: 'root',
    location: '7268',
  },
  '7668:WBTC': {
    chainId: 7668,
    chainType: 'root',
    location: '8292',
  },
  '7668:DAI': {
    chainId: 7668,
    chainType: 'root',
    location: '9316',
  },
  '7668:PRIME': {
    chainId: 7668,
    chainType: 'root',
    location: '10340',
  },
  '7668:PEPE': {
    chainId: 7668,
    chainType: 'root',
    location: '11364',
  },
  '7668:wstETH': {
    chainId: 7668,
    chainType: 'root',
    location: '12388',
  },
  '7668:DYDX': {
    chainId: 7668,
    chainType: 'root',
    location: '13412',
  },
  '7668:LINK': {
    chainId: 7668,
    chainType: 'root',
    location: '14436',
  },
  '7668:HEX': {
    chainId: 7668,
    chainType: 'root',
    location: '15460',
  },
  '7668:LDO': {
    chainId: 7668,
    chainType: 'root',
    location: '16484',
  },
  '7668:BLUR': {
    chainId: 7668,
    chainType: 'root',
    location: '17508',
  },
  '7668:cbETH': {
    chainId: 7668,
    chainType: 'root',
    location: '18532',
  },
  '7668:UNI': {
    chainId: 7668,
    chainType: 'root',
    location: '19556',
  },
  '7668:FRAX': {
    chainId: 7668,
    chainType: 'root',
    location: '20580',
  },
  '7668:MATIC': {
    chainId: 7668,
    chainType: 'root',
    location: '21604',
  },
  '7668:RLB': {
    chainId: 7668,
    chainType: 'root',
    location: '22628',
  },
  '7668:PNDC': {
    chainId: 7668,
    chainType: 'root',
    location: '23652',
  },
  '7668:FET': {
    chainId: 7668,
    chainType: 'root',
    location: '24676',
  },
  '7668:LUSD': {
    chainId: 7668,
    chainType: 'root',
    location: '25700',
  },
  '7668:BITCOIN': {
    chainId: 7668,
    chainType: 'root',
    location: '26724',
  },
  '7668:rETH': {
    chainId: 7668,
    chainType: 'root',
    location: '27748',
  },
  '7668:agEUR': {
    chainId: 7668,
    chainType: 'root',
    location: '28772',
  },
  '7668:RPL': {
    chainId: 7668,
    chainType: 'root',
    location: '29796',
  },
  '7668:SHIB': {
    chainId: 7668,
    chainType: 'root',
    location: '30820',
  },
  '7668:BONE': {
    chainId: 7668,
    chainType: 'root',
    location: '31844',
  },
  '7668:FUN': {
    chainId: 7668,
    chainType: 'root',
    location: '32868',
  },
  '7668:PRYSM': {
    chainId: 7668,
    chainType: 'root',
    location: '106596',
  },
  '7668:PORKJET': {
    chainId: 7668,
    chainType: 'root',
    location: '54372',
  },
}

const COLLECTION_CONFIG = {
  // TRN Mainnet
  '7668:The Next Legends Boxers': {
    chainId: 7668,
    chainType: 'root',
    location: '1124',
  },
  '7668:Goblins': {
    chainId: 7668,
    chainType: 'root',
    location: '3172',
  },
  '7668:Amulets': {
    chainId: 7668,
    chainType: 'root',
    location: '2148',
  },
}

const tokenChainLocations = CHAIN_LOCATION_CONFIG[
  ENV
].TOKENS_CHAIN_LOCATIONS.map((chainLocation) => {
  return TOKEN_CONFIG[chainLocation]
})

const nftChainLocations = Object.values(COLLECTION_CONFIG)

const client = new ApolloClient({
  uri: NETWORK_CONFIG[ENV].assetsGraphQL,
  cache: new InMemoryCache(),
  fetch,
})

const GenericTokenBalancesDocument = gql`
  query GenericTokenBalances(
    $chainLocations: [BlockchainLocationInput!]!
    $addresses: [Address!]!
  ) {
    genericTokenBalances(
      chainLocations: $chainLocations
      addresses: $addresses
    ) {
      edges {
        node {
          amount
          genericToken {
            id
            location
            chainId
            chainType
            symbol
            decimals
          }
          holder {
            id
            address
          }
          id
        }
      }
    }
  }
`

const NftsDocument = gql`
  query Nfts(
    $addresses: [Address!]!
    $chainLocations: [BlockchainLocationInput]
    $first: Int
    $after: String
  ) {
    nfts(
      addresses: $addresses
      chainLocations: $chainLocations
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          tokenId
          collection {
            id
            location
            chainId
            chainType
            name
          }
          assetType
          metadata {
            id
            uri
            attributes
            properties
          }
          ... on NFT721 {
            owner {
              id
              address
            }
          }
          ... on NFT1155 {
            balancesOf(addresses: $addresses) {
              balance
              owner {
                address
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        nextPageCursor
      }
    }
  }
`

const queryTokensForAddresses = async (addresses) => {
  const result = await client.query({
    query: GenericTokenBalancesDocument,
    variables: {
      chainLocations: tokenChainLocations,
      addresses,
    },
  })

  const validTokens = result.data.genericTokenBalances.edges.filter((edge) => {
    return new Number(edge.node.amount) > 0
  })

  return validTokens
}

const queryNftsForAddresses = async (addresses) => {
  let after = null
  let allNfts = []

  while (true) {
    const { data } = await client.query({
      query: NftsDocument,
      variables: {
        addresses,
        chainLocations: nftChainLocations,
        first: 1000,
        after,
      },
    })

    const nfts = data.nfts.edges.map((edge) => edge.node)
    allNfts = allNfts.concat(nfts)

    if (!data.nfts.pageInfo.hasNextPage) {
      break
    }

    after = data.nfts.pageInfo.nextPageCursor
  }

  return allNfts
}

const getFuturescore = async (futurepass) => {
  const response = await fetch(
    `${NETWORK_CONFIG[ENV].futurescoreUrl}${futurepass}`
  )
  const responseData = await response.json()

  return responseData.futureScore ?? 0
}

const getOwnedFuturePass = async (eoa) => {
  const response = await fetch(`${NETWORK_CONFIG[ENV].accountIndexer}${eoa}`)
  const responseData = await response.json()
  return responseData.ownedFuturepass
}

const getAllLinkedAccounts = async (futurepass) => {
  const response = await fetch(
    `${NETWORK_CONFIG[ENV].accountLinker}${futurepass}`
  )

  const responseData = await response.json()
  return responseData.allLinkedAccounts
}

const getAssetsInfoFromPublicKey = async (publicKey) => {
  const eoa = ethers.utils.computeAddress(publicKey)
  const futurepass = await getOwnedFuturePass(eoa)

  const allLinkedAccounts = await getAllLinkedAccounts(futurepass)
  const queryAssetsAddresses = allLinkedAccounts
    .filter((account) =>
      account.startsWith(CHAIN_LOCATION_CONFIG[ENV].TRN_ID.toString())
    )
    .map((account) => account.split(':')[2])

  const futurescore = await getFuturescore(futurepass)
  const tokens = await queryTokensForAddresses(queryAssetsAddresses)
  const nfts = await queryNftsForAddresses(queryAssetsAddresses)

  return {
    futurescore,
    tokens,
    nfts,
  }
}

const migrate = async (oldUserId, newUserId, item) => {
  const { iss, ...rest } = item

  try {
    await dynamodb
      .delete({
        TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
        Key: {
          iss,
          userId: oldUserId,
        },
      })
      .promise()

    await dynamodb
      .put({
        TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
        Item: {
          iss,
          ...rest,
          userId: newUserId,
        },
      })
      .promise()

    console.log(`Updated userId from ${oldUserId} to ${newUserId}`)
    return true
  } catch (error) {
    console.error(`Failed to update userId ${oldUserId}:`, error)
    return false
  }
}

const accountHasNoAssets = (accountTokens, accountNfts, accountFs) => {
  if (
    accountTokens.length === 0 &&
    accountNfts.length === 0 &&
    accountFs == 0
  ) {
    return true
  }

  if (accountNfts.length === 0 && accountTokens.length === 1) {
    const token = accountTokens[0]

    // token.node.genericToken.location equals 0 means this is token ROOT
    if (
      parseInt(token.node.amount) === 1 &&
      parseInt(token.node.genericToken.location) === 0
    ) {
      return true
    }
  }

  return false
}

async function runMigration() {
  let lastEvaluatedKey = null
  const report = {
    totalAccountsScanned: 0,
    totalAccountsWithUpperCaseLetter: 0,
    migrationPlan: [],
    migratedAccounts: [],
    failedMigratedAccounts: [],
    conflictAccounts: [],
  }

  const swappableAccounts = []

  do {
    const scanParams = {
      TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
      FilterExpression: 'begins_with(userId, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': 'email:',
      },
      ExclusiveStartKey: lastEvaluatedKey,
    }

    const scanResults = await dynamodb.scan(scanParams).promise()
    const items = scanResults.Items || []
    lastEvaluatedKey = scanResults.LastEvaluatedKey

    for (const item of items) {
      report.totalAccountsScanned++
      const currentAccountWithUpperCase = item

      if (/[A-Z]/.test(currentAccountWithUpperCase.userId)) {
        console.log(
          `\r\n\r\nstart processinG account for ${currentAccountWithUpperCase.userId}`
        )

        // get account ( with uppercase letters ) extra info, we need to check its assets later
        const currentAccountExtraInfo = await getAssetsInfoFromPublicKey(
          currentAccountWithUpperCase.publicKey
        )

        report.totalAccountsWithUpperCaseLetter++
        const lowerCaseUserId = currentAccountWithUpperCase.userId.toLowerCase()
        const lowerCaseUserIdQueryParams = {
          TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
          KeyConditionExpression: 'iss = :issValue AND userId = :lowerUserId',
          ExpressionAttributeValues: {
            ':issValue': currentAccountWithUpperCase.iss,
            ':lowerUserId': lowerCaseUserId,
          },
        }

        const lowerCaseUserIdScanResults = await dynamodb
          .query(lowerCaseUserIdQueryParams)
          .promise()

        // we know if the account ( with all lowercase letters ) exists, then it must be the only one, so get the first element from the result
        const accountWithAllLowercase =
          lowerCaseUserIdScanResults.Items[0] || null

        if (accountWithAllLowercase != null) {
          console.log(
            `find lowercase account: ${currentAccountWithUpperCase.userId.toLowerCase()}`
          )
          // user has all lowercase email accounts

          // get account ( with all lowercase letters ) assets info
          const accountWithAllLowercasExtraInfo =
            await getAssetsInfoFromPublicKey(accountWithAllLowercase.publicKey)

          if (
            accountHasNoAssets(
              accountWithAllLowercasExtraInfo.tokens,
              accountWithAllLowercasExtraInfo.nfts,
              accountWithAllLowercasExtraInfo.futurescore
            )
          ) {
            // account ( with all lowercase letters ) doesn't have any assets

            if (
              accountHasNoAssets(
                currentAccountExtraInfo.tokens,
                currentAccountExtraInfo.nfts,
                currentAccountExtraInfo.futurescore
              )
            ) {
              // current account ( with uppercase letters ) doesn't have any assets
              /**
               *
               * Situation 1: none of accounts has any assets
               *
               * we don't need to do anything, user will login to its all lowercase account, but the account with uppercase letters will still exists in db
               */
              console.log(`Situation 1: no need to do anything`)
            } else {
              /**
               *
               * Situation 2: account with uppercase letters has assets but account with all lowercase doesn't have
               *
               * we need to swap the keyid and publicKey for these 2 accounts
               *
               * The swap will be done in another script, we just add the account to the list
               *
               */

              console.log(
                'Situation 2: put accounts into swap list for further processing'
              )

              if (dryRun) {
                report.migrationPlan.push({
                  reason:
                    "account with uppercase letters has assets but account with all lowercase doesn't have",
                  from: currentAccountWithUpperCase.userId,
                  to: lowerCaseUserId,
                  raw: {
                    from: {
                      ...currentAccountWithUpperCase,
                      ...currentAccountExtraInfo,
                    },
                    to: {
                      ...accountWithAllLowercase,
                      ...accountWithAllLowercasExtraInfo,
                    },
                  },
                })
              }

              swappableAccounts.push({
                from: {
                  ...currentAccountWithUpperCase,
                },
                to: {
                  ...accountWithAllLowercase,
                },
              })
            }
          } else {
            // account ( with all lowercase letters ) has assets

            if (
              accountHasNoAssets(
                currentAccountExtraInfo.tokens,
                currentAccountExtraInfo.nfts,
                currentAccountExtraInfo.futurescore
              )
            ) {
              /**
               *
               * Situation 3: account with uppercase letters doesn't have any assets
               *
               * This is the same as situation 1
               * We don't need to do anything, user will login to its all lowercase account, but the account with uppercase letters will still exists in db
               *
               */
              console.log(`Situation 3: no need to do anything`)
            } else {
              /**
               *
               * Situation 4: account with uppercase letters has assets
               *
               * Both accounts have assets, we should confirm with production team
               * Hopefully this never happens
               *
               * We add the account ( with uppercase letters ) to the report
               */
              report.conflictAccounts.push({
                currentAccount: {
                  ...currentAccountWithUpperCase,
                  ...currentAccountExtraInfo,
                },
                accountWithAllLowercase: {
                  ...accountWithAllLowercase,
                  ...accountWithAllLowercasExtraInfo,
                },
              })
              console.log(
                `Situation 4: cannot doing migration due to the conflict`
              )
            }
          }
        } else {
          // user doesn't have lowercase email accounts

          console.log('Cannot find lowercase account: start migration')
          /**
           *
           * It is safe for us to run the migration, just simply update the user id of the account ( with uppercase letters ) to all lowercase user id
           *
           */

          if (dryRun) {
            report.migrationPlan.push({
              reason: "user doesn't have lowercase email accounts",
              from: currentAccountWithUpperCase.userId,
              to: lowerCaseUserId,
              raw: {
                from: {
                  ...currentAccountWithUpperCase,
                  ...currentAccountExtraInfo,
                },
              },
            })
          } else {
            const isSuccessful = await migrate(
              currentAccountWithUpperCase.userId,
              lowerCaseUserId,
              currentAccountWithUpperCase
            )

            console.log(`Situation 5: end migration: ${isSuccessful}`)

            if (isSuccessful) {
              report.migratedAccounts.push({
                ...currentAccountWithUpperCase,
                newUserId: lowerCaseUserId,
              })
            } else {
              report.failedMigratedAccounts.push(currentAccountWithUpperCase)
            }
          }
        }
      }
    }
  } while (lastEvaluatedKey)

  fs.writeFileSync('migration.json', JSON.stringify(report, null, 2))
  fs.writeFileSync('swap.json', JSON.stringify(swappableAccounts, null, 2))

  console.log('\r\nMigration Report:')
  console.log(`Total Email Accounts scanned ${report.totalAccountsScanned}`)
  console.log(
    `Total Email Accounts are migrated: ${report.migratedAccounts.length}`
  )
  console.log(`Total Conflicts: ${report.conflictAccounts.length}`)
}

runMigration()
  .then(() => {
    console.log('Migration completed')
  })
  .catch((error) => {
    console.error('Migration failed', error)
  })
