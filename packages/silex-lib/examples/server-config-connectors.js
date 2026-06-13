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
 * This file is an example of a server configuration file.
 * It is used to test hosting and storage connectors.
 *
 * You can run the server with the following environment variable to use this configuration file:
 * SILEX_SERVER_CONFIG=`pwd`/examples/server-config-connectors.js
 *
 * It expects the following environment variables to be set:
 * - GITLAB_CLIENT_ID
 * - GITLAB_CLIENT_SECRET
 * - GITLAB_DOMAIN
 * - FRAMAGIT_CLIENT_ID
 * - FRAMAGIT_CLIENT_SECRET
 * - FRAMAGIT_DOMAIN
 *
 * Suggested values:
 * - GITLAB_DOMAIN=https://gitlab.com
 * - FRAMAGIT_DOMAIN=https://framagit.org
 *
 * You need to create an application on gitlab.com and framagit.org
 * and set the callback url to http://localhost:6805/auth/gitlab/callback
 *
 */

const FtpConnector = require('../dist/plugins/server/plugins/server/FtpConnector').default
const GitlabConnector = require('../dist/plugins/server/plugins/server/GitlabConnector').default
const GitlabHostingConnector = require('../dist/plugins/server/plugins/server/GitlabHostingConnector').default
const DownloadPlugin = require('../dist/plugins/server/plugins/server/DownloadConnector').default
const StaticPlugin = require('@silexlabs/silex/dist/plugins/server/plugins/server/StaticPlugin').default
const node_modules = require('node_modules-path')

class FramaGitConnector extends GitlabConnector {
  connectorId = 'framagit'
  displayName = 'FramaGit'
  constructor(config, options) {
    super(config, options)
  }
}

module.exports = async function (config, options) {
  if (!FtpConnector) throw new Error('FtpConnector not found')
  if (!GitlabConnector) throw new Error('GitlabConnector not found')
  if (!DownloadPlugin) throw new Error('DownloadPlugin not found')

  config.setHostingConnectors([
    new FtpConnector(config, {
      type: 'HOSTING',
    }),
    new GitlabHostingConnector(config, {
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      domain: process.env.GITLAB_DOMAIN,
    }),
    new DownloadPlugin(config),
  ])
  config.setStorageConnectors([
    new FtpConnector(config, {
      type: 'STORAGE',
    }),
    new GitlabConnector(config, {
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET,
      domain: process.env.GITLAB_DOMAIN,
    }),
    new FramaGitConnector(config, {
      clientId: process.env.FRAMAGIT_CLIENT_ID,
      clientSecret: process.env.FRAMAGIT_CLIENT_SECRET,
      domain: process.env.FRAMAGIT_DOMAIN,
    }),
  ])

  // CMS is now built into silex-lib - no separate route needed
  // config.addPlugin(StaticPlugin, {
  //   routes: [{
  //     route: '/js/silex-cms/',
  //     path: node_modules('@silexlabs/silex-cms') + '/@silexlabs/silex-cms/dist',
  //   }],
  // })
  return {}
}

