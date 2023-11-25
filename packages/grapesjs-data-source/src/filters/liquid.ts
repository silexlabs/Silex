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

import { optionsFormButtons, convertKind, optionsFormStateSelector, getFieldType, optionsFormKeySelector } from "../utils"
import { Field, Filter } from "../types"
import { DataSourceEditor } from ".."

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
      apply: (str, options) => `${str}${options.suffix}`,
      options: {
        suffix: '',
      },
      optionsForm: () => `
      <form>
        <label>Suffix
          <input type="text" name="suffix" placeholder="Suffix"/>
        </label>
        ${ optionsFormButtons() }
      </form>
      `
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
      optionsForm: (input: Field | null, options) => `
      <form>
        <label>Key to filter on
          ${ optionsFormKeySelector(editor, input, options, 'key') }
        </label>
        <label>Value to match (hard coded)
          <input type="text" name="value" placeholder="Value"/>
        </label>
        <label>Value to match (select a custom state)
          ${ optionsFormStateSelector(editor, options, 'value') }
        </label>
        ${ optionsFormButtons() }
      </form>
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
      optionsForm: () => `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        ${ optionsFormButtons() }
      </form>
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
      optionsForm: () => `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        ${ optionsFormButtons() }
      </form>
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
      optionsForm: (input: Field | null, options) => `
        <form>
          <label>Key
            ${ optionsFormKeySelector(editor, input, options, 'key') }
          </label>
          ${ optionsFormButtons() }
        </form>
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
      optionsForm: () => `
      <form>
        <label>Index
          <input type="number" name="index" placeholder="Index"/>
        </label>
        ${ optionsFormButtons() }
      </form>
    `,
    }
  ]
}