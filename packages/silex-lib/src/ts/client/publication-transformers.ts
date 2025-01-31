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

import { Component, CssRule, StyleProps, Editor } from 'grapesjs'
import { ClientSideFile, ClientSideFileType, Initiator, PublicationData } from '../types'
import { onAll } from './utils'

/**
 * @fileoverview Silex publication transformers are used to control how the site is rendered and published
 * Here we call path the path on the connector (either storage or hosting)
 * We call permalink the path at which the resource is served
 * This is where pages and assets paths and permalinks are set
 * Here we also update background images urls, assets url and links to match the new permalinks
 */

// Properties names used to store the original methods on the components and styles
const ATTRIBUTE_METHOD_STORE_HTML = 'tmp-pre-publication-transformer-tohtml'
const ATTRIBUTE_METHOD_STORE_SRC = 'tmp-pre-publication-transformer-src'
const ATTRIBUTE_METHOD_STORE_ATTRIBUTES_SRC = 'tmp-pre-publication-transformer-attributes-src'
const ATTRIBUTE_METHOD_STORE_INLINE_CSS = 'tmp-pre-publication-transformer-inline-css'
const ATTRIBUTE_METHOD_STORE_HREF = 'tmp-pre-publication-transformer-href'
const ATTRIBUTE_METHOD_STORE_CSS = 'tmp-pre-publication-transformer-tocss'

/**
 * Interface for publication transformers
 * They are added to the config object with config.addPublicationTransformer()
 */
export interface PublicationTransformer {
  // Temporarily override how components render at publication by grapesjs
  renderComponent?(component: Component, toHtml: () => string): string | undefined
  // Temporarily override how styles render at publication by grapesjs
  renderCssRule?(rule: CssRule, initialRule: () => StyleProps): StyleProps | undefined
  // Transform files after they are rendered and before they are published
  transformFile?(file: ClientSideFile): ClientSideFile
  // Define files URLs
  transformPermalink?(link: string, type: ClientSideFileType, initiator: Initiator): string
  // Define where files are published
  transformPath?(path: string, type: ClientSideFileType): string
}

export const publicationTransformerDefault: PublicationTransformer = {
  // Override how components render at publication by grapesjs
  renderComponent(component: Component, toHtml: () => string): string | undefined {
    return toHtml()
  },
  // Override how styles render at publication by grapesjs
  renderCssRule(rule: CssRule, initialRule: () => StyleProps): StyleProps | undefined {
    return initialRule()
  },
  // Define where files are published
  transformPath(path: string, type: ClientSideFileType): string {
    return path
  },
  // Define files URLs
  transformPermalink(link: string, type: ClientSideFileType, initiator: Initiator): string {
    switch(initiator) {
    case Initiator.HTML:
      return link
    case Initiator.CSS:
      // In case of a link from a CSS file, we need to go up one level
      return `../${link.replace(/^\//, '')}`
    default:
      throw new Error(`Unknown initiator ${initiator}`)
    }
  },
  // Define how files are named
  transformFile(file: ClientSideFile): ClientSideFile {
    return file
  }
}

export function validatePublicationTransformer(transformer: PublicationTransformer): void {
  // List all the properties
  const allowedProperties = [
    'renderComponent',
    'renderCssRule',
    'transformFile',
    'transformPermalink',
    'transformPath',
  ]

  // Check that there are no unknown properties
  Object.keys(transformer).forEach(key => {
    if(!allowedProperties.includes(key)) {
      throw new Error(`Publication transformer: unknown property ${key}`)
    }
  })

  // Check that the methods are functions
  allowedProperties.forEach(key => {
    if(typeof transformer[key] !== 'function' && transformer[key] !== undefined) {
      throw new Error(`Publication transformer: ${key} must be a function`)
    }
  })
}

/**
 * Alter the components rendering
 * Exported for unit tests
 */
export function renderComponents(editor: Editor) {
  const config = editor.getModel().get('config')
  onAll(editor, (c: Component) => {
    if (c.get(ATTRIBUTE_METHOD_STORE_HTML)) {
      console.warn('Publication transformer: HTML transform already altered', c)
    } else {
      const initialToHTML = c.toHTML.bind(c)
      c[ATTRIBUTE_METHOD_STORE_HTML] = c.toHTML
      const initialGetStyle = c.getStyle.bind(c)
      c[ATTRIBUTE_METHOD_STORE_INLINE_CSS] = c.getStyle
      const href = c.get('attributes').href as string | undefined
      if(href?.startsWith('./')) {
        c[ATTRIBUTE_METHOD_STORE_HREF] = href
        c.set('attributes', {
          ...c.get('attributes'),
          href: transformPermalink(editor, href, ClientSideFileType.HTML, Initiator.HTML),
        })
      }
      // Handle both c.attributes.src and c.attributes.attributes.src
      // For some reason we need both
      // Especially when the component is not on the current page, we need c.attributes.attributes.src
      if(c.get('attributes').src) {
        c[ATTRIBUTE_METHOD_STORE_SRC] = c.get('attributes').src
        const src = transformPermalink(editor, c.get('attributes').src, ClientSideFileType.ASSET, Initiator.HTML)
        c.set('attributes', {
          ...c.get('attributes'),
          src,
        })
      }
      if(c.get('src')) {
        c[ATTRIBUTE_METHOD_STORE_ATTRIBUTES_SRC] = c.get('src')
        const src = transformPermalink(editor, c.get('src'), ClientSideFileType.ASSET, Initiator.HTML)
        c.set('src', src)
      }
      c.toHTML = () => {
        return config.publicationTransformers.reduce((html: string, transformer: PublicationTransformer) => {
          return transformer.renderComponent ? transformer.renderComponent(c, () => html) ?? html : html
        }, initialToHTML())
      }
      c.getStyle = () => transformBgImage(editor, initialGetStyle())
    }
  })
}

