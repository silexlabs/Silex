module.exports = function (silexConfig, options) {
  silexConfig.addPlugin([
    __dirname + '/src/plugins/ExpressPlugin.js',
    __dirname + '/src/plugins/SslPlugin.js',
    __dirname + '/src/plugins/StaticPlugin.js',
    __dirname + '/src/plugins/WebsitePlugin.js',
    __dirname + '/src/plugins/PublishPlugin.js',
  ], {
    'src/plugins/WebsitePlugin.js': {
      backend: 'src/plugins/DefaultBackend.js',
    },
    'src/plugins/PublishPlugin.js': {
      backend: 'src/plugins/DefaultBackend.js',
    },
  })

  // Return an object to be merged with Silex config
  return {}
}
