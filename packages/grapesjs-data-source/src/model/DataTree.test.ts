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

/**
 * @jest-environment jsdom
 */
import grapesjs, { Editor, Component } from 'grapesjs'
import { DataTree } from './DataTree'
import { Type, Filter, TypeProperty, Token, State } from '../types'
import { DataSourceEditor } from '..'

const simpleTypes: Type[] = [{
  id: 'testTypeId',
  name: 'test type name',
  kind: 'object',
  fields: [
    {
      id: 'testFieldId',
      name: 'test field name',
      typeId: 'testFieldTypeId',
      kind: 'scalar',
      dataSourceId: 'DataSourceId',
    }
  ],
  queryable: true,
  dataSourceId: 'DataSourceId',
}, {
  id: 'testFieldTypeId',
  name: 'test field type name',
  kind: 'scalar',
  fields: [],
  queryable: false,
  dataSourceId: 'DataSourceId',
}]
const simpleFilters: Filter[] = [{
  type: 'filter',
  id: 'testFilterAnyInput',
  name: 'test filter any input',
  validate: type => !type,
  outputType: () => null,
  options: {},
  optionsForm: null,
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId',
  name: 'test filter name',
  validate: type => type?.id === 'testTypeId',
  outputType: type => type!,
  options: {},
  optionsForm: null,
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId2',
  name: 'test filter name 2',
  validate: type => type?.id === 'testFieldTypeId',
  outputType: () => null,
  options: {},
  optionsForm: null,
  apply: jest.fn(),
}]
const simpleTokens: Token[] = [{
  type: 'property',
  propType: 'type',
  typeId: 'testTypeId',
  dataSourceId: 'DataSourceId',
  kind: 'object',
}, {
  type: 'property',
  propType: 'field',
  fieldId: 'testFieldId',
  typeId: 'testTypeId',
  parentTypeId: 'testTypeId',
  dataSourceId: 'DataSourceId',
  kind: 'object',
}]

let editor: Editor
beforeEach(async () => {
  editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
})

test('DataTree instanciation', () => {
  expect(DataTree).toBeDefined()
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: []})
  expect(dataTree).toBeDefined()
})

test('Find type from  id', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: [{
    id: 'DataSourceId',
    connect: async () => {},
    getTypes: () => simpleTypes,
  }]})

  // Type not found
  expect(dataTree.findType('unknown')).toBeNull()

  // Type found
  const type = dataTree.findType('testTypeId')
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testTypeId')

  // With data source id
  expect(dataTree.findType('testTypeId', 'DataSourceId')).not.toBeNull()
  expect(dataTree.findType('testTypeId', 'unknown')).toBeNull()
})

test('get types map', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => {},
      getTypes: () => simpleTypes,
    }],
  })
  const types = dataTree.getAllTypes()
  expect(types).toBeDefined()
  expect(types).toHaveLength(2)
  expect(types[0].id).toBe('testTypeId')
})

test('get empty context', () => {
  const editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
  const component = editor.getComponents().first()
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: []})
  const context = dataTree.getContext(component)
  expect(context).toBeDefined()
  expect(context).toHaveLength(0)
})

test('get context with filters', () => {
  const component = editor.getComponents().first()
  const dataTree = new DataTree(editor as DataSourceEditor, {
    dataSources: [],
    filters: simpleFilters,
  })
  const context = dataTree.getContext(component)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1) // 1 Filter only for no input
  const filter = context[0] as Filter
  expect(filter.id).toBe('testFilterAnyInput')
})

test('get context with parent compontent states', () => {
  const component = editor.getComponents().first()
  const child: Component = component.append('<div></div>')[0]
  expect(component.get('components')).toHaveLength(1)
  expect(child).toBeDefined()
  component.set('states', {
    testStateId: [{
      type: 'property',
      propType: 'type',
      typeId: 'testTypeId',
      dataSourceId: 'DataSourceId',
    }],
  })
  const dataTree = new DataTree(editor as DataSourceEditor, { filters: [], dataSources: [] })
  const context = dataTree.getContext(child)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1)
  const typeProp = context[0] as State
  expect(typeProp.type).toBe('state')
  expect(typeProp.componentId).toBe(component.cid)
  expect(typeProp.id).toBe('testStateId')
})

