const Compiler = require('./Compiler')
const NodeEnvironmentPlugin = require('./node/NodeEnvironmentPlugin')
const WebpackOptionsApply = require('./WebpackOptionsApply')

const webpack = function(options) {
  // 1 初始化compiler
  const compiler = new Compiler(options.context)
  compiler.options = options
  // 2 给compiler赋予文件读写的能力
  new NodeEnvironmentPlugin().apply(compiler)
  // 3 将options传入的plugins挂载到compiler上
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler)
    }
  }
  // 4 加载webpack内置的很多插件，比如 entryOptionPlugin
  new WebpackOptionsApply().process(options, compiler);
  // 5 返回compiler
  return compiler
}

module.exports = webpack