/**
 * Alter the styles rendering
 * Exported for unit tests
 */
export function renderCssRules(editor: Editor) {
  const config = editor.getModel().get('config')
  editor.Css.getAll().forEach((style: CssRule) => {
    if (style[ATTRIBUTE_METHOD_STORE_CSS]) {
      console.warn('Publication transformer: CSS transform already altered', style)
    } else {
      const initialGetStyle = style.getStyle.bind(style)
      style[ATTRIBUTE_METHOD_STORE_CSS] = style.getStyle
      style.getStyle = () => {
        const initialStyle = transformBgImage(editor, initialGetStyle())
        const result = config.publicationTransformers.reduce((s: CssRule, transformer: PublicationTransformer) => {
          return {
            ...transformer.renderCssRule ? transformer.renderCssRule(s, () => initialStyle) ?? s : s,
          }
        }, initialStyle)
        return result
      }
    }
  })
}

function doTransformPermalink(editor: Editor, cssValue: string): string {
  return cssValue.replace(/url\(([^)]+)\)/g, (match, url) => {
    // Support URLs with or without quotes
    const cleanUrl = url.replace(/['"]/g, '')
    // Transform URLs
    const newUrl = transformPermalink(editor, cleanUrl, ClientSideFileType.ASSET, Initiator.CSS)
    // Return the new URL with url keyword
    return `url("${newUrl}")`
  })
}

/**
 * Transform background image url according to the transformed path of assets
 */
export function transformBgImage(editor: Editor, style: StyleProps): StyleProps {
  const cssValue = style['background-image']
  if (cssValue) {
    const newCssValue = typeof cssValue === 'string' ? doTransformPermalink(editor, cssValue) : cssValue.map(value => doTransformPermalink(editor, value))
    return {
      ...style,
      'background-image': newCssValue,
    }
  }
  return style
}

/**
 * Transform files
 * Exported for unit tests
 */
export function transformFiles(editor: Editor, data: PublicationData) {
  const config = editor.getModel().get('config')
  data.files = config.publicationTransformers.reduce((files: ClientSideFile[], transformer: PublicationTransformer) => {
    return files.map((file, idx) => {
      const page = data.pages[idx] ?? null
      return transformer.transformFile ? transformer.transformFile(file) as ClientSideFile ?? file : file
    })
  }, data.files)
}

/**
 * Transform files paths
 * Exported for unit tests
 */
export function transformPermalink(editor: Editor, path: string, type: ClientSideFileType, initiator: Initiator): string {
  const config = editor.getModel().get('config')
  return config.publicationTransformers.reduce((result: string, transformer: PublicationTransformer) => {
    return transformer.transformPermalink ? transformer.transformPermalink(result, type, initiator) ?? result : result
  }, path)
}

export function transformPath(editor: Editor, path: string, type: ClientSideFileType): string {
  const config = editor.getModel().get('config')
  return config.publicationTransformers.reduce((result: string, transformer: PublicationTransformer) => {
    return transformer.transformPath ? transformer.transformPath(result, type) ?? result : result
  }, path)
}

export function resetRenderComponents(editor: Editor) {
  onAll(editor, (c: Component) => {
    if (c[ATTRIBUTE_METHOD_STORE_HTML]) {
      c.toHTML = c[ATTRIBUTE_METHOD_STORE_HTML]
      delete c[ATTRIBUTE_METHOD_STORE_HTML]
    }
    if (c[ATTRIBUTE_METHOD_STORE_INLINE_CSS]) {
      c.getStyle = c[ATTRIBUTE_METHOD_STORE_INLINE_CSS]
      delete c[ATTRIBUTE_METHOD_STORE_INLINE_CSS]
    }
    if(c[ATTRIBUTE_METHOD_STORE_SRC]) {
      c.set('attributes', {
        ...c.get('attributes'),
        src: c[ATTRIBUTE_METHOD_STORE_SRC],
      })
      delete c[ATTRIBUTE_METHOD_STORE_SRC]
    }
    if(c[ATTRIBUTE_METHOD_STORE_ATTRIBUTES_SRC]) {
      c.set('src', c[ATTRIBUTE_METHOD_STORE_ATTRIBUTES_SRC])
      delete c[ATTRIBUTE_METHOD_STORE_ATTRIBUTES_SRC]
    }
    if(c[ATTRIBUTE_METHOD_STORE_HREF]) {
      c.set('attributes', {
        ...c.get('attributes'),
        href: c[ATTRIBUTE_METHOD_STORE_HREF],
      })
      delete c[ATTRIBUTE_METHOD_STORE_HREF]
    }
  })
}

export function resetRenderCssRules(editor: Editor) {
  editor.Css.getAll().forEach(c => {
    if (c[ATTRIBUTE_METHOD_STORE_CSS]) {
      c.getStyle = c[ATTRIBUTE_METHOD_STORE_CSS]
      delete c[ATTRIBUTE_METHOD_STORE_CSS]
    }
  })
}
