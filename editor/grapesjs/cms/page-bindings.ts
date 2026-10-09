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

import { Component, Editor, Page } from 'grapesjs'
import { getPersistantId, StoredToken, toExpression } from '@silexlabs/grapesjs-data-source'
import { Silex11tyPluginWebsiteSettings } from './index'
import { updateBodyStates } from './page-settings'
import { updatePaginationStates } from './states'
import { pageOf } from '../pages'

/**
 * The collection and the permalink of a page, for the page tool of the agents, in
 * the paths of the element bindings (wp.posts.nodes, item.slug)
 */

const cmdBind = 'pages:cms-bind'
const cmdUnbind = 'pages:cms-unbind'
export const cmdBindings = 'pages:cms-bindings'
const BIND_TO = ['collection', 'permalink']
// The fixed parts of a permalink end up in the front matter and in Liquid
const PERMALINK_TEXT = /^[A-Za-z0-9/_.-]*$/
const PERMALINK = /^([^{}]*)(?:\{([^{}]+)\})?([^{}]*)$/

interface PageBindingOptions {
  page_id?: string
  bind_to?: string
  path?: string
}

function fixed(value: string): StoredToken {
  return { type: 'property', propType: 'field', fieldId: 'fixed', label: 'Fixed value', kind: 'scalar', typeIds: ['String'], options: { value } } as StoredToken
}

function settingsOf(page: Page): Silex11tyPluginWebsiteSettings {
  return (page.get('settings') ?? {}) as Silex11tyPluginWebsiteSettings
}

function save(editor: Editor, page: Page, settings: Silex11tyPluginWebsiteSettings) {
  page.set('settings', settings)
  updateBodyStates(editor, page)
  if (page === editor.Pages.getSelected()) updatePaginationStates(editor)
}

function resolve(editor: Editor, page: Page, path: string, list: boolean): { expression: StoredToken[], fields: string[] } {
  // Paths are resolved on the selected page, where the items of the collection are
  if (page !== editor.Pages.getSelected()) throw new Error(`Select the page first: page(action:'select', page_id:"${page.id}"). Nothing was changed.`)
  return editor.runCommand('data-source:cms:resolve', { path, list })
}

// Publication puts the address between slashes (ensureLeadingAndTrailingSlash): the
// agent writes them like in an address, the Liquid of the page must not repeat them
function permalinkExpression(editor: Editor, page: Page, template: string): StoredToken[] {
  const [, start, path, end] = PERMALINK.exec(template) ?? []
  if (start === undefined) throw new Error('Write the permalink like blog/{item.slug}/, with one path in braces at most. Nothing was changed.')
  if (!PERMALINK_TEXT.test(start) || !PERMALINK_TEXT.test(end)) {
    throw new Error('Outside the braces, a permalink has only letters, digits, / _ . and -. Nothing was changed.')
  }
  if (end.includes('.html')) throw new Error('A permalink of a collection page ends with a folder, like blog/{item.slug}/. Nothing was changed.')
  if (!path) return [fixed(start)]
  const before = start.replace(/^\/+/, '')
  const after = end.replace(/\/+$/, '')
  return resolve(editor, page, `${before}{${path.trim()}}${after}`, false).expression
}

function pathOf(editor: Editor, page: Page, expression: StoredToken[]): string {
  return editor.runCommand('data-source:cms:path-of', { expression, body: page.getMainComponent() })
}

function permalinkText(editor: Editor, page: Page, expression: StoredToken[]): string {
  if (expression.every(token => token.type === 'property' && (token as { fieldId?: string }).fieldId === 'fixed')) {
    return expression.map(token => (token as { options?: { value?: string } }).options?.value ?? '').join('')
  }
  const path = pathOf(editor, page, expression)
  return `/${path.includes('{') ? path : `{${path}}`}/`
}

// Elements and the permalink use the items of the page through a state of its body
function usesItems(value: unknown, bodyId: string): boolean {
  if (typeof value === 'string' && value.startsWith('[')) return usesItems(toExpression(value), bodyId)
  if (Array.isArray(value)) return value.some(v => usesItems(v, bodyId))
  if (!value || typeof value !== 'object') return false
  const token = value as { type?: string, storedStateId?: string, componentId?: string }
  if (token.type === 'state' && token.storedStateId === 'items' && token.componentId === bodyId) return true
  return Object.values(value).some(v => usesItems(v, bodyId))
}

