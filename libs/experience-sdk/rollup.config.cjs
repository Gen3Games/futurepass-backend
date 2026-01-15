/* eslint-disable @typescript-eslint/no-unsafe-call -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- it is rollup config */
/* eslint-disable @typescript-eslint/no-var-requires -- it is rollup config */
/* eslint-disable @typescript-eslint/no-unsafe-return -- it is rollup config */
/* eslint-disable no-undef -- it is rollup config */

const nrwlConfig = require('@nx/react/plugins/bundle-rollup')

const wagmi = 'libs/experience-sdk/src/wagmi/index.ts'
const web3react = 'libs/experience-sdk/src/web3-react/index.ts'

module.exports = (options) => {
  const nxConfig = nrwlConfig(options)

  return {
    ...nxConfig,
    // ...require('@nx/react/plugins/bundle-rollup')(options),
    input: [options.input.index, wagmi, web3react],

    output: {
      ...nxConfig.output,
      entryFileNames: (x) => {
        if (x.facadeModuleId.endsWith(wagmi)) {
          if (nxConfig.output.format === 'cjs') {
            return `wagmi.c.cjs`
          }
          if (nxConfig.output.format === 'esm') {
            return `wagmi.e.js`
          }
        }
        if (x.facadeModuleId.endsWith(web3react)) {
          if (nxConfig.output.format === 'cjs') {
            return `web3react.c.cjs`
          }
          if (nxConfig.output.format === 'esm') {
            return `web3react.e.js`
          }
        }

        if (nxConfig.output.format === 'cjs') {
          return `[name].c.cjs`
        }
        if (nxConfig.output.format === 'esm') {
          return `[name].e.js`
        }

        // if (x.facadeModuleId.endsWith(wagmi)) return 'wagmi.js';
        // if (x.facadeModuleId.endsWith(web3react)) return 'web3react.js';
        // return '[name].js';
      },
      chunkFileNames: (() => {
        if (nxConfig.output.format === 'cjs') {
          return `[name].c.cjs`
        }
        if (nxConfig.output.format === 'esm') {
          return `[name].e.js`
        }
      })(),
    },
  }
}

/* eslint-enable @typescript-eslint/no-unsafe-call -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- it is rollup config */
/* eslint-enable @typescript-eslint/no-var-requires -- it is rollup config */
/* eslint-enable @typescript-eslint/no-unsafe-return -- it is rollup config */
/* eslint-enable no-undef -- it is rollup config */
