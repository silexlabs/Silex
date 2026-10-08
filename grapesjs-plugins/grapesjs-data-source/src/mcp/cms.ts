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
import { DATA_SOURCE_DATA_LOAD_END, DataSourceId, Expression, Field, IDataSource, Properties, State, StoredProperty, StoredToken, Type, UnariOperator } from '../types'
import GraphQL, { GraphQLBackendType } from '../datasources/GraphQL'
import { getAllDataSources, setDataSources } from '../model/dataSourceRegistry'
import { getOrCreatePersistantId, getPersistantId, getState, getStateIds, removeState, setState } from '../model/state'
import { StoredState } from '../model/state'
import { getExpressionResultType } from '../model/token'
import { isComponentVisible } from '../view/canvas'
import { getPageExpressions, getPageQuery, getValue } from '../api'
import { cleanStateName } from '../utils'
import { getPreviewErrors } from '../model/previewDataLoader'
import { SchemaLookup, expressionToPath, parsePath, resolvePath, typeLabel } from './path'
import { itemFields, listBelow, searchSchema, summarizeRoot, summarizeType } from './schema'
import { BACKENDS, checkAuthorization, checkSourceId, checkUrl, connectSource, within } from './sources'

export const CMD_CMS = 'data-source:cms'

const ACTIONS = ['list', 'add', 'update', 'remove', 'schema', 'search', 'bind', 'unbind', 'bindings'] as const
const BIND_TO = ['content', 'loop', 'attribute', 'condition'] as const
type BindTo = typeof BIND_TO[number]

interface CmsOptions {
  action?: string
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
}

const STATE_OF: Record<Exclude<BindTo, 'attribute'>, string> = {
  content: Properties.innerHTML,
  loop: Properties.__data,
  condition: Properties.condition,
}

export const cmsCapability = {
  id: 'cms',
  command: CMD_CMS,
  description: 'Data from a CMS (GraphQL API, like WordPress headless): connect a source, explore its schema, bind the selected element to its data.',
  openWorld: true,
  destructive: true,
  tags: ['data'],
  inputSchema: {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: [...ACTIONS],
        description: 'list/add/update/remove: sources (add tests the connection). schema/search: explore a source. bind/unbind/bindings: data of the selected element.',
      },
      source: { type: 'string', description: 'Source id, like "wp". Paths start with it. Optional for schema and search when there is one source.' },
      url: { type: 'string', description: 'add/update: GraphQL endpoint, like https://name.wp.cms.blue/graphql' },
      backend: { type: 'string', enum: [...BACKENDS], description: 'add/update: default detected' },
      authorization: { type: 'string', description: 'add/update: Authorization header, like "Bearer <token>". Empty removes it. Never shown back.' },
      type: { type: 'string', description: 'schema: a type name from a previous answer, like Post' },
      text: { type: 'string', description: 'search: part of a type or field name' },
      bind_to: { type: 'string', enum: [...BIND_TO], description: 'bind/unbind: loop repeats the selected element for each item of a list' },
      path: { type: 'string', description: 'bind: wp.posts(first: 3).nodes for a loop, item.title inside a loop (item = the closest loop). schema: lists the fields of what the path leads to' },
      attribute: { type: 'string', description: 'bind_to attribute: src, href, alt…' },
      operator: { type: 'string', enum: [UnariOperator.TRUTHY, UnariOperator.FALSY], description: 'bind_to condition: show the element when the value is truthy (default) or falsy' },
    },
  },
}

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
  const ds = getAllDataSources().find(ds => ds.id === id)
  if (!ds) throw new Error(`No source "${id ?? ''}". Sources: ${userSources().map(ds => ds.id).join(', ') || 'none'}.`)
  if (!(ds instanceof GraphQL) || ds.readonly || ds.hidden) throw new Error(`Source "${ds.id}" comes with Silex and cannot be changed.`)
  return ds
}