function usesPageItems(page: Page): Component[] {
  const bodyId = getPersistantId(page.getMainComponent())
  if (!bodyId) return []
  const users: Component[] = []
  const visit = (component: Component) => {
    if (usesItems([component.get('privateStates'), component.get('publicStates')], bodyId)) users.push(component)
    component.components().forEach(visit)
  }
  page.getMainComponent().components().forEach(visit)
  return users
}

export default function pageBindings(editor: Editor) {
  editor.Commands.add(cmdBindings, (_ed: Editor, _sender: unknown, { page }: { page: Page }) => {
    const settings = settingsOf(page)
    const collection = toExpression(settings.eleventyPageData) as StoredToken[] | null
    const permalink = toExpression(settings.eleventyPermalink) as StoredToken[] | null
    return {
      ...(collection?.length ? { collection: pathOf(editor, page, collection) } : {}),
      ...(permalink?.length ? { permalink: permalinkText(editor, page, permalink) } : {}),
    }
  })

  editor.Commands.add(cmdBind, (_ed: Editor, _sender: unknown, options: PageBindingOptions = {}) => {
    const page = pageOf(editor, options.page_id)
    if (!BIND_TO.includes(options.bind_to ?? '')) throw new Error(`Set bind_to to one of ${BIND_TO.join(', ')}.`)
    if (!options.path) throw new Error('Set path. Nothing was changed.')
    const settings = settingsOf(page)
    if (options.bind_to === 'collection') {
      const { expression, fields } = resolve(editor, page, options.path, true)
      if (expression.some(token => token.type !== 'property')) {
        throw new Error('A collection is a list from a source, like wp.posts.nodes. Nothing was changed.')
      }
      save(editor, page, { ...settings, eleventyPageData: JSON.stringify(expression), eleventyPageSize: settings.eleventyPageSize ?? '1' })
      return `Collection bound: one page per item of ${options.path}. Item fields: ${fields.join(', ')}.`
    }
    const expression = permalinkExpression(editor, page, options.path)
    save(editor, page, { ...settings, eleventyPermalink: JSON.stringify(expression) })
    return `Permalink bound: ${permalinkText(editor, page, expression)}`
  })

  editor.Commands.add(cmdUnbind, (_ed: Editor, _sender: unknown, options: PageBindingOptions = {}) => {
    const page = pageOf(editor, options.page_id)
    const settings = { ...settingsOf(page) }
    if (options.bind_to === 'collection') {
      if (!settings.eleventyPageData) throw new Error('This page has no collection.')
      const users = usesPageItems(page)
      const bodyId = getPersistantId(page.getMainComponent())
      if (users.length || (bodyId && usesItems(settings.eleventyPermalink, bodyId))) {
        const ids = users.slice(0, 5).map(component => editor.runCommand('agent-ids:get', { component })).join(', ')
        throw new Error(`${ids ? `Elements ${ids}` : 'The permalink'} use item of this page. Unbind them first. Nothing was changed.`)
      }
      delete settings.eleventyPageData
    } else if (options.bind_to === 'permalink') {
      if (!settings.eleventyPermalink) throw new Error('This page has no permalink.')
      delete settings.eleventyPermalink
    } else {
      throw new Error(`Set bind_to to one of ${BIND_TO.join(', ')}.`)
    }
    save(editor, page, settings)
    return `${options.bind_to === 'collection' ? 'Collection' : 'Permalink'} removed.`
  })

  editor.on('ai-capabilities:ready', (addCapability: (def: Record<string, unknown>) => void) => {
    const pageId = { type: 'string', description: 'Page id from list. Default: the selected page' }
    const bindTo = { type: 'string', enum: BIND_TO }
    addCapability({
      tool: 'page',
      action: 'bind',
      command: cmdBind,
      description: 'make a page per item of a CMS list (collection), or set the address of the pages (permalink).',
      inputSchema: {
        type: 'object',
        required: ['bind_to', 'path'],
        properties: {
          page_id: pageId,
          bind_to: bindTo,
          path: { type: 'string', description: 'collection: wp.posts.nodes. permalink: blog/{item.slug}/' },
        },
      },
    })
    addCapability({
      tool: 'page',
      action: 'unbind',
      command: cmdUnbind,
      description: 'remove the collection or the permalink of a page.',
      inputSchema: { type: 'object', required: ['bind_to'], properties: { page_id: pageId, bind_to: bindTo } },
    })
  })
}
