module.exports = async function (config, options) {
  await config.addPlugin([
    __dirname + '/src/plugins/ExpressPlugin.js',
    __dirname + '/src/plugins/SslPlugin.js',
    __dirname + '/src/plugins/StaticPlugin.js',
    __dirname + '/src/plugins/WebsitePlugin.js',
    __dirname + '/src/plugins/PublishPlugin.js',
  ])

  // Return an object to be merged with Silex config
  return {}
}
