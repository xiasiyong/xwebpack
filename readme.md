# webpack源码学习

> github地址： https://github.com/xiasiyong/xwebpack

# 项目准备

```js
// src/index.js
const name = require('./login')
console.log(name)

// src/login.js
module.exports = 'xiasy'

// webpack.config.js
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
```

## 依赖安装并打包

```js
yarn add webpack@4 webpack-cli@3
yarn webpack
```

## 打包文件分析

> webpack打包后端文件就是一个自执行函数，传入被打包的模块组成的对象，该函数里面有很多方法。

```js
(function(modules) {
  var installedModules = {}
  function __webpack_require__(moduleId) {
  }
  __webpack_require__.m = modules
  __webpack_require__.c = installedModules
  __webpack_require__.o= function(exports, name) {
  }
  __webpack_require__.d = function(exports, name, getter) {
  }
  __webpack_require__.r = function(module) {
  }
  __webpack_require__.n = function(module) {
  }
  __webpack_require__.t = function(value, mode) {
  }
  __webpack_require__.p = ''
  __webpack_require__(__webpack_require__.s = './src/index.js')
})({
    "./src/index.js":
    (function(module, exports, __webpack_require__) {
    }),
    "./src/login.js":
    (function(module, exports, __webpack_require__) {
    }),
 });
```

1. installedModules 一个缓存对象，已经加载过的模块缓存到这里，再一次加载的时候直接从缓存中取
2. __webpack_require__, 核心方法，webpack自己实现的模块加载器
3. __webpack_require__.m， 缓存modules，方便获取
4. __webpack_require__.c，installedModules的快捷引用
5. __webpack_require__.o，判断对象是是否存在某个属性
6. __webpack_require__.d 给对象添加getter方法
7. __webpack_require__.r，给esmodule添加__esModule标记，如果支持Symbol的话，添加Symbol.toStringTag，这样typeof someEsModule === 'Module'
8. __webpack_require__.n, 给指定模块设置getter方法，处理commonjs的导入
9.  __webpack_require__.t， 接受一个 value 模块 id 和 mode， 经过一定的规则，处理模块的内容之后再返回
10. __webpack_require__.p， 保存配置文件中的publicPath

## __webpack_require__方法实现

```js
function __webpack_require__(moduleId) {
    // 2-1 先判断缓存是有没有，有就返回对应模块的 exports
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports
    }
    // 2-2
    // 如果没有，就加载对应的模块
    // 记载的方法就是，先定义一个 module， 里面有 exports 属性， 调用模块对应的函数的时候，将 module 通过 实参传递进去，在模块内部，给 module.exports 赋值，然后我们就可以拿到模块暴露出来的内容了
    var module = installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    }
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__)

    // 2-3 执行玩之后，修改 l 状态
    module.l = true
    // 2-4 返回模块中exports的内容，供加载这个模块的地方使用
    return module.exports
  }
```

## modules 对象生成

```js
// webpack打包后的文件，是一个自执行函数，传入一个对象，对象里面是每一个模块的信息，key是moduleId， value是模块对应的内容，webpack的内核打包，主要就是生成这个对象
({
    "./src/index.js":
    (function(module, exports, __webpack_require__) {
      const name = __webpack_require__("./src/login.js");
			console.log(name);
    }),
    "./src/login.js":
    (function(module, exports, __webpack_require__) {
      module.exports = 'xiasy';
    }),
 });
```

## 方便webpack调试，根目录下新建run.js 

```js
const webpack = require('webpack')
const webpackConfig = require('./webpack.config')

const compiler = webpack(webpackConfig)

compiler.run((err, stats) => {
  console.log(err)
  console.log(stats)
})
```

## webpack源码实现

1. webpack入口文件

   ```js
   const Compiler = require('./Compiler') // 负责编译
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
   ```

2.  new Compiler

   ```js
   const compiler = new Compiler(options.context) // options.context 
   compiler.options = optionswebpack.config.js中配置
   // webpack.config.js
   module.exports = {
     ...
     context: process.cwd(),
     ...
   }
   // ./lib/Compiler.js
   const {
     Tapable,
     SyncHook,
     SyncBailHook,
     AsyncSeriesHook,
     AsyncParallelHook
   } = require('tapable')
   
   class Compiler extends Tapable{
     constructor(context) {
       super()
       this.context = context
       this.hooks = { // webpack的插件机制，在每一个环节都会插入对应的钩子，方便通过plugin扩展功能
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
   }
   
   module.exports = Compiler
   ```

