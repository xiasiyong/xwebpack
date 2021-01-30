const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'none',
  context: process.cwd(),
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('dist')
  }
}