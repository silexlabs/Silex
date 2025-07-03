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

import grapesjs, { Component } from 'grapesjs'
import { DataTree } from './DataTree'
import { Property, DataSourceEditor, StoredFilter, State, Expression, Tree, Field, Token, Type, Filter  } from '../types'
import { getStates, getParentByPersistentId, getState } from './state'
import { simpleFilters, simpleQueryables, simpleTypes, testDataSourceId, testTokens } from '../test-data'

// Mock only getState
jest.mock('./state', () => ({
  ...jest.requireActual('./state'),
  getState: jest.fn(),
  getStates: jest.fn(),
  getOrCreatePersistantId: jest.fn(),
  getParentByPersistentId: jest.fn(),
}))

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

let editor: DataSourceEditor
let containerComponent: Component
beforeEach(async () => {
  jest.resetAllMocks()
  ;(getStates as jest.Mock).mockReturnValue([]) // Default for getStates
  editor = grapesjs.init({
    container: document.createElement('div'),
    components: '<div><div></div></div>',
  }) as DataSourceEditor
  containerComponent = editor.getComponents().first()
})

test('DataTree instanciation', () => {
  expect(DataTree).toBeDefined()
  const dataTree = new DataTree(editor, {filters: [], dataSources: []})
  expect(dataTree).toBeDefined()
})

test('Find type from  id', () => {
  const dataTree = new DataTree(editor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    isConnected: () => true,
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
    fetchValues: jest.fn(),
  }]})

  // Trigger the event to populate allTypes
  editor.trigger('data-source:ready')

  // Type not found
  expect(() => dataTree.getType('unknown type', null, null)).toThrow()

  // Type found
  const type = dataTree.getType('testTypeId', null, null)
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testTypeId')

  // With data source id
  expect(dataTree.getType('testTypeId', testDataSourceId, null)).not.toBeNull()
  expect(() => dataTree.getType('testTypeId', 'unknown type', null)).toThrow()
})

test('Expressions to tree', () => {
  const dataTree = new DataTree(editor, {filters: [], dataSources: []})
  const expression: Expression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }]
  const component = editor.getComponents().first()
  expect(dataTree.getTrees({expression, component}, testDataSourceId))
    .toEqual([{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId'],
        kind: 'object',
        dataSourceId: testDataSourceId,
      },
      children: [],
    }])
})

test('merge trees', () => {
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor, {filters: [], dataSources: []})
  const tree1: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: testDataSourceId,
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: testDataSourceId,
      },
      children: [],
    }],
  }
  const tree2: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: testDataSourceId,
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: testDataSourceId,
      },
      children: [],
    }, {
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId2',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: testDataSourceId,
      },
      children: [],
    }],
  }
  expect(dataTree.mergeTrees(tree1, tree2))
    .toEqual({
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId'],
        kind: 'object',
        dataSourceId: testDataSourceId,
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldPropertyId2',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId'],
          kind: 'scalar',
          dataSourceId: testDataSourceId,
        },
        children: [],
      }, {
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldPropertyId',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId'],
          kind: 'scalar',
          dataSourceId: testDataSourceId,
        },
        children: [],
      }],
    })
})

test('merge trees with multiple possible types', () => {
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor, {filters: [], dataSources: []})
  const tree1: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'parentFieldId',
      label: 'test parent name',
      typeIds: ['testParentId'],
      kind: 'object',
      dataSourceId: testDataSourceId,
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId1'],
        kind: 'object',
        dataSourceId: testDataSourceId,
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID1',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId1'],
          kind: 'scalar',
          dataSourceId: testDataSourceId,
        },
        children: [],
      }],
    }],
  }
  const tree2: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'parentFieldId',
      label: 'test parent name',
      typeIds: ['testParentId'],
      kind: 'object',
      dataSourceId: testDataSourceId,
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId2'],
        kind: 'object',
        dataSourceId: testDataSourceId,
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID2',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId2'],
          kind: 'scalar',
          dataSourceId: testDataSourceId,
        },
        children: [],
      }],
    }],
  }
  expect(dataTree.mergeTrees(tree1, tree2))
    .toEqual({
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'parentFieldId',
        label: 'test parent name',
        typeIds: ['testParentId'],
        kind: 'object',
        dataSourceId: testDataSourceId,
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldId',
          label: 'test field name',
          typeIds: ['testTypeId1'],
          kind: 'object',
          dataSourceId: testDataSourceId,
        },
        children: [{
          token: {
            type: 'property',
            propType: 'field',
            fieldId: 'ONLY_TEST_TYPE_ID1',
            label: 'test field property name',
            typeIds: ['testFieldPropertyTypeId1'],
            kind: 'scalar',
            dataSourceId: testDataSourceId,
          },
          children: [],
        }],
      }, {
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldId',
          label: 'test field name',
          typeIds: ['testTypeId2'],
          kind: 'object',
          dataSourceId: testDataSourceId,
        },
        children: [{
          token: {
            type: 'property',
            propType: 'field',
            fieldId: 'ONLY_TEST_TYPE_ID2',
            label: 'test field property name',
            typeIds: ['testFieldPropertyTypeId2'],
            kind: 'scalar',
            dataSourceId: testDataSourceId,
          },
          children: [],
        }],
      }]
    })
})

