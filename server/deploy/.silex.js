/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @fileoverview Default Silex server config = the full SaaS (the v3.silex.me / canary setup).
 * Serves the editor (StaticPlugin), the multi-site dashboard, the onboarding email backend,
 * and the storage/hosting connectors selected by env vars. Loaded by default at startup
 * (see server/config.ts: configFilePath). Runtime paths target the monorepo dist.
 */
const { join } = require('path')
const nodeModules = require('node_modules-path')

const SslPlugin = require('../../dist/server/server/plugins/SslPlugin').default
const StaticPlugin = require('../../dist/server/server/plugins/StaticPlugin').default
const { ConnectorType } = require('../../dist/server/common/types')
const FtpConnector = require('../../dist/server/server/plugins/FtpConnector').default
const DownloadConnector = require('../../dist/server/server/plugins/DownloadConnector').default
const GitlabConnector = require('../../dist/server/server/plugins/GitlabConnector').default
const GitlabHostingConnector = require('../../dist/server/server/plugins/GitlabHostingConnector').default
const { FsStorage } = require('../../dist/server/server/connectors/FsStorage')
const { FsHosting } = require('../../dist/server/server/connectors/FsHosting')
const dashboard = require('./server-plugins/dashboard.js')
const onboarding = require('./server-plugins/onboarding.js')

// Load .env file
require('dotenv').config()

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
  FTP_STORAGE_PATH: process.env.FTP_STORAGE_PATH || '',
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

module.exports = async function(config) {
  // SaaS multi-site dashboard FIRST: its "/" handler redirects to the localized
  // dashboard before StaticPlugin can serve the editor's index.html at "/".
  // (STARTUP_START handlers run in addPlugin order → dashboard routes mount first.)
  await config.addPlugin(dashboard, {})

  try {
    // Core: serve the editor client, fonts and public assets
    await config.addPlugin([
      SslPlugin,
      StaticPlugin,
    ], {
      [StaticPlugin]: {
        routes: [
          {
            route: '/',
            path: join(__dirname, '../../public'),
          }, {
            route: '/css/',
            path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/css/',
          }, {
            route: '/webfonts/',
            path: nodeModules('@fortawesome/fontawesome-free') + '/@fortawesome/fontawesome-free/webfonts/',
          }, {
            route: '/css/files/',
            path: nodeModules('@fontsource/ubuntu') + '/@fontsource/ubuntu/files/',
          }, {
            route: '/',
            path: join(__dirname, '../../dist/client'),
          }, {
            // SaaS client plugins (e.g. onboarding) imported by ./client-config.js
            route: '/js/client-plugins/',
            path: join(__dirname, 'client-plugins'),
          },
        ],
      },
    })
  } catch (e) {
    console.error(e)
  }

  // SaaS: onboarding email backend
  await config.addPlugin(onboarding, {})

  // Storage and hosting connectors selected by env vars
  initConnectors(config)

  return {}
}
