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
import { DATA_SOURCE_DATA_LOAD_END, DataSourceId, Expression, Field, IDataSource, Properties, State, StoredProperty, StoredToken, Token, Type, UnariOperator } from '../types'
import GraphQL, { BACKEND_TYPES, GraphQLBackendType, bodyStart } from '../datasources/GraphQL'
import { addDataSource, getAllDataSources, removeDataSource, setDataSources } from '../model/dataSourceRegistry'
import { getOrCreatePersistantId, getPersistantId, getState, getStateIds, newStateId, previewFirstItem, removeState, setState } from '../model/state'
import { StoredState } from '../model/state'
import { getExpressionResultType } from '../model/token'
import { isComponentVisible } from '../view/canvas'
import { getCompletion, getPageExpressions, getPageQuery, getValue } from '../api'
import { cleanStateName, filterDisplayedCompletion, getTokenDisplayName, groupByType, isSecondaryToken, textFilter } from '../utils'
import { getPreviewErrors } from '../model/previewDataLoader'
import { SchemaLookup, expressionToPath, parsePath, resolvePath, typeLabel } from './path'
import { itemFields, listBelow } from './schema'
import { checkAuthorization, checkSourceId, checkUrl, connectSource, within } from './sources'

export const CMD_CMS = 'data-source:cms'

const ACTIONS = ['list', 'add', 'update', 'remove', 'expression', 'expression_add', 'expression_set', 'unbind', 'bindings'] as const
type Action = typeof ACTIONS[number]
const BIND_TO = ['content', 'loop', 'attribute', 'condition'] as const
type BindTo = typeof BIND_TO[number]

interface CmsOptions {
  element_id?: string
  source?: string
  url?: string
  backend?: string
  authorization?: string
  bind_to?: string
  attribute?: string
  operator?: string
  token?: string
  options?: Record<string, unknown>
  index?: number
  show_all?: boolean
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
}

const BINDING = {
  element_id: { type: 'string', description: 'Element id, like "ab12". Default: the selected element' },
  bind_to: { type: 'string', enum: [...BIND_TO], description: 'loop repeats the element for each item of a list' },
  token: { type: 'string', description: 'one of the next tokens of the answer, like posts, then nodes; item is the closest loop. With expression_set, "-" removes the token and the ones after' },
  options: { type: 'object', description: 'options of the token, like {"first": 3}' },
  index: { type: 'number', description: 'position of the token in the expression, from 0' },
  show_all: { type: 'boolean', description: 'also list the secondary fields, as "Show all fields" in the editor' },
  attribute: { type: 'string', description: 'bind_to attribute: src, href, alt…' },
  operator: { type: 'string', enum: [UnariOperator.TRUTHY, UnariOperator.FALSY], description: 'bind_to condition: show the element when the value is truthy (default) or falsy' },
}

interface ActionDef { tool: 'cms' | 'element', description: string, parameters: string[], required?: string[], readOnly?: boolean }

