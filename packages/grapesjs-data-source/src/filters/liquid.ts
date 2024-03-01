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

import { Field, Filter, Options } from "../types"
import { DataSourceEditor } from ".."
import { html } from "lit"
import { ref } from "lit/directives/ref.js"
import { convertKind, getFieldType } from "../utils"
import { StateEditor } from "../view/state-editor"

/**
 * Check if a field is a number
 */
function isNumber(field: Field | null): boolean {
  if (!field || field.kind !== 'scalar') return false
  const typeIds = field.typeIds.map(typeId => typeId.toLowerCase())
  return typeIds.includes('number') || typeIds.includes('int')
}

/**
 * Liquid filters
 */
export default function(editor: DataSourceEditor): Filter[] {
  return [
    {
      type: 'filter',
      id: 'strip_html',
      label: 'strip_html',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/<[^>]*>/g, ''),
      options: {},
    }, {
      type: 'filter',
      id: 'append',
      label: 'append',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str, options) => `${str}${options.state}`,
      options: {
        state: '',
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          name="value"
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${options.value || '[]'}
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Suffix</label>
        </state-editor>
      `,
    }, {
      type: 'filter',
      id: 'prepend',
      label: 'prepend',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str, options) => `${options.state}${str}`,
      options: {
        state: '',
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          name="value"
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${options.value || '[]'}
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Prefix</label>
        </state-editor>
      `,
    }, {
      type: 'filter',
      id: 'where',
      label: 'where',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr, options) => {
        const { key, value } = options as { key: string, value: string }
        return (arr as Record<string, unknown>[]).filter(item => item[key] === value)
      },
      options: {
        key: '',
        value: '',
      },
      quotedOptions: ['key'],
      optionsKeys: ['key', 'value'],
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.key || []}
          name="key"
          root-type=${field?.typeIds[0] ?? ''}
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Key to filter on</label>
        </state-editor>
        <p>==</p>
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.value || []}
          name="value"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Value to match</label>
        </state-editor>
    `,
    }, {
      type: 'filter',
      id: 'first',
      label: 'first',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => convertKind(field, 'list', 'object'),
      apply: (arr) => (arr as unknown[])[0],
      options: {},
    }, {
      type: 'filter',
      id: 'last',
      label: 'last',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => convertKind(field, 'list', 'object'),
      apply: (arr) => (arr as unknown[])[(arr as unknown[]).length - 1],
      options: {},
    }, {
      type: 'filter',
      id: 'join',
      label: 'join',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'list',
      output: (field: Field | null) => convertKind(field, 'list', 'scalar'),
      apply: (arr, options) => (arr as string[]).join(options.separator as string ?? ','),
      options: {
        separator: ',',
      },
      quotedOptions: ['key'],
      optionsKeys: ['key', 'separator', 'value'],
      optionsForm: (field: Field | null, options: Options) => html`
          <state-editor
            no-filters
            data-is-input
            class="ds-state-editor__options"
            value=${options.key || []}
            name="key"
            ${ref(el => el && (el as StateEditor).setEditor(editor))}
            root-type=${field?.typeIds[0] ?? ''}
          >
            <label slot="label">Separator</label>
          </state-editor>
          <state-editor
            no-filters
            data-is-input
            class="ds-state-editor__options"
            value=${options.value || []}
            name="value"
            ${ref(el => el && (el as StateEditor).setEditor(editor))}
          >
            <label slot="label">Value to match</label>
          </state-editor>
    `,
    }, {
      type: 'filter',
      id: 'split',
      label: 'split',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: (field: Field | null) => convertKind(field, 'scalar', 'list'),
      apply: (str, options) => (str as string).split(options.separator as string ?? ','),
      options: {
        separator: ',',
      },
      quotedOptions: ['separator'],
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Separator
          <input type="text" name="separator" placeholder="Separator" value=${options.separator}/>
        </label>
    `,
    }, {
      type: 'filter',
      id: 'map',
      label: 'map',
      validate: (field: Field | null) => !!field && (field.kind === 'list' || field.kind === 'object'),
      output: (field, options) => getFieldType(editor, field, options['key'] as string | undefined),
      apply: (arr, options) => (arr as Record<string, unknown>[]).map(item => item[options.key as string]),
      options: {
        key: '',
      },
      quotedOptions: ['key'],
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.key || []}
          name="key"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
          root-type=${field?.typeIds[0] ?? ''}
        >
          <label slot="label">Key to map</label>
        </state-editor>
      `,
    // This is a dynamic key, but it's not working yet
    // The problem is that output method can only return a single field, but we need to return a list of fields
    // This was an attempt returning the first field only but this makes it impossible to select fields inside the result object and the query will not include the content of the fields we should return
    // }, {
    //   type: 'filter',
    //   id: 'map-dynamic',
    //   filterName: 'map',
    //   label: 'map (dynamic key)',
    //   validate: (field: Field | null) => !!field && (field.kind === 'list' || field.kind === 'object'),
    //   // Any field can be chosen, so we return the first one
    //   // Is multiple fields necessary? We will probably always have the same data structure there
    //   output: (field) => field ? editor.DataSourceManager.getDataTree()
    //     .getType(field.typeIds[0], field.dataSourceId ?? null)?.fields[0] ?? null : null,
    //   apply: (arr, options) => (arr as Record<string, unknown>[]).map(item => item[options.key as string]),
    //   options: {
    //     key: '',
    //   },
    //   quotedOptions: [],
    //   optionsForm: (field: Field | null, options: Options) => html`
    //     <state-editor
    //       no-filters
    //       data-is-input
    //       class="ds-state-editor__options"
    //       value=${options.key || []}
    //       name="key"
    //       ${ref(el => el && (el as StateEditor).setEditor(editor))}
    //     >
    //       <label slot="label">Key to map (dyanamic)</label>
    //     </state-editor>
    //   `,
    }, {
      type: 'filter',
      id: 'reverse',
      label: 'reverse',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr) => (arr as unknown[]).reverse(),
      options: {},
    }, {
      type: 'filter',
      id: 'size',
      label: 'size',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: () => ({
        id: 'Int',
        label: 'Int',
        typeIds: ['Int'],
        kind: 'scalar',
      }),
      apply: (arr) => (arr as unknown[]).length,
      options: {},
    }, {
      type: 'filter',
      id: 'at',
      label: 'at',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => convertKind(field, 'list', 'object'),
      apply: (arr, options) => (arr as unknown[])[options.index as number],
      options: {
        index: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Index
          <input type="number" name="index" placeholder="Index" value=${options.index}/>
        </label>
    `,
    }, {
      type: 'filter',
      id: 'slice',
      label: 'slice',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr, options) => (arr as unknown[]).slice(options.start as number, options.end as number),
      options: {
        start: 0,
        end: 0,
      },
      optionsKeys: ['start', 'end'],
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.start || []}
          name="start"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Start index</label>
        </state-editor>
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.end || []}
          name="end"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">End index</label>
        </state-editor>
      `,
    }, {
      type: 'filter',
      id: 'sort',
      label: 'sort',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr, options) => (arr as Record<string, string | number>[]).sort((a, b) => {
        if (a[options.key as string] < b[options.key as string]) {
          return -1
        }
        if (a[options.key as string] > b[options.key as string]) {
          return 1
        }
        return 0
      }),
      quotedOptions: ['key'],
      options: {
        key: '',
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          class="ds-state-editor__options"
          value=${options.key || []}
          name="key"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
          root-type=${field?.typeIds[0] ?? ''}
        >
          <label slot="label">Key to sort on</label>
        </state-editor>
      `,
    }, {
      type: 'filter',
      id: 'plus',
      label: 'plus',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => (num as number) + (options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'minus',
      label: 'minus',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => (num as number) - (options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'times',
      label: 'times',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => (num as number) * (options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'divided_by',
      label: 'divided_by',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => (num as number) / (options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'modulo',
      label: 'modulo',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => (
        (num as number) % (options.value as number)
      ),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'abs',
      label: 'abs',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num) => Math.abs(num as number),
      options: {},
    }, {
      type: 'filter',
      id: 'ceil',
      label: 'ceil',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num) => Math.ceil(num as number),
      options: {},
    }, {
      type: 'filter',
      id: 'floor',
      label: 'floor',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num) => Math.floor(num as number),
      options: {},
    }, {
      type: 'filter',
      id: 'round',
      label: 'round',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num) => Math.round(num as number),
      options: {},
    }, {
      type: 'filter',
      id: 'at_least',
      label: 'at_least',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => Math.max(num as number, options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'at_most',
      label: 'at_most',
      validate: (field: Field | null) => !!field && isNumber(field),
      output: type => type,
      apply: (num, options) => Math.min(num as number, options.value as number),
      options: {
        value: 0,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Value
          <input type="number" name="value" placeholder="Value" value=${options.value}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'compact',
      label: 'compact',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr) => (arr as unknown[]).filter(item => !!item),
      options: {},
    }, {
      type: 'filter',
      id: 'default',
      label: 'default',
      validate: (field: Field | null) => !!field && field.kind === 'scalar',
      output: field => field,
      apply: (value, options) => value ?? options.value,
      options: {
        value: '',
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          name="value"
          data-is-input
          no-filters
          class="ds-state-editor__options"
          value=${options.value || '[]'}
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
        >
          <label slot="label">Default value</label>
        </state-editor>
      `,
    }, {
      type: 'filter',
      id: 'escape',
      label: 'escape',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/"/g, '\\"'),
      options: {},
    }, {
      type: 'filter',
      id: 'escape_once',
      label: 'escape_once',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/"/g, '\\"'),
      options: {},
    }, {
      type: 'filter',
      id: 'newline_to_br',
      label: 'newline_to_br',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/\n/g, '<br />'),
      options: {},
    }, {
      type: 'filter',
      id: 'strip_newlines',
      label: 'strip_newlines',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/\n/g, ''),
      options: {},
    }, {
      type: 'filter',
      id: 'truncate',
      label: 'truncate',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str, options) => (str as string).slice(0, options.length as number),
      options: {
        length: 50,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Length
          <input type="number" name="length" placeholder="Length" value=${options.length}/>
        </label>
      `,
    }, {
      type: 'filter',
      id: 'truncatewords',
      label: 'truncatewords',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str, options) => (str as string).split(' ').slice(0, options.length as number).join(' '),
      options: {
        length: 15,
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Length
          <input type="number" name="length" placeholder="Length" value=${options.length}/>
        </label>
      `,
    },
  ]
}
