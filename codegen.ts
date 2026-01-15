import { CodegenConfig } from '@graphql-codegen/cli'
// import * as sdk from './libs/experience-sdk'

require('dotenv').config()

const config: CodegenConfig = {
  generates: {
    'libs/react-sdk/src/__generated__/': {
      schema:
        'https://w1jv6xw3jh.execute-api.us-west-2.amazonaws.com/api/graphql',
      preset: 'client',
      documents: [
        'libs/react-sdk/src/hooks/**/*.graphql.ts',
        '!libs/react-sdk/src/hooks/useBridgeTransaction/useBridgeTransaction.graphql.ts',
        '!libs/react-sdk/src/hooks/useBridgeTransactions/useBridgeTransactions.graphql.ts',
      ],
      plugins: [],
      presetConfig: {
        gqlTagName: 'gql',
      },
      config: {
        nonOptionalTypename: true,
      },
    },
    // 'libs/react-sdk/src/__generated_bridging__/': {
    //   schema: [
    //     {
    //       // default using development schema endpoint
    //       'https://ap-southeast-2.aws.realm.mongodb.com/api/client/v2.0/app/porcini-web-apps-hvfnd/graphql':
    //         {
    //           headers: {
    //             apiKey: sdk.io.fromEnv('CODEGEN_API_KEY'),
    //           },
    //         },
    //     },
    //   ],
    //   preset: 'client',
    //   documents: [
    //     'libs/react-sdk/src/hooks/useBridgeTransaction/useBridgeTransaction.graphql.ts',
    //     'libs/react-sdk/src/hooks/useBridgeTransactions/useBridgeTransactions.graphql.ts',
    //   ],
    //   plugins: [],
    //   presetConfig: {
    //     gqlTagName: 'gql',
    //   },
    //   config: {
    //     nonOptionalTypename: true,
    //   },
    // },
  },
  ignoreNoDocuments: true,
}

export default config
