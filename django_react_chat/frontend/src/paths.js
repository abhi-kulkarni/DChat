const path = require('path')

module.exports = {
  // Source files

  entry: path.resolve(__dirname, './index.js'),

  src: path.resolve(__dirname, ''),

  // Production build files
  build: path.resolve(__dirname, '../static/dist'),

  // Static files that get copied to build folder
  public: path.resolve(__dirname, './static'),

}