test('get tree with filters', async () => {
  const queryObjects: Expression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testId1',
    label: 'test field name',
    typeIds: ['PostEntityResponseCollection'],
    kind: 'list',
    dataSourceId: testDataSourceId,
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'data',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: testDataSourceId,
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'id',
    label: 'test field name',
    typeIds: ['ID'],
    kind: 'scalar',
    dataSourceId: testDataSourceId,
  }]
  const dataTree = new DataTree(editor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    isConnected: () => true,
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
    fetchValues: jest.fn(),
  }]})
  // Make sure it treats them all as relative
  dataTree.isRelative = () => true
  const component = editor.getComponents().first()
  const result = dataTree.getTrees({expression: [...queryObjects], component}, testDataSourceId)
  expect(result)
    .toEqual([{
      token: queryObjects[0],
      children: [{
        token: queryObjects[2],
        children: [{
          token: queryObjects[4],
          children: [],
        }],
      }],
    }])
})

test('Merge trees with empty and no options', async () => {
  const trees = [{
    'token': {
      'type': 'property',
      'propType': 'field',
      'typeIds': [],
      'label': 'test field name',
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object'
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId1',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId'
        },
        'children': []
      }
    ],
  }, {
    'token': {
      'type': 'property',
      'propType': 'field',
      'typeIds': [],
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object'
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId1',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId',
          'options': {
            'test': undefined,
            'test2': '',
          },
        },
        'children': []
      }
    ],
  }] as Tree[]
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    isConnected: () => true,
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
    fetchValues: jest.fn(),
  }]})

  expect(async () => dataTree.mergeTrees(trees[0], trees[1]))
    .not.toThrow()

  // The 2 trees are the same
  // The 2nd tree has empty options which should be ignored
  expect(dataTree.mergeTrees(trees[0], trees[1]))
    .toEqual(trees[0])
})

test('Get query with errors in options', async () => {
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor, {filters: [], dataSources: []})
  expect(() => dataTree.mergeTrees({
    'token': {
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object',
      'typeIds': [],
      'type': 'property',
      'propType': 'field',
      'label': 'test field name',
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId1',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId'
        },
        'children': []
      }
    ]
  }, {
    'token': {
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object',
      'typeIds': [],
      'type': 'property',
      'propType': 'field',
      'label': 'test field name',
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId1',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId',
          'options': {
            'id': 'option'
          }
        },
        'children': []
      }
    ]
  }))
    .toThrow()
})

test('Get query from multiple expressions', async () => {
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor, {filters: [], dataSources: []})
  const tree = dataTree.mergeTrees({
    'token': {
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object',
      'typeIds': [],
      'type': 'property',
      'propType': 'field',
      'label': 'test field name',
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId1',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId'
        },
        'children': []
      }
    ]
  }, {
    'token': {
      'dataSourceId': 'testDataSourceId',
      'fieldId': 'query',
      'kind': 'object',
      'typeIds': [],
      'type': 'property',
      'propType': 'field',
      'label': 'test field name',
    },
    'children': [
      {
        'token': {
          'type': 'property',
          'propType': 'field',
          'fieldId': 'testFieldId2',
          'label': 'test field name',
          'typeIds': [
            'testTypeId'
          ],
          'kind': 'object',
          'dataSourceId': 'testDataSourceId'
        },
        'children': []
      }
    ]
  })
  expect(tree).not.toBeUndefined()
  expect(tree.token).not.toBeUndefined()
  expect(tree.token.fieldId).toBe('query')
  expect(tree.children).toHaveLength(2)
  expect(tree.children[0].token.fieldId).toBe('testFieldId1')
})

//test('Get query from expression with filters', async () => {
//  const queryObjects = [{
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testId1',
//    label: 'test field name',
//    typeIds: ['PostEntityResponseCollection'],
//    kind: 'list',
//    dataSourceId: 'testDataSourceId',
//  }, {
//    type: 'filter',
//    id: 'testFilterId1',
//    label: 'test filter name',
//    options: {},
//  }, {
//    type: 'property',
//    propType: 'field',
//    fieldId: 'data',
//    label: 'test field name',
//    typeIds: ['PostEntity'],
//    kind: 'list',
//    dataSourceId: 'testDataSourceId',
//  }, {
//    type: 'filter',
//    id: 'testFilterId1',
//    label: 'test filter name',
//    options: {},
//  }, {
//    type: 'property',
//    propType: 'field',
//    fieldId: 'id',
//    label: 'test field name',
//    typeIds: ['ID'],
//    kind: 'scalar',
//    dataSourceId: 'testDataSourceId',
//  }]
//  await dataSource.getQuery([[...queryObjects]])
//  expect(getQuery).toHaveBeenCalledTimes(1)
//  expect(getQuery).toHaveBeenCalledWith({
//    token: {
//      dataSourceId: 'testDataSourceId',
//      fieldId: 'query',
//      kind: 'object',
//      typeIds: ['Query'],
//    },
//    children: [
//      { token: queryObjects[0], children: [
//        { token: queryObjects[2], children: [
//          { token: queryObjects[4], children: [] }
//        ]},
//      ]},
//    ]
//  })
//})

