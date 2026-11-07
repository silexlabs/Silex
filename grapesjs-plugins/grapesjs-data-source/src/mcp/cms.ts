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
import { BinaryOperator, DATA_SOURCE_DATA_LOAD_END, DataSourceId, Expression, Field, IDataSource, Properties, StoredProperty, StoredToken, Type, UnariOperator } from '../types'
import GraphQL, { BACKEND_TYPES, GraphQLBackendType, bodyStart } from '../datasources/GraphQL'
import { addDataSource, getAllDataSources, getDataSource, removeDataSource, setDataSources } from '../model/dataSourceRegistry'
import { getPersistantId, getState, getStateIds, newStateId, previewFirstItem, removeState, setState } from '../model/state'
import { StoredState } from '../model/state'
import { getFilters } from '../model/dataSourceManager'
import { isComponentVisible } from '../view/canvas'
import { getPageExpressions, getPageQuery, getValue } from '../api'
import { cleanStateName, findToken, getFixedToken } from '../utils'
import { getPreviewErrors } from '../model/previewDataLoader'
import { SchemaLookup, expressionToPath, filterTokens, parsePath, resolvePath, splitTopLevel, typeLabel } from './path'
import { itemFields, listBelow, searchSchema, summarizeRoot, summarizeType } from './schema'
import { checkAuthorization, checkSourceId, checkUrl, connectSource, within } from './sources'
import { elementId, isLoopItem, itemScope, itemUsers } from './item'

export const CMD_CMS = 'data-source:cms'

const ACTIONS = ['list', 'add', 'update', 'remove', 'schema', 'search', 'bind', 'unbind', 'bindings'] as const
type Action = typeof ACTIONS[number]
const BIND_TO = ['content', 'loop', 'attribute', 'condition'] as const
type BindTo = typeof BIND_TO[number]
const OPERATORS: string[] = [...Object.values(UnariOperator), ...Object.values(BinaryOperator)]
const BINARY: string[] = Object.values(BinaryOperator)

interface CmsOptions {
  element_id?: string
  source?: string
  url?: string
  backend?: string
  authorization?: string
  type?: string
  text?: string
  bind_to?: string
  path?: string
  attribute?: string
  operator?: string
  value?: string
}

const STATE_OF: Record<Exclude<BindTo, 'attribute'>, string> = {
  content: Properties.innerHTML,
  loop: Properties.__data,
  condition: Properties.condition,
}

const SOURCE = {
  source: { type: 'string', description: 'Source id, like "wp". Paths start with it' },
  url: { type: 'string', description: 'GraphQL endpoint, like https://name.wp.cms.blue/graphql' },
  backend: { type: 'string', enum: [...BACKEND_TYPES], description: 'default detected' },
  authorization: { type: 'string', description: 'Authorization header, like "Bearer <token>". Empty removes it. Never shown back' },
  type: { type: 'string', description: 'a type name from a previous answer, like Post' },
  text: { type: 'string', description: 'part of a type or field name' },
  path: { type: 'string', description: 'lists the fields of what the path leads to, like wp.posts.nodes' },
}

const BINDING = {
  element_id: { type: 'string', description: 'Element id, like "ab12". Default: the selected element' },
  bind_to: { type: 'string', enum: [...BIND_TO], description: 'loop repeats the element for each item of a list' },
  path: { type: 'string', description: 'wp.posts(first: 3).nodes for a loop, item.title inside a loop (item = the closest loop). A Liquid expression without {{ }}: filters go after |, like item.content | strip_html | truncate: 150, or item.title | append: " | Blog". Filter arguments: text in quotes, a number, or a path like append: item.category; filters that take text, like join or date, only take it in quotes' },
  attribute: { type: 'string', description: 'bind_to attribute: src, href, alt…' },
  operator: { type: 'string', enum: OPERATORS, description: 'bind_to condition: show the element when the value is truthy (default), or when it compares to value, like ==' },
  value: { type: 'string', description: 'bind_to condition with ==, !=, >, <, >= or <=: the text to compare with, without quotes, like news' },
}

interface ActionDef { tool: 'cms' | 'element', description: string, parameters: string[], required?: string[], readOnly?: boolean }

