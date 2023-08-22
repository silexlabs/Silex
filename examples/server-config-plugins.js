const StaticPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/StaticPlugin').default

module.exports = (config, opts) => {
  config.addPlugin(StaticPlugin, {
    routes: [
      {
        route: '/plugins/',
        path: __dirname + '/../dist/plugins/client',
      }, {
        route: '/plugins/js/lit-html/',
        path: 'node_modules/lit-html/',
      },
    ],
  })
}
