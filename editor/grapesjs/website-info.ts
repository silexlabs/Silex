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

import type { Editor } from 'grapesjs'
import { WebsiteMeta } from '~/common/types.js'

// GrapesJS plugin: shows the website name + current page in the top bar.
// Added to the editor plugin list in ./index.ts. The Silex config (api, ids) is read
// from the editor model — set on it after init — only inside event handlers (lazy).
export default function websiteInfoPlugin(editor: Editor) {
  let websiteMeta: WebsiteMeta | null = null
  const getConfig = () => editor.getModel().get('config')

  editor.on('storage:end:load', async () => {
    const config = getConfig()
    websiteMeta = await config.api.websiteMetaRead({ websiteId: config.websiteId, connectorId: config.storageId })
    displayWebsiteMeta()
  })

  // Refresh when the page changes
  editor.on('page:select', () => displayWebsiteMeta())

  function displayWebsiteMeta() {
    const container = document.querySelector('#gjs-website-meta') ?? (function () {
      const c = document.createElement('div')
      c.id = 'gjs-website-meta'
      c.classList.add('gjs-website-meta')
      // Add the website name in the top bar
      document.querySelector('.gjs-pn-devices-c')?.appendChild(c)
      return c
    })()
    const currentPage = editor.Pages?.getSelected()
    container.innerHTML = `
        ${websiteMeta?.imageUrl ? `<div class="gjs-website-meta-image" style="background: url(${websiteMeta?.imageUrl});"></div>` : ''}
        <div class="gjs-website-meta-name">${websiteMeta?.name ?? 'Unknown'} | ${currentPage?.get('name') ?? currentPage?.get('type')}</div>
      `
  }
}