const ACTION_OF: Record<Action, ActionDef> = {
  list: { tool: 'cms', description: 'the sources.', parameters: [], readOnly: true },
  add: { tool: 'cms', description: 'tests the connection to a GraphQL API, adds it and lists its collections.', parameters: ['source', 'url', 'backend', 'authorization'], required: ['source', 'url'] },
  update: { tool: 'cms', description: 'change a source, tested like add.', parameters: ['source', 'url', 'backend', 'authorization'], required: ['source'] },
  remove: { tool: 'cms', description: 'remove a source no element uses.', parameters: ['source'], required: ['source'] },
  schema: { tool: 'cms', description: 'the collections of a source, the fields of a type or of a path. Source optional when there is one.', parameters: ['source', 'type', 'path'], readOnly: true },
  search: { tool: 'cms', description: 'fields and types whose name contains text.', parameters: ['source', 'text'], required: ['text'], readOnly: true },
  bind: { tool: 'element', description: 'show data from a CMS source (cms tool) in the element: its content, an attribute, a loop or a condition.', parameters: ['element_id', 'bind_to', 'path', 'attribute', 'operator', 'value'], required: ['bind_to', 'path'] },
  unbind: { tool: 'element', description: 'remove a binding of the element.', parameters: ['element_id', 'bind_to', 'attribute'], required: ['bind_to'] },
  bindings: { tool: 'element', description: 'the bindings of the element.', parameters: ['element_id'], readOnly: true },
}

export const CMS_DESCRIPTION = 'Data from a CMS (GraphQL API, like WordPress headless): connect a source and explore its schema.'

export const cmsCapabilities = ACTIONS.map(action => {
  const { tool, description, parameters, required, readOnly } = ACTION_OF[action]
  const schemas: Record<string, unknown> = tool === 'cms' ? SOURCE : BINDING
  return {
    tool,
    action,
    command: `${CMD_CMS}:${action}`,
    description,
    openWorld: action === 'add' || action === 'update' || action === 'bind',
    destructive: action === 'remove' || action === 'unbind',
    readOnly,
    inputSchema: {
      type: 'object',
      required,
      properties: Object.fromEntries(parameters.map(key => [key, schemas[key]])),
    },
  }
})

function lookupFor(ds: IDataSource): SchemaLookup {
  const wordpress = ds instanceof GraphQL && ds.backendType === 'wordpress'
  return {
    queryables: () => ds.getQueryables(),
    // The data source also lists each root field as a type of the same name
    type: id => ds.getTypes().find(type => type.id === id && !(type as Type & { queryable?: boolean }).queryable),
    secondary: ds.getSecondaryFieldNames?.() ?? [],
    missingFieldHint: wordpress ? 'Silex hides some technical WordPress types, and a field added with ACF or Pods needs its "Show in GraphQL" option.' : undefined,
  }
}

const userSources = () => getAllDataSources().filter(ds => !ds.hidden)

function connectedSource(id: string | undefined): IDataSource {
  const sources = userSources()
  if (!id) {
    if (sources.length === 1) return checkConnected(sources[0])
    throw new Error(sources.length
      ? `Set source, one of: ${sources.map(ds => ds.id).join(', ')}.`
      : 'No source yet. Add one with action "add", source and url.')
  }
  const ds = sources.find(ds => ds.id === id)
  if (!ds) throw new Error(`No source "${id}". Sources: ${sources.map(ds => ds.id).join(', ') || 'none, add one with action "add"'}.`)
  return checkConnected(ds)
}

function checkConnected(ds: IDataSource): IDataSource {
  if (!ds.isConnected()) throw new Error(`Source "${ds.id}" is not connected. Call action "update" with source "${ds.id}" to connect it again.`)
  return ds
}

function editableSource(id: string | undefined): GraphQL {
  const ds = getDataSource(id)
  if (!ds) throw new Error(`No source "${id ?? ''}". Sources: ${userSources().map(ds => ds.id).join(', ') || 'none'}.`)
  if (!(ds instanceof GraphQL) || ds.readonly || ds.hidden) throw new Error(`Source "${ds.id}" comes with Silex and cannot be changed.`)
  return ds
}

function backendOf(value: string | undefined): GraphQLBackendType | undefined {
  if (value === undefined) return undefined
  if (!BACKEND_TYPES.includes(value as GraphQLBackendType)) throw new Error(`backend must be one of ${BACKEND_TYPES.join(', ')}.`)
  return value as GraphQLBackendType
}

// Sources are saved with the website, but adding one is not a change GrapesJS tracks
function markChanged(editor: Editor) {
  editor.getModel().set('changesCount', editor.getDirtyCount() + 1)
}

