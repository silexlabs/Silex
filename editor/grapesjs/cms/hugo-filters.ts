/*
 * Silex website builder, free/libre no-code tool for makers.
 * Copyright (c) 2023 lexoyo and Silex Labs foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import type { Component, Editor } from 'grapesjs'
import { Field, Filter, Options, isString, toExpression } from '@silexlabs/grapesjs-data-source'
import { html } from 'lit-html'
import type { GoOptions } from './gotmpl'
import { hasNumberType } from './render'

/**
 * A Hugo function offered as a filter in the editor
 * The id is the name of the function in Hugo, the preview follows what Hugo does
 */
export interface HugoFilter extends Filter {
  toGo: (input: string, options: GoOptions) => string
}

interface OptionForm {
  name: string
  label: string
  // Read in each item of the input list
  itemKey?: boolean
}

function isNumber(field: Field | null): boolean {
  return field?.kind === 'scalar' && hasNumberType(field.typeIds)
}

function isList(field: Field | null): boolean {
  return field?.kind === 'list'
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asNumber(value: unknown, fallback = 0): number {
  const number = parseFloat(`${value}`)
  return isNaN(number) ? fallback : number
}

// Like the guard written for Hugo
function asCount(value: unknown, fallback: number): number {
  return /^\d+$/.test(`${value ?? ''}`.trim()) ? parseInt(`${value}`) : fallback
}

function withKind(field: Field | null, kind: Field['kind']): Field | null {
  return field && { ...field, kind }
}

// The type of the items' key, for the result of apply
function itemKeyType(options: Options): Field | null {
  const last = toExpression(options.key)?.at(-1)
  return last?.type === 'property' ? { id: last.fieldId, label: last.label, typeIds: last.typeIds, kind: 'list', dataSourceId: last.dataSourceId } : null
}

// What Hugo's default replaces
function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === 0 || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value as object).length === 0)
}

const collator = new Intl.Collator('en')

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'string' && typeof b === 'string') return collator.compare(a, b)
  if (a === b) return 0
  return (a as number) < (b as number) ? -1 : 1
}

function sameValue(item: unknown, value: unknown): boolean {
  return typeof item === 'number' ? item === asNumber(value, NaN) : item === value
}

function form(editor: Editor, forms: OptionForm[]) {
  return (selected: Component, input: Field | null, options: Options, stateName: string) => html`${forms.map(({ name, label, itemKey }) => itemKey ? html`
    <state-editor
      .selected=${selected}
      .editor=${editor}
      no-filters
      data-is-input
      class="ds-state-editor__options"
      value=${options[name] || []}
      name=${name}
      root-type=${input?.typeIds[0] ?? ''}
    >
      <label slot="label">${label}</label>
    </state-editor>
  ` : html`
    <state-editor
      .selected=${selected}
      .editor=${editor}
      parent-name=${stateName}
      data-is-input
      class="ds-state-editor__options"
      value=${options[name] || []}
      name=${name}
    >
      <label slot="label">${label}</label>
    </state-editor>
  `)}`
}

