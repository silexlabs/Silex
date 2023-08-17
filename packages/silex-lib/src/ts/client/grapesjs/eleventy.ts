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
 * @deprecated
 * Replaced by the plugin 11ty.ts
 * This plugin is deprecated. Use the publication renderer plugin instead.
 */
console.warn('This plugin is deprecated. Use the publication renderer plugin instead.')
throw 'This plugin is deprecated. Use the publication renderer plugin instead.'

import { getPageSlug } from '../../page'
import { ClientEvent } from '../events'
import { Page } from 'grapesjs'

const pluginName = 'eleventy'

export const eleventyPlugin = (editor, opts) => {
  editor.on(opts.eventStart || ClientEvent.PUBLISH_DATA, data => {
    data.pages.forEach((page: Page, idx) => {
      const file = data.files[idx]
      file.css = `---
permalink: /css/${getPageSlug(page.get('name'))}.css
---
${file.css}
`
      file.cssPath += '.liquid'
    })
  })
}