const ACTION_OF: Record<Action, ActionDef> = {
  list: { tool: 'cms', description: 'the sources.', parameters: [], readOnly: true },
  add: { tool: 'cms', description: 'tests the connection to a GraphQL API, adds it and lists its collections.', parameters: ['source', 'url', 'backend', 'authorization'], required: ['source', 'url'] },
  update: { tool: 'cms', description: 'change a source, tested like add.', parameters: ['source', 'url', 'backend', 'authorization'], required: ['source'] },
  remove: { tool: 'cms', description: 'remove a source no element uses.', parameters: ['source'], required: ['source'] },
  expression: { tool: 'element', description: 'the CMS expression of the element for bind_to (its content, an attribute, a loop or a condition): its tokens, its preview value and the next tokens.', parameters: ['element_id', 'bind_to', 'attribute', 'show_all'], required: ['bind_to'], readOnly: true },
  expression_add: { tool: 'element', description: 'add a token at the end of the expression: data from a CMS source (cms tool), the item of a loop or a filter. Answers like expression.', parameters: ['element_id', 'bind_to', 'attribute', 'token', 'options', 'operator', 'show_all'], required: ['bind_to', 'token'] },
  expression_set: { tool: 'element', description: 'change the token at index or its options; a new token removes the ones after. Answers like expression.', parameters: ['element_id', 'bind_to', 'attribute', 'index', 'token', 'options', 'show_all'], required: ['bind_to', 'index'] },
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
    openWorld: action === 'add' || action === 'update' || action === 'expression_add' || action === 'expression_set',
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
  const ds = getAllDataSources().find(ds => ds.id === id)
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

function elementId(editor: Editor, component: Component): string {
  return editor.runCommand('agent-ids:get', { component })
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
  return `Source "${id}" added (${ds.backendType}). Its data are tokens of element(action:'expression').`
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


function targetElement(editor: Editor, id: string | undefined): Component {
  return editor.runCommand('agent-ids:elements', { element_id: id })[0]
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

// Text around one path, like ./blog/{item.slug}/: the text goes in the published
// Liquid and JavaScript, so it keeps to the characters of an address
const TEMPLATE = /^([^{}]*)\{([^{}]+)\}([^{}]*)$/
const TEMPLATE_TEXT = /^[A-Za-z0-9/_.#?=&:~-]*$/

function templateExpression(editor: Editor, component: Component | undefined, path: string, ownLoopIsItem: boolean, link = false): Resolved {
  if (!path.includes('{') && !path.includes('}')) return pathExpression(editor, component, path, ownLoopIsItem)
  const [, before, inner, after] = TEMPLATE.exec(path) ?? []
  if (inner === undefined) throw new Error(`Write text around one path in braces, like ./blog/{item.slug}/. Got "${path}".`)
  if (!TEMPLATE_TEXT.test(before) || !TEMPLATE_TEXT.test(after)) {
    throw new Error('Outside the braces, only letters, digits and / _ . # ? = & : ~ - are allowed.')
  }
  // The value comes from the CMS: it must not end up after javascript: in a link
  const scheme = link ? /^([a-z][a-z0-9+.-]*):/i.exec(before)?.[1].toLowerCase() : undefined
  if (scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme)) throw new Error(`A link can start with http:, https:, mailto: or tel:, not ${scheme}:.`)
  const resolved = pathExpression(editor, component, inner.trim(), ownLoopIsItem)
  if (resolved.field.kind !== 'scalar') throw new Error(`${inner.trim()} is not a value: text can only go around a value, like item.slug.`)
  return {
    ...resolved,
    expression: [
      ...resolved.expression,
      ...(before ? [textFilter('prepend', before)] : []),
      ...(after ? [textFilter('append', after)] : []),
    ],
  }
}

// The loop of an element is item for its own content, not for its own loop
function pathExpression(editor: Editor, component: Component | undefined, path: string, ownLoopIsItem: boolean): Resolved {
  const [first, ...rest] = parsePath(path)
  if (first.args) throw new Error(`A path starts with a source id or item, without arguments: ${first.name}.${rest[0]?.name ?? 'field'}.`)
  if (first.name === 'item') {
    const loop = component && loopAround(component, ownLoopIsItem)
    if (!loop) return pageItemExpression(editor, component, rest)
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

// On a collection page, item is the item of the page: Silex keeps the items of the
// page in a state of the body (cms/states.ts)
const PAGE_ITEMS = 'items'

function pageItemExpression(editor: Editor, component: Component | undefined, rest: ReturnType<typeof parsePath>): Resolved {
  const body = (component ? component.parents().pop() ?? component : undefined) ?? editor.Pages.getSelected()?.getMainComponent()
  const items = body && getState(body, PAGE_ITEMS, true)
  const itemsField = items?.expression?.length ? getExpressionResultType(items.expression, body!) : null
  if (!body || !itemsField) {
    throw new Error('No loop around the element, and this page is not a collection page. Bind an element with bind_to "loop", or the page with page(action:\'bind\', bind_to:\'collection\').')
  }
  const ds = itemsField.dataSourceId === undefined ? undefined : getAllDataSources().find(d => d.id === itemsField.dataSourceId)
  if (!ds) throw new Error('The collection of this page has an unknown type. Bind the page again with bind_to "collection".')
  const state: State = {
    type: 'state',
    storedStateId: PAGE_ITEMS,
    componentId: getOrCreatePersistantId(body),
    exposed: true,
    label: 'Pagination items',
  }
  const firstItem = { type: 'filter', id: 'first', label: 'first', options: {} } as unknown as StoredToken
  const lookup = lookupFor(ds)
  const item: Field = { ...itemsField, kind: 'object' }
  const { tokens, field } = rest.length ? resolvePath(rest, item, 'item', lookup) : { tokens: [], field: item }
  return { expression: [state, firstItem, ...tokens], field, lookup, ds }
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

// An expression is built token by token, as in the expression editor (view/state-editor.ts)
interface Slot {
  component: Component
  target: BindTo
  attribute: string | null
}

function slotOf(editor: Editor, opts: CmsOptions): Slot {
  const target = bindTo(opts.bind_to)
  return { component: targetElement(editor, opts.element_id), target, attribute: target === 'attribute' ? attributeName(opts.attribute) : null }
}

function stateIdOf({ component, target, attribute }: Slot): string | undefined {
  return attribute ? attributeStateId(component, attribute) : STATE_OF[target as Exclude<BindTo, 'attribute'>]
}

function tokensOf(slot: Slot): StoredToken[] {
  const id = stateIdOf(slot)
  return (id ? getState(slot.component, id, false)?.expression ?? [] : []) as StoredToken[]
}

function keyOf(token: Token): string {
  switch (token.type) {
  case 'property': return token.fieldId
  case 'filter': return token.id
  case 'state': return token.storedStateId === Properties.__data && !token.exposed ? 'item' : token.storedStateId
  }
}

interface Entry { key: string, token: Token, group: string }

// The "+" drop down of the expression editor: same completion, same hidden fields, same groups
function nextTokens(editor: Editor, slot: Slot, tokens: StoredToken[], showAll: boolean): { entries: Entry[], hidden: number } {
  const completion = getCompletion({ component: slot.component, expression: tokens, currentStateId: stateIdOf(slot) ?? slot.attribute ?? undefined, hideLoopData: slot.target === 'loop' })
  const dataSources = getAllDataSources()
  const shown = filterDisplayedCompletion(completion, token => isSecondaryToken(token, dataSources), showAll)
  const seen = new Map<string, number>()
  const entries = Object.entries(groupByType(editor, slot.component, shown, tokens)).flatMap(([group, groupTokens]) => groupTokens.map(token => {
    const key = keyOf(token)
    const count = (seen.get(key) ?? 0) + 1
    seen.set(key, count)
    return { key: count > 1 ? `${key}#${count}` : key, token, group }
  }))
  return { entries, hidden: completion.length - shown.length }
}

function entryLine(component: Component, { key, token }: Entry): string {
  if (token.type !== 'property') return `${key}: ${getTokenDisplayName(component, token)}`
  const options = Object.keys(token.options ?? {})
  return `${key}: ${typeLabel(token)}${options.length ? `, options ${options.join(', ')}` : ''}`
}

function describe(editor: Editor, slot: Slot, showAll = false): string {
  const tokens = tokensOf(slot)
  const { component, target, attribute } = slot
  const what = `${attribute ? `Attribute ${attribute}` : target[0].toUpperCase() + target.slice(1)} of element ${elementId(editor, component)}`
  const sourceOf = (token: StoredProperty) => token.dataSourceId === undefined ? null : String(token.dataSourceId)
  const lines = [tokens.length ? `${what}: ${expressionToPath(tokens, sourceOf, getPersistantId(component.parents().pop() ?? component) ?? undefined)}` : `${what}: empty.`]
  if (tokens.length) lines.push(previewOf(component, target, tokens))
  const { entries, hidden } = nextTokens(editor, slot, tokens, showAll)
  const groups = [...new Set(entries.map(entry => entry.group))]
  lines.push(entries.length ? 'Next tokens:' : 'No next token.')
  for (const group of groups) {
    const inGroup = entries.filter(entry => entry.group === group)
    if (inGroup.every(entry => entry.token.type === 'filter')) lines.push(`${group}: ${inGroup.map(entry => entry.key).join(', ')}`)
    else lines.push(`${group}:`, ...inGroup.map(entry => `  ${entryLine(component, entry)}`))
  }
  if (hidden) lines.push(`${hidden} secondary fields hidden, show_all lists them.`)
  return lines.join('\n')
}

function previewOf(component: Component, target: BindTo, tokens: StoredToken[]): string {
  const field = getExpressionResultType(tokens, component)
  if (!field) return 'Preview: this expression has no type, change its last token.'
  const value = getValue(tokens, component, target !== 'loop')
  if (target === 'loop') {
    return field.kind === 'list'
      ? `Preview: ${Array.isArray(value) ? value.length : 0} items of ${field.typeIds.join('|')}. Bind its children with the token item.`
      : `Not a list yet (${typeLabel(field)}): add a token that is a list.`
  }
  if (target !== 'condition' && field.kind !== 'scalar') return `Not a value yet (${typeLabel(field)}): add one of its fields.`
  if (target === 'condition') return `Preview: the element is ${isComponentVisible(component) ? 'shown' : 'hidden'}.`
  if (value === undefined || value === null || value === '') return 'Preview: empty.'
  return `Preview: ${preview(value)}.`
}

function failure(editor: Editor, slot: Slot, why: string, showAll?: boolean): Error {
  return new Error(`${why} Nothing was changed.\n${describe(editor, slot, showAll)}`)
}

// Stored as the expression editor stores a token it picked (toValue, then fromString)
function picked(editor: Editor, slot: Slot, entry: Entry, options: Record<string, unknown> | undefined, showAll?: boolean): StoredToken {
  const token = JSON.parse(JSON.stringify(entry.token)) as StoredToken
  if (!options) return token
  if (token.type !== 'property') throw failure(editor, slot, `Options of ${entry.key} cannot be set yet.`, showAll)
  const allowed = Object.keys((entry.token as StoredProperty).options ?? {})
  const unknown = Object.keys(options).filter(name => !allowed.includes(name))
  if (unknown.length) throw failure(editor, slot, allowed.length ? `${entry.key} has no option ${unknown.join(', ')}. Options: ${allowed.join(', ')}.` : `${entry.key} takes no options.`, showAll)
  // The options form of the editor gives text
  const text = Object.fromEntries(Object.entries(options).map(([name, value]) => [name, typeof value === 'string' ? value : JSON.stringify(value)]))
  return { ...token, options: { ...token.options, ...text } }
}

function findEntry(editor: Editor, slot: Slot, before: StoredToken[], key: string | undefined, showAll?: boolean): Entry {
  if (!key) throw failure(editor, slot, 'Set token to one of the next tokens.', showAll)
  const entry = nextTokens(editor, slot, before, true).entries.find(entry => entry.key === key)
  if (!entry) throw failure(editor, slot, `No token "${key}" can come here.`, showAll)
  return entry
}

async function save(editor: Editor, slot: Slot, tokens: StoredToken[], operator: string | undefined, showAll?: boolean): Promise<string> {
  const { component, target, attribute } = slot
  if (target === 'condition' && operator !== undefined && operator !== UnariOperator.TRUTHY && operator !== UnariOperator.FALSY) throw failure(editor, slot, 'operator must be truthy or falsy.', showAll)
  const expression = target === 'loop' && tokens.length ? previewFirstItem(tokens) : tokens
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
    return failure(editor, slot, why, showAll)
  }
  try {
    if (target === 'condition') component.set('conditionOperator', operator ?? operatorBefore ?? UnariOperator.TRUTHY)
    if (operandBefore) removeState(component, Properties.condition2, false)
    write(expression.length ? (attribute ? { label: attribute, expression } : { expression }) : null)
    getPageQuery(page, editor)
  } catch (e) {
    throw undo(`This expression breaks the data query of the page: ${bodyStart(e)}.`)
  }
  const dsId = expression.find((token): token is StoredProperty => token.type === 'property' && token.dataSourceId !== undefined)?.dataSourceId
    ?? getExpressionResultType(expression, component)?.dataSourceId
  if (dsId === undefined) {
    stop()
    return describe(editor, slot, showAll)
  }
  let data: Record<DataSourceId, unknown>
  try {
    data = await within(loaded, 25_000, 'The preview data did not load within 25 s.')
  } catch (e) {
    stop()
    return `${(e as Error).message}\n${describe(editor, slot, showAll)}`
  }
  if (data[dsId] === undefined || data[dsId] === null) {
    const why = getPreviewErrors()[dsId]
    throw undo(why ? `The data query failed with this expression: ${bodyStart(why)}. Check the options of the tokens.` : `Source "${dsId}" sent no data for this page.`)
  }
  return describe(editor, slot, showAll)
}

function expression(editor: Editor, opts: CmsOptions): string {
  return describe(editor, slotOf(editor, opts), opts.show_all)
}

async function expressionAdd(editor: Editor, opts: CmsOptions): Promise<string> {
  const slot = slotOf(editor, opts)
  const tokens = tokensOf(slot)
  const token = picked(editor, slot, findEntry(editor, slot, tokens, opts.token, opts.show_all), opts.options, opts.show_all)
  return save(editor, slot, [...tokens, token], opts.operator, opts.show_all)
}

async function expressionSet(editor: Editor, opts: CmsOptions): Promise<string> {
  const slot = slotOf(editor, opts)
  const tokens = tokensOf(slot)
  const index = opts.index
  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= tokens.length) {
    throw failure(editor, slot, tokens.length ? `Set index from 0 to ${tokens.length - 1}.` : 'This expression is empty, add a token with expression_add.', opts.show_all)
  }
  const before = tokens.slice(0, index)
  if (opts.token === '-') return save(editor, slot, before, undefined, opts.show_all)
  if (opts.token !== undefined) {
    // As in the editor: a new token at index clears its options and removes the tokens after
    const token = picked(editor, slot, findEntry(editor, slot, before, opts.token, opts.show_all), opts.options, opts.show_all)
    return save(editor, slot, [...before, token], undefined, opts.show_all)
  }
  if (!opts.options) throw failure(editor, slot, 'Set token or options.', opts.show_all)
  const current = nextTokens(editor, slot, before, true).entries.find(({ token }) => token.type === tokens[index].type && keyOf(token) === keyOf(tokens[index] as Token))
  if (!current) throw failure(editor, slot, `The token at ${index} cannot come here any more, change it with token.`, opts.show_all)
  const { options } = picked(editor, slot, current, opts.options, opts.show_all) as StoredProperty
  const changed = { ...tokens[index], options: { ...(tokens[index] as StoredProperty).options, ...options } } as StoredToken
  return save(editor, slot, [...before, changed, ...tokens.slice(index + 1)], undefined, opts.show_all)
}

function unbind(editor: Editor, opts: CmsOptions): string {
  const component = targetElement(editor, opts.element_id)
  const target = bindTo(opts.bind_to)
  const attribute = target === 'attribute' ? attributeName(opts.attribute) : null
  const id = attribute ? attributeStateId(component, attribute) : STATE_OF[target as Exclude<BindTo, 'attribute'>]
  if (!id || !getState(component, id, false)) throw new Error(`This element has no ${attribute ? `attribute ${attribute}` : target} binding. ${bindings(editor, opts)}`)
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

function bindings(editor: Editor, opts: CmsOptions): string {
  const component = targetElement(editor, opts.element_id)
  const sourceOf = (token: StoredProperty) => token.dataSourceId === undefined ? null : String(token.dataSourceId)
  const lines = getStateIds(component, false).flatMap(id => {
    const state = getState(component, id, false)
    if (!state?.expression?.length) return []
    const path = expressionToPath(state.expression as StoredToken[], sourceOf, getPersistantId(component.parents().pop() ?? component) ?? undefined)
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
      const { expression, field, lookup } = list ? pathExpression(editor, body, path, false) : templateExpression(editor, body, path, false)
      checkKind(list ? 'loop' : 'content', path, field, lookup)
      return { expression, fields: list ? itemFields(lookup.type(field.typeIds[0]), lookup) : [] }
    },
  })
  editor.Commands.add(`${CMD_CMS}:path-of`, {
    run(_editor: Editor, _sender: unknown, { expression, body }: { expression: StoredToken[], body: Component }) {
      return expressionToPath(expression, token => token.dataSourceId === undefined ? null : String(token.dataSourceId), getPersistantId(body) ?? undefined)
    },
  })
  const run: Record<Action, (opts: CmsOptions) => unknown> = {
    list: () => list(),
    add: opts => add(editor, opts),
    update: opts => update(editor, opts),
    remove: opts => remove(editor, opts),
    expression: opts => expression(editor, opts),
    expression_add: opts => expressionAdd(editor, opts),
    expression_set: opts => expressionSet(editor, opts),
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