function describeSource(ds: IDataSource): string {
  const backend = ds instanceof GraphQL ? ds.backendType : ds.type
  const auth = Object.keys(ds.headers ?? {}).some(key => key.toLowerCase() === 'authorization') ? 'auth:set' : 'auth:none'
  return `${ds.id} ${ds.url} ${backend} ${auth} ${ds.isConnected() ? 'connected' : 'not connected'}`
}

function listIds(editor: Editor, components: Component[]): string {
  const ids = components.slice(0, 5).map(component => elementId(editor, component))
  return ids.join(', ') + (components.length > 5 ? '…' : '')
}


async function add(editor: Editor, opts: CmsOptions): Promise<string> {
  const id = checkSourceId(opts.source, getAllDataSources().map(ds => String(ds.id)))
  const url = checkUrl(opts.url)
  const headers: Record<string, string> = opts.authorization ? { Authorization: checkAuthorization(opts.authorization) } : {}
  const ds = await connectSource({ id, label: id, url, headers, backend: backendOf(opts.backend) })
    .catch(e => { throw new Error(`${(e as Error).message} The source was not added.`, { cause: e }) })
  addDataSource(ds, { connected: true })
  markChanged(editor)
  return `Source "${id}" added (${ds.backendType}).\n${summarizeRoot(id, lookupFor(ds))}`
}

async function update(editor: Editor, opts: CmsOptions): Promise<string> {
  const old = editableSource(opts.source)
  const url = opts.url === undefined ? old.url : checkUrl(opts.url)
  const headers = Object.fromEntries(Object.entries(old.headers ?? {}).filter(([key]) => key.toLowerCase() !== 'authorization'))
  const oldAuth = Object.entries(old.headers ?? {}).find(([key]) => key.toLowerCase() === 'authorization')?.[1]
  const auth = opts.authorization === undefined ? oldAuth : checkAuthorization(opts.authorization)
  if (auth) headers.Authorization = auth
  const backend = backendOf(opts.backend)
  // Same server: keep the types chosen in the settings, the bindings may use them
  const same = url === old.url && (!backend || backend === old.backendType)
  const ds = await connectSource({ id: old.id, label: old.label, url, headers, backend: same ? old.backendType : backend, keep: same ? old : undefined })
    .catch(e => { throw new Error(`${(e as Error).message} Nothing was changed.`, { cause: e }) })
  setDataSources(getAllDataSources().map(other => other === old ? ds : other))
  markChanged(editor)
  return `Source updated: ${describeSource(ds)}`
}

function remove(editor: Editor, opts: CmsOptions): string {
  const ds = editableSource(opts.source)
  const users = editor.Pages.getAll().flatMap(page => getPageExpressions(page)
    .filter(({ expression }) => !!findToken(expression, token => token.type === 'property' && token.dataSourceId === ds.id))
    .map(({ component }) => ({ component, page })))
  const elements = [...new Map(users.map(user => [user.component, user])).values()]
  if (elements.length) {
    const here = elements.filter(({ page }) => page === editor.Pages.getSelected()).map(({ component }) => component)
    const elsewhere = [...new Set(elements.filter(({ page }) => page !== editor.Pages.getSelected()).map(({ page }) => page.id))]
    const where = [here.length ? `elements ${listIds(editor, here)}` : '', elsewhere.length ? `pages ${elsewhere.join(', ')}` : ''].filter(Boolean).join(' and ')
    throw new Error(`Source "${ds.id}" is used by ${where}. Unbind them first with element(action:'unbind'). Nothing was removed.`)
  }
  removeDataSource(ds)
  markChanged(editor)
  return `Source "${ds.id}" removed.`
}

function list(): string {
  const sources = userSources()
  return sources.length ? sources.map(describeSource).join('\n') : 'No source yet. Add one with action "add", source and url.'
}


function schema(editor: Editor, opts: CmsOptions): string {
  if (opts.path) {
    const { field, lookup } = pathExpression(editor, editor.getSelected(), opts.path, true)
    if (field.kind === 'scalar') return `${opts.path} is a value (${typeLabel(field)}).`
    const type = lookup.type(field.typeIds[0])
    if (!type) throw new Error(`No type ${field.typeIds[0]}.`)
    return summarizeType(type, lookup)
  }
  const ds = connectedSource(opts.source)
  const lookup = lookupFor(ds)
  if (!opts.type) return summarizeRoot(String(ds.id), lookup)
  const type = lookup.type(opts.type)
  if (!type) throw new Error(`No type "${opts.type}" in source "${ds.id}". Use a type shown by action "schema", like Post in [Post], or a path.`)
  return summarizeType(type, lookup)
}

