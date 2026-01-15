/* eslint-disable @typescript-eslint/no-unsafe-call -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- it is rollup config */
/* eslint-disable @typescript-eslint/no-var-requires -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-return -- it is rollup config */
/* eslint-disable no-undef -- it is rollup config */

const nrwlConfig = require('@nx/react/plugins/bundle-rollup')
const image = require('@rollup/plugin-image')
const replace = require('@rollup/plugin-replace')
const url = require('@rollup/plugin-url')
const svgr = require('@svgr/rollup')

const dotenv = require('dotenv')
const packageJson = require('./package.json')

const environment = process.env.NODE_ENV
const envFilePath = `${__dirname}/.env.${environment}`

dotenv.config({ path: envFilePath })

module.exports = (config) => {
  const nxConfig = nrwlConfig(config)
  // console.log(nxConfig.plugins);
  // console.log({
  //   ...nxConfig,
  //   output: {
  //     ...nxConfig.output,
  //     file: (() => {
  //       if (nxConfig.output.format === 'cjs') {
  //         return 'dist/libs/react-sdk/index.cjs';
  //       }
  //       if (nxConfig.output.format === 'esm') {
  //         return 'dist/libs/react-sdk/index.js';
  //       }

  //       throw new Error('invalid format');
  //     })(),
  //     preserveModules: true,
  //     preserveModulesRoot: 'libs/react-sdk',
  //   },
  // });

  const plugins = [
    svgr({
      icon: true,
    }),
    image(),
    url({
      // by default, rollup-plugin-url will not handle font files
      include: ['**/*.woff', '**/*.woff2', '**/*.svg', '**/*.png', '**/*.webp'],
      // setting infinite limit will ensure that the files
      // are always bundled with the code, not copied to /dist
      limit: Infinity,
    }),
    ...nxConfig.plugins.filter(
      (x) => !['svgr', 'url', 'image'].includes(x.name)
    ),
    replace({
      'process.env.REACT_SDK_VERSION': packageJson.version,
      preventAssignment: true,
    }),
  ]

  return {
    ...nxConfig,
    output: {
      ...nxConfig.output,
      entryFileNames: (() => {
        if (nxConfig.output.format === 'cjs') {
          return `[name].c.cjs`
        }
        if (nxConfig.output.format === 'esm') {
          return `[name].e.js`
        }

        throw new Error('invalid format')
      })(),
      preserveModules: true,
      preserveModulesRoot: 'libs/react-sdk',
    },
    plugins,
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-call -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- it is rollup config */
/* eslint-enable @typescript-eslint/no-var-requires -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-return -- it is rollup config */
/* eslint-enable no-undef -- it is rollup config */
