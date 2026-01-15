module.exports = {
  extends: ['@commitlint/config-conventional'],
  ignores: [(message) => /\[skip ci\]/i.test(message)],
  rules: {
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'idp-b',
        'idp-f',
        'cs',
        'e-sdk',
        'r-sdk',
        'icb',
        'rpc-k',
        'sb',
        'oidc-c',
        'nx-t',
        'fp',
        'cl',
        'am',
        'pt',
        'common',
      ],
    ],
  },
}
