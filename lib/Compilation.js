const path = require('path')
const Parser = require('./Parser')
const async = require('neo-async')
const NormalModuleFactory = require('./NormalModuleFactory')
const normalModuleFactory = new NormalModuleFactory()
const ejs = require('ejs')
const Chunk = require('./Chunk')
const parser = new Parser()

const {
  Tapable, 
  SyncHook
} = require('tapable')

class Compilation extends Tapable{
  constructor(compiler) {
    super()
    this.compiler = compiler
    this.context = compiler.context
    this.options = compiler.options
    this.inputFileSystem = compiler.inputFileSystem
    this.outputFileSystem = compiler.outputFileSystem
    this.entries = [] // 存放所有入口模块
    this.modules = [] // 存放所有模块的数据
    this.chunks = []
    this.assets = {}
    this.files = []
    this.hooks = {
      succeedModule: new SyncHook(['module']),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook()
    }
  }
  /**
   * 
   * @param {*} context 当前项目的根路径
   * @param {*} entry 当前的入口文件
   * @param {*} name chunkName main
   * @param {*} callback 回调
   */
  addEntry(context, entry, name, callback) {
    return this._addModuleChain(context, entry, name, callback)
  }
  createModule(data, doAddEntry, callback) {
    let module = normalModuleFactory.create(data)

    const afterBuild = (err, module) => {
      if (module.dependencies.length > 0) {
        this.processDependencies(module, (err, module) => {
          callback(err, module)
        })
      } else {
        callback(err, module)
      }
    }
    this.buildModule(module, afterBuild)

    // Build之后，将module保存
    doAddEntry && doAddEntry(module)
    this.modules.push(module)
  }
  _addModuleChain(context, entry, name, callback) {
    this.createModule({
      context,
      name,
      rawRequest: entry,
      resource: path.posix.join(context, entry),
      parser,
      // moduleId: './' + path.posix.relative(path.posix.join(context, entry), context)
      moduleId: './' + path.posix.relative(context, path.posix.join(context, entry))
    }, (module) => {
      this.entries.push(module)
    }, callback)
  }
  buildModule(module, callback) {
    module.build(this, (err) => {
      // 意味着build过程完成了
      this.hooks.succeedModule.call(module)
      callback(err, module)
    })
  }
  processDependencies(module, callback) {
    const dependencies = module.dependencies
    async.forEach(dependencies, (dependency, done) => {
      this.createModule({
        context: dependency.context,
        name: dependency.name,
        rawRequest: dependency.rawRequest,
        resource: dependency.resource,
        moduleId: dependency.moduleId,
        parser,
      }, null, done)
    }, callback)
  }
  seal(callback) {
    this.hooks.seal.call()
    this.hooks.beforeChunks.call()
    for (const entryModule of this.entries) {
      const chunk = new Chunk(entryModule)
      this.chunks.push(chunk)
      chunk.modules = this.modules.filter(module => module.name === chunk.name)
    }

    this.hooks.afterChunks.call(this.chunks)

    this.createChunks()
    callback()
  }
  createChunks() {
    for (const chunk of this.chunks) {
      const fileName = chunk.name + '.js'
      chunk.files.push(fileName)

      // 使用ejs渲染模块
      const tempFile = path.posix.join(__dirname, 'template/main.ejs')
      const tempCode = this.inputFileSystem.readFileSync(tempFile, 'utf8')
      const tempRender = ejs.compile(tempCode)
      const source = tempRender({
        entryModuleId: chunk.entryModule.moduleId,
        modules: chunk.modules
      })
      // 输出文件
      this.emitAssets(fileName, source)
    }
  }
  emitAssets(fileName, source) {
    this.assets[fileName] = source
    this.files.push(fileName)
  }
}

module.exports = Compilation