function search(opts: CmsOptions): string {
  if (!opts.text) throw new Error('Set text to part of a type or field name.')
  const ds = connectedSource(opts.source)
  const types = ds.getTypes().filter(type => type.dataSourceId !== undefined && !(type as Type & { queryable?: boolean }).queryable)
  return searchSchema(String(ds.id), opts.text, types, lookupFor(ds))
}


function targetElement(editor: Editor, id: string | undefined): Component {
  return editor.runCommand('agent-ids:elements', { element_id: id })[0]
}

function bindTo(value: string | undefined): BindTo {
  if (!BIND_TO.includes(value as BindTo)) throw new Error(`Set bind_to to one of ${BIND_TO.join(', ')}.`)
  return value as BindTo
}

function attributeName(value: string | undefined): string {
  const name = cleanStateName(value ?? null)
  if (!value || name !== value.toLowerCase() || !/^[a-z_:][a-z0-9_:.-]*$/.test(name)) throw new Error('Set attribute to an HTML attribute name, like src, href or alt.')
  if (name.startsWith('on')) throw new Error('Event attributes (on…) cannot come from the CMS.')
  if ((Object.values(Properties) as string[]).includes(name)) throw new Error(`"${name}" is not an attribute, use bind_to "${name === Properties.innerHTML ? 'content' : 'condition'}".`)
  return name
}

function attributeStateId(component: Component, name: string): string | undefined {
  return getStateIds(component, false).find(id => id === name || getState(component, id, false)?.label === name)
}

interface Resolved {
  expression: Expression
  field: Field
  lookup: SchemaLookup
  ds: IDataSource
}

// The loop of an element is item for its own content, not for its own loop
function pathExpression(editor: Editor, component: Component | undefined, path: string, ownLoopIsItem: boolean): Resolved {
  const [dataPath, ...calls] = splitTopLevel(path, '|')
  if (calls.length) {
    const resolved = pathExpression(editor, component, dataPath, ownLoopIsItem)
    const option = (optionPath: string) => pathExpression(editor, component, optionPath, ownLoopIsItem).expression
    const { tokens, field } = filterTokens(calls, resolved.field, resolved.lookup, getFilters(), option)
    return { ...resolved, expression: [...resolved.expression, ...tokens], field }
  }
  const [first, ...rest] = parsePath(path)
  if (first.args) throw new Error(`A path starts with a source id or item, without arguments: ${first.name}.${rest[0]?.name ?? 'field'}.`)
  if (first.name === 'item') {
    const { tokens: start, field: item, ds } = itemScope(editor, component, ownLoopIsItem)
    const lookup = lookupFor(ds)
    const { tokens, field } = rest.length ? resolvePath(rest, item, 'item', lookup) : { tokens: [], field: item }
    return { expression: [...start, ...tokens], field, lookup, ds }
  }
  const ds = connectedSource(first.name)
  if (rest.length === 0) throw new Error(`Add the fields after the source id, like ${first.name}.posts.nodes.`)
  const lookup = lookupFor(ds)
  const { tokens, field } = resolvePath(rest, null, first.name, lookup)
  return { expression: tokens, field, lookup, ds }
}

function checkKind(target: BindTo, path: string, field: Field, lookup: SchemaLookup) {
  if (field.kind !== 'scalar' && field.typeIds.length > 1) {
    throw new Error(`${path} can be ${field.typeIds.length} types (${field.typeIds.slice(0, 5).join(', ')}). Use a collection of one type, or a field they share: ${path}.<field>.`)
  }
  if (target === 'loop') {
    if (field.kind === 'list') return
    const below = listBelow(field, lookup)
    throw new Error(below ? `${path} is not a list. Did you mean ${path}${below}?` : `${path} is not a list (${typeLabel(field)}), there is nothing to repeat.`)
  }
  if (target === 'condition' || field.kind === 'scalar') return
  if (field.kind === 'list') throw new Error(`${path} is a list. Bind it with bind_to "loop" on the element to repeat, then use item.<field> inside.`)
  const fields = itemFields(lookup.type(field.typeIds[0]), lookup, target === 'attribute')
  throw new Error(`${path} is an object (${typeLabel(field)}). Bind one of its values: ${fields.length ? fields.map(f => `${path}.${f}`).join(', ') : 'it has none'}.`)
}

