/* eslint-disable @typescript-eslint/no-unsafe-assignment -- webpack config file*/
/* eslint-disable @typescript-eslint/no-unsafe-call -- webpack config file*/
/* eslint-disable @typescript-eslint/no-unsafe-return -- webpack config file*/
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- webpack config file*/

const webpack = require('webpack')

module.exports = (config) => {
  if (!config.module) config.module = { rules: [] }
  if (!config.module.rules) config.module.rules = []
  if (!config.module) config.module = { rules: [] }
  if (!config.module.rules) config.module.rules = []

  config.module.rules.push({
    test: /\.(woff(2)?|ttf|eot|webp)(\?v=\d+\.\d+\.\d+)?$/,
    use: [
      {
        loader: require.resolve('file-loader'),
        options: {
          name: 'assets/[name].[ext]',
        },
      },
    ],
  })

  config.module.rules.push({
    test: /\.svg$/,
    use: [
      {
        loader: require.resolve('@svgr/webpack'),
        options: {
          icon: true,
        },
      },
      {
        loader: require.resolve('file-loader'),
        options: {
          name: 'assets/[name].[ext]',
        },
      },
    ],
  })

  // Work around for Buffer is undefined:
  // https://github.com/webpack/changelog-v5/issues/10
  config.plugins.push(
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  )
  config.resolve.fallback = { stream: require.resolve('stream-browserify') }
  return config
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment -- webpack config file*/
/* eslint-enable @typescript-eslint/no-unsafe-call -- webpack config file*/
/* eslint-enable @typescript-eslint/no-unsafe-return -- webpack config file*/
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- webpack config file*/
