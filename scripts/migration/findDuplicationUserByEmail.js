/**
 * To run the script: aws-vault exec custodial-auth-staging -- node ./findDuplicationUserByEmail.js <staging | prod>
 *
 * NOTE: This script only support to be running with custodial auth staging profile and custodial auth prod profile.
 * Choose to the correct parameter with the profile you are using
 *
 */
const AWS = require('aws-sdk')
const fs = require('fs')
const ethers = require('ethers')
const { ApolloClient, InMemoryCache, gql } = require('@apollo/client')

const [, , ENV] = process.argv

if (!ENV) {
  console.error('Please provide the env as an argument')
  process.exit(1)
}

if (!['staging', 'prod'].includes(ENV)) {
  console.error('Invalid env provided, only "staging" and "prod" allowed ')
  process.exit(1)
}

AWS.config.update({ region: 'us-west-2' })
const dynamodb = new AWS.DynamoDB.DocumentClient()

// For local testing
// const dynamodb = new AWS.DynamoDB.DocumentClient({
//   endpoint: 'http://localstack-main:4566',
//   region: 'us-east-2',
//   accessKeyId: 'local',
//   secretAccessKey: 'local',
// })

const TABLE_CONFIG = {
  staging: {
    FOUNDATION_KEY_OWNERSHIP_TABLE:
      'fv-staging-custodialauthstaging-foundation-key-ownership',
  },
  prod: {
    FOUNDATION_KEY_OWNERSHIP_TABLE:
      'fv-prod-custodialauthprod-foundation-key-ownership',
  },
}

