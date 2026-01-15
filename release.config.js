const path = require('path')

const packageName = process.env.PACKAGE_NAME

if (!packageName) {
  throw new Error('PACKAGE_NAME environment variable is required')
}

module.exports = {
  branches: ['main', 'next'],
  tagFormat: `${packageName}-v\${version}`,
  plugins: [
    './scripts/semantic-release/filter-commits.js',
    './scripts/semantic-release/custom-generate-notes.js',
    [
      '@semantic-release/changelog',
      {
        changelogFile: `libs/${packageName}/CHANGELOG.md`,
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        pkgRoot: path.join('libs', packageName),
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true,
        pkgRoot: path.join('dist/libs', packageName),
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: [
          `libs/${packageName}/package.json`,
          `libs/${packageName}/CHANGELOG.md`,
        ],
        message:
          'chore(release): ${nextRelease.gitTag} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    // will publish the release to GitHub
    '@semantic-release/github',
  ],
  verifyConditions: ['@semantic-release/github'],
  repositoryUrl: 'https://github.com/futureversecom/futurepass',
}
