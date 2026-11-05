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

import { Field, Filter, Options, StoredFilter, StoredProperty, StoredToken, Type, TypeId } from '../types'
import { fixedText, getFixedToken, toExpression } from '../utils'
import { itemLength } from './item'

/**
 * Data paths written by agents, like `wp.posts(first: 3).nodes` or `item.title`,
 * and the expression tokens they stand for
 */

export interface Segment {
  name: string
  args?: Record<string, string>
}

export interface SchemaLookup {
  queryables(): Field[]
  type(id: TypeId): Type | undefined
  secondary: string[]
  missingFieldHint?: string
}

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

function closing(text: string, open: number): number {
  let depth = 0
  let quote = ''
  for (let i = open; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) {
        quote = ''
        if (depth === 0) return i
      }
    } else if (c === '"' || c === '\'') quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c) && --depth === 0) return i
  }
  return -1
}

export function splitTopLevel(text: string, separator = ','): string[] {
  const parts: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if ('([{"\''.includes(c)) {
      const end = closing(text, i)
      if (end < 0) throw new Error(`Unclosed ${c} in "${text}".`)
      i = end
    } else if (c === separator) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts.map(part => part.trim()).filter(Boolean)
}

function parseArgs(text: string): Record<string, string> {
  return Object.fromEntries(splitTopLevel(text).map(arg => {
    const colon = arg.indexOf(':')
    const name = arg.slice(0, colon).trim()
    const value = arg.slice(colon + 1).trim()
    if (colon < 0 || !NAME.test(name) || !value) throw new Error(`Write arguments as name: value, like (first: 3). Got "${arg}".`)
    return [name, value]
  }))
}

export function parsePath(path: string): Segment[] {
  const segments: Segment[] = []
  let i = 0
  while (i < path.length) {
    // Sources made in the settings have ids like ds-0; GraphQL names have no dash
    const name = (i === 0 ? /^[A-Za-z_][A-Za-z0-9_-]*/ : /^[A-Za-z_][A-Za-z0-9_]*/).exec(path.slice(i))?.[0]
    if (!name) throw new Error(`Cannot read the path "${path}" at "${path.slice(i)}". Write it like wp.posts(first: 3).nodes or item.title.`)
    i += name.length
    const segment: Segment = { name }
    if (path[i] === '(') {
      const end = closing(path, i)
      if (end < 0) throw new Error(`Unclosed ( in the path "${path}".`)
      segment.args = parseArgs(path.slice(i + 1, end))
      i = end + 1
    }
    segments.push(segment)
    if (i < path.length) {
      if (path[i] !== '.') throw new Error(`Cannot read the path "${path}" at "${path.slice(i)}". Separate fields with a dot.`)
      i++
      if (i === path.length) throw new Error(`The path "${path}" ends with a dot.`)
    }
  }
  if (segments.length === 0) throw new Error('The path is empty.')
  return segments
}

export function typeLabel(field: Field): string {
  const types = field.typeIds.join('|')
  return field.kind === 'list' ? `[${types}]` : types
}

function visibleFieldNames(fields: Field[], secondary: string[]): string {
  const names = fields.map(f => f.id).filter(name => !secondary.includes(name))
  return names.slice(0, 15).join(', ') + (names.length > 15 ? `, and ${names.length - 15} more` : '')
}

function toToken(field: Field, args?: Record<string, string>): StoredProperty {
  return {
    type: 'property',
    propType: 'field',
    fieldId: field.id,
    label: field.label,
    typeIds: field.typeIds,
    kind: field.kind,
    dataSourceId: field.dataSourceId,
    // All the arguments, null when not set, as the editor stores them
    ...(field.arguments?.length ? { options: { ...Object.fromEntries(field.arguments.map(arg => [arg.name, arg.defaultValue ?? null])), ...args } } : {}),
  }
}

function checkArgs(field: Field, args: Record<string, string> | undefined, shown: string) {
  if (!args) return
  const allowed = (field.arguments ?? []).map(arg => arg.name)
  const unknown = Object.keys(args).filter(name => !allowed.includes(name))
  if (unknown.length) {
    throw new Error(allowed.length
      ? `${shown} has no argument ${unknown.join(', ')}. Arguments: ${allowed.join(', ')}.`
      : `${shown} takes no arguments.`)
  }
}

