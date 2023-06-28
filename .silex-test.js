const FtpBackend = require('./src/plugins/FtpBackend')

module.exports = async function (config, options) {
  config.setHostingProviders([new FtpBackend({})])
  return {}
}
