const { ConnectorType } = require('@silexlabs/silex/dist/server/types')
const FtpConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/FtpConnector').default
const DownloadConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/DownloadConnector').default
const GitlabConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/GitlabConnector').default
const GitlabHostingConnector = require('@silexlabs/silex/dist/plugins/server/plugins/server/GitlabHostingConnector').default
const { FsStorage } = require('@silexlabs/silex/dist/server/server/connectors/FsStorage')
const { FsHosting } = require('@silexlabs/silex/dist/server/server/connectors/FsHosting')
const dash = require('@silexlabs/silex-dashboard')
const StaticPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/StaticPlugin').default
const node_modules = require('node_modules-path')
const onboarding = require(__dirname + '/server-plugins/onboarding.js')
const { join } = require('path')

module.exports = async function (config) {
  await config.addPlugin(dash)
  await config.addPlugin(onboarding)

  initConnectors(config)
  //config.setHostingConnectors([
  //  new FtpConnector(config, {
  //    type: ConnectorType.HOSTING,
  //  }),
  //  new DownloadPlugin(config),
  //])

  //config.setStorageConnectors([
  //  new FtpConnector(config, {
  //    type: ConnectorType.STORAGE,
  //  }),
  //  new GitlabConnector(config, {
  //    clientId: process.env.GITLAB_CLIENT_ID,
  //    clientSecret: process.env.GITLAB_CLIENT_SECRET,
  //    domain: process.env.GITLAB_DOMAIN,
  //  }),
  //  new FramagitConnector(config, {
  //    clientId: process.env.FRAMAGIT_CLIENT_ID,
  //    clientSecret: process.env.FRAMAGIT_CLIENT_SECRET,
  //    domain: process.env.FRAMAGIT_DOMAIN,
  //  }),
  //])

  // CMS Plugin
  config.addPlugin(StaticPlugin, {
    routes: [
      {
        route: '/js/client-plugins/',
        path: './client-plugins/',
      },
    ],
  })
}

const env = {
  STORAGE_CONNECTORS: process.env.STORAGE_CONNECTORS || 'ftp',
  HOSTING_CONNECTORS: process.env.HOSTING_CONNECTORS || 'ftp,download',
  SILEX_FS_ROOT: process.env.SILEX_FS_ROOT || join(process.cwd(), '/silex/storage'),
  SILEX_FS_HOSTING_ROOT: process.env.SILEX_FS_HOSTING_ROOT || join(process.cwd(), '/silex/hosting'),
  GITLAB_DISPLAY_NAME: process.env.GITLAB_DISPLAY_NAME || 'Gitlab',
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET,
  GITLAB_DOMAIN: process.env.GITLAB_DOMAIN,
  GITLAB2_DISPLAY_NAME: process.env.GITLAB2_DISPLAY_NAME || 'Gitlab',
  GITLAB2_CLIENT_ID: process.env.GITLAB2_CLIENT_ID,
  GITLAB2_CLIENT_SECRET: process.env.GITLAB2_CLIENT_SECRET,
  GITLAB2_DOMAIN: process.env.GITLAB2_DOMAIN,
  FTP_STORAGE_PATH: process.env.FTP_STORAGE_PATH || '/silex/storage',
  FTP_HOSTING_PATH: process.env.FTP_HOSTING_PATH || '',
}

// Create alternate versions of the the Gitlab connector
class GitlabConnector1 extends GitlabConnector {
  displayName = env.GITLAB_DISPLAY_NAME
  constructor(config, options) {
    super(config, options)
  }
}

class GitlabConnector2 extends GitlabConnector {
  connectorId = 'gitlab2'
  displayName = env.GITLAB2_DISPLAY_NAME
  constructor(config, options) {
    super(config, options)
  }
}

class GitlabHostingConnector1 extends GitlabHostingConnector {
  displayName = env.GITLAB_DISPLAY_NAME
  constructor(config, options) {
    super(config, options)
  }
}

class GitlabHostingConnector2 extends GitlabHostingConnector {
  connectorId = 'gitlab2'
  displayName = env.GITLAB2_DISPLAY_NAME
  constructor(config, options) {
    super(config, options)
  }
}

function initConnectors(config) {
  // Add storage and hosting connectors from env vars
  if (env.STORAGE_CONNECTORS) {
    config.setStorageConnectors([])
    const connectors = env.STORAGE_CONNECTORS.split(',')
    connectors.forEach((connector) => {
      console.info('> Add storage connector from env var:', connector)
      switch (connector) {
        case 'fs':
          config.addStorageConnector(new FsStorage(config, {
            path: env.SILEX_FS_ROOT,
          }))
          break
        case 'gitlab':
          config.addStorageConnector(new GitlabConnector1(config, {
            clientId: env.GITLAB_CLIENT_ID,
            clientSecret: env.GITLAB_CLIENT_SECRET,
            domain: env.GITLAB_DOMAIN,
          }))
          break
        case 'gitlab2':
          config.addStorageConnector(new GitlabConnector2(config, {
            clientId: env.GITLAB2_CLIENT_ID,
            clientSecret: env.GITLAB2_CLIENT_SECRET,
            domain: env.GITLAB2_DOMAIN,
          }))
          break
        case 'ftp':
          config.addStorageConnector(new FtpConnector(config, {
            type: ConnectorType.STORAGE,
            path: env.FTP_STORAGE_PATH,
          }))
          break
        default:
          console.error('Unknown storage connector', connector)
          throw new Error(`Unknown storage connector ${connector}`)
      }
    })
  }

  if (env.HOSTING_CONNECTORS) {
    config.setHostingConnectors([])
    const connectors = env.HOSTING_CONNECTORS.split(',')
    connectors.forEach((connector) => {
      console.info('> Add hosting connector from env var:', connector)
      switch (connector) {
        case 'fs':
          config.addHostingConnector(new FsHosting(config, {
            path: env.SILEX_FS_HOSTING_ROOT,
          }))
          break
        case 'gitlab':
          config.addHostingConnector(new GitlabHostingConnector1(config, {
            clientId: env.GITLAB_CLIENT_ID,
            clientSecret: env.GITLAB_CLIENT_SECRET,
            domain: env.GITLAB_DOMAIN,
          }))
          break
        case 'gitlab2':
          config.addHostingConnector(new GitlabHostingConnector2(config, {
            clientId: env.GITLAB2_CLIENT_ID,
            clientSecret: env.GITLAB2_CLIENT_SECRET,
            domain: env.GITLAB2_DOMAIN,
          }))
          break
        case 'ftp':
          config.addHostingConnector(new FtpConnector(config, {
            type: ConnectorType.HOSTING,
            path: env.FTP_HOSTING_PATH,
          }))
          break
        case 'download':
          config.addHostingConnector(new DownloadConnector(config))
          break
        default:
          console.error('Unknown hosting connector', connector)
          throw new Error(`Unknown hosting connector ${connector}`)
      }
    })
  }
}