3. NodeEnvironmentPlugin，  给compiler赋予文件读写的能力

   ```js
   new NodeEnvironmentPlugin().apply(compiler)
   //./node/NodeEnvironmentPlugin
   const fs = require('fs')
   
   class NodeEnvironmentPlugin {
     constructor(options) {
       this.options = options || {};
     }
     apply(compiler) {
       compiler.inputFileSystem = fs // 简单实用fs代替
       compiler.outputFileSystem = fs
     }
   }
   
   module.exports = NodeEnvironmentPlugin
   ```

4. 自定义plugin挂载，其实就是初始化好每一个钩子的监听函数，将来在某个钩子触发的时候，对执行对应的回调

   ```js
   // 3 将options传入的plugins挂载到compiler上
   if (options.plugins && Array.isArray(options.plugins)) {
     for (const plugin of options.plugins) {
       plugin.apply(compiler)
     }
   }
   ```

5. WebpackOptionsApply， 加载webpack内置的很多插件，最主要的就是 entryOptionPlugin，

   经过entryOptionPlugin之后，就等于是监听好了make钩子，等make钩子触发callAsync的时候，就调用compliation.addEntry开始打包

   ```js
   
   new WebpackOptionsApply().process(options, compiler);
   
   // WebpackOptionsApply.js
   // EntryOptionPlugin只是其中的一个插件，作用就是初始化webpack打包的入口
   const EntryOptionPlugin = require('./EntryOptionPlugin')
   
   class WebpackOptionsApply {
     process(options, compiler) {
       new EntryOptionPlugin().apply(compiler);
       compiler.hooks.entryOption.call(options.context, options.entry)
     }
   }
   
   module.exports = WebpackOptionsApply
   
   // EntryOptionPlugin.js
   // 源码中还包括很多，比如多入口打包，这里只考虑单入口打包的情况
   
   const SingleEntryPlugin = require('./SingleEntryPlugin')
   
   const itemToPlugin = function(context, entry, name) {
     return new SingleEntryPlugin(context, entry, name)
   }
   class EntryOptionPlugin {
     apply(compiler) {
       compiler.hooks.entryOption.tap('EntryOptionPlugin', (context, entry) => {
         itemToPlugin(context, entry, 'main').apply(compiler)
       })
     }
   }
   
   module.exports = EntryOptionPlugin
   
   // SingleEntryPlugin.js
   class SingleEntryPlugin {
     constructor(context, entry, name) {
       this.context = context
       this.entry = entry
       this.name = name
     }
   
     apply(compiler) {
       compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => { // 只是监听，并没有执行，需要等到make触发callAsync在执行
         console.log('make 钩子执行啦')
         compilation.addEntry(this.context, this.entry, this.name, callback)
       })
     }
   }
   
   module.exports = SingleEntryPlugin
   ```

6. compiler.run

   ```js
   // run.js
   compiler.run((err, stats) => {
     console.log(err)
     console.log(stats)
   })
   
   // compiler.js
   // run 方法
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
         this.compile(onCompiled) // 触发对应的钩子之后，开始compile
       })
     })
   }
   // compile方法
   compile(calllback) {
     const params = this.newCompliationParams()
     this.hooks.beforeCompile.callAsync(params, err => {
       this.hooks.compile.call(params)
       const compilation = this.newCompilation(params)
       this.hooks.make.callAsync(compilation, err => {
         // 在这里触发了make钩子，然后在SingleEntryPlugin.js中才调用 compilation.addEntry
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
   ```

7. 进行下一步之前，先了解一下compilation，在complier执行compile方法的时候，会初始化一个compilation

   ```js
   // compiler.js 
   const compilation = this.newCompilation(params)
   newCompilation(params) {
     const compilation = this.createCompilation(); 
     return compilation
   }
   createCompilation() {
     return new Compilation(this)
   }
   // Compilation.js 简化版
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
   }
   
   module.exports = Compilation
   ```

