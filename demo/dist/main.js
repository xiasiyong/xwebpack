(function(modules) {
  // 12 webpackJsonpCassback 合并modules， 修改promise的状态
  function webpackJsonpCallback(data) {
    var chunkIds = data[0]
    var moreModules = data[1]
    let chunkId, resolves = []
    for (var i = 0; i < chunkIds.length; i++) {
      chunkId = chunkIds[i]
      if (Object.prototype.hasOwnProperty.call(installedChunks, chunkId) && installedChunks[chunkId]) {
        resolves.push(installedChunks[chunkId][0])
      }
      installedChunks[chunkId] = 0
    }
    // 合并modules
    for (var moduleId in moreModules) {
      modules[moduleId] = moreModules[moduleId]
    }
    // 修改promise的状态
    while (resolves.length) {
      resolves.shift()()
    }
  }
  // 1 定义一个对象，用于缓存已经加载的模块
  var installedModules = {}
  // 已经加载过的chunks， 0 表示已经安装过，promise代表正在安装，undefined代表从未按照你黄
  var installedChunks = {
    main: 0
  }
  // 2 实现 __webpack_require__ 方法，接收一个moduleId, 返回被加载模块的exports属性
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
  // 3 给 __webpack_require__ 添加一个 m 属性，方便访问 modules
  __webpack_require__.m = modules
  // 4 给 __webpack_require__ 添加一个 c 属性，方便访问 installedModules
  __webpack_require__.c = installedModules
  // 5. 给 __webpack_require__ 添加一个 o 方法，判断对象是否存在某个属性
  __webpack_require__.o= function(exports, name) {
    return Object.prototype.hasOwnProperty.call(exports, name)
  }
  // 6. 给 __webpack_require__ 添加 d 方法，给对象的属性添加getter
  __webpack_require__.d = function(exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, {
        enumerable: true,
        get: getter
      })
    }
  }
  // 7.给 __webpack_require__ 添加 r 方法, 给esModule模块添加表示
  __webpack_require__.r = function(module) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(module, Symbol.toStringTag, { value: 'Module' })
    }
    Object.defineProperty(module, '__esModule', { value: true })
  }

  // 8. 给 __webpack_require__ 添加 n 方法，用于设置具体的getter
  __webpack_require__.n = function(module) {
    var getter = module && module.__esModule ?
      function() { return module['default'] } :
      function() { return module }
      __webpack_require__.d(getter, 'a', getter)
    return getter
  }
  // 11. 给 __webpack_require__ 添加 t 方法， 接受一个 value 模块 id 和 mode， 经过一定的规则，处理模块的内容之后再返回
  __webpack_require__.t = function(value, mode) {
    if (mode & 1) {
      value = __webpack_require__(value)
    }

    if (mode & 8) { // 直接可以使用的commonjs 
      return value
    }

    if ((mode & 4) && typeof value === 'object' && value && value.__esModule) {
      return value
    }

    let ns = Object.create(null)
    __webpack_require__.r(ns)
    Object.defineProperty(ns, 'default', { enumerable: true, value: value })
    if (mode & 2 && typeof value !== 'string') {
      for (var key in value) {
        __webpack_require__.d(ns, key, function(key) {
          return value[key]
        }.bind(null, key))
      }
    }
    return ns
  }

  // 14 
  function jsonpScriptSrc(chunkId) {
    return __webpack_require__.p + '' + chunkId + '.bundle.js'
  }

  // 13 实现 __webpack_require__.e 通过jsonp，加载异步模块
  __webpack_require__.e = function(chunkId) {
    const promises = []
    let installedChunkData = installedChunks[chunkId]
    if (installedChunkData !== 0) {
      if (installedChunkData) { // 正在加载中
        promises.push(installedChunkData[2])
      } else {
        const promise = new Promise((resolve, reject) => {
          installedChunkData = installedChunks[chunkId] = [resolve, reject]
        })
        promises.push(installedChunkData[2] = promise)

        // start chunk loading
        var script = document.createElement('script')
        script.src = jsonpScriptSrc(chunkId)
        document.head.appendChild(script)
      }
    }
    return Promise.all(promises)
  }

  // 12. 重写 webpackJsonp 的push方法
  var jsonpArray = window['webpackJsonp'] = window['webpackJsonp'] || []
  var oldJsonpFunction = jsonpArray.push.bind(jsonpArray)
  jsonpArray.push = webpackJsonpCallback

  // 9. 给 __webpack_require__ 添加 p ，保存配置文件中的publicPath
  __webpack_require__.p = ''

  // 10. 调用 __webpack_require__ , 并传入入口文件的键名
  __webpack_require__(__webpack_require__.s = './src/index.js')

})({
  
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