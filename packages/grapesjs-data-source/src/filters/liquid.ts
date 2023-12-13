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
          value=${options.value || '[]'}
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
          @change=${({target}: {target: StateEditor}) => target.rerender()}
        >
          <label slot="label">Suffix</label>
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
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          value=${options.key || []}
          name="key"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
          @change=${({target}: {target: StateEditor}) => target.rerender()}
        >
          <label slot="label">Key to filter on</label>
        </state-editor>
        <state-editor
          no-filters
          data-is-input
          value=${options.value || []}
          name="value"
          ${ref(el => el && (el as StateEditor).setEditor(editor))}
          @change=${({target}: {target: StateEditor}) => target.rerender()}
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
      optionsForm: (field: Field | null, options: Options) => html`
          <state-editor
            no-filters
            data-is-input
            value=${options.key || []}
            name="key"
            ${ref(el => el && (el as StateEditor).setEditor(editor))}
            @change=${({target}: {target: StateEditor}) => target.rerender()}
          >
            <label slot="label">Key to filter on</label>
          </state-editor>
          <state-editor
            no-filters
            data-is-input
            value=${options.value || []}
            name="value"
            ${ref(el => el && (el as StateEditor).setEditor(editor))}
            @change=${({target}: {target: StateEditor}) => target.rerender()}
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
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Separator
          <input type="text" name="separator" placeholder="Separator" value=${options.separator}/>
        </label>
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
      optionsForm: (field: Field | null, options: Options) => html`
        <label>Separator
          <input type="text" name="separator" placeholder="Separator" value=${options.separator}/>
        </label>
    `,
    }, {
      type: 'filter',
      id: 'map',
      label: 'map',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field, options) => getFieldType(editor, field, options['key'] as string | undefined),
      apply: (arr, options) => (arr as Record<string, unknown>[]).map(item => item[options.key as string]),
      options: {
        key: '',
      },
      optionsForm: (field: Field | null, options: Options) => html`
        <state-editor
          no-filters
          data-is-input
          value=${options.key || []}
            name="key"
            ${ref(el => el && (el as StateEditor).setEditor(editor))}
            @change=${({target}: {target: StateEditor}) => target.rerender()}
          >
          <label slot="label">Key</label>
        </state-editor>
      `,
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
    }
  ]
}