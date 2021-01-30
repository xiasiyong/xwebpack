const path = require('path')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
const types = require('@babel/types')

class NormalModule {

  constructor(data) {
    this.context = data.context
    this.name = data.name
    this.rawRequest = data.rawRequest
    this.resource = data.resource
    this.moduleId = data.moduleId
    // todo
    this.parser = data.parser
    this._ast = ''
    this._source = ''
    this.dependencies = []
  }

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
            node.callee.name = '__webpack_require__'
            node.arguments = [types.stringLiteral(depModuleId)]
          }
        }
      })

      const { code } = generator(this._ast)
      this._source = code
      callback(err)
    })
  }
  doModule(compliation, callback) {
    this.getSource(compliation, (err, source) => {
      this._source = source
      callback(err)
    })
  }
  getSource(compliation, callback) {
    compliation.inputFileSystem.readFile(this.resource, 'utf8', callback)
  }
}

module.exports = NormalModule