export function getHugoFilters(editor: Editor): HugoFilter[] {
  const filter = (id: string, label: string, forms: OptionForm[], definition: Omit<HugoFilter, 'type' | 'id' | 'label' | 'options' | 'optionsForm'>): HugoFilter => ({
    type: 'filter',
    id,
    label,
    options: Object.fromEntries(forms.map(({ name }) => [name, ''])),
    optionsKeys: forms.map(({ name }) => name),
    itemKeys: forms.filter(({ itemKey }) => itemKey).map(({ name }) => name),
    optionsForm: forms.length ? form(editor, forms) : undefined,
    ...definition,
  })
  return [
    filter('collections.Index', 'index', [{ name: 'index', label: 'Index' }], {
      validate: isList,
      output: field => withKind(field, 'object'),
      apply: (list, options) => asList(list)[asCount(options.index, 0)],
      toGo: (input, options) => `index ${input} ${options.integer('index', '0')}`,
    }),
    filter('collections.First', 'first', [{ name: 'count', label: 'Number of items' }], {
      validate: isList,
      output: field => field,
      apply: (list, options) => asList(list).slice(0, asCount(options.count, 1)),
      toGo: (input, options) => `first ${options.integer('count', '1')} (default slice ${input})`,
    }),
    filter('collections.After', 'after', [{ name: 'count', label: 'Number of items to skip' }], {
      validate: isList,
      output: field => field,
      apply: (list, options) => asList(list).slice(asCount(options.count, 0)),
      toGo: (input, options) => `after ${options.integer('count', '0')} (default slice ${input})`,
    }),
    filter('collections.Last', 'last', [{ name: 'count', label: 'Number of items' }], {
      validate: isList,
      output: field => field,
      apply: (list, options) => {
        const count = asCount(options.count, 1)
        return count > 0 ? asList(list).slice(-count) : []
      },
      toGo: (input, options) => `last ${options.integer('count', '1')} (default slice ${input})`,
    }),
    filter('collections.Where', 'where', [{ name: 'key', label: 'Key to filter on', itemKey: true }, { name: 'value', label: 'Value to match' }], {
      validate: isList,
      output: field => field,
      apply: (list, options) => asList(list).filter(item => sameValue((options.key as (item: unknown) => unknown)(item), options.value)),
      toGo: (input, options) => `where ${options.withoutNullParents('key', `(default slice ${input})`)} ${JSON.stringify(options.path('key').join('.'))} ${options.isNumberKey('key') ? options.number('value', '0') : options.text('value', '')}`,
    }),
    filter('collections.Sort', 'sort', [{ name: 'key', label: 'Key to sort on', itemKey: true }, { name: 'order', label: 'Order (asc or desc)' }], {
      validate: isList,
      output: field => field,
      apply: (list, options) => {
        const key = options.key as (item: unknown) => unknown
        const sign = `${options.order}`.trim() === 'desc' ? -1 : 1
        const items = asList(list)
        const isSet = (item: unknown) => key(item) !== undefined && key(item) !== null
        return items.filter(isSet).sort((a, b) => sign * compare(key(a), key(b))).concat(items.filter(item => !isSet(item)))
      },
      toGo: (input, options) => {
        const list = `(default slice ${input})`
        return `append ${options.withNullParents('key', list)} (sort ${options.withoutNullParents('key', list)} ${JSON.stringify(options.path('key').join('.'))} ${options.text('order', 'asc')})`
      },
    }),
    filter('collections.Reverse', 'reverse', [], {
      validate: isList,
      output: field => field,
      apply: list => [...asList(list)].reverse(),
      toGo: input => `collections.Reverse ${input}`,
    }),
    filter('collections.Apply', 'apply', [{ name: 'key', label: 'Key to keep', itemKey: true }], {
      validate: isList,
      output: (field, options) => itemKeyType(options),
      apply: (list, options) => asList(list).map(item => (options.key as (item: unknown) => unknown)(item)),
      toGo: (input, options) => `apply (default slice ${input}) "index" "." ${options.path('key').map(key => JSON.stringify(key)).join(' ')}`,
    }),
    filter('len', 'len', [], {
      validate: isList,
      output: () => ({ id: 'Int', label: 'Int', typeIds: ['Int'], kind: 'scalar' }),
      apply: value => asList(value).length,
      toGo: input => `len (default slice ${input})`,
    }),
    filter('math.Add', 'add', [{ name: 'before', label: 'Before' }, { name: 'after', label: 'After' }], {
      validate: field => isString(field) || isNumber(field),
      output: field => field,
      apply: (value, options) => typeof value === 'number'
        ? asNumber(options.before) + value + asNumber(options.after)
        : `${options.before ?? ''}${value ?? ''}${options.after ?? ''}`,
      toGo: (input, options) => {
        const value = options.isNumber() ? (key: string) => options.number(key, '0') : (key: string) => options.text(key, '')
        const values = [
          ...options.isSet('before') ? [value('before')] : [],
          options.isNumber() ? `(default 0 ${input})` : `(string ${input})`,
          ...options.isSet('after') ? [value('after')] : [],
        ]
        return values.length > 1 ? `add ${values.join(' ')}` : `add ${values[0]} ${value('after')}`
      },
    }),
    filter('math.Sub', 'sub', [{ name: 'value', label: 'Value to subtract' }], {
      validate: isNumber,
      output: field => field,
      apply: (value, options) => asNumber(value) - asNumber(options.value),
      toGo: (input, options) => `sub (default 0 ${input}) ${options.number('value', '0')}`,
    }),
    filter('compat.Default', 'default', [{ name: 'value', label: 'Default value' }], {
      validate: field => !!field,
      output: field => field,
      apply: (value, options) => isEmpty(value) ? options.value : value,
      toGo: (input, options) => `default ${options.isNumber() ? options.number('value', '0') : options.text('value', '')} ${input}`,
    }),
    filter('strings.Split', 'split', [{ name: 'delimiter', label: 'Delimiter' }], {
      validate: isString,
      output: field => withKind(field, 'list'),
      apply: (value, options) => `${value ?? ''}`.split(`${options.delimiter ?? ''}`),
      toGo: (input, options) => `split (string ${input}) ${options.text('delimiter', '')}`,
    }),
    filter('strings.Replace', 'replace', [{ name: 'old', label: 'Text to replace' }, { name: 'new', label: 'Replacement' }], {
      validate: isString,
      output: field => field,
      apply: (value, options) => `${value ?? ''}`.split(`${options.old ?? ''}`).join(`${options.new ?? ''}`),
      toGo: (input, options) => `replace (string ${input}) ${options.text('old', '')} ${options.text('new', '')}`,
    }),
    filter('strings.Truncate', 'truncate', [{ name: 'size', label: 'Size' }, { name: 'ellipsis', label: 'Ellipsis' }], {
      validate: isString,
      output: field => field,
      apply: (value, options) => {
        const characters = Array.from(`${value ?? ''}`)
        const size = asCount(options.size, characters.length)
        if (characters.length <= size) return characters.join('')
        // Hugo cuts at the last space before the size
        let cut = characters.slice(0, size).join('')
        if (!/\s/.test(characters[size]) && cut.lastIndexOf(' ') > 0) cut = cut.slice(0, cut.lastIndexOf(' '))
        return `${cut.trimEnd()}${options.ellipsis ? options.ellipsis : ' …'}`
      },
      toGo: (input, options) => options.isSet('size')
        ? `truncate ${options.integer('size', '0')}${options.isSet('ellipsis') ? ` ${options.text('ellipsis', '')}` : ''} (string ${input})`
        : `string ${input}`,
    }),
    filter('transform.Plainify', 'plainify', [], {
      validate: isString,
      output: field => field,
      apply: value => `${value ?? ''}`
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<br\s*\/?>|<\/p>/gi, '\n')
        .replace(/<\/?(div|h[1-6]|li|ul|ol|section|article|header|footer|blockquote|tr|td|th)\b[^>]*>/gi, ' ')
        .replace(/<[^>]*>/g, ''),
      toGo: input => `plainify ${input}`,
    }),
    filter('urls.Anchorize', 'anchorize', [], {
      validate: isString,
      output: field => field,
      apply: value => `${value ?? ''}`.trim().toLowerCase().replace(/ /g, '-').replace(/[^\p{L}\p{Nd}_-]/gu, ''),
      toGo: input => `anchorize ${input}`,
    }),
  ]
}
