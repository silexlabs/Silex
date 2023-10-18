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

import { DataTree } from "../model/DataTree"
import { Field, Filter, FilterOptions, State } from "../types"

export default function(dataTree: DataTree): Filter[] {
  function listToObject(field: Field | null): Field | null {
    if (!field) {
      return null
    }
    if(field.kind !== 'list') {
      console.error('Field is not a list', field)
      throw new Error(`Field ${field.name} is not a list`)
    }
    return {
      ...field,
      kind: 'object',
    }
  }
  function getFieldType(field: Field | null, key: string | undefined): Field | null {
    if (!field || !key) return null
    const types = field.typeIds.map(typeId => dataTree.findType(typeId))
    const fields = types.map(type => type?.fields.find(field => field.name === key))
    switch(fields.length) {
      case 0: return null
      case 1: return fields[0]!
      default: return {
        id: `${field.id}.${key}`,
        name: `${field.name}.${key}`,
        typeIds: fields.reduce((typeIds, field) => typeIds
          // Add typeIds of the field if not already present
          .concat(field!.typeIds.filter(t => !typeIds.includes(t)))
          , [] as string[]),
        kind: 'object',
      }
    }
  }
  function keySelector(field: Field | null, options: FilterOptions, name: string): string {
    // FIXME: here field is always null
    if(!field) return `
      <label>${name}
        <input type="text" name="${name}" />
      </label>
    `
    return `
      <select name="${name}">
        <option value="">Select a ${name}</option>
        ${
          field ? field.typeIds
            .flatMap(typeId => dataTree.findType(typeId)!.fields)
            .map(f => `<option value="${f.name}" ${f.name === options.key ? 'selected': ''}>${f.name}</option>`)
            .join('\n') 
            : ''
        }
      </select>
    `
  }
  return [
    {
      type: 'filter',
      id: 'abs',
      name: 'abs',
      validate: (field: Field | null) => !!field && (field.typeIds.includes('Int') || field.typeIds.includes('Float')) && field.kind === 'scalar',
      output: field => field,
      apply: num => Math.abs(num as number),
      options: {},
    }, {
      type: 'filter',
      id: 'strip_html',
      name: 'strip_html',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: type => type,
      apply: (str) => (str as string).replace(/<[^>]*>/g, ''),
      options: {},
    }, {
      type: 'filter',
      id: 'where',
      name: 'where',
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
          ${ keySelector(input, options, 'key') }
        </label>
        <label>Value to match (hard coded)
          <input type="text" name="value" placeholder="Value"/>
        </label>
        <label>Value to match (from parent state)
          <select name="state">
            ${
              dataTree.getContext()
                .filter(token => token.type === 'state')
                .map(state => `<option value="${(state as State).id}">${(state as State).id}</option>`)
                .join('\n')
            }
          </select>
        </label>
        <input type="submit" value="Apply" />
        <input type="reset" value="Cancel" />
      </form>
    `,
    }, {
      type: 'filter',
      id: 'first',
      name: 'first',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => listToObject(field),
      apply: (arr) => (arr as unknown[])[0],
      options: {},
    }, {
      type: 'filter',
      id: 'last',
      name: 'last',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => listToObject(field),
      apply: (arr) => (arr as unknown[])[(arr as unknown[]).length - 1],
      options: {},
    }, {
      type: 'filter',
      id: 'join',
      name: 'join',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'list',
      output: field => field ? {
        ...field,
        kind: 'scalar',
      } : null,
      apply: (arr, options) => (arr as string[]).join(options.separator as string ?? ','),
      options: {
        separator: ',',
      },
      optionsForm: () => `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        <input type="submit" value="Apply" />
        <input type="reset" value="Cancel" />
      </form>
    `,
    }, {
      type: 'filter',
      id: 'split',
      name: 'split',
      validate: (field: Field | null) => !!field && field.typeIds.includes('String') && field.kind === 'scalar',
      output: field => field ? {
        ...field,
        kind: 'list',
      } : null,
      apply: (str, options) => (str as string).split(options.separator as string ?? ','),
      options: {
        separator: ',',
      },
      optionsForm: () => `
      <form>
        <label>Separator
          <input type="text" name="separator" placeholder="Separator"/>
        </label>
        <input type="submit" value="Apply" />
        <input type="reset" value="Cancel" />
      </form>
    `,
    }, {
      type: 'filter',
      id: 'map',
      name: 'map',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field, options) => getFieldType(field, options['key'] as string | undefined),
      apply: (arr, options) => (arr as Record<string, unknown>[]).map(item => item[options.key as string]),
      options: {
        key: '',
      },
      optionsForm: (input: Field | null, options) => `
        <form>
          <label>Key
            ${ keySelector(input, options, 'key') }
          </label>
          <input type="submit" value="Apply" />
          <input type="reset" value="Cancel" />
        </form>
      `,
    }, {
      type: 'filter',
      id: 'reverse',
      name: 'reverse',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => field,
      apply: (arr) => (arr as unknown[]).reverse(),
      options: {},
    }, {
      type: 'filter',
      id: 'size',
      name: 'size',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: () => ({
        id: 'Int',
        name: 'Int',
        typeIds: ['Int'],
        kind: 'scalar',
      }),
      apply: (arr) => (arr as unknown[]).length,
      options: {},
    }, {
      type: 'filter',
      id: 'at',
      name: 'at',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: field => listToObject(field),
      apply: (arr, options) => (arr as unknown[])[options.index as number],
      options: {
        index: 0,
      },
      optionsForm: () => `
      <form>
        <label>Index
          <input type="number" name="index" placeholder="Index"/>
        </label>
        <input type="submit" value="Apply" />
        <input type="reset" value="Cancel" />
      </form>
    `,
    }
  ]
}