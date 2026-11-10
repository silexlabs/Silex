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
import { type Property, toExpression } from '@silexlabs/grapesjs-data-source'
import { getPageSlug, getPageUrl } from '~/common/page'
import type { Silex11tyPluginWebsiteSettings } from './index'
import { PERMALINK_KEY } from './settings-keys'

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
  const settings = page?.get('settings') as Silex11tyPluginWebsiteSettings | undefined
  const tokens = toExpression(settings?.[PERMALINK_KEY]) as Property[] | null
  if (!tokens?.length || !tokens.every(token => token.type === 'property' && token.fieldId === 'fixed')) return link
  return ensureLeadingAndTrailingSlash(tokens.map(token => token.options?.value ?? '').join('')) + suffix
}
