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

import { Field, StoredProperty, StoredToken, Type, TypeId } from '../types'

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
      else if (c === quote) quote = ''
    } else if (c === '"' || c === '\'') quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c) && --depth === 0) return i
  }
  return -1
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if ('([{"\''.includes(c)) {
      const end = c === '"' || c === '\'' ? text.indexOf(c, i + 1) : closing(text, i)
      if (end < 0) throw new Error(`Unclosed ${c} in "${text}".`)
      i = end
    } else if (c === ',') {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts.map(part => part.trim()).filter(Boolean)
}

// Argument values end up in the JavaScript of the published site (cms/publication.ts),
// inside a template literal
const UNSAFE_IN_ARG = /[`\\$]/

function parseArgs(text: string): Record<string, string> {
  return Object.fromEntries(splitTopLevel(text).map(arg => {
    const colon = arg.indexOf(':')
    const name = arg.slice(0, colon).trim()
    const value = arg.slice(colon + 1).trim()
    if (colon < 0 || !NAME.test(name) || !value) throw new Error(`Write arguments as name: value, like (first: 3). Got "${arg}".`)
    if (UNSAFE_IN_ARG.test(value)) throw new Error(`Argument values cannot contain \` \\ or $. Got "${arg}".`)
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
    ...(args ? { options: args } : {}),
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

export function expressionToPath(expression: StoredToken[], sourceOf: (token: StoredProperty) => string | null): string {
  let path = ''
  for (const token of expression) {
    switch (token.type) {
    case 'state':
      path = token.storedStateId === '__data' && !token.exposed ? 'item' : `state ${token.label || token.storedStateId}`
      break
    case 'filter':
      path += ` | ${token.id}`
      break
    case 'property': {
      if (token.fieldId === 'fixed') {
        path += `"${String(token.options?.value ?? '')}"`
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
