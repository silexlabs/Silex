import grapesjs from 'grapesjs/dist/grapes.min.js'

import { getPageSlug } from '../../page'

const pluginName = 'eleventy'

export const eleventyPlugin = grapesjs.plugins.add(pluginName, (editor, opts) => {
  editor.on(opts.eventStart || 'publish:start', data => {
    data.pages.forEach((page, idx) => {
      const file = data.files[idx]
      file.css = `---
permalink: /css/${getPageSlug(page.name)}.css
---
${file.css}
`
    })
  })
})

