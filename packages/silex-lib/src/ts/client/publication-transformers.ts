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

import { Component, CssRule, Editor, ObjectStrings, OptionsStyle, Page, ToHTMLOptions } from 'grapesjs'
import { ClientSideFile, PublicationData } from '../types'
import { ClientConfig } from './config'
import { ClientEvent } from './events'
import { onAll } from './utils'

/**
 * @fileoverview Silex publication transformers are used to control how the site is rendered and published
 */

// Properties names used to store the original methods on the components and styles
const ATTRIBUTE_METHOD_STORE_HTML = 'tmp-pre-publication-transformer-tohtml'
const ATTRIBUTE_METHOD_STORE_CSS = 'tmp-pre-publication-transformer-tocss'

/**
 * Interface for publication transformers
 * They are added to the config object with config.addPublicationTransformer()
 */
export interface PublicationTransformer {
  // Override how components render at publication by grapesjs
  renderComponent(component: Component, initialHtml: string): string
  // Override how styles render at publication by grapesjs
  renderCssRule(rule: CssRule, initialRule: ObjectStrings): ObjectStrings
  // Define how pages are named
  pageToSlug(page: Page): string
  // Transform files after they are rendered and before they are published
  transformFile(file: ClientSideFile): ClientSideFile
}


/**
 * Init publication transformers
 * Called at startup in the /index.ts file
 */
export async function initPublicationTransformers(config: ClientConfig) {
  const editor = config.getEditor()
  // Override default rendering of components and styles
  // Also create page slugs
  editor.on(ClientEvent.PUBLISH_START, () => {
    transformComponents(config)
    transformStyles(config)
    transformPages(config)
  })
  // Reset the components and styles rendering
  editor.on(ClientEvent.PUBLISH_END, () => {
    resetTransformComponents(config)
    resetTransformStyles(config)
    resetTransformPages(config)
  })
  // Transform files after generating all files to be published
  editor.on(ClientEvent.PUBLISH_DATA, (data: PublicationData) => {
    transformFiles(config, data)
  })
}

/**
 * Alter the components rendering
 * Exported for unit tests
 */
export function transformComponents(config: ClientConfig) {
  const editor = config.getEditor()
  onAll(editor, (c: Component) => {
    if (c.get(ATTRIBUTE_METHOD_STORE_HTML)) {
      console.warn('Silex: publication transformer: HTML transform already altered', c)
    } else {
      const initialToHTML = c.toHTML.bind(c)
      c[ATTRIBUTE_METHOD_STORE_HTML] = c.toHTML
      c.toHTML = () => {
        return config.publicationTransformers.reduce((html, transformer) => {
          try {
            return transformer.renderComponent(c, html) ?? html
          } catch (e) {
            console.error('Silex: publication transformer: error rendering component', c, e)
            return html
          }
        }, initialToHTML())
      }
    }
  })
}

/**
 * Alter the styles rendering
 * Exported for unit tests
 */
export function transformStyles(config: ClientConfig) {
  const editor = config.getEditor()
  editor.Css.getAll().forEach(c => {
    if (c[ATTRIBUTE_METHOD_STORE_CSS]) {
      console.warn('Silex: publication transformer: CSS transform already altered', c)
    } else {
      const initialGetStyle = c.getStyle.bind(c)
      c[ATTRIBUTE_METHOD_STORE_CSS] = c.getStyle
      c.getStyle = () => {
        try {
          return config.publicationTransformers.reduce((style, transformer) => {
            return {
              ...transformer.renderCssRule(c, style),
            }
          }, initialGetStyle())
        } catch (e) {
          console.error('Silex: publication transformer: error rendering style', c, e)
          return initialGetStyle()
        }
      }
    }
  })
}

/**
 * Create page slugs
 * Exported for unit tests
 */
export function transformPages(config: ClientConfig) {
  const editor = config.getEditor()
  editor.Pages.getAll().forEach(page => {
    page.set('slug', config.publicationTransformers.reduce((slug, transformer) => {
      try {
        return transformer.pageToSlug(page) ?? slug
      } catch (e) {
        console.error('Silex: publication transformer: error creating page slug', page, e)
        return slug
      }
    }, page.get('slug')))
  })
}

/**
 * Transform files
 * Exported for unit tests
 */
export function transformFiles(config: ClientConfig, data: PublicationData) {
  data.files = config.publicationTransformers.reduce((files: ClientSideFile[], transformer: PublicationTransformer) => {
    return files.map(file => {
      try {
        return transformer.transformFile(file) as ClientSideFile
      } catch (e) {
        console.error('Silex: publication transformer: error transforming file', file, e)
        return file
      }
    })
  }, data.files)
}

export function resetTransformComponents(config: ClientConfig) {
  const editor = config.getEditor()
  onAll(editor, (c: Component) => {
    if (c[ATTRIBUTE_METHOD_STORE_HTML]) {
      c.toHTML = c[ATTRIBUTE_METHOD_STORE_HTML]
      delete c[ATTRIBUTE_METHOD_STORE_HTML]
    }
  })
}

export function resetTransformStyles(config: ClientConfig) {
  const editor = config.getEditor()
  editor.Css.getAll().forEach(c => {
    if (c[ATTRIBUTE_METHOD_STORE_CSS]) {
      c.getStyle = c[ATTRIBUTE_METHOD_STORE_CSS]
      delete c[ATTRIBUTE_METHOD_STORE_CSS]
    }
  })
}

export function resetTransformPages(config: ClientConfig) {
  const editor = config.getEditor()
  editor.Pages.getAll().forEach(page => {
    page.unset('slug')
  })
}