//test('Get query with options', async () => {
//  const DataSource = (await importDataSource([simpleSchema]))
//  const dataSource = new DataSource(options)
//  dataSource.getTypes = () => ([{
//    id: 'Query',
//    fields: [{
//      id: 'testFieldId1',
//      dataSourceId: 'testDataSourceId',
//      typeIds: ['rootTypeId1'],
//    }, {
//      id: 'testFieldId2',
//      dataSourceId: 'testDataSourceId',
//      typeIds: ['rootTypeId2'],
//    }, {
//      id: 'testFieldId3',
//      dataSourceId: 'testDataSourceId',
//      typeIds: ['rootTypeId1'],
//    }],
//  }, {
//    id: 'testTypeId',
//    dataSourceId: 'testDataSourceId',
//    fields: [],
//  }] as Type[])
//  await dataSource.connect()
//  const query = await dataSource.getQuery([[{
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId1',
//    label: 'test field name',
//    typeIds: ['testTypeId'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {id: 1},
//  }], [{
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId1',
//    label: 'test field name',
//    typeIds: ['testTypeId'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {id: 1},
//  }], [{
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId2',
//    label: 'test field name',
//    typeIds: ['testTypeId'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {name: 'test'},
//  }], [{
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId3',
//    label: 'test field name',
//    typeIds: ['testTypeId'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//  }]])
//  expect(query).not.toBeUndefined()
//  expect(query).toEqual(`query {
//  __typename
//  testFieldId1(id: 1) {
//    __typename
//
//
//  }
//  testFieldId2(name: "test") {
//    __typename
//
//
//  }
//  testFieldId3 {
//    __typename
//
//
//  }
//
//}`)
//})
//
//test('Get query with property options', async () => {
//  const DataSource = (await importDataSource([simpleSchema]))
//  const dataSource = new DataSource(options)
//  dataSource.getQuery = jest.fn(() => 'testQuery')
//  await dataSource.connect()
//  await dataSource.getQuery([[{
//    // LEVEL 1
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId1',
//    label: 'test field name',
//    typeIds: ['PostEntity'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {id: 'option'},
//  }, {
//    // LEVEL 2
//    type: 'property',
//    propType: 'field',
//    fieldId: 'test',
//    label: 'test field property name',
//    typeIds: ['String'],
//    kind: 'scalar',
//    dataSourceId: 'testDataSourceId',
//    options: {prop: 'option1'},
//  }], [{
//    // LEVEL 1
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId1',
//    label: 'test field name',
//    typeIds: ['PostEntity'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {id: 'option'},
//  }, {
//    // LEVEL 2
//    type: 'property',
//    propType: 'field',
//    fieldId: 'id',
//    label: 'test field property name',
//    typeIds: ['ID'],
//    kind: 'scalar',
//    dataSourceId: 'testDataSourceId',
//    options: {},
//  }], [{
//    // LEVEL 1
//    type: 'property',
//    propType: 'field',
//    fieldId: 'testFieldId1',
//    label: 'test field name',
//    typeIds: ['PostEntity'],
//    kind: 'object',
//    dataSourceId: 'testDataSourceId',
//    options: {id: 'option'},
//  }, {
//    // LEVEL 2
//    type: 'property',
//    propType: 'field',
//    fieldId: 'attributes',
//    label: 'test field property name',
//    typeIds: ['PostEntity'],
//    kind: 'Object',
//    dataSourceId: 'testDataSourceId',
//    options: {prop: 'option3'},
//  }]])
//  expect(dataSource.getQuery).toHaveBeenCalledTimes(1)
//  expect(dataSource.getQuery).toHaveBeenCalledWith({
//    token: {
//      dataSourceId: 'testDataSourceId',
//      fieldId: 'query',
//      kind: 'object',
//      typeIds: ['Query'],
//    },
//    children: [
//      { token: {
//        type: 'property',
//        propType: 'field',
//        fieldId: 'testFieldId1',
//        label: 'test field name',
//        typeIds: ['PostEntity'],
//        kind: 'object',
//        dataSourceId: 'testDataSourceId',
//        options: {id: 'option'},
//      }, children: [
//        { token: {
//          type: 'property',
//          propType: 'field',
//          fieldId: 'test',
//          label: 'test field property name',
//          typeIds: ['String'],
//          kind: 'scalar',
//          dataSourceId: 'testDataSourceId',
//          options: {prop: 'option1'},
//        }, children: [] },
//        { token: {
//          type: 'property',
//          propType: 'field',
//          fieldId: 'id',
//          label: 'test field property name',
//          typeIds: ['ID'],
//          kind: 'scalar',
//          dataSourceId: 'testDataSourceId',
//          options: {},
//        }, children: [] },
//        { token: {
//          type: 'property',
//          propType: 'field',
//          fieldId: 'attributes',
//          label: 'test field property name',
//          typeIds: ['PostEntity'],
//          kind: 'Object',
//          dataSourceId: 'testDataSourceId',
//          options: {prop: 'option3'},
//        }, children: [] },
//      ]},
//    ]
//  })
//})
//
//test('Get query with filter options', () => {
//  const fn = jest.fn(() => ([{
//    id: 'Query',
//    fields: [{
//      id: 'rootField1',
//      label: 'test',
//      dataSourceId: 'testDataSourceId',
//      typeIds: ['rootTypeId1'],
//    }, {
//      id: 'rootField2',
//      label: 'test',
//      dataSourceId: 'testDataSourceId',
//      typeIds: ['rootTypeId2'],
//    }],
//  }, {
//    id: 'rootTypeId1',
//    label: 'test',
//    dataSourceId: 'testDataSourceId',
//    fields: [{
//      id: 'childField1',
//      label: 'test',
//      typeIds: ['childTypeId1'],
//      kind: 'scalar',
//      dataSourceId: 'testDataSourceId',
//    }, {
//      id: 'childField3',
//      label: 'test',
//      typeIds: ['childTypeId3'],
//      kind: 'scalar',
//      dataSourceId: 'testDataSourceId',
//    }],
//  }, {
//    id: 'rootTypeId2',
//    label: 'test',
//    dataSourceId: 'testDataSourceId',
//    fields: [{
//      id: 'childField2',
//      label: 'test',
//      typeIds: ['childTypeId2'],
//      kind: 'scalar',
//      dataSourceId: 'testDataSourceId',
//    }],
//  }] as Type[]))
//  class GQLTestTrees extends GraphQL {
//    protected queryType: string = 'Query'
//    getTypes(): Type[] {
//      return fn()
//    }
//  }
//  const gql = new GQLTestTrees({
//    url: 'http://localhost',
//    method: 'POST',
//    headers: {},
//    id: 'testDataSourceId',
//    label: 'test',
//    type: 'graphql',
//  })
//  expect(gql.getQuery({
//    token: testTokens.rootField1 as Property,
//    children: [{
//      token: testTokens.childField3 as Property,
//      children: [],
//    }],
//  }))
//    .toEqual(dedent`
//      query {
//        __typename
//        rootField2 {
//          __typename
//          childField2
//
//        }
//        rootField1 {
//          __typename
//          childField3
//          childField1
//
//        }
//
//      }
//    `)
//})

