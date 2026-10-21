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

import { Field, Type } from '../types'
import { SchemaLookup, typeLabel } from './path'

/**
 * Short text views of a schema: a WordPress one has ~800 types and its full
 * introspection weighs megabytes, an agent reads it one type at a time
 */

const MAX_LINES = 40
const MAX_SEARCH = 20
// Relay plumbing: a connection is shown by its nodes, an edge by its node
const PLUMBING = ['cursor', 'edges', 'pageInfo']
// Cursor paging means nothing on a static site
const HIDDEN_ARGS = ['last', 'after', 'before', 'asPreview']

function isShown(field: Field, lookup: SchemaLookup): boolean {
  return !lookup.secondary.includes(field.id) && !PLUMBING.includes(field.id)
}

/**
 * A field whose type has a single useful field (a WordPress connection or edge)
 * is shown as the path to that field: posts.nodes, featuredImage.node
 */
function shortcut(field: Field, lookup: SchemaLookup): { path: string, field: Field } {
  let path = field.id
  let current = field
  for (let depth = 0; depth < 2 && current.kind === 'object' && current.typeIds.length === 1; depth++) {
    const fields = lookup.type(current.typeIds[0])?.fields.filter(f => isShown(f, lookup)) ?? []
    if (fields.length !== 1 || fields[0].kind === 'scalar') break
    current = fields[0]
    path += `.${current.id}`
  }
  return { path, field: current }
}

function argNames(field: Field): string[] {
  // Arguments of a value (WordPress title(format)) only change its rendering
  if (field.kind === 'scalar') return []
  return (field.arguments ?? []).map(arg => arg.name).filter(name => !HIDDEN_ARGS.includes(name))
}

// The part before ":" is a path to copy as is, the arguments come after
function line(prefix: string, field: Field, lookup: SchemaLookup): string {
  const short = shortcut(field, lookup)
  const args = argNames(field)
  return `${prefix}${short.path}: ${typeLabel(short.field)}${args.length ? ` (args: ${args.join(', ')})` : ''}`
}

function capped(lines: string[], hidden: number): string {
  const more = lines.length - MAX_LINES
  const shown = more > 0 ? lines.slice(0, MAX_LINES).concat(`${more} more, use action "search".`) : lines
  return shown.concat(hidden ? [`${hidden} technical fields hidden, action "search" finds them.`] : []).join('\n')
}

export function summarizeRoot(source: string, lookup: SchemaLookup): string {
  const all = lookup.queryables()
  const shown = all.filter(f => isShown(f, lookup))
  const collections = new Map<string, string[]>()
  const singles = new Map<string, string[]>()
  let example = ''
  for (const field of shown) {
    const short = shortcut(field, lookup)
    const args = argNames(field).join(', ')
    if (short.field.kind === 'list') {
      collections.set(args, [...collections.get(args) ?? [], `${source}.${short.path}: ${typeLabel(short.field)}`])
      if (!example && argNames(field).includes('first')) example = `${source}.${field.id}(first: 3)${short.path.slice(field.id.length)}`
    } else {
      singles.set(args, [...singles.get(args) ?? [], `${source}.${short.path} (${typeLabel(short.field)})`])
    }
  }
  const lines = [
    ...[...collections].flatMap(([args, paths]) => [`Collections for bind_to "loop"${args ? ` (args: ${args})` : ''}:`, ...paths]),
    ...[...singles].map(([args, paths]) => `${args ? `Single items (args: ${args})` : 'Values'}: ${paths.join(', ')}`),
  ]
  if (lines.length === 0) return `Source "${source}" has no queryable field.`
  const argsHint = example ? `Argument values go on the field that takes them: ${example}. ` : ''
  return capped(lines, all.length - shown.length) + `\n${argsHint}Fields of an item: action "schema" with its type.`
}

export function summarizeType(type: Type, lookup: SchemaLookup): string {
  const shown = type.fields.filter(f => isShown(f, lookup))
  return capped([`${type.id} fields (in a loop: item.<field>):`, ...shown.map(field => line('', field, lookup))], type.fields.length - shown.length)
}

// Relay types are plumbing, the shortcuts above already go through them
const PLUMBING_TYPE = /(Connection|Edge|PageInfo|WhereArgs)$/

export function searchSchema(source: string, text: string, types: Type[], lookup: SchemaLookup): string {
  const q = text.toLowerCase()
  const roots = lookup.queryables().filter(f => f.id.toLowerCase().includes(q)).map(f => line(`${source}.`, f, lookup))
  const typeNames: string[] = []
  // A field of an interface comes again on each type that has it: one line, its types after
  const fields = new Map<string, string[]>()
  for (const type of types.filter(t => !PLUMBING_TYPE.test(t.id))) {
    if (type.id.toLowerCase().includes(q)) typeNames.push(type.id)
    for (const field of type.fields) {
      if (PLUMBING.includes(field.id) || !field.id.toLowerCase().includes(q)) continue
      const key = line('', field, lookup)
      fields.set(key, [...fields.get(key) ?? [], type.id])
    }
  }
  const results = [
    ...roots,
    ...[...fields].map(([key, on]) => `${key} (on ${on.slice(0, 4).join(', ')}${on.length > 4 ? ', and more' : ''})`),
    ...(typeNames.length ? [`Types: ${typeNames.slice(0, 10).join(', ')}`] : []),
  ]
  if (results.length === 0) return `Nothing matches "${text}".`
  const more = results.length - MAX_SEARCH
  const head = fields.size ? 'Fields in a loop are item.<field>.\n' : ''
  return head + results.slice(0, MAX_SEARCH).join('\n') + (more > 0 ? `\n${more} more, search a longer text.` : '')
}

/**
 * Fields to suggest, values first, so that binding often needs no schema call.
 * For an attribute, the URLs come first
 */
export function itemFields(type: Type | undefined, lookup: SchemaLookup, urlsFirst = false): string[] {
  if (!type) return []
  const rank = (field: Field) => (field.kind === 'scalar' ? 0 : 2) - (urlsFirst && /url|link|uri/i.test(field.id) ? 1 : 0)
  return type.fields
    .filter(f => isShown(f, lookup))
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 20)
    .map(f => shortcut(f, lookup).path)
}

/**
 * The list a non-list field leads to, for "did you mean wp.posts.nodes"
 */
export function listBelow(field: Field, lookup: SchemaLookup): string | null {
  const short = shortcut(field, lookup)
  return short.field.kind === 'list' && short.field !== field ? short.path.slice(field.id.length) : null
}
