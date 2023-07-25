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
 * This plugin is deprecated. Use the publication renderer plugin instead.
 */
console.warn('This plugin is deprecated. Use the publication renderer plugin instead.')
throw 'This plugin is deprecated. Use the publication renderer plugin instead.'

/* Usage:
  import publicationRenderer from '/node_modules/@silexlabs/silex/dist/plugins/client/plugins/client/publicationRenderer.js'
  await config.addPlugin(publicationRenderer, {
    css: {
      frontMatter: true,
      ext: '.css.liquid',
      path: '../../../pages'
    },
    html: {
      frontMatter: false,
      path: '../../../_includes'
    },
    assets: {
      path: '../../../',
      url: '/',
    },
  })
*/

import { getPageSlug } from '../../page.js'
import { ClientSideFile } from '../../types.js'
import { onAll } from '../../client/utils.js'
import { ClientEvent } from '../../client/events.js'
import { Page } from 'grapesjs'

export default (config, opts: any = {}) => {
  const options = {
    autoHomePage: false,
    ...opts,
    html: {
      frontMatter: false,
      ext: '.html',
      url: '/',
      path: './',
      ...opts.html,
    },
    css: {
      frontMatter: false,
      ext: '.css',
      url: '/css',
      path: './css',
      ...opts.css,
    },
    assets: {
      url: '/',
      path: './',
      ...opts.assets,
    },
  }
  config.on(ClientEvent.STARTUP_END, ({ editor }) => {
    editor.on(ClientEvent.PUBLISH_START, () => {
      // Update assets URL to display outside the editor
      const assetsFolderUrl = options.assets.url
      if (assetsFolderUrl) {
        // Concat the paths, handles the trailing and leading slashes
        const publishedUrl = path => `${assetsFolderUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
        // New URLs for assets, according to site config
        onAll(editor, c => {
          // Attributes
          if (c.get('type') === 'image') {
            const src = c.get('src')
            c.set('tmp-src', src)
            c.set('src', publishedUrl(src))
          }
          //// Inline styles
          //// This is handled by the editor.Css.getAll loop
          //const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
          //if(bgUrl) {
          //  c.set('tmp-bg-url', bgUrl)
          //  c.setStyle({
          //    ...c.getStyle(),
          //    'background-image': `url('${publishedUrl(bgUrl)}')`,
          //  })
          //}
        })
        editor.Css.getAll()
          .forEach(c => {
            const bgUrl = c.getStyle()['background-image']?.match(/url\('(.*)'\)/)?.pop()
            if (bgUrl) {
              c.setStyle({
                ...c.getStyle(),
                'background-image': `url('${publishedUrl(bgUrl)}')`,
              })
              c.set('tmp-bg-url-css' as any, bgUrl)
            }
          })
      }
      editor.Pages.getAll().forEach(page => {
        if (page.get('type') === 'main' && options?.autoHomePage) {
          page.set('slug', 'index')
        } else {
          page.set('slug', getPageSlug(page.get('name') || page.get('type')))
        }
      })
    })
    editor.on(ClientEvent.PUBLISH_END, () => {
      const assetsFolderUrl = options.assets.url
      // Reset asset URLs
      if (assetsFolderUrl) {
        onAll(editor, c => {
          if (c.get('type') === 'image' && c.has('tmp-src')) {
            c.set('src', c.get('tmp-src'))
            c.set('tmp-src')
          }
        //// This is handled by the editor.Css.getAll loop
        //if(c.getStyle()['background-image'] && c.has('tmp-bg-url')) {
        //  c.setStyle({
        //    ...c.getStyle(),
        //    'background-image': `url('${c.get('tmp-bg-url')}')`,
        //  })
        //  c.set('tmp-bg-url')
        //}
        })
        editor.Css.getAll()
          .forEach(c => {
            if (c.has('tmp-bg-url-css' as any)) {
              c.setStyle({
                ...c.getStyle(),
                'background-image': `url('${c.get('tmp-bg-url-css' as any)}')`,
              })
              c.set('tmp-bg-url-css' as any)
            }
          })
      }
    })
    //editor.on(ClientEvent.PUBLISH_DATA, data => {
    //  data.pages.forEach((page: Page, idx) => {
    //    const file = data.files[idx] as ClientSideFile
    //    console.log('Silex: publication renderer: page', page, file)
    //    // CSS
    //    if(file.type === 'css') {
    //    file.cssPath = file.cssPath.replace(/\.css$/, options.css.ext)
    //    file.cssPath = options.css.path + file.cssPath
    //    if (options.css.frontMatter) {
    //      file.css = `---\npermalink: ${options.css.url}/${page.slug}.css\n---\n${file.css}`
    //    }
    //    // HTML
    //    file.htmlPath = file.htmlPath.replace(/\.html$/, options.html.ext)
    //    file.htmlPath = options.html.path + file.htmlPath
    //    if (options.html.frontMatter) {
    //      file.html = `---\npermalink: ${options.html.url}/${page.slug}.html\n---\n${file.html}`
    //    }
    //  })
    //  data.assets.forEach((asset, idx) => {
    //    asset.path = options.assets.path + asset.src
    //    // The rest is handled by the editor.Css.getAll loop
    //  })
    //})
  })
}
