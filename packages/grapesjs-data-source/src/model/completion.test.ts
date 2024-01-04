/**
 * @jest-environment jsdom
 */

import grapesjs, { Component, Editor } from "grapesjs"
import { DataTree } from "./DataTree"
import { getCompletion, getContext } from "./completion"
import { simpleFilters, simpleQueryables, simpleTypes, testDataSourceId } from "../test-data"
import { DataSourceEditor, Filter, Property, State } from "../types"
import { getOrCreatePersistantId, getStateIds } from "./state"

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

// Mock only getState
jest.mock('./state', () => ({
  ...jest.requireActual('./state'),
  getState: jest.fn(),
  getStateIds: jest.fn(),
  getOrCreatePersistantId: jest.fn(),
  getParentByPersistentId: jest.fn(),
}))

const simpleQueryableTokens: Property[] = [{
  fieldId: 'testSimpleQueryableId',
  label: 'test queryable',
  type: 'property',
  propType: 'field',
  typeIds: ['testTypeId'],
  kind: 'scalar',
  dataSourceId: testDataSourceId,
}]

let editor: Editor
beforeEach(async () => {
  jest.resetAllMocks()
  ;(getStateIds as jest.Mock).mockReturnValue([]) // Default for getStateIds
  editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
})

test('get empty context', () => {
  const editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div></div>',
  })
  const component = editor.getComponents().first()
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: []})
  const context = getContext(component, dataTree)
  expect(context).toBeDefined()
  expect(context).toHaveLength(0)
})

test('get context with filters', () => {
  const component = editor.getComponents().first()
  const dataTree = new DataTree(editor as DataSourceEditor, {
    dataSources: [],
    filters: simpleFilters,
  })
  const context = getContext(component, dataTree)
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
  const context = getContext(child, dataTree)
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
      id: testDataSourceId,
      connect: async () => {},
      getTypes: () => [{
        id: 'testTypeId1',
        label: 'test type name 1',
        kind: 'scalar',
        fields: [],
        dataSourceId: testDataSourceId,
      }, {
        id: 'testTypeId2',
        label: 'test type name 2',
        kind: 'scalar',
        fields: [],
        dataSourceId: testDataSourceId,
      }],
      getQueryables: () => [{
        id: 'testFieldId2',
        label: 'test field name 2',
        typeIds: ['testTypeId2'],
        kind: 'scalar',
        dataSourceId: testDataSourceId,
      }],
      getQuery: () => '',
    }],
  })
  const context = getContext(component, dataTree)
  expect(context).toBeDefined()
  expect(context).toHaveLength(1)
  const typeProp = context[0] as Property
  expect(typeProp.fieldId).toContain('testFieldId2')
})

test('get completion with simple context', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: testDataSourceId,
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  // The context is the queryables here
  const completion1 = getCompletion(component, [], dataTree)
  expect(completion1).toHaveLength(1) 
  expect(completion1).toEqual(simpleQueryableTokens)

  // 1 level value
  const completion2 = getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }], dataTree)
  expect(completion2).toHaveLength(1)
  const typeProp = completion2[0] as Property
  expect(typeProp.typeIds).toContain('testFieldTypeId')

  // 2 levels value
  const completion3 = getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }], dataTree)
  expect(completion3).toHaveLength(0)
})

test('get completion with filters', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: simpleFilters,
    dataSources: [{
      id: testDataSourceId,
      connect: async () => { },
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
    }],
  })
  const component = editor.getComponents().first()

  // Empty value
  expect(getCompletion(component, [], dataTree)).toEqual([
    simpleQueryableTokens[0],
    simpleFilters[0],
  ])

  // 1 level value
  const completion = getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }], dataTree)
  expect(completion).toHaveLength(2) // 1 field and 1 filters

  // 2 levels value
  const completion2 = getCompletion(component, [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testFieldTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }], dataTree)
  expect(completion2).toHaveLength(1) // 1 filter
})
