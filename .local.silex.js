const { ConnectorType } = require(__dirname + '/dist/server/types')
const FtpConnector = require(__dirname + '/dist/plugins/server/plugins/server/FtpConnector').default
const GitlabConnector = require(__dirname + '/dist/plugins/server/plugins/server/GitlabConnector').default
const GitlabHostingConnector = require(__dirname + '/dist/plugins/server/plugins/server/GitlabHostingConnector').default


module.exports = async function(config) {
  config.setStorageConnectors([
    new FtpConnector(config, {
      type: ConnectorType.STORAGE,
    }),
    new GitlabConnector(config, {
      type: ConnectorType.STORAGE,
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      scope: process.env.GITLAB_SCOPE,
      domain: process.env.GITLAB_DOMAIN,
    })
  ])

  config.setHostingConnectors([
    new FtpConnector(config, {
      type: ConnectorType.HOSTING,
    }),
    new GitlabHostingConnector(config, {
      type: ConnectorType.HOSTING,
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      scope: process.env.GITLAB_SCOPE,
      domain: process.env.GITLAB_DOMAIN,
      timeout: process.env.GITLAB_TIMEOUT,
    })
  ])
}