test('isRelative', () => {
  const dataTree = new DataTree(editor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    isConnected: () => true,
    getTypes: () => ([{
      id: 'parentType',
      label: 'test',
      dataSourceId: testDataSourceId,
      fields: [{
        id: 'testId1',
        label: 'test',
        typeIds: ['childType'],
        kind: 'list',
        dataSourceId: testDataSourceId,
      }],
    }, {
      id: 'childType',
      label: 'test',
      dataSourceId: testDataSourceId,
      fields: [{
        id: 'testId2',
        label: 'test',
        typeIds: ['childType'],
        kind: 'scalar',
        dataSourceId: testDataSourceId,
      }],
    }] as Type[]),
    getQueryables: () => ([]),
    getQuery: () => '',
    fetchValues: jest.fn(),
  }]})
  expect(dataTree.isRelative({
    type: 'property',
    propType: 'field',
    fieldId: 'testId1',
    label: 'test field name',
    typeIds: ['parentType'],
    kind: 'list',
    dataSourceId: testDataSourceId,
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'testId2',
    label: 'test field name',
    typeIds: ['childType'],
    kind: 'scalar',
    dataSourceId: testDataSourceId,
  }, testDataSourceId)).toBeTruthy()
})

test('get tree with options', () => {
  const fn = jest.fn(() => ([{
    id: 'rootTypeId1',
    label: 'test',
    dataSourceId: testDataSourceId,
    fields: [{
      id: 'childField1',
      label: 'test',
      typeIds: ['childTypeId1'],
      kind: 'scalar',
      dataSourceId: testDataSourceId,
    }, {
      id: 'childField3',
      label: 'test',
      typeIds: ['childTypeId3'],
      kind: 'scalar',
      dataSourceId: testDataSourceId,
    }],
  }, {
    id: 'rootTypeId2',
    label: 'test',
    dataSourceId: testDataSourceId,
    fields: [{
      id: 'childField2',
      label: 'test',
      typeIds: ['childTypeId2'],
      kind: 'scalar',
      dataSourceId: testDataSourceId,
    }],
  }] as Type[]))

  const dataTree = new DataTree(editor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    isConnected: () => true,
    getTypes: fn,
    getQueryables: () => [],
    getQuery: () => '',
    fetchValues: jest.fn(),
  }]})

  // Simple expression with relative child expression
  const expression1 = [
    testTokens.rootField1,
    {
      ...testTokens.filter,
      options: {
        childExpressionRelative: JSON.stringify([testTokens.childField1]),
      },
    } as Filter,
  ] as Expression
  const component = editor.getComponents().first()
  expect(() => dataTree.getTrees({expression: expression1, component}, testDataSourceId)).not.toThrow()
  expect(dataTree.getTrees({expression: expression1, component}, testDataSourceId))
    .toEqual([{
      token: testTokens.rootField1,
      children: [{
        token: testTokens.childField1,
        children: [],
      }],
    }])
  // More complex expression with absolute child expression
  const expression2: Expression = [{
    ...testTokens.rootField1,
  }, {
    ...testTokens.filter,
    options: {
      id: 1,
      childExpressionAbsolute: JSON.stringify([testTokens.rootField2, testTokens.childField2]),
      childExpressionRelative: JSON.stringify([testTokens.childField1]),
    },
  } as Filter,
  testTokens.childField3
  ]
  expect(() => dataTree.getTrees({expression: expression2, component}, testDataSourceId)).not.toThrow()
  expect(dataTree.getTrees({expression: expression2, component}, testDataSourceId))
    .toEqual([{
      token: testTokens.rootField1,
      children: [{
        token: testTokens.childField3,
        children: [],
      }],
    }, {
      token: testTokens.rootField1,
      children: [],
    }, {
      token: testTokens.rootField2,
      children: [{
        token: testTokens.childField2,
        children: [],
      }],
    }, {
      token: testTokens.rootField1,
      children: [{
        token: testTokens.childField1,
        children: [],
      }],
    }])
})