test('get context with data source queryable values', () => {
  const component = editor.getComponents().first()
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => {},
      getTypes: () => [{
        id: 'testTypeId1',
        name: 'test type name 1',
        kind: 'scalar',
        fields: [],
        queryable: false,
        dataSourceId: 'DataSourceId',
      }, {
        id: 'testTypeId2',
        name: 'test type name 2',
        kind: 'scalar',
        fields: [],
        queryable: true,
        dataSourceId: 'DataSourceId',
      }],
    }],
  })
  const context = dataTree.getContext(component)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1)
  const typeProp = context[0] as TypeProperty
  expect(typeProp.typeId).toBe('testTypeId2')
})

// const simpleExpression: Context = [
//   {
//     type: 'property',
//     propType: 'type',
//     typeId: 'testTypeId',
//     dataSourceId: 'DataSourceId',
//   }, {
//     type: 'property',
//     propType: 'field',
//     fieldId: 'testFieldId',
//     typeId: 'testTypeId',
//     dataSourceId: 'DataSourceId',
//   }
// ]
// test('get value with simple context', () => {
//   const dataTree = new DataTree({
//     filters: [],
//     dataSources: [{
//       id: 'DataSourceId',
//       connect: async () => { },
//       getTypes: () => simpleTypes,
//     }],
//   })
// 
//   // Empty value
//   expect(dataTree.getValue(simpleExpression, [])).toBeNull()
// 
//   // 1 level value
//   const value = dataTree.getValue(simpleExpression, [{
//     type: 'property',
//     propType: 'type',
//     typeId: 'testTypeId',
//     dataSourceId: 'DataSourceId',
//   }])
//   expect(value).not.toBeNull()
//   // TODO: test value
// 
//   // 2 levels value
//   const value2 = dataTree.getValue(simpleExpression, [{
//     type: 'property',
//     propType: 'type',
//     typeId: 'testTypeId',
//     dataSourceId: 'DataSourceId',
//   }, {
//     type: 'property',
//     propType: 'field',
//     fieldId: 'testFieldId',
//     typeId: 'testTypeId',
//     dataSourceId: 'DataSourceId',
//   }])
//   expect(value2).not.toBeNull()
//   // TODO: test value
// })

test('get type from property', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
    }],
  })
  const prop: Type | null = dataTree.getTypeFromProperty({
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    dataSourceId: 'DataSourceId',
    kind: 'object',
  })
  expect(prop).not.toBeNull()
  expect(prop?.id).toBe('testTypeId')
  const field: Type | null = dataTree.getTypeFromProperty({
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    parentTypeId: 'testTypeId',
    typeId: 'testFieldTypeId',
    dataSourceId: 'DataSourceId',
    kind: 'object',
  })
  expect(field).not.toBeNull()
  expect(field?.id).toBe('testFieldTypeId')
})

test('get type with simple context', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
    }],
  })

  // Empty value
  expect(dataTree.getTypeFromExpression([])).toBeNull()

  // 1 level value
  const type = dataTree.getTypeFromExpression([{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    dataSourceId: 'DataSourceId',
    kind: 'object',
  }])
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testTypeId')

  // 2 levels value
  const type2 = dataTree.getTypeFromExpression([{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    parentTypeId: 'testTypeId',
    typeId: 'testFieldTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(type2).not.toBeNull()
  expect(type2?.id).toBe('testFieldTypeId')
})

test('get completion with simple context', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  expect(dataTree.getCompletion(component, [])).toStrictEqual(simpleTokens.slice(0, 1))

  // 1 level value
  const completion = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion).toHaveLength(1)
  const typeProp = completion[0] as TypeProperty
  expect(typeProp.typeId).toBe('testFieldTypeId')

  //// 2 levels value
  const completion2 = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    parentTypeId: 'testTypeId',
    typeId: 'testFieldTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion2).toHaveLength(0)
})

test('get completion with filters', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: simpleFilters,
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  expect(dataTree.getCompletion(component, [])).toStrictEqual(simpleTokens.slice(0, 1).concat(simpleFilters[0]))

  // 1 level value
  const completion = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion).toHaveLength(2) // 1 field and 1 filters (both filter input matches)

  //// 2 levels value
  const completion2 = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'type',
    typeId: 'testTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    parentTypeId: 'testTypeId',
    typeId: 'testFieldTypeId',
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion2).toHaveLength(1) // 1 filter
})
