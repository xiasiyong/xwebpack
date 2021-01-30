class Chunk {
  constructor(entryModule) {
    this.entryModule = entryModule
    this.name = entryModule.name
    this.files = []
    this.modules = []
  }
}

module.exports = Chunk