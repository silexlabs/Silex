/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
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
import { fixedText, toExpression, type StoredToken } from '@silexlabs/grapesjs-data-source'
import { getPageSlug, getPageUrl } from '~/common/page'
import type { WebsiteSettings } from '~/common/types'

export function getFixedPermalink(settings: WebsiteSettings): string | null {
  if (!settings.eleventyPermalink) return ''
  return fixedText(toExpression(settings.eleventyPermalink) ?? [])
}

// Keep the same stored expression format as the expression editor.
export function serializeFixedPermalink(value: string): string {
  const token: StoredToken = {
    type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value',
    kind: 'scalar', typeIds: ['String'], options: { value },
  }
  return JSON.stringify(value ? [token] : [])
}

export function ensureLeadingAndTrailingSlash(str: string): string {
  if (str.length === 0) return '/'
  let s = str
  if (!s.startsWith('/')) s = '/' + s
  // No empty file name
  if (s.endsWith('/.html')) throw new Error('Permalink may not end with "/.html". Your missing a file name!')
  // If it ends with .html, keep as-is; otherwise ensure trailing slash
  if (!s.endsWith('/') && !s.endsWith('.html')) s = s + '/'
  return s
}

// A page with a fixed permalink is published there, so links to it go there too
export function linkToPermalink(editor: Editor, link: string): string {
  const [, path, suffix] = link.match(/^([^?#]*)(.*)$/) ?? []
  const page = editor.Pages.getAll().find(page => getPageUrl(getPageSlug(page.getName())) === path)
  const permalink = getFixedPermalink((page?.get('settings') ?? {}) as WebsiteSettings)
  if (!permalink) return link
  return ensureLeadingAndTrailingSlash(permalink) + suffix
}

// Without a template engine, publish fixed permalinks directly as HTML files.
export function pathToPermalink(editor: Editor, path: string): string {
  const page = editor.Pages.getAll().find(page => `/${getPageSlug(page.getName())}.html` === path)
  if (!page) return path
  const permalink = getFixedPermalink((page.get('settings') ?? {}) as WebsiteSettings)
  if (permalink === null) throw new Error(`Page "${page.getName()}" uses a permalink expression, but expressions are disabled.`)
  if (!permalink) return path
  const url = ensureLeadingAndTrailingSlash(permalink)
  return url.endsWith('/') ? `${url}index.html` : url
}