/**
 * Tokens for the segments after the start: the source root when `from` is null,
 * the loop item otherwise
 */
export function resolvePath(segments: Segment[], from: Field | null, start: string, lookup: SchemaLookup): { tokens: StoredProperty[], field: Field } {
  const tokens: StoredProperty[] = []
  let current = from
  let shown = start
  for (const segment of segments) {
    let candidates: { field: Field, typeId?: TypeId }[]
    if (!current) {
      candidates = lookup.queryables().map(field => ({ field }))
    } else {
      if (current.kind === 'list') {
        throw new Error(`${shown} is a list. Select the element to repeat, bind it with bind_to "loop" and path "${shown}", then bind its children with item.${segment.name}.`)
      }
      if (current.kind === 'scalar') {
        throw new Error(`${shown} is a value (${typeLabel(current)}), it has no field "${segment.name}".`)
      }
      candidates = current.typeIds.flatMap(typeId => (lookup.type(typeId)?.fields ?? []).map(field => ({ field, typeId })))
    }
    const found = candidates.find(c => c.field.id === segment.name)
    if (!found) {
      const where = current ? current.typeIds.join('|') : 'the root of the source'
      const hint = lookup.missingFieldHint ? ` ${lookup.missingFieldHint}` : ''
      throw new Error(`No field "${segment.name}" on ${where}. Fields: ${visibleFieldNames(candidates.map(c => c.field), lookup.secondary)}.${hint}`)
    }
    checkArgs(found.field, segment.args, `${shown}.${segment.name}`)
    // A field of a union type: keep only the type that has the next field, as the editor does
    const previous = tokens[tokens.length - 1]
    if (previous && found.typeId && previous.typeIds.length > 1) previous.typeIds = [found.typeId]
    tokens.push(toToken(found.field, segment.args))
    current = found.field
    shown = `${shown}.${segment.name}${segment.args ? `(${Object.entries(segment.args).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`
  }
  return { tokens, field: current! }
}

function optionValue(raw: string): string {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try { return JSON.parse(raw) } catch { throw new Error(`Cannot read the value ${raw}.`) }
  }
  if (raw.startsWith('\'') && raw.endsWith('\'')) return raw.slice(1, -1)
  return raw
}

// The interface picks the key of sort on the item type, like itemKeys, but its preview reads it as a field name
function isItemKey(filter: Filter | undefined, name: string): boolean {
  return !!filter?.itemKeys?.includes(name) || (filter?.id === 'sort' && name === 'key')
}

// The interface edits these quoted options with a state-editor, which stores an expression
const EXPRESSION_TEXT = ['join', 'split']

// Arguments in the order Liquid takes them, which is also the order of publication
function filterOptions(filter: Filter, args: string[], field: Field, lookup: SchemaLookup, resolve: (path: string) => StoredToken[]): Options {
  const names = filter.optionsKeys ?? Object.keys(filter.options ?? {})
  if (args.length > names.length) throw new Error(names.length ? `${filter.id} takes ${names.length} argument(s): ${names.join(', ')}.` : `${filter.id} takes no arguments.`)
  if ((filter.id === 'where' || filter.id === 'find') && args.length < 2) throw new Error(`${filter.id} takes 2 arguments: key, value, like ${filter.id}: "category", "news".`)
  if (filter.id === 'slice' && args.length < 2) throw new Error('slice takes 2 arguments: start, length, like slice: 0, 3.')
  return {
    ...filter.options,
    ...Object.fromEntries(args.map((raw, i) => {
      const name = names[i]
      const value = optionValue(raw)
      // A key is a field of each item, like the editor sets it from the item type
      if (isItemKey(filter, name)) {
        const { tokens } = resolvePath(parsePath(value), { ...field, kind: 'object' }, 'item', lookup)
        return [name, JSON.stringify(tokens)]
      }
      if (/^["']/.test(raw)) {
        // Publication quotes the quotedOptions itself, and writes the others as they are stored
        return [name, filter.quotedOptions?.includes(name) && !EXPRESSION_TEXT.includes(filter.id) ? value : JSON.stringify([getFixedToken(value)])]
      }
      if (/^-?\d+(\.\d+)?$/.test(raw)) return [name, raw]
      // Publication would quote the path, writing it as text
      if (filter.quotedOptions?.includes(name)) throw new Error(`${filter.id}: ${name} takes text in quotes, like "${raw}". Nothing was changed.`)
      try {
        return [name, JSON.stringify(resolve(raw))]
      } catch (e) {
        throw new Error(`${filter.id}: ${raw} is read as a path. ${(e as Error).message} For text, write it in quotes: "${raw}".`, { cause: e })
      }
    })),
  }
}

export function filterTokens(calls: string[], from: Field, lookup: SchemaLookup, filters: Filter[], resolve: (path: string) => StoredToken[]): { tokens: Filter[], field: Field } {
  const tokens: Filter[] = []
  let field = from
  for (const call of calls) {
    const [, name, args] = /^([a-z_]+)\s*(?::([\s\S]*))?$/.exec(call) ?? []
    if (!name) throw new Error(`Write a filter like Liquid, separated by |: truncate: 150, or where: "category", "news". Got "${call}".`)
    const filter = filters.find(f => f.id === name)
    if (!filter || !filter.validate(field)) {
      const usable = filters.filter(f => f.validate(field)).map(f => f.id)
      throw new Error(`${filter ? `Filter ${name} does not apply` : `No filter "${name}"`} to ${typeLabel(field)}. Filters: ${usable.join(', ') || 'none'}.`)
    }
    const options = filterOptions(filter, args ? splitTopLevel(args) : [], field, lookup, resolve)
    // Stored whole like the editor does: publication reads quotedOptions and optionsKeys on the token
    tokens.push({ ...filter, options })
    const output = filter.output(field, options)
    if (!output) throw new Error(`The result of ${name} has no known type.`)
    field = output
  }
  return { tokens, field }
}

function optionText(value: unknown, quoted: boolean, itemKey: boolean, toPath: (expression: StoredToken[]) => string): string {
  const expression = toExpression(value) as StoredToken[] | null
  if (expression) {
    const fixed = fixedText(expression)
    if (fixed === null && !itemKey) return toPath(expression)
    return JSON.stringify(fixed ?? expression.map(token => (token as StoredProperty).fieldId ?? '').join('.'))
  }
  return quoted ? JSON.stringify(String(value ?? '')) : String(value ?? '')
}

// Arguments left at the default of the filter are not shown, from the end
function filterCall(token: StoredFilter, filters: Filter[], toPath: (expression: StoredToken[]) => string): string {
  const filter = filters.find(f => f.id === token.id)
  const options = token.options ?? {}
  const names = filter?.optionsKeys ?? Object.keys(filter?.options ?? options)
  const isDefault = (name: string) => options[name] === undefined || String(options[name]) === String(filter?.options?.[name])
  let count = names.length
  while (count > 0 && isDefault(names[count - 1])) count--
  return count ? `${token.id}: ${names.slice(0, count).map(name => optionText(options[name], !!filter?.quotedOptions?.includes(name), isItemKey(filter, name), toPath)).join(', ')}` : token.id
}

export function expressionToPath(expression: StoredToken[], sourceOf: (token: StoredProperty) => string | null, pageBodyId: string | undefined, filters: Filter[]): string {
  const start = itemLength(expression, pageBodyId)
  let path = start ? 'item' : ''
  for (const token of expression.slice(start)) {
    switch (token.type) {
    case 'state':
      path = `state ${token.label || token.storedStateId}`
      break
    case 'filter':
      path += ` | ${filterCall(token, filters, option => expressionToPath(option, sourceOf, pageBodyId, filters))}`
      break
    case 'property': {
      const fixed = fixedText([token])
      if (fixed !== null) {
        path += `"${fixed}"`
        break
      }
      const args = token.options ? Object.entries(token.options).filter(([, v]) => v !== undefined && v !== null && v !== '') : []
      const segment = `${token.fieldId}${args.length ? `(${args.map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}`
      path += path ? `.${segment}` : `${sourceOf(token) ?? ''}.${segment}`
    }
    }
  }
  return path
}
