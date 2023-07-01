const FtpBackend = require('./src/ts/plugins/FtpBackend')

module.exports = async function (config, options) {
  config.setHostingProviders([new FtpBackend({})])
  config.setStorage(new FtpBackend({})) 
  return {}
}