test('get types map', () => {
  const dataTree = new DataTree(editor, {
    filters: [],
    dataSources: [{
      id: testDataSourceId,
      connect: async () => {},
      isConnected: () => true,
      getTypes: () => simpleTypes,
      getQueryables: () => simpleTypes[0].fields,
      getQuery: () => '',
      fetchValues: jest.fn(),
    }],
  })
  const types = dataTree.getAllTypes()
  expect(types).toBeDefined()
  expect(types).toHaveLength(2)
  expect(types[0].id).toBe('testTypeId')
})

test('Get experessions used by a component', () => {
  const dataTree = new DataTree(editor, {
    filters: simpleFilters,
    dataSources: [{
      id: testDataSourceId,
      connect: async () => { },
      isConnected: () => true,
      getTypes: () => simpleTypes,
      getQueryables: () => simpleQueryables,
      getQuery: () => '',
      fetchValues: jest.fn(),
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
    dataSourceId: testDataSourceId,
  }] as Property[]
  ;(getStates as jest.Mock).mockReturnValue([{
    expression,
  }])
  expect(dataTree.getComponentExpressions(component)[0].expression).toBe(expression)
})

test('Get experessions used by a component and its children', () => {
  class DataTreeTest extends DataTree {
    getComponentExpressions = jest.fn(() => [])
  }
  const dataTree = new DataTreeTest(editor, {
    filters: [],
    dataSources: [],
  })
  dataTree.getComponentExpressionsRecursive(containerComponent)
  expect(dataTree.getComponentExpressions).toHaveBeenCalledTimes(2) // 1 per component
})

test('Get experessions used by a page', () => {
  class DataTreeTest extends DataTree {
    getComponentExpressionsRecursive = jest.fn(() => [])
  }
  const dataTree = new DataTreeTest(editor, {
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
  const dataTree = new DataTreeTest(editor, {
    filters: [],
    dataSources: [],
  })
  dataTree.getAllPagesExpressions()
  expect(dataTree.getPageExpressions).toHaveBeenCalledTimes(1) // 1 per page
})

test('get value with properties', () => {
  const dataTree = new DataTree(editor, {
    filters: [],
    dataSources: [{
      id: testDataSourceId,
      connect: async () => { },
      isConnected: () => true,
      getTypes: () => simpleTypes,
      getQueryables: () => simpleTypes[0].fields,
      getQuery: () => '',
      fetchValues: () => Promise.resolve({
        testFieldId1: {
          testFieldId2: 'test field',
        },
      }),
    }],
  })

  const anyData = Symbol('test')
  expect(dataTree.getValue([], containerComponent, false, anyData)).toBe(anyData)

  // 1 level deep value
  const property1 = {
    type: 'property',
    propType: 'field',
    typeIds: [],
    dataSourceId: testDataSourceId,
    fieldId: 'simpleFieldId',
    label: 'simple label',
    kind: 'scalar',
  } as Property
  const dataProperty1 = {
    simpleFieldId: 'test simpleFieldId',
  }
  expect(dataTree.getValue([property1], containerComponent, false, {})).toBeNull()
  const value = dataTree.getValue([property1], containerComponent, false, dataProperty1)
  expect(value).not.toBeNull()
  expect(value).toBe(dataProperty1.simpleFieldId)

  // 2 levels deep
  const property2 = {
    type: 'property',
    propType: 'field',
    typeIds: [],
    dataSourceId: testDataSourceId,
    fieldId: 'simpleFieldId2',
    label: 'simple label',
    kind: 'scalar',
  } as Property
  const dataProperty2 = {
    simpleFieldId: {
      simpleFieldId2: 'test simpleFieldId2'
    }
  }
  expect(dataTree.getValue([property1, property2], containerComponent, false, {})).toBeNull()
  const value2 = dataTree.getValue([property1, property2], containerComponent, false, dataProperty2)
  expect(value2).not.toBeNull()
  expect(value2).toBe(dataProperty2.simpleFieldId.simpleFieldId2)
})

test('get fixed value with filters', () => {
  const dataTree = new DataTree(editor, {
    filters: [{
      type: 'filter',
      id: 'identityFilter',
      label: 'Sample Filter',
      apply: value => `${value} modified`,
      validate: () => true,
      output: input => input,
      options: {},
    }],
    dataSources: [],
  })

  const fixed = {
    type: 'property',
    propType: 'field',
    typeIds: [],
    dataSourceId: testDataSourceId,
    fieldId: 'fixed',
    label: 'simple label',
    kind: 'scalar',
    options: {
      value: 'expected value',
    }
  } as Property

  const filter = {
    id: 'identityFilter',
    type: 'filter',
    options: {},
  } as StoredFilter

  expect(dataTree.getValue([fixed], containerComponent, false, {})).toBe('expected value')
  expect(dataTree.getValue([fixed, filter], containerComponent, false, {})).toBe('expected value modified')
})

test('get value with a state', () => {
  const dataTree = new DataTree(editor, {
    filters: [],
    dataSources: [],
  })

  const fixed = {
    expression: [{
      type: 'property',
      propType: 'field',
      typeIds: [],
      dataSourceId: testDataSourceId,
      fieldId: 'fixed',
      label: 'simple label',
      kind: 'scalar',
      options: {
        value: 'expected value',
      }
    }],
  }

  const firstComponentChild = containerComponent.components().first()
  const testPersistantId = 'testPersistantId'
  containerComponent.set('id-plugin-data-source', testPersistantId)
  const mockState = {
    expression: [{
      type: 'state',
      componentId: testPersistantId,
      exposed: true,
      storedStateId: 'storedStateId',
      label: 'test label',
    }] as State[],
  }

  // Use this state in the mock of getStates function
  //;(getStates as jest.Mock).mockReturnValue([mockState])
  ;(getState as jest.Mock).mockReturnValue(fixed)
  ;(getParentByPersistentId as jest.Mock).mockReturnValueOnce(containerComponent)

  const stateValue = dataTree.getValue(mockState.expression, firstComponentChild, false, {})
  expect(stateValue).toBe('expected value')
})

test('get __data with a state', () => {
  const dataTree = new DataTree(editor, {
    filters: [{
      type: 'filter',
      id: 'identityFilter',
      label: 'IDENTITY',
      apply: value => value,
      validate: () => true,
      output: input => input,
      options: {},
    }],
    dataSources: [],
  })

  const fixed = {
    expression: [{
      type: 'property',
      propType: 'field',
      typeIds: [],
      dataSourceId: testDataSourceId,
      fieldId: 'fixed',
      label: 'simple label',
      kind: 'scalar',
      options: {
        value: ['first value', 'other expeced value'],
      }
    }],
  }

  const firstComponentChild = containerComponent.components().first()
  const testPersistantId = 'testPersistantId'
  containerComponent.set('id-plugin-data-source', testPersistantId)
  const mockState = {
    expression: [{
      type: 'state',
      componentId: testPersistantId,
      exposed: true,
      storedStateId: '__data',
      label: 'test label',
    }] as State[],
  }

  // Use this state in the mock of getStates function
  ;(getState as jest.Mock).mockReturnValue(fixed)
  ;(getParentByPersistentId as jest.Mock).mockReturnValueOnce(containerComponent)

  const stateValue = dataTree.getValue(mockState.expression, firstComponentChild, true, {})
  expect(stateValue).toEqual(fixed.expression[0].options.value)
})

test('get `__data[previewIndex].something` with a state', () => {
  const dataTree = new DataTree(editor, {
    filters: [{
      type: 'filter',
      id: 'identityFilter',
      label: 'IDENTITY',
      apply: value => value,
      validate: () => true,
      output: input => input,
      options: {},
    }],
    dataSources: [],
  })

  const fixed = {
    expression: [{
      type: 'property',
      propType: 'field',
      typeIds: [],
      dataSourceId: testDataSourceId,
      fieldId: 'fixed',
      label: 'simple label',
      kind: 'scalar',
      options: {
        value: ['first value', 'other expeced value'],
      }
    }],
  }

  const firstComponentChild = containerComponent.components().first()
  const testPersistantId = 'testPersistantId'
  containerComponent.set('id-plugin-data-source', testPersistantId)
  const mockState = {
    expression: [{
      type: 'state',
      componentId: testPersistantId,
      exposed: true,
      storedStateId: '__data',
      label: 'test label',
    }, { // We need a second token, otherwise it returns the object
      id: 'identityFilter',
      type: 'filter',
      options: {},
      previewIndex: 0,
    }] as State[],
  }

  // Use this state in the mock of getStates function
  ;(getState as jest.Mock).mockReturnValue(fixed)
  ;(getParentByPersistentId as jest.Mock).mockReturnValueOnce(containerComponent)

  const stateValue = dataTree.getValue(mockState.expression, firstComponentChild, true, {})
  expect(stateValue).toBe(fixed.expression[0].options.value[0])
  return

  const fixed2 = {
    expression: [{
      type: 'property',
      propType: 'field',
      typeIds: [],
      dataSourceId: testDataSourceId,
      fieldId: 'fixed',
      label: 'simple label',
      kind: 'scalar',
      previewIndex: 1,
      options: {
        value: ['first value', 'other expeced value'],
      }
    }],
  }

  const mockState2 = {
    expression: [{
      type: 'state',
      componentId: testPersistantId,
      exposed: true,
      storedStateId: '__data',
      label: 'test label',
    }, { // We need a second token, otherwise it returns the object
      id: 'identityFilter',
      type: 'filter',
      options: {},
    }] as State[],
  }

  // Use this state in the mock of getStates function
  ;(getState as jest.Mock).mockReturnValue(fixed2)
  ;(getParentByPersistentId as jest.Mock).mockReturnValueOnce(containerComponent)

  const stateValue2 = dataTree.getValue(mockState2.expression, firstComponentChild, true, {})
  expect(stateValue2).toBe(fixed.expression[0].options.value[1])
})

// test('get `__data[previewIndex].__data[otherPreviewIndex]` with a state', () => {
//   const dataTree = new DataTree(editor, {
//     filters: [{
//       type: 'filter',
//       id: 'identityFilter',
//       label: 'IDENTITY',
//       apply: value => value,
//       validate: () => true,
//       output: input => input,
//       options: {},
//     }],
//     dataSources: [{
//       id: testDataSourceId,
//       connect: async () => { },
//       isConnected: () => true,
//       getTypes: () => simpleTypes,
//       getQueryables: () => simpleQueryables,
//       getQuery: () => '',
//       fetchValues: () => Promise.resolve({
//         testFieldId1: {
//           testFieldId2: 'test field',
//           testFieldIdArray: ['item1', 'item2'],
//         },
//       }),
//     }],
//   })
//
//   const simpleExpression: Context = [
//     {
//       type: 'property',
//       propType: 'field',
//       typeIds: [],
//       dataSourceId: testDataSourceId,
//       fieldId: 'testFieldId1',
//       label: 'field label 1',
//       kind: 'object',
//     }, {
//       type: 'property',
//       propType: 'field',
//       fieldId: 'testFieldIdArray',
//       typeIds: [],
//       dataSourceId: testDataSourceId,
//       label: 'field array',
//       kind: 'scalar',
//     }
//   ]
//
//   const childComponent = containerComponent.components().first()
//   const PERSISTANT_ID_CHILD = 'testPersistantId2'
//   childComponent.set('id-plugin-data-source', PERSISTANT_ID_CHILD)
//
//   const mockState0 = {
//     expression: [{
//       type: 'state',
//       componentId: PERSISTANT_ID_CHILD,
//       exposed: true,
//       storedStateId: '__data',
//       label: 'test label',
//     }, { // We need a second token, otherwise it returns the object
//       id: 'identityFilter',
//       type: 'filter',
//       options: {},
//     }] as State[],
//   }
//
//   const PERSISTANT_ID_CONTAINER = 'testPersistantId'
//   containerComponent.set('id-plugin-data-source', PERSISTANT_ID_CONTAINER)
//
//   const mockState1 = {
//     expression: [{
//       type: 'state',
//       componentId: PERSISTANT_ID_CONTAINER,
//       exposed: true,
//       storedStateId: '__data',
//       label: 'test label',
//     }, { // We need a second token, otherwise it returns the object
//       id: 'identityFilter',
//       type: 'filter',
//       options: {},
//     }] as State[],
//   }
//
//   // Use this state in the mock of getStates function
//   ;(getState as jest.Mock).mockReturnValueOnce(mockState0)
//   ;(getState as jest.Mock).mockReturnValueOnce(mockState1)
//   ;(getParentByPersistentId as jest.Mock).mockReturnValueOnce(containerComponent)
//
//   const stateValue = dataTree.getValue(simpleExpression, childComponent, false, {})
//   expect(stateValue).toBe('item1')
// })

test('get value from GraphQL inline fragments (flatData.modules.item)', () => {
  const testDataSourceId = 'squidex'

  // Mock data similar to the example.graphql.json structure
  const mockData = {
    queryPageContents: [{
      flatData: {
        modules: [
          {
            __typename: 'PageDataModulesChildDto',
            item: {
              __typename: 'HeroWordSliderComponent',
              type: 'hero-word-slider',
              before: 'If you are looking for:',
              words: [
                { __typename: 'HeroWordSliderDataWordsChildDto', word: '100% free website builder' },
                { __typename: 'HeroWordSliderDataWordsChildDto', word: 'no-code solution' }
              ],
              after: 'You are in the right place!',
              cTAUrl: 'https://example.com',
              cTALabel: 'Start now!'
            }
          },
          {
            __typename: 'PageDataModulesChildDto',
            item: {
              __typename: 'SimpleHeroComponent',
              type: 'simple-hero',
              text: '<h1>Welcome</h1>',
              cTAUrl: 'https://example.com/welcome',
              cTALabel: 'Get started'
            }
          }
        ]
      }
    }]
  }

  const dataTree = new DataTree(editor, {
    filters: [{
      type: 'filter',
      id: 'first',
      label: 'first',
      validate: () => true,
      output: (field: Field | null) => field,
      apply: (arr: unknown) => Array.isArray(arr) ? arr[0] : arr,
      options: {},
    }],
    dataSources: [{
      id: testDataSourceId,
      connect: async () => {},
      isConnected: () => true,
      getTypes: () => ([]),
      getQueryables: () => ([]),
      getQuery: () => '',
      fetchValues: () => Promise.resolve(mockData),
    }]
  })

  // Set the query result to simulate fetched data
  dataTree.queryResult[testDataSourceId] = mockData

  // Test accessing the first item's before text
  const beforeExpression = [
    {
      type: 'property',
      propType: 'field',
      fieldId: 'queryPageContents',
      label: 'queryPageContents',
      typeIds: ['Page'],
      dataSourceId: testDataSourceId,
      kind: 'list'
    },
    {
      type: 'filter',
      id: 'first',
      label: 'first',
      options: {}
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'flatData',
      label: 'flatData',
      typeIds: ['PageFlatDataDto'],
      dataSourceId: testDataSourceId,
      kind: 'object'
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'modules',
      label: 'modules',
      typeIds: ['PageDataModulesChildDto'],
      dataSourceId: testDataSourceId,
      kind: 'list'
    },
    {
      type: 'filter',
      id: 'first',
      label: 'first',
      options: {}
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'item',
      label: 'item',
      typeIds: ['HeroWordSliderComponent'],
      dataSourceId: testDataSourceId,
      kind: 'object'
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'before',
      label: 'before',
      typeIds: ['String'],
      dataSourceId: testDataSourceId,
      kind: 'scalar'
    }
  ] as Token[]

  const result = dataTree.getValue(beforeExpression, containerComponent, false)
  expect(result).toBe('If you are looking for:')

  // Test accessing words array
  const wordsExpression = [
    {
      type: 'property',
      propType: 'field',
      fieldId: 'queryPageContents',
      label: 'queryPageContents',
      typeIds: ['Page'],
      dataSourceId: testDataSourceId,
      kind: 'list'
    },
    {
      type: 'filter',
      id: 'first',
      label: 'first',
      options: {}
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'flatData',
      label: 'flatData',
      typeIds: ['PageFlatDataDto'],
      dataSourceId: testDataSourceId,
      kind: 'object'
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'modules',
      label: 'modules',
      typeIds: ['PageDataModulesChildDto'],
      dataSourceId: testDataSourceId,
      kind: 'list'
    },
    {
      type: 'filter',
      id: 'first',
      label: 'first',
      options: {}
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'item',
      label: 'item',
      typeIds: ['HeroWordSliderComponent'],
      dataSourceId: testDataSourceId,
      kind: 'object'
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'words',
      label: 'words',
      typeIds: ['HeroWordSliderDataWordsChildDto'],
      dataSourceId: testDataSourceId,
      kind: 'list'
    },
    {
      type: 'filter',
      id: 'first',
      label: 'first',
      options: {}
    },
    {
      type: 'property',
      propType: 'field',
      fieldId: 'word',
      label: 'word',
      typeIds: ['String'],
      dataSourceId: testDataSourceId,
      kind: 'scalar'
    }
  ] as Token[]

  const wordsResult = dataTree.getValue(wordsExpression, containerComponent, false)
  expect(wordsResult).toBe('100% free website builder')
})

// test('test', () => {
//   // Mocks
//   const testDataSourceId = 'source1'
//   const containerData = [
//     {
//       __data: [
//         { value: 'expected result' },
//         { value: 'not this one' },
//       ],
//     },
//     { __data: [] },
//   ]
//
//   const dataTree = new DataTree(editor, {
//     filters: [],
//     dataSources: [{
//       id: testDataSourceId,
//       connect: async () => {},
//       isConnected: () => true,
//       getTypes: () => ({}),
//       getQueryables: () => ({}),
//       getQuery: () => '',
//       fetchValues: () => Promise.resolve(containerData),
//     }]
//   })
//
//   // Simulate 2 nested __data states: __data[0] → __data[0] → value
//   const outerState: State = {
//     type: 'state',
//     componentId: 'container',
//     exposed: true,
//     storedStateId: '__data',
//     previewIndex: 0,
//     label: 'outer',
//   }
//
//   const innerState: State = {
//     type: 'state',
//     componentId: 'child',
//     exposed: true,
//     storedStateId: '__data',
//     previewIndex: 0,
//     label: 'inner',
//   }
//
//   // Inject resolveState to manually resolve to each other
//   dataTree.resolveState = (state, component) => {
//     if (state.componentId === 'child') return [outerState]
//     if (state.componentId === 'container') return []
//     return null
//   }
//
//   // Expression to resolve: __data (child) → __data (container) → value
//   const expr: Context = [
//     innerState,
//     { type: 'property', propType: 'field', fieldId: 'value', dataSourceId: testDataSourceId, label: 'val', kind: 'scalar' } as Token,
//   ]
//
//   const result = dataTree.getValue(expr, containerComponent, {} as unknown)
//   expect(result).toBe('expected result')
// })
