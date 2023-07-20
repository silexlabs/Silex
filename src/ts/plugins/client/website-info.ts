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

import { ClientEvent } from '../../client/events.js'

interface WebsiteInfoOptions {
  websiteId: string
  connectorId: string
  appendTo: 'commands' | 'options' | 'views' | 'project-bar-container' | 'project-bar-panel' | 'views-container'
}

export default async function(config) {
  config.on(ClientEvent.GRAPESJS_START, async () => {
    const grapesPlugin = (editor, opts: Partial<WebsiteInfoOptions>) => {
      const options = {
        appendTo: 'commands',
        ...opts,
      } as WebsiteInfoOptions
      editor.on('storage:end:load', async () => {
        // Get website meta data
        const { websiteId, connectorId } = options
        // Get the website meta data
        const websiteMeta = await config.api.websiteMetaRead({ websiteId, connectorId })
        displayWebsiteMeta(websiteMeta)
      })
      return {}
    }

    config.grapesJsConfig.plugins.push(grapesPlugin)
    config.grapesJsConfig.pluginsOpts[grapesPlugin.toString()] = {
      websiteId: config.websiteId,
      connectorId: config.storageId,
    }
    function displayWebsiteMeta(websiteMeta) {
      // Create the container
      const container = document.createElement('div')
      container.classList.add('gjs-website-meta')
      // Add the container to the UI
      // Add the name of the website in the top bar
      const topBar = document.querySelector('.gjs-pn-devices-c')
      topBar?.appendChild(container)
      // Display the website meta data
      container.innerHTML = `
        <div class="gjs-website-meta-image" style="background: url(${websiteMeta.imageUrl});"></div>
        <div class="gjs-website-meta-name">${websiteMeta.name}</div>
      `
    }
  })
}
