const {
  Tapable,
  SyncHook,
  SyncBailHook,
  AsyncSeriesHook,
  AsyncParallelHook
} = require('tapable')
const Stats = require('./Stats')
const path = require('path')
const mkdirp = require('mkdirp')

const CreateNormalModuleFactory = require('./CreateNormalModuleFactory')
const Compilation = require('./Compilation')

class Compiler extends Tapable{
  constructor(context) {
    super()
    this.context = context
    this.hooks = {
      done: new AsyncSeriesHook(["stats"]),
			beforeRun: new AsyncSeriesHook(["compiler"]),
			run: new AsyncSeriesHook(["compiler"]),
			emit: new AsyncSeriesHook(["compilation"]),
			thisCompilation: new SyncHook(["compilation", "params"]),
			compilation: new SyncHook(["compilation", "params"]),
      entryOption: new SyncBailHook(["context", "entry"]),
			beforeCompile: new AsyncSeriesHook(["params"]),
			compile: new SyncHook(["params"]),
			make: new AsyncParallelHook(["compilation"]),
			afterCompile: new AsyncSeriesHook(["compilation"]),
    }
  }
  newCompliationParams() {
    const params = {
      normalModuleFactory: new CreateNormalModuleFactory()
    }
    return params
  }
  compile(calllback) {
    const params = this.newCompliationParams()
    this.hooks.beforeCompile.callAsync(params, err => {
      this.hooks.compile.call(params)
      const compilation = this.newCompilation(params)
      this.hooks.make.callAsync(compilation, err => {
        console.log('make钩子的监听执行了')
        // 开始处理chunk
        compilation.seal((err) => {
          this.hooks.afterCompile.callAsync(compilation, (err) => {
            calllback(err, compilation)
          })
        })
      })
    })
  }
  newCompilation(params) {
    const compilation = this.createCompilation(); 
    return compilation
  }
  createCompilation() {
    return new Compilation(this)
  }
  emitAssets(compliation, callback) {
    const emitFiles= (err) => {
      const assets = compliation.assets
      const outputPath = this.options.output.path
      for (const file in assets) {
        const source = assets[file]
        const targetPath = path.posix.join(outputPath, file)
        this.outputFileSystem.writeFileSync(targetPath, source, 'utf8')
      }
      callback(err)
    }
    // 创建好目录之后再写入
    this.hooks.emit.callAsync(compliation, (err) => {
      mkdirp.sync(this.options.output.path)
      emitFiles()
    })
  }
  run(callback) {
    console.log('start run')
    const finnalCallback = function(err, stats) {
      return callback(err, stats)
    }
    const onCompiled = (err, compliation) => {
      // 最终在这里将处理好的 chunk 写入到指定的文件然后输出至 dist 
      this.emitAssets(compliation, (err) => {
        finnalCallback(err, new Stats(compliation))
      })
    }

    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, err => {
        this.compile(onCompiled)
      })
    })
  }
}

module.exports = Compiler