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

import { DataSourceEditor, getPersistantId, getStateVariableName } from ".."
import { Field, Filter, Options, State } from "../types"

export default function(editor: DataSourceEditor): Filter[] {
  const dataTree = editor.DataSourceManager.getDataTree()
  function listToObject(field: Field | null): Field | null {
    if (!field) {
      return null
    }
    if(field.kind !== 'list') {
      console.error('Field is not a list', field)
      throw new Error(`Field ${field.label} is not a list`)
    }
    return {
      ...field,
      kind: 'object',
    }
  }
  function getFieldType(field: Field | null, key: string | undefined): Field | null {
    if (!field || !key) return null
    const types = field.typeIds.map(typeId => dataTree.findType(typeId))
    const fields = types.map(type => type?.fields.find(field => field.label === key))
    switch(fields.length) {
      case 0: return null
      case 1: return fields[0]!
      default: return {
        id: `${field.id}.${key}`,
        label: `${field.label}.${key}`,
        typeIds: fields.reduce((typeIds, field) => typeIds
          // Add typeIds of the field if not already present
          .concat(field!.typeIds.filter(t => !typeIds.includes(t)))
          , [] as string[]),
        kind: 'object',
      }
    }
  }
  function keySelector(field: Field | null, options: Options, name: string): string {
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
            .map(f => `<option value="${f.label}" ${f.label === options.key ? 'selected': ''}>${f.label}</option>`)
            .join('\n') 
            : ''
        }
      </select>
    `
  }
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
          ${ keySelector(input, options, 'key') }
        </label>
        <label>Value to match (hard coded)
          <input type="text" name="value" placeholder="Value"/>
        </label>
        <label>Value to match (select a custom state)
          <select name="state">
            ${
              dataTree.getContext()
                .filter(token => token.type === 'state' && token.exposed)
                .map(token => {
                  const state = token as State
                  const value = getStateVariableName(state.componentId, state.storedStateId)
                  const component = (() => {
                    let c = editor.getSelected()
                    while (c) {
                      if (getPersistantId(c) === state.componentId) return c
                      c = c.parent()
                    }
                    return null
                  })()
                  if (!component) {
                    console.warn(`Could not find component with persistent ID ${state.componentId}`, { state })
                    return ''
                  }
                  return `<option selected="${options.state === value}" value="${value}">${component.getName()}'s ${state.label}</option>`
                })
                .join('\n')
            }
          </select>
        </label>
        <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>
    `,
    }, {
      type: 'filter',
      id: 'first',
      label: 'first',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => listToObject(field),
      apply: (arr) => (arr as unknown[])[0],
      options: {},
    }, {
      type: 'filter',
      id: 'last',
      label: 'last',
      validate: (field: Field | null) => !!field && field.kind === 'list',
      output: (field: Field | null) => listToObject(field),
      apply: (arr) => (arr as unknown[])[(arr as unknown[]).length - 1],
      options: {},
    }, {
      type: 'filter',
      id: 'join',
      label: 'join',
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
        <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>
    `,
    }, {
      type: 'filter',
      id: 'split',
      label: 'split',
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
        <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>
    `,
    }, {
      type: 'filter',
      id: 'map',
      label: 'map',
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
          <div class="buttons">
            <input type="reset" value="Cancel" />
            <input type="submit" value="Apply" />
          </div>
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
          <div class="buttons">
          <input type="reset" value="Cancel" />
          <input type="submit" value="Apply" />
        </div>
      </form>
    `,
    }
  ]
}