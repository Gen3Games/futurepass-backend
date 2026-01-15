export default {
  displayName: 'identity-contract-bindings',
  preset: '../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': 'ts-jest',
  },
  testEnvironment: 'node',
  coverageDirectory: '../../coverage/libs/identity-contract-bindings',
}