function backendOf(value: string | undefined): GraphQLBackendType | undefined {
  if (value === undefined) return undefined
  if (!BACKENDS.includes(value as GraphQLBackendType)) throw new Error(`backend must be one of ${BACKENDS.join(', ')}.`)
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

function elementId(editor: Editor, component: Component): string {
  return editor.Commands.has('agent-ids:get') ? editor.runCommand('agent-ids:get', { component }) : component.getId()
}

function someToken(value: unknown, test: (token: StoredToken) => boolean): boolean {
  if (Array.isArray(value)) return value.some(v => someToken(v, test))
  if (typeof value === 'string' && value.startsWith('[')) {
    try { return someToken(JSON.parse(value), test) } catch { return false }
  }
  if (value && typeof value === 'object') {
    return test(value as StoredToken) || Object.values(value).some(v => someToken(v, test))
  }
  return false
}

function sentence(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.slice(0, 200).trim().replace(/[.\s]+$/, '')
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
  setDataSources([...getAllDataSources(), ds])
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
    .filter(({ expression }) => someToken(expression, token => token.type === 'property' && token.dataSourceId === ds.id))
    .map(({ component }) => ({ component, page })))
  const elements = [...new Map(users.map(user => [user.component, user])).values()]
  if (elements.length) {
    const here = elements.filter(({ page }) => page === editor.Pages.getSelected()).map(({ component }) => component)
    const elsewhere = [...new Set(elements.filter(({ page }) => page !== editor.Pages.getSelected()).map(({ page }) => page.id))]
    const where = [here.length ? `elements ${listIds(editor, here)}` : '', elsewhere.length ? `pages ${elsewhere.join(', ')}` : ''].filter(Boolean).join(' and ')
    throw new Error(`Source "${ds.id}" is used by ${where}. Unbind them first with action "unbind". Nothing was removed.`)
  }
  setDataSources(getAllDataSources().filter(other => other !== ds))
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


function selectedElement(editor: Editor): Component {
  const all = editor.getSelectedAll()
  if (all.length === 0) throw new Error('No element selected. Call components_select first.')
  if (all.length > 1) throw new Error('Several elements are selected. Select only one with components_select.')
  return all[0]
}

function loopAround(component: Component, includeSelf: boolean): Component | null {
  for (let c: Component | undefined = includeSelf ? component : component.parent(); c; c = c.parent()) {
    if (getState(c, Properties.__data, false)?.expression?.length) return c
  }
  return null
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
  const [first, ...rest] = parsePath(path)
  if (first.args) throw new Error(`A path starts with a source id or item, without arguments: ${first.name}.${rest[0]?.name ?? 'field'}.`)
  if (first.name === 'item') {
    const loop = component && loopAround(component, ownLoopIsItem)
    if (!loop) throw new Error('No loop around the selected element. Select the element to repeat, bind it with bind_to "loop", then bind its children with item.<field>.')
    const loopField = getExpressionResultType(getState(loop, Properties.__data, false)!.expression, loop)
    const ds = loopField?.dataSourceId === undefined ? undefined : getAllDataSources().find(d => d.id === loopField.dataSourceId)
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
    const lookup = lookupFor(ds)
    const item: Field = { ...loopField, kind: 'object' }
    const { tokens, field } = rest.length ? resolvePath(rest, item, 'item', lookup) : { tokens: [], field: item }
    return { expression: [state, ...tokens], field, lookup, ds }
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
    ? attributeStateId(component, attribute) ?? `${component.getId()}-${Math.random().toString(36).slice(2)}`
    : STATE_OF[target as Exclude<BindTo, 'attribute'>]
  return {
    before: getState(component, id, false),
    write: state => state ? setState(component, id, state, false) : removeState(component, id, false),
  }
}

async function bind(editor: Editor, opts: CmsOptions): Promise<string> {
  const component = selectedElement(editor)
  const target = bindTo(opts.bind_to)
  if (!opts.path) throw new Error('Set path, like wp.posts.nodes for a loop or item.title inside a loop.')
  const attribute = target === 'attribute' ? attributeName(opts.attribute) : null
  const operator = opts.operator ?? UnariOperator.TRUTHY
  if (target === 'condition' && operator !== UnariOperator.TRUTHY && operator !== UnariOperator.FALSY) throw new Error('operator must be truthy or falsy.')
  const { expression, field, lookup, ds } = pathExpression(editor, component, opts.path, target !== 'loop')
  checkKind(target, opts.path, field, lookup)
  if (target === 'loop') {
    const last = expression[expression.length - 1] as StoredProperty
    expression[expression.length - 1] = { ...last, previewIndex: 0 }
  }

  const { write, before } = writer(component, target, attribute)
  const operatorBefore = component.get('conditionOperator')
  // Only unary conditions here: the second operand of a binary one goes
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
    }
    return new Error(`${why} Nothing was changed.`)
  }
  try {
    if (target === 'condition') component.set('conditionOperator', operator)
    if (operandBefore) removeState(component, Properties.condition2, false)
    write(attribute ? { label: attribute, expression } : { expression })
    getPageQuery(page, editor)
  } catch (e) {
    throw undo(`This binding breaks the data query of the page: ${sentence(e)}.`)
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
    throw undo(why ? `The data query failed with this binding: ${sentence(why)}. Check the arguments in path.` : `Source "${ds.id}" sent no data for this page.`)
  }

  const inLoop = expression[0]?.type === 'state'
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
  const component = selectedElement(editor)
  const target = bindTo(opts.bind_to)
  const attribute = target === 'attribute' ? attributeName(opts.attribute) : null
  const id = attribute ? attributeStateId(component, attribute) : STATE_OF[target as Exclude<BindTo, 'attribute'>]
  if (!id || !getState(component, id, false)) throw new Error(`This element has no ${attribute ? `attribute ${attribute}` : target} binding. ${bindings(editor)}`)
  if (target === 'loop') {
    const loopId = getPersistantId(component)
    const usesItem = (c: Component) => [false, true].some(exported => getStateIds(c, exported)
      .some(id => !(c === component && !exported && id === Properties.__data)
        && someToken(getState(c, id, exported)?.expression, token => token.type === 'state' && token.componentId === loopId)))
    const users = [component, ...component.find('*')].filter(usesItem)
    if (users.length) throw new Error(`Elements ${listIds(editor, users)} use item of this loop. Unbind them first. Nothing was changed.`)
  }
  removeState(component, id, false)
  if (target === 'condition') {
    component.unset('conditionOperator')
    if (getState(component, Properties.condition2, false)) removeState(component, Properties.condition2, false)
  }
  return `${attribute ? `Attribute ${attribute}` : target[0].toUpperCase() + target.slice(1)} binding removed.`
}

function bindings(editor: Editor): string {
  const component = selectedElement(editor)
  const sourceOf = (token: StoredProperty) => token.dataSourceId === undefined ? null : String(token.dataSourceId)
  const lines = getStateIds(component, false).flatMap(id => {
    const state = getState(component, id, false)
    if (!state?.expression?.length) return []
    const path = expressionToPath(state.expression as StoredToken[], sourceOf)
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
  editor.Commands.add(CMD_CMS, {
    async run(_editor: Editor, _sender: unknown, opts: CmsOptions = {}) {
      switch (opts.action) {
      case 'list': return list()
      case 'add': return add(editor, opts)
      case 'update': return update(editor, opts)
      case 'remove': return remove(editor, opts)
      case 'schema': return schema(editor, opts)
      case 'search': return search(opts)
      case 'bind': return bind(editor, opts)
      case 'unbind': return unbind(editor, opts)
      case 'bindings': return bindings(editor)
      default: throw new Error(`Set action to one of ${ACTIONS.join(', ')}.`)
      }
    },
  })
}
