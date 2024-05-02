const { ConnectorType } = require('@silexlabs/silex/dist/server/types')
const FtpConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/FtpConnector').default
const DownloadPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/DownloadConnector').default
const GitlabConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/GitlabConnector').default
const dash = require('@silexlabs/silex-dashboard')
const StaticPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/StaticPlugin').default
const node_modules = require('node_modules-path')
const onboarding = require(__dirname + '/server-plugins/onboarding.js')

// Create an alternate version of the the Gitlab connector
class FramagitConnector extends GitlabConnector {
  connectorId = 'framagit'
  displayName = 'Framagit'
  constructor(config, options) {
    super(config, options)
  }
}

module.exports = async function (config) {
  await config.addPlugin(dash)
  await config.addPlugin(onboarding)

  config.setHostingConnectors([
    new FtpConnector(config, {
      type: ConnectorType.HOSTING,
    }),
    new DownloadPlugin(config),
  ])

  config.setStorageConnectors([
    new FtpConnector(config, {
      type: ConnectorType.STORAGE,
    }),
    new GitlabConnector(config, {
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      domain: process.env.GITLAB_DOMAIN,
    }),
    new FramagitConnector(config, {
      clientId: process.env.FRAMAGIT_CLIENT_ID,
      clientSecret: process.env.FRAMAGIT_CLIENT_SECRET,
      domain: process.env.FRAMAGIT_DOMAIN,
    }),
  ])

  // CMS Plugin
  config.addPlugin(StaticPlugin, {
    routes: [
      {
        route: '/js/silex-cms/',
        path: node_modules('@silexlabs/silex-cms') + '/@silexlabs/silex-cms/dist/',
      },
      {
        route: '/js/client-plugins/',
        path: './client-plugins/',
      },
    ],
  })
}
