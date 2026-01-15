/* eslint-disable import/no-anonymous-default-export -- jest.config.ts */
export default {
  displayName: 'custodial-signer',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': [
      'babel-jest',
      {
        presets: ['@nx/next/babel'],
        plugins: ['@babel/plugin-proposal-private-methods'],
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/custodial-signer',
}
/* eslint-enable import/no-anonymous-default-export -- jest.config.ts */
