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

import { Component, Editor } from 'grapesjs'
import { Field, IDataSource, Properties, State, StoredToken } from '../types'
import { getDataSource } from '../model/dataSourceRegistry'
import { getOrCreatePersistantId, getPersistantId, getState, getStateIds } from '../model/state'
import { getExpressionResultType } from '../model/token'

/**
 * `item` in a path: the item of the closest loop, or else the item of the collection page
 */

// Silex keeps the item of a collection page in a state of the body (cms/states.ts)
const PAGE_ITEM = 'item'
// Sites made before the item state: the items of the page, then the filter first
const PAGE_ITEMS = 'items'

interface ItemScope {
  tokens: StoredToken[]
  field: Field
  ds: IDataSource
}

export function someToken(value: unknown, test: (token: StoredToken) => boolean): boolean {
  if (Array.isArray(value)) return value.some(v => someToken(v, test))
  if (typeof value === 'string' && value.startsWith('[')) {
    try { return someToken(JSON.parse(value), test) } catch { return false }
  }
  if (value && typeof value === 'object') {
    return test(value as StoredToken) || Object.values(value).some(v => someToken(v, test))
  }
  return false
}

function loopAround(component: Component, includeSelf: boolean): Component | null {
  for (let c: Component | undefined = includeSelf ? component : component.parent(); c; c = c.parent()) {
    if (getState(c, Properties.__data, false)?.expression?.length) return c
  }
  return null
}

export function isLoopItem(token: StoredToken | undefined): boolean {
  return token?.type === 'state' && token.storedStateId === Properties.__data && !token.exposed
}

export function elementId(editor: Editor, component: Component): string {
  return editor.runCommand('agent-ids:get', { component })
}

export function itemScope(editor: Editor, component: Component | undefined, ownLoopIsItem: boolean): ItemScope {
  const loop = component && loopAround(component, ownLoopIsItem)
  if (!loop) return pageItem(editor, component)
  const loopField = getExpressionResultType(getState(loop, Properties.__data, false)!.expression, loop)
  const ds = loopField?.dataSourceId === undefined ? undefined : getDataSource(loopField.dataSourceId)
  if (!loopField || !ds) throw new Error(`The loop on element ${elementId(editor, loop)} has an unknown type. Bind it again with bind_to "loop".`)
  const state: State = {
    type: 'state',
    storedStateId: Properties.__data,
    componentId: getOrCreatePersistantId(loop),
    previewIndex: loopField.previewIndex,
    exposed: false,
    forceKind: 'object',
    label: `Loop item (${loopField.label})`,
  }
  return { tokens: [state], field: { ...loopField, kind: 'object' }, ds }
}

function pageItem(editor: Editor, component: Component | undefined): ItemScope {
  const body = (component ? component.parents().pop() ?? component : undefined) ?? editor.Pages.getSelected()?.getMainComponent()
  const item = body && getState(body, PAGE_ITEM, true)
  const itemField = item?.expression?.length ? getExpressionResultType(item.expression, body!) : null
  if (!body || !item || !itemField) {
    throw new Error('No loop around the element, and this page is not a collection page. Bind an element with bind_to "loop", or the page with page(action:\'bind\', bind_to:\'collection\').')
  }
  const ds = itemField.dataSourceId === undefined ? undefined : getDataSource(itemField.dataSourceId)
  if (!ds) throw new Error('The collection of this page has an unknown type. Bind the page again with bind_to "collection".')
  const state: State = {
    type: 'state',
    storedStateId: PAGE_ITEM,
    componentId: getOrCreatePersistantId(body),
    exposed: true,
    forceKind: 'object',
    label: item.label ?? PAGE_ITEM,
  }
  return { tokens: [state], field: { ...itemField, kind: 'object' }, ds }
}

// How many tokens of the expression stand for item: 0 when it does not start with item
export function itemLength(expression: StoredToken[], pageBodyId: string | undefined): number {
  const [first, second] = expression
  if (isLoopItem(first)) return 1
  const pageState = first?.type === 'state' && !!first.exposed && first.componentId === pageBodyId ? first.storedStateId : null
  if (pageState === PAGE_ITEM) return 1
  return pageState === PAGE_ITEMS && second?.type === 'filter' && second.id === 'first' ? 2 : 0
}

// The elements in the loop that use its item, its own loop binding aside
export function itemUsers(loop: Component): Component[] {
  const loopId = getPersistantId(loop)
  const usesItem = (c: Component) => [false, true].some(exported => getStateIds(c, exported)
    .some(id => !(c === loop && !exported && id === Properties.__data)
      && someToken(getState(c, id, exported)?.expression, token => token.type === 'state' && token.componentId === loopId)))
  return [loop, ...loop.find('*')].filter(usesItem)
}
