/**
 * @jest-environment jsdom
 */

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

import grapesjs, { Editor, Component } from 'grapesjs'
import { DataTree } from './DataTree'
import { Type, Filter, FieldProperty, Field, State, Expression } from '../types'
import { DataSourceEditor } from '..'
import { getState, getStateIds, getOrCreatePersistantId, getParentByPersistentId } from './state'
import { get } from 'jquery'

// Mock only getState
jest.mock('./state', () => ({
  ...jest.requireActual('./state'),
  getState: jest.fn(),
  getStateIds: jest.fn(),
  getOrCreatePersistantId: jest.fn(),
  getParentByPersistentId: jest.fn(),
}))

const simpleTypes: Type[] = [{
  id: 'testTypeId',
  label: 'test type name',
  fields: [
    {
      id: 'testFieldId',
      label: 'test field name',
      typeIds: ['testFieldTypeId'],
      kind: 'scalar',
      dataSourceId: 'DataSourceId',
    }
  ],
  dataSourceId: 'DataSourceId',
}, {
  id: 'testFieldTypeId',
  label: 'test field type name',
  fields: [],
  dataSourceId: 'DataSourceId',
}]
const simpleQueryables: Field[] = [{
  id: 'testSimpleQueryableId',
  label: 'test queryable',
  typeIds: ['testTypeId'],
  kind: 'scalar',
  dataSourceId: 'DataSourceId',
}]
const simpleQueryableTokens: FieldProperty[] = [{
  fieldId: 'testSimpleQueryableId',
  label: 'test queryable',
  type: 'property',
  propType: 'field',
  typeIds: ['testTypeId'],
  kind: 'scalar',
  dataSourceId: 'DataSourceId',
}]
const simpleFilters: Filter[] = [{
  type: 'filter',
  id: 'testFilterAnyInput',
  label: 'test filter any input',
  validate: type => !type, // Just for empty expressions
  output: () => null,
  options: {},
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId',
  label: 'test filter name',
  validate: type => !!type?.typeIds.includes('testTypeId'),
  output: type => type!,
  options: {},
  apply: jest.fn(),
}, {
  type: 'filter',
  id: 'testFilterId2',
  label: 'test filter name 2',
  validate: type => !!type?.typeIds.includes('testFieldTypeId'),
  output: () => null,
  options: {},
  apply: jest.fn(),
}]

let editor: Editor
let firstComponent: Component
beforeEach(async () => {
  jest.resetAllMocks()
  ;(getStateIds as jest.Mock).mockReturnValue([]) // Default for getStateIds
  editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
  firstComponent = editor.getComponents().first()
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
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
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
      getQueryables: () => simpleTypes[0].fields,
      getQuery: () => '',
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

  // Define mock values
  ;(getStateIds as jest.Mock).mockImplementation((c: unknown) => {
    if(c === component) return ['testStateId']
    else return []
  })
  ;(getOrCreatePersistantId as jest.Mock).mockReturnValue('testPersistentId')
  const dataTree = new DataTree(editor as DataSourceEditor, { filters: [], dataSources: [] })
  const context = dataTree.getContext(child)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1)
  const typeProp = context[0] as State
  expect(typeProp.type).toBe('state')
  expect(typeProp.componentId).toBe('testPersistentId')
  expect(typeProp.storedStateId).toBe('testStateId')
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
        label: 'test type name 1',
        kind: 'scalar',
        fields: [],
        dataSourceId: 'DataSourceId',
      }, {
        id: 'testTypeId2',
        label: 'test type name 2',
        kind: 'scalar',
        fields: [],
        dataSourceId: 'DataSourceId',
      }],
      getQueryables: () => [{
        id: 'testFieldId2',
        label: 'test field name 2',
        typeIds: ['testTypeId2'],
        kind: 'scalar',
        dataSourceId: 'DataSourceId',
      }],
      getQuery: () => '',
    }],
  })
  const context = dataTree.getContext(component)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1)
  const typeProp = context[0] as FieldProperty
  expect(typeProp.fieldId).toContain('testFieldId2')
})

//// TODO: Value tests
//// const simpleExpression: Context = [
////   {
////     type: 'property',
////     propType: 'type',
////     typeId: 'testTypeId',
////     dataSourceId: 'DataSourceId',
////   }, {
////     type: 'property',
////     propType: 'field',
////     fieldId: 'testFieldId',
////     typeId: 'testTypeId',
////     dataSourceId: 'DataSourceId',
////   }
//// ]
//// test('get value with simple context', () => {
////   const dataTree = new DataTree({
////     filters: [],
////     dataSources: [{
////       id: 'DataSourceId',
////       connect: async () => { },
////       getTypes: () => simpleTypes,
////     }],
////   })
//// 
////   // Empty value
////   expect(dataTree.getValue(simpleExpression, [])).toBeNull()
//// 
////   // 1 level value
////   const value = dataTree.getValue(simpleExpression, [{
////     type: 'property',
////     propType: 'type',
////     typeId: 'testTypeId',
////     dataSourceId: 'DataSourceId',
////   }])
////   expect(value).not.toBeNull()
////   // TODO: test value
//// 
////   // 2 levels value
////   const value2 = dataTree.getValue(simpleExpression, [{
////     type: 'property',
////     propType: 'type',
////     typeId: 'testTypeId',
////     dataSourceId: 'DataSourceId',
////   }, {
////     type: 'property',
////     propType: 'field',
////     fieldId: 'testFieldId',
////     typeId: 'testTypeId',
////     dataSourceId: 'DataSourceId',
////   }])
////   expect(value2).not.toBeNull()
////   // TODO: test value
//// })
//
test('get type with simple context', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })

  // Empty value
  expect(dataTree.getExpressionResultType([], firstComponent)).toBeNull()

  // 1 level value
  const type = dataTree.getExpressionResultType([{
    fieldId: 'testFieldId',
    label: 'test field name',
    type: 'property',
    propType: 'field',
    typeIds: ['testFieldTypeId'],
    dataSourceId: 'DataSourceId',
    kind: 'object',
  }], firstComponent)
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testFieldId')

  // 2 levels value
  const type2 = dataTree.getExpressionResultType([{
    fieldId: 'first',
    label: 'test field name',
    type: 'property',
    propType: 'field',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'second',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }], firstComponent)
  expect(type2).not.toBeNull()
  expect(type2?.id).toBe('second')
})

