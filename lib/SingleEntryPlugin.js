class SingleEntryPlugin {
  constructor(context, entry, name) {
    this.context = context
    this.entry = entry
    this.name = name
  }

  apply(compiler) {
    compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
      console.log('make 钩子执行啦')
      compilation.addEntry(this.context, this.entry, this.name, callback)
      // callback()
    })
  }
}

module.exports = SingleEntryPlugin