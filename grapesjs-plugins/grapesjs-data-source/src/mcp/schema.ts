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
import { SchemaLookup } from './path'

/**
 * Short text views of a schema: a WordPress one has ~800 types and its full
 * introspection weighs megabytes, an agent reads it one type at a time
 */

// Relay plumbing: a connection is shown by its nodes, an edge by its node
const PLUMBING = ['cursor', 'edges', 'pageInfo']

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
