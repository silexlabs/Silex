const prodConfig = require('./webpack.config')

module.exports = {
  ...prodConfig,
  //devtool: 'inline-source-map',
  devtool: 'source-map',
  mode: 'development',
};
