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

import { Editor, Page } from 'grapesjs'
import type { AddCapability } from '@silexlabs/grapesjs-ai-capabilities'
import { StoredToken, toExpression } from '@silexlabs/grapesjs-data-source'
import { setSettingsOf } from '../settings'
import { PAGE_ID, pageOf } from '../pages'
import { cmdSelectPage } from '../page-panel'
import { permalinkWarning } from './page-settings'

export const cmdBindings = 'pages:cms-bindings'
const cmdBind = 'pages:cms-bind'
const cmdUnbind = 'pages:cms-unbind'
const KEYS = {
  collection: 'eleventyPageData',
  permalink: 'eleventyPermalink',
  title: 'eleventySeoTitle',
  description: 'eleventySeoDescription',
  favicon: 'eleventyFavicon',
  og_image: 'eleventyOGImage',
  og_title: 'eleventyOGTitle',
  og_description: 'eleventyOGDescription',
}
const BIND_TO = Object.keys(KEYS)
export const BINDING_SETTINGS = Object.values(KEYS)

interface PageBindingOptions {
  page_id?: string
  bind_to?: string
  path?: string
}

function keyOf(bindTo = ''): string {
  if (!BIND_TO.includes(bindTo)) throw new Error(`Set bind_to to one of ${BIND_TO.join(', ')}.`)
  return KEYS[bindTo as keyof typeof KEYS]
}

export default function pageBindings(editor: Editor) {
  editor.Commands.add(cmdBindings, (_ed: Editor, _sender: unknown, { page }: { page: Page }) => {
    const settings = (page.get('settings') ?? {}) as Record<string, string>
    return Object.fromEntries(Object.entries(KEYS).flatMap(([bindTo, key]) => {
      const expression = toExpression(settings[key]) as StoredToken[] | null
      return expression?.length ? [[bindTo, editor.runCommand('data-source:cms:path-of', { expression, body: page.getMainComponent() })]] : []
    }))
  })

  editor.Commands.add(cmdBind, (_ed: Editor, _sender: unknown, { page_id, bind_to, path }: PageBindingOptions = {}) => {
    const page = pageOf(editor, page_id)
    const key = keyOf(bind_to)
    if (!path) throw new Error('Set path. Nothing was changed.')
    // Paths are resolved on the selected page, where the items of the collection are
    const selectedNote = page === editor.Pages.getSelected() ? '' : `Page ${page.id} is now selected.`
    if (selectedNote) editor.runCommand(cmdSelectPage, { page_id: page.id })
    const list = bind_to === 'collection'
    const { expression, fields } = editor.runCommand('data-source:cms:resolve', { path, list })
    setSettingsOf(editor, page, { [key]: JSON.stringify(expression) })
    const reply = (...lines: (string | null)[]) => [...lines, selectedNote].filter(Boolean).join('\n')
    if (list) return reply(`Collection bound: one page per item of ${path}. Item fields: ${fields.join(', ')}.`)
    if (bind_to !== 'permalink') return reply(`${bind_to} bound: ${path}`)
    return reply(`Permalink bound: ${path}`, permalinkWarning(page.get('settings') ?? {}))
  })

  editor.Commands.add(cmdUnbind, (_ed: Editor, _sender: unknown, { page_id, bind_to }: PageBindingOptions = {}) => {
    setSettingsOf(editor, pageOf(editor, page_id), { [keyOf(bind_to)]: undefined })
    return `${bind_to} removed.`
  })

  editor.on('ai-capabilities:ready', (addCapability: AddCapability) => {
    const bindTo = { type: 'string', enum: BIND_TO }
    addCapability({
      tool: 'page',
      action: 'bind',
      command: cmdBind,
      description: 'make a page per item of a CMS list (collection), set the address of the pages (permalink), or their SEO and social settings from the item.',
      inputSchema: {
        type: 'object',
        required: ['bind_to', 'path'],
        properties: {
          page_id: PAGE_ID,
          bind_to: bindTo,
          path: { type: 'string', description: 'collection: wp.posts.nodes. permalink: item.slug | prepend: "blog/". title: item.title | append: " | Blog"' },
        },
      },
    })
    addCapability({
      tool: 'page',
      action: 'unbind',
      command: cmdUnbind,
      description: 'remove a binding of a page.',
      inputSchema: { type: 'object', required: ['bind_to'], properties: { page_id: PAGE_ID, bind_to: bindTo } },
    })
  })
}
