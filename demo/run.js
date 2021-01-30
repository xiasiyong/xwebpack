// const webpack = require('webpack')
const webpack = require('../lib/webpack')
const webpackConfig = require('./webpack.config')

const compiler = webpack(webpackConfig)

compiler.run((err, stats) => {
  console.log(err)
  console.log(stats)
})