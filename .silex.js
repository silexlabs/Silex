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

const SslPlugin = require('./dist/plugins/SslPlugin').default
const StaticPlugin = require('./dist/plugins/StaticPlugin').default
const WebsitePlugin = require('./dist/plugins/WebsitePlugin').default
const PublicationPlugin = require('./dist/plugins/PublicationPlugin').default

module.exports = async function(config, options) {
  try {
    if(!SslPlugin) throw new Error('SslPlugin not found')
    if(!StaticPlugin) throw new Error('StaticPlugin not found')
    if(!WebsitePlugin) throw new Error('WebsitePlugin not found')
    if(!PublicationPlugin) throw new Error('PublicationPlugin not found')

    await config.addPlugin([
      SslPlugin,
      StaticPlugin,
      WebsitePlugin,
      PublicationPlugin,
    ])
  } catch(e) {
    console.error(e)
  }

  // Return an object to be merged with Silex config
  return {}
}