function preview(value: unknown): string {
  const text = String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return JSON.stringify(text.length > 60 ? `${text.slice(0, 60)}…` : text)
}

// The load that the state change starts (dataSourceManager onStateChange)
function nextPreviewLoad(editor: Editor): { loaded: Promise<Record<DataSourceId, unknown>>, stop: () => void } {
  let listener: (data: Record<DataSourceId, unknown>) => void = () => {}
  const loaded = new Promise<Record<DataSourceId, unknown>>(resolve => {
    listener = data => { editor.off(DATA_SOURCE_DATA_LOAD_END, listener); resolve(data ?? {}) }
    editor.on(DATA_SOURCE_DATA_LOAD_END, listener)
  })
  return { loaded, stop: () => editor.off(DATA_SOURCE_DATA_LOAD_END, listener) }
}

function writer(component: Component, target: BindTo, attribute: string | null): { write: (state: StoredState | null) => void, before: StoredState | null } {
  const id = attribute
    ? attributeStateId(component, attribute) ?? newStateId(component)
    : STATE_OF[target as Exclude<BindTo, 'attribute'>]
  return {
    before: getState(component, id, false),
    write: state => state ? setState(component, id, state, false) : removeState(component, id, false),
  }
}

async function bind(editor: Editor, opts: CmsOptions): Promise<string> {
  const component = targetElement(editor, opts.element_id)
  const target = bindTo(opts.bind_to)
  if (!opts.path) throw new Error('Set path, like wp.posts.nodes for a loop or item.title inside a loop.')
  const attribute = target === 'attribute' ? attributeName(opts.attribute) : null
  const operator = opts.operator ?? UnariOperator.TRUTHY
  if (target === 'condition' && !OPERATORS.includes(operator)) throw new Error(`operator must be one of: ${OPERATORS.join(', ')}.`)
  const binary = target === 'condition' && BINARY.includes(operator)
  if (binary && opts.value === undefined) throw new Error(`operator ${operator} compares with value: set value, like news.`)
  if (!binary && opts.value !== undefined) throw new Error('value is only for a condition with ==, !=, >, <, >= or <=.')
  const { field, lookup, ds, ...resolved } = pathExpression(editor, component, opts.path, target !== 'loop')
  checkKind(target, opts.path, field, lookup)
  const expression = target === 'loop' ? previewFirstItem(resolved.expression) : resolved.expression

  const { write, before } = writer(component, target, attribute)
  const operatorBefore = component.get('conditionOperator')
  const operandBefore = target === 'condition' ? getState(component, Properties.condition2, false) : null
  const page = editor.Pages.getSelected()!
  const { loaded, stop } = nextPreviewLoad(editor)
  const undo = (why: string) => {
    stop()
    write(before)
    if (target === 'condition') {
      if (operatorBefore === undefined) component.unset('conditionOperator')
      else component.set('conditionOperator', operatorBefore)
      if (operandBefore) setState(component, Properties.condition2, operandBefore, false)
      else if (binary) removeState(component, Properties.condition2, false)
    }
    return new Error(`${why} Nothing was changed.`)
  }
  try {
    if (target === 'condition') component.set('conditionOperator', operator)
    if (binary) setState(component, Properties.condition2, { expression: [getFixedToken(opts.value!)] }, false)
    else if (operandBefore) removeState(component, Properties.condition2, false)
    write(attribute ? { label: attribute, expression } : { expression })
    getPageQuery(page, editor)
  } catch (e) {
    throw undo(`This binding breaks the data query of the page: ${bodyStart(e)}.`)
  }

  let data: Record<DataSourceId, unknown>
  try {
    data = await within(loaded, 25_000, 'The preview data did not load within 25 s.')
  } catch (e) {
    stop()
    return `Bound, but ${(e as Error).message[0].toLowerCase()}${(e as Error).message.slice(1)}`
  }
  if (data[ds.id] === undefined || data[ds.id] === null) {
    const why = getPreviewErrors()[ds.id]
    throw undo(why ? `The data query failed with this binding: ${bodyStart(why)}. Check the arguments in path.` : `Source "${ds.id}" sent no data for this page.`)
  }

  const inLoop = isLoopItem(expression[0])
  switch (target) {
  case 'loop': {
    const value = getValue(expression, component, false)
    const items = Array.isArray(value) ? value.length : 0
    return `Loop bound on element ${elementId(editor, component)}: ${items} items of ${field.typeIds[0]} in the preview. Item fields: ${itemFields(lookup.type(field.typeIds[0]), lookup).join(', ')}. Bind its children with item.<field>.`
  }
  case 'condition':
    return `Condition bound: the element is ${isComponentVisible(component) ? 'shown' : 'hidden'}${inLoop ? ' for the first item' : ''} in the preview.`
  default: {
    const value = getValue(expression, component, true)
    const what = attribute ? `Attribute ${attribute}` : 'Content'
    if (value === undefined || value === null || value === '') return `${what} bound, but it is empty${inLoop ? ' for the first item' : ''} in the preview.`
    return `${what} bound: ${preview(value)}${inLoop ? ' for the first item' : ''}.`
  }
  }
}

