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

const FtpConnector = require('../dist/plugins/server/plugins/server/FtpConnector').default
const GitlabConnector = require('../dist/plugins/server/plugins/server/GitlabConnector').default
const DownloadPlugin = require('../dist/plugins/server/plugins/server/DownloadConnector').default

module.exports = async function (config, options) {
  if (!FtpConnector) throw new Error('FtpConnector not found')
  if (!GitlabConnector) throw new Error('GitlabConnector not found')
  if (!DownloadPlugin) throw new Error('DownloadPlugin not found')

  config.setHostingConnectors([
    new FtpConnector(config, {
      type: 'HOSTING',
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
  ])

  return {}
}

