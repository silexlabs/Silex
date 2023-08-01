const { ConnectorType } = require('@silexlabs/silex/dist/server/types')
const FtpConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/FtpConnector').default
const DownloadPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/DownloadConnector').default
const GitlabConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/GitlabConnector').default
const dash = require('@silexlabs/silex-dashboard')

module.exports = async function (config) {
  await config.addPlugin(dash)

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
      scope: process.env.GITLAB_SCOPE,
    }),
  ])
}