test('get completion with simple context', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  // The context is the queryables here
  const completion1 = dataTree.getCompletion(component, [])
  expect(completion1).toHaveLength(1) 
  expect(completion1).toEqual(simpleQueryableTokens)

  // 1 level value
  const completion2 = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion2).toHaveLength(1)
  const typeProp = completion2[0] as FieldProperty
  expect(typeProp.typeIds).toContain('testFieldTypeId')

  // 2 levels value
  const completion3 = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion3).toHaveLength(0)
})

test('get completion with filters', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: simpleFilters,
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  expect(dataTree.getCompletion(component, [])).toEqual([
    simpleQueryableTokens[0],
    simpleFilters[0],
  ])

  // 1 level value
  const completion = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion).toHaveLength(2) // 1 field and 1 filters

  // 2 levels value
  const completion2 = dataTree.getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: 'DataSourceId',
  }])
  expect(completion2).toHaveLength(1) // 1 filter
})

test('Get experessions used by a component', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: simpleFilters,
    dataSources: [{
      id: 'DataSourceId',
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })
  const component = editor.getComponents().first()
  const expression = [{
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: 'DataSourceId',
    }] as FieldProperty[]
  ;(getStateIds as jest.Mock).mockReturnValueOnce(['testStateId'])
  ;(getState as jest.Mock).mockImplementation(() => ({
    expression,
  }))
  expect(dataTree.getComponentExpressions(component)).toEqual([expression])
})

test('Get experessions used by a component and its children', () => {
  class DataTreeTest extends DataTree {
    getComponentExpressions = jest.fn(() => [])
  }
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {
    filters: [],
    dataSources: [],
  })
  dataTree.getComponentExpressionsRecursive(firstComponent)
  expect(dataTree.getComponentExpressions).toHaveBeenCalledTimes(1) // 1 per component
})

test('Get experessions used by a page', () => {
  class DataTreeTest extends DataTree {
    getComponentExpressionsRecursive = jest.fn(() => [])
  }
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {
    filters: [],
    dataSources: [],
  })
  dataTree.getPageExpressions((editor.Pages.getAll()[0]))
  expect(dataTree.getComponentExpressionsRecursive).toHaveBeenCalledTimes(1)
})

test('Get experessions used by all pages', () => {
  class DataTreeTest extends DataTree {
    getPageExpressions = jest.fn(() => [])
  }
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {
    filters: [],
    dataSources: [],
  })
  dataTree.getAllPagesExpressions()
  expect(dataTree.getPageExpressions).toHaveBeenCalledTimes(1) // 1 per page
})

test('Get experessions used by 2 components with 2 loops', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [],
  })
  const parent = editor.getComponents().first()
  const child: Component = parent.append('<div></div>')[0]
  const grandChild: Component = child.append('<div></div>')[0]
  expect(parent.get('components')).toHaveLength(1)
  expect(child).toBeDefined()
  expect(grandChild).toBeDefined()
  
  const parentExpression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'posts',
    kind: 'list',
  }] as Expression
  const childExpression = [{
    type: "state",
    storedStateId: "parentStateId",
    componentId: "parentPersistentId",
    exposed: false,
    forceKind: "object",
    label: "parent loop item"
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'comments',
    kind: 'list',
  }] as Expression
  const grandChildExpression = [{
    type: 'state',
    storedStateId: 'childStateId',
    componentId: 'childPersistentId',
    exposed: false,
    forceKind: 'object',
    label: 'child loop item',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'body',
    kind: 'scalar',
  }] as Expression
  const resultGrandChildExpression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'posts',
    kind: 'list',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'comments',
    kind: 'list',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'body',
    kind: 'scalar',
  }] as Expression

  ;(getStateIds as jest.Mock).mockImplementation((comp: unknown, hidden: boolean) => {
    if(comp === parent && hidden === true) return ['parentStateId']
    else if(comp === child && hidden === true) return ['childStateId']
    else if(comp === grandChild && hidden === true) return ['grandChildStateId']
    return []
  })
  ;(getState as jest.Mock).mockImplementation((comp: unknown, id: string) => {
    if(id === 'parentStateId') return { expression: parentExpression }
    else if(id === 'childStateId') return { expression: childExpression }
    else if(id === 'grandChildStateId') return { expression: grandChildExpression }
    return null
  })
  ;(getOrCreatePersistantId as jest.Mock).mockImplementation((c: unknown) => {
    if(c === parent) return 'parentPersistentId'
    else if(c === child) return 'childPersistentId'
    return null
  })
  ;(getParentByPersistentId as jest.Mock).mockImplementation((id: string) => {
    if(id === 'parentPersistentId') return parent
    else if(id === 'childPersistentId') return child
    return null
  })
  const result = dataTree.getComponentExpressions(grandChild)
  expect(result).toEqual([resultGrandChildExpression])
})
