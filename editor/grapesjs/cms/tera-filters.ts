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

import { Filter, getFilters } from '@silexlabs/grapesjs-data-source'
import type { TeraOptions } from './tera'
import { SLICE_ALL_LENGTH, getSliceOptions } from './slice'

const INTEGER = /^-?\d+$/

/**
 * A Liquid filter of the editor which Zola can publish, same id, options and preview
 */
export interface TeraFilter extends Filter {
  toTera: (input: string, options: TeraOptions) => string
}

const TO_TERA: Record<string, TeraFilter['toTera']> = {
  first: input => `${input} | first`,
  last: input => `${input} | last`,
  // The second option of Liquid's slice is a length
  slice: (input, options) => {
    const [start, length] = getSliceOptions([options.integer('start') ?? '', options.integer('end') ?? ''])
    const list = options.variable(input)
    if (length === `${SLICE_ALL_LENGTH}`) return `${list}[${start}:]`
    if (!INTEGER.test(start) || !INTEGER.test(length)) return `${list}[${start}:${start} + ${length}]`
    const end = parseInt(start) + parseInt(length)
    // A negative start counts from the end, Tera stops at the end only without an end bound
    return parseInt(start) < 0 && end >= 0 ? `${list}[${start}:]` : `${list}[${start}:${end}]`
  },
  strip_html: input => `${input} | striptags`,
  // Liquid counts the ellipsis in the length and keeps a text which fits
  truncate: (input, options) => {
    const length = options.integer('length') ?? '50'
    const text = options.variable(input)
    const cut = INTEGER.test(length) ? `${Math.max(parseInt(length) - 3, 0)}` : `(${length} - 3 if ${length} > 3 else 0)`
    return `${text} if (${text} | length) <= ${length} else (${text} | truncate(length=${cut}, end="..."))`
  },
  append: (input, options) => `${input} ~ ${options.text('value')}`,
  prepend: (input, options) => `${options.text('value')} ~ ${input}`,
  split: (input, options) => `${input} | split(pat=${options.text('separator')})`,
  sort: (input, options) => {
    const key = options.path('key').join('.')
    return key ? `${input} | sort(attribute=${JSON.stringify(key)})` : `${input} | sort`
  },
  size: input => `${input} | length`,
  reverse: input => `${input} | reverse`,
  // Zola's own, not Eleventy's
  slugify: input => `${input} | slugify`,
  downcase: input => `${input} | lower`,
  replace: (input, options) => `${input} | replace(from=${options.text('search')}, to=${options.text('replace')})`,
  escape: input => `${input} | escape`,
  // Tera's default only replaces a missing value, Liquid's also nil, false and empty ones, not 0
  default: (input, options) => {
    const value = options.variable(input)
    return `(${value} if ${value} or ${value} == 0 else ${options.text('value')})`
  },
  // A date without a time zone is taken as already in the chosen one, Liquid would take it as UTC
  date: (input, options) => {
    const timeZone = options.text('timeZone')
    return `${input} | date(format=${options.text('format')}, timezone=${timeZone === '""' ? '"UTC"' : timeZone})`
  },
}

// Called once the Liquid filters are in the editor
export function getTeraFilters(): TeraFilter[] {
  return getFilters()
    .filter(({ id }) => TO_TERA[id])
    .map(filter => ({ ...filter, toTera: TO_TERA[filter.id] }))
}