const NETWORK_CONFIG = {
  staging: {
    accountIndexer:
      'https://account-indexer.api.futurepass.futureverse.dev/api/v1/linked-futurepass?eoa=11155111:evm:',
    accountLinker:
      'https://account-linker.api.futurepass.futureverse.dev/api/v1/linked-accounts?futurepass=',
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
  staging: {
    TRN_ID: 7672,
    TOKENS_CHAIN_LOCATIONS: [
      '7672:ROOT',
      '7672:XRP',
      '7672:ASTO',
      '7672:ETH',
      '7672:SYLO',
      '7672:USDC',
      '7672:PORKJET',
      '7672:VTX',
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
  // TRN Porcini
  '7672:ROOT': {
    chainId: 7672,
    chainType: 'root',
    location: '0',
  },
  '7672:XRP': {
    chainId: 7672,
    chainType: 'root',
    location: '2',
  },
  '7672:VTX': {
    chainId: 7672,
    chainType: 'root',
    location: '3',
  },
  '7672:ETH': {
    chainId: 7672,
    chainType: 'root',
    location: '1124',
  },
  '7672:PORKJET': {
    chainId: 7672,
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
  '7672:SYLO': {
    chainId: 7672,
    chainType: 'root',
    location: '3172',
  },
  '7668:USDC': {
    chainId: 7668,
    chainType: 'root',
    location: '3172',
  },
  '7672:USDC': {
    chainId: 7672,
    chainType: 'root',
    location: '2148',
  },
  '7668:ASTO': {
    chainId: 7668,
    chainType: 'root',
    location: '4196',
  },
  '7672:ASTO': {
    chainId: 7672,
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
  //   console.log(
  //     `query tokens for addresses: ${JSON.stringify(addresses)}`,
  //     tokenChainLocations
  //   )
  const result = await client.query({
    query: GenericTokenBalancesDocument,
    variables: {
      chainLocations: tokenChainLocations,
      addresses,
    },
  })

  //   console.log(result.data.genericTokenBalances.edges)
  const validTokens = result.data.genericTokenBalances.edges.filter((edge) => {
    return new Number(edge.node.amount) > 0
  })

  //   console.log(validTokens)

  return validTokens
}

const queryNftsForAddresses = async (addresses) => {
  //   console.log(
  //     `query nfts for addresses: ${JSON.stringify(addresses)}`,
  //     nftChainLocations
  //   )

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
  // console.log(`${NETWORK_CONFIG[ENV].futurescoreUrl}${futurepass}`)
  // console.log(responseData)

  return responseData.futureScore
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

const getExtraInfoFromPublicKey = async (publicKey) => {
  const eoa = ethers.utils.computeAddress(publicKey)
  const futurepass = await getOwnedFuturePass(eoa)

  const futurescore = await getFuturescore(futurepass)
  const allLinkedAccounts = await getAllLinkedAccounts(futurepass)
  const queryAssetsAddresses = allLinkedAccounts
    .filter((account) =>
      account.startsWith(CHAIN_LOCATION_CONFIG[ENV].TRN_ID.toString())
    )
    .map((account) => account.split(':')[2])

  const tokens = await queryTokensForAddresses(queryAssetsAddresses)
  const nfts = await queryNftsForAddresses(queryAssetsAddresses)

  return {
    eoa,
    futurepass,
    futurescore,
    allLinkedAccounts,
    queryAssetsAddresses,
    tokens,
    nfts,
  }
}

async function scanAndGenerateReport() {
  let lastEvaluatedKey = null
  const report = {
    itemsWithUpperCase: [],
    duplicates: {},
    totalScanned: 0,
    totalUpperCase: 0,
    accountsOwnAssets: [],
    uniqueIss: [],
  }

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

    report.totalScanned += items.length

    for (const item of items) {
      const userId = item.userId
      const iss = item.iss

      if (!report.uniqueIss.includes(iss)) {
        report.uniqueIss.push(iss)
      }

      if (/[A-Z]/.test(userId)) {
        const extraInfo = await getExtraInfoFromPublicKey(item.publicKey)
        const duplicatedAccount = {
          ...item,
          ...extraInfo,
        }

        report.itemsWithUpperCase.push(duplicatedAccount)

        if (extraInfo.tokens.length > 0 || extraInfo.nfts.length > 0) {
          report.accountsOwnAssets.push(duplicatedAccount)
        }

        report.totalUpperCase++
        const lowerCaseUserId = userId.toLowerCase()

        if (report.duplicates[lowerCaseUserId]) {
          report.duplicates[lowerCaseUserId].duplicateAccounts.push(
            duplicatedAccount
          )
        } else {
          const lowerCaseUserIdScanParams = {
            TableName: TABLE_CONFIG[ENV].FOUNDATION_KEY_OWNERSHIP_TABLE,
            FilterExpression: 'userId = :lowerUserId',
            ExpressionAttributeValues: {
              ':lowerUserId': lowerCaseUserId,
            },
          }

          const lowerCaseUserIdScanResults = await dynamodb
            .scan(lowerCaseUserIdScanParams)
            .promise()
          const lowerCaseUserIdItems = lowerCaseUserIdScanResults.Items || []

          if (lowerCaseUserIdItems.length > 0) {
            const normalAccounts = await Promise.all(
              lowerCaseUserIdItems.map(async (lowerCaseUserIdItem) => {
                const extraInfo = await getExtraInfoFromPublicKey(
                  lowerCaseUserIdItem.publicKey
                )

                return {
                  ...lowerCaseUserIdItem,
                  ...extraInfo,
                }
              })
            )

            report.duplicates[lowerCaseUserId] = {
              normalAccounts,
              duplicateAccounts: [duplicatedAccount],
            }
          }
        }
      }
    }
  } while (lastEvaluatedKey)

  fs.writeFileSync(
    'report.json',
    JSON.stringify(
      {
        ...report,
        uniqueIssCount: report.uniqueIss.length,
        accountsOwnAssetsCount: report.accountsOwnAssets.length,
      },
      null,
      2
    )
  )

  console.log('Scan Report:')
  console.log(`Total Email Accounts Scanned: ${report.totalScanned}`)
  console.log(`Total Accounts with Upper Case: ${report.totalUpperCase}`)
  console.log(
    `Total Duplicated Accounts: ${Object.keys(report.duplicates).length}`
  )

  console.log(
    `Total Accounts who own assets: ${report.accountsOwnAssets.length}`
  )
  console.log(`Total Unique Iss: ${report.uniqueIss.length}`)
}

scanAndGenerateReport()
  .then(() => {
    console.log('Scan completed')
  })
  .catch((error) => {
    console.error('Scan failed', error)
  })
