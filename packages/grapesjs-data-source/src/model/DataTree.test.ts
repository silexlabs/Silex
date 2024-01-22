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
import { Type, Filter, Property, Expression, Tree } from '../types'
import { DataSourceEditor } from '..'
import { getState, getStateIds } from './state'
import { simpleFilters, simpleQueryables, simpleTypes, testDataSourceId, testTokens } from '../test-data'

// Mock only getState
jest.mock('./state', () => ({
  ...jest.requireActual('./state'),
  getState: jest.fn(),
  getStateIds: jest.fn(),
  getOrCreatePersistantId: jest.fn(),
  getParentByPersistentId: jest.fn(),
}))

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

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
    id: testDataSourceId,
    connect: async () => {},
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
  }]})

  // Type not found
  expect(() => dataTree.getType('unknown', null)).toThrow()

  // Type found
  const type = dataTree.getType('testTypeId', null)
  expect(type).not.toBeNull()
  expect(type?.id).toBe('testTypeId')

  // With data source id
  expect(dataTree.getType('testTypeId', testDataSourceId)).not.toBeNull()
  expect(() => dataTree.getType('testTypeId', 'unknown')).toThrow()
})

test('Expressions to tree', () => {
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: []})
  const expression: Expression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: testDataSourceId,
  }]
  expect(dataTree.getTrees(expression, testDataSourceId))
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
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {filters: [], dataSources: []})
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
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {filters: [], dataSources: []})
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
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
  }]})
  // Make sure it treats them all as relative
  dataTree.isRelative = () => true
  const result = dataTree.getTrees([...queryObjects], testDataSourceId)
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
    "token": {
      "type": "property",
      "propType": "field",
      "typeIds": [],
      "label": "test field name",
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object"
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId1",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId"
        },
        "children": []
      }
    ],
  }, {
    "token": {
      "type": "property",
      "propType": "field",
      "typeIds": [],
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object"
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId1",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId",
          "options": {
            "test": undefined,
            "test2": "",
          },
        },
        "children": []
      }
    ],
  }] as Tree[]
  class DataTreeTest extends DataTree {
    public mergeTrees(tree1: Tree, tree2: Tree): Tree {
      return super.mergeTrees(tree1, tree2)
    }
  }
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    getTypes: () => simpleTypes,
    getQueryables: () => simpleTypes[0].fields,
    getQuery: () => '',
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
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {filters: [], dataSources: []})
  expect(() => dataTree.mergeTrees({
    "token": {
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object",
      "typeIds": [],
      "type": "property",
      "propType": "field",
      "label": "test field name",
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId1",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId"
        },
        "children": []
      }
    ]
  }, {
    "token": {
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object",
      "typeIds": [],
      "type": "property",
      "propType": "field",
      "label": "test field name",
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId1",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId",
          "options": {
            "id": "option"
          }
        },
        "children": []
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
  const dataTree = new DataTreeTest(editor as DataSourceEditor, {filters: [], dataSources: []})
  const tree = dataTree.mergeTrees({
    "token": {
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object",
      "typeIds": [],
      "type": "property",
      "propType": "field",
      "label": "test field name",
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId1",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId"
        },
        "children": []
      }
    ]
  }, {
    "token": {
      "dataSourceId": "testDataSourceId",
      "fieldId": "query",
      "kind": "object",
      "typeIds": [],
      "type": "property",
      "propType": "field",
      "label": "test field name",
    },
    "children": [
      {
        "token": {
          "type": "property",
          "propType": "field",
          "fieldId": "testFieldId2",
          "label": "test field name",
          "typeIds": [
            "testTypeId"
          ],
          "kind": "object",
          "dataSourceId": "testDataSourceId"
        },
        "children": []
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
  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
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

  const dataTree = new DataTree(editor as DataSourceEditor, {filters: [], dataSources: [{
    id: testDataSourceId,
    connect: async () => {},
    getTypes: fn,
    getQueryables: () => [],
    getQuery: () => '',
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
  expect(() => dataTree.getTrees(expression1, testDataSourceId)).not.toThrow()
  expect(dataTree.getTrees(expression1, testDataSourceId))
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
  expect(() => dataTree.getTrees(expression2, testDataSourceId)).not.toThrow()
  expect(dataTree.getTrees(expression2, testDataSourceId))
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
  const dataTree = new DataTree(editor as DataSourceEditor, {
    filters: [],
    dataSources: [{
      id: testDataSourceId,
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

// TODO: Value tests
// const simpleExpression: Context = [
//   {
//     type: 'property',
//     propType: 'type',
//     typeId: 'testTypeId',
//     dataSourceId: DataSourceId,
//   }, {
//     type: 'property',
//     propType: 'field',
//     fieldId: 'testFieldId',
//     typeId: 'testTypeId',
//     dataSourceId: DataSourceId,
//   }
// ]
// test('get value with simple context', () => {
//   const dataTree = new DataTree({
//     filters: [],
//     dataSources: [{
//       id: DataSourceId,
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
//     dataSourceId: DataSourceId,
//   }])
//   expect(value).not.toBeNull()
//   // TODO: test value
// 
//   // 2 levels value
//   const value2 = dataTree.getValue(simpleExpression, [{
//     type: 'property',
//     propType: 'type',
//     typeId: 'testTypeId',
//     dataSourceId: DataSourceId,
//   }, {
//     type: 'property',
//     propType: 'field',
//     fieldId: 'testFieldId',
//     typeId: 'testTypeId',
//     dataSourceId: DataSourceId,
//   }])
//   expect(value2).not.toBeNull()
//   // TODO: test value
// })

test('Get experessions used by a component', () => {
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
  const expression = [{
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: testDataSourceId,
    }] as Property[]
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
