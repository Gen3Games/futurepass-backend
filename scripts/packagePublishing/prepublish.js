const fs = require('fs')
const { execSync } = require('child_process')

const privateNpmrcPath = '.npmrc.private'
const publicNpmrcPath = '.npmrc.public'

if (process.argv.length < 3) {
  console.error('Usage: node prepublish.js <package-path>')
  process.exit(1)
}
const packageName = process.argv[2]
if (!['react-sdk', 'experience-sdk'].includes(packageName)) {
  console.error('Invalid package name')
  process.exit(1)
}

// First run build:all to ensure the change in version is reflected
try {
  console.log('Building all')
  execSync('rm -rf dist && pnpm build:all', { stdio: 'inherit' })
  console.log('Sucessfully built all')
} catch (e) {
  console.error('error building libraries', e)
  process.exit(1)
}

const distLibsPath = `./dist/libs/${packageName}`
const packageJsonPath = `${distLibsPath}/package.json`
const outputNpmrcPath = `${distLibsPath}/.npmrc`
let originalPackageJson = {}

try {
  // Read the original package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  //backup
  originalPackageJson = { ...packageJson }

  const version = packageJson.version

  const copyNpmrcFileIfExists = (sourcePath) => {
    if (!fs.existsSync(sourcePath)) {
      return
    }
    fs.copyFileSync(sourcePath, outputNpmrcPath)
  }

  if (/alpha|beta/.test(version)) {
    // For alpha or beta versions, change the package name for private registry
    packageJson.name = originalPackageJson.name.replace(
      'futureverse',
      'futureversecom'
    )

    // update package name from futureverse to futureversecom
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // build the .npmrc
    copyNpmrcFileIfExists(privateNpmrcPath)

    console.log(
      'Publishing to private npm registry with name:',
      packageJson.name
    )
    execSync(
      `cd dist/libs/${packageName} && npm publish --registry=https://npm.pkg.github.com`,
      { stdio: 'inherit' }
    )
  } else {
    console.log(
      'Publishing to public npm registry with name:',
      packageJson.name
    )
    // build the .npmrc
    copyNpmrcFileIfExists(publicNpmrcPath)

    execSync(
      `cd dist/libs/${packageName} && npm run publish --registry=https://registry.npmjs.org`,
      { stdio: 'inherit' }
    )
  }
} finally {
  // Restore the original package.json
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(originalPackageJson, null, 2)
  )
  if (fs.existsSync(outputNpmrcPath)) {
    fs.unlinkSync(outputNpmrcPath)
  }
  console.log('Restored original package.json')
}
