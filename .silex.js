const ExpressPlugin = require('./dist/plugins/ExpressPlugin').default
const SslPlugin = require('./dist/plugins/SslPlugin').default
const StaticPlugin = require('./dist/plugins/StaticPlugin').default
const WebsitePlugin = require('./dist/plugins/WebsitePlugin').default
const PublicationPlugin = require('./dist/plugins/PublicationPlugin').default

module.exports = async function(config, options) {
  try {
    await config.addPlugin([
      ExpressPlugin,
      SslPlugin,
      StaticPlugin,
      WebsitePlugin,
      PublicationPlugin,
    ])
  } catch(e) {
    console.error(e)
  }

  // Return an object to be merged with Silex config
  return {}
}