function unbind(editor: Editor, opts: CmsOptions): string {
  const component = targetElement(editor, opts.element_id)
  const target = bindTo(opts.bind_to)
  const attribute = target === 'attribute' ? attributeName(opts.attribute) : null
  const id = attribute ? attributeStateId(component, attribute) : STATE_OF[target as Exclude<BindTo, 'attribute'>]
  if (!id || !getState(component, id, false)) throw new Error(`This element has no ${attribute ? `attribute ${attribute}` : target} binding. ${bindings(editor, opts)}`)
  if (target === 'loop') {
    const users = itemUsers(component)
    if (users.length) throw new Error(`Elements ${listIds(editor, users)} use item of this loop. Unbind them first. Nothing was changed.`)
  }
  removeState(component, id, false)
  if (target === 'condition') {
    component.unset('conditionOperator')
    if (getState(component, Properties.condition2, false)) removeState(component, Properties.condition2, false)
  }
  return `${attribute ? `Attribute ${attribute}` : target[0].toUpperCase() + target.slice(1)} binding removed.`
}

const sourceOf = (token: StoredProperty) => token.dataSourceId === undefined ? null : String(token.dataSourceId)

function pathOf(expression: StoredToken[], body: Component): string {
  return expressionToPath(expression, sourceOf, getPersistantId(body) ?? undefined, getFilters())
}

function bindings(editor: Editor, opts: CmsOptions): string {
  const component = targetElement(editor, opts.element_id)
  const lines = getStateIds(component, false).flatMap(id => {
    const state = getState(component, id, false)
    if (!state?.expression?.length) return []
    const path = pathOf(state.expression as StoredToken[], component.parents().pop() ?? component)
    switch (id) {
    case Properties.innerHTML: return [`content: ${path}`]
    case Properties.__data: return [`loop: ${path}`]
    case Properties.condition: return [`condition (${component.get('conditionOperator') ?? UnariOperator.TRUTHY}): ${path}`]
    case Properties.condition2: return [`condition, compared with: ${path}`]
    default: return [`attribute ${state.label || id}: ${path}`]
    }
  })
  return lines.length ? lines.join('\n') : 'This element has no bindings.'
}

export default (editor: Editor) => {
  // For the page tool of Silex: the same paths as the bindings of an element
  editor.Commands.add(`${CMD_CMS}:resolve`, {
    run(_editor: Editor, _sender: unknown, { path, list }: { path?: string, list?: boolean }) {
      if (!path) throw new Error('Set path.')
      const body = editor.Pages.getSelected()?.getMainComponent()
      const { expression, field, lookup } = pathExpression(editor, body, path, false)
      checkKind(list ? 'loop' : 'content', path, field, lookup)
      return { expression, fields: list ? itemFields(lookup.type(field.typeIds[0]), lookup) : [] }
    },
  })
  editor.Commands.add(`${CMD_CMS}:path-of`, {
    run(_editor: Editor, _sender: unknown, { expression, body }: { expression: StoredToken[], body: Component }) {
      return pathOf(expression, body)
    },
  })
  const run: Record<Action, (opts: CmsOptions) => unknown> = {
    list: () => list(),
    add: opts => add(editor, opts),
    update: opts => update(editor, opts),
    remove: opts => remove(editor, opts),
    schema: opts => schema(editor, opts),
    search: opts => search(opts),
    bind: opts => bind(editor, opts),
    unbind: opts => unbind(editor, opts),
    bindings: opts => bindings(editor, opts),
  }
  for (const action of ACTIONS) {
    editor.Commands.add(`${CMD_CMS}:${action}`, {
      async run(_editor: Editor, _sender: unknown, opts: CmsOptions = {}) {
        return run[action](opts)
      },
    })
  }
}
