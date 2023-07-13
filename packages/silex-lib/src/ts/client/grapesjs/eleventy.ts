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

throw 'unused now'

import grapesjs from 'grapesjs/dist/grapes.min.js'

import { getPageSlug } from '../../page'
import { Page } from '../../types'
import { ClientEvent } from '../events'

const pluginName = 'eleventy'

export const eleventyPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  editor.on(opts.eventStart || ClientEvent.PUBLISH_DATA, data => {
    data.pages.forEach((page: Page, idx) => {
      const file = data.files[idx]
      file.css = `---
permalink: /css/${getPageSlug(page.name)}.css
---
${file.css}
`
      file.cssPath += '.liquid'
    })
  })
})

