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

/*
 * @fileoverview This file is loaded by Silex
 * Start silex with the environment variable SILEX_CLIENT_CONFIG or the CLI option --client-config set to this file
 * FIXME: this directus plugin for grapesjs is not working with ES6 modules
 * You need to install the plugin: npm install --save @silexlabs/grapesjs-directus-storage
 */

import DirectusPlugin from '/js/grapesjs-directus-storage/es6/index.js'

export default async function (config) {
  // Add grapesjs plugins
  config.on('silex:grapesjs:start', () => {
    // Add this directus GrapesJs plugin
    config.grapesJsConfig.storageManager.type = 'directus'
    config.grapesJsConfig.plugins = config.grapesJsConfig.plugins.filter(plugin => plugin.name !== 'storagePlugin')
    config.grapesJsConfig.autoLoad = false
    config.grapesJsConfig.assetManager.upload = 'http://localhost:8055/assets'
    config.grapesJsConfig.plugins.push(DirectusPlugin)
    config.grapesJsConfig.pluginsOpts[DirectusPlugin] = {
      directusUrl: 'https://silexlabs.internet2000.net/cms/' // prompt('You need a Directus server to test this plugin. Directus server URL', 'http://localhost:8055'),
    }
  })
}