8. 在complier中的compile方法冲触发了make钩子， make钩子在SingleEntryPlugin.js注册了监听，触发之后会执行compilation.addEntry

   ```js
   // SingleEntryPlugin.js
   apply(compiler) {
     compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
       console.log('make 钩子执行啦')
       compilation.addEntry(this.context, this.entry, this.name, callback)
     })
   }
   
   // Compilation.js
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
   // _addModuleChain
   _addModuleChain(context, entry, name, callback) {
     this.createModule({
       context,
       name,
       rawRequest: entry,
       resource: path.posix.join(context, entry),
       parser,
       moduleId: './' + path.posix.relative(context, path.posix.join(context, entry))
     }, (module) => { // 如果是入口文件，添加到entries中
       this.entries.push(module)
     }, callback)
   }
   // webpack的打包模块的思想都是先通过normalModuleFactory创建一个模块，然后再调用这个模块的build方法进行一系列的操作，了解createModule之前，先了解一下normalModuleFactory
   // normalModuleFactory.js
   const NormalModule = require("./NormalModule")
   class NormalModuleFactory {
     create(data) {
       return new NormalModule(data)
     }
   }
   module.exports = NormalModuleFactory
   
   // NormalModule
   class NormalModule {
     constructor(data) {
       this.context = data.context
       this.name = data.name
       this.rawRequest = data.rawRequest
       this.resource = data.resource
       this.moduleId = data.moduleId
       this.parser = data.parser
       this._ast = ''
       this._source = ''
       this.dependencies = []
     }
     build(compliation, callback) {
     }
   }
   module.exports = NormalModule
   
   // createModule
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
   // buildModule
   buildModule(module, callback) {
     module.build(this, (err) => {
       // 意味着build过程完成了
       this.hooks.succeedModule.call(module)
       callback(err, module)
     })
   }
   // NormalModule.js 
   build(compliation, callback) {
     this.doModule(compliation, callback)
   }
   doModule(compliation, callback) {
     this.getSource(compliation, (err, source) => {
       this._source = source
       callback(err) // 执行到了这里之后，拿到了模块的源代码，又回到了build函数中执行对应的回调
     })
   }
   getSource(compliation, callback) {
     compliation.inputFileSystem.readFile(this.resource, 'utf8', callback)
   }
   // build
   build(compliation, callback) {
     // 1. 从文件中读取对应的内容
     // 2. 如果不是js文件，则需要交给对应的loader先处理
     // 3. 处理完成之后，就可以将js转换成ast语法树，处理esm和commonjs调用
     // 4. 如果当前js又引用了其他的模块，则需要递归的调用
     this.doModule(compliation, (err) => {
       this._ast = this.parser.parse(this._source)
       traverse(this._ast, {
         CallExpression: (nodePath) => {
           const node = nodePath.node
           if (node.callee.name === 'require') {
             const modulePath = node.arguments[0].value // './login'
             let moduleName = modulePath.split(path.posix.sep).pop() // login
             const ext = moduleName.includes('.') ? '' : '.js'
             moduleName += ext // login.js
             // 绝对路径，方便加载资源
             const depResouce = path.posix.join(path.posix.dirname(this.resource), moduleName)
             // 当前模块的Id
             const depModuleId = './' + path.posix.relative(this.context, depResouce) // ./src/login.js
   
             this.dependencies.push({
               name: this.name, // todo
               resource: depResouce,
               moduleId: depModuleId,
               rawRequest: moduleName,
               context: this.context
             })
             // 替换内容
             node.callee.name = '__webpack_require__' // 替换require
             node.arguments = [types.stringLiteral(depModuleId)]
           }
         }
       })
   
       const { code } = generator(this._ast)
       this._source = code
       callback(err) // 执行到了这里，又回到了 Compliation.js中的createModule执行afterBuild
     })
   }
   ```

9. 经过上一步之后，我们得到了对应的*module*，以及*module*中的依赖模块dependencies

   ```js
   // Compliation.js 执行 afterBuild
   createModule(data, doAddEntry, callback) {
     let module = normalModuleFactory.create(data)
     const afterBuild = (err, module) => { 
       if (module.dependencies.length > 0) { // 如果有依赖的模块，则需要递归处理,等所有的依赖模块都处理完成之后，再来执行对应的回调
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
   // processDependencies
   processDependencies(module, callback) {
     const dependencies = module.dependencies
     // async是第三方库，等所有的依赖模块都加载完成之后，再执行对应的回调
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
   ```

10. afterBuild之后，我们拿到了entries， modules，就完成了make的操作，然后回调make的回调中调用 compilation.seal方法来处理chunk

    ```js
    // Compiler.js
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
    // 在了解seal之前，先熟悉Chunk类
    // Chunk.js
    class Chunk {
      constructor(entryModule) {
        this.entryModule = entryModule
        this.name = entryModule.name
        this.files = []
        this.modules = []
      }
    }
    module.exports = Chunk
    
    // Compilation.js 
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
    ```

11. chunk处理完成之后，会调用Compliation 的emitAssets方法，将对应的内容存放在assets中，顺便将文件名添加到files中，方便查看生成了那些文件

    ```js
    emitAssets(fileName, source) {
      this.assets[fileName] = source
      this.files.push(fileName)
    }
    ```

12. 执行完createChunks之后，调用对应的callback，回到Compiler.js，再触发compile方法的回调执行onCompiled

    ```js
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
    ```

13. onCompiled方法

    ```js
    const onCompiled = (err, compliation) => {
      // 最终在这里将处理好的 chunk 写入到指定的文件然后输出至 dist 
      this.emitAssets(compliation, (err) => {
        finnalCallback(err, new Stats(compliation))
      })
    }
    // 最终生成对应的文件
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
    ```

    