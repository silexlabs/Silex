import GraphQL, { GQLField, GQLType, GQLKind, GraphQLOptions, GQLOfType, Tree } from './GraphQL'
import { directusTestSchema, simpleSchema, strapiSchema} from '../../__mocks__/graphql-mocks'
import { Expression, Field, Filter, Token, Type } from '../types'
import dedent from 'dedent-js'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

const bearerToken = process.env.BEARER ?? ''

const options: GraphQLOptions = {
  id: 'testDataSourceId',
  type: 'graphql',
  label: 'GraphQL',
  url: `https://sandbox.internet2000.net/cms/graphql?access_token=${bearerToken}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + bearerToken,
  },
  //queryable: ['posts', 'Contact', 'test'],
}

async function importDataSource(datas?: unknown[]) {
  if (datas?.length) {
    global.fetch = jest.fn()
    datas?.forEach(data => {
      global.fetch = (global.fetch as jest.Mock)
      .mockImplementationOnce(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        })
      })
    })
  }
  // @ts-ignore
  return (await import('./GraphQL')).default.default // Why default.default?
}

class GQLTest extends GraphQL {
  graphQLToField(field: GQLField): Field {
    return super.graphQLToField(field)
  }

  graphQLToType(allTypes: string[], type: GQLType, kind: GQLKind, queryable: boolean): Type {
    return super.graphQLToType(allTypes, type, kind, queryable)
  }

  getOfTypeProp<T>(prop: string, type: GQLOfType, defaultValue?: T): T {
    return super.getOfTypeProp(prop, type, defaultValue)
  }

  getTrees(expression: Expression): Tree[] {
    return super.getTrees(expression)
  }

  mergeTrees(tree1: Tree, tree2: Tree): Tree {
    return super.mergeTrees(tree1, tree2)
  }

  buildQuery(...args: any[]): string {
    /* @ts-ignore */
    return super.buildQuery(...args)
  }
}

beforeEach(async () => {
  jest.resetAllMocks()
})

test('getTypeProp', async () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  expect(gql.getOfTypeProp('kind', {kind: 'SCALAR'})).toBe('SCALAR')
  expect(gql.getOfTypeProp('kind', {kind: 'NON_NULL', ofType: {kind: 'SCALAR'}})).toBe('SCALAR')
  expect(gql.getOfTypeProp('kind', {kind: 'NON_NULL', ofType: {kind: 'LIST', ofType: {kind: 'SCALAR'}}})).toBe('SCALAR')
  expect(gql.getOfTypeProp('kind', {kind: 'NON_NULL', ofType: {kind: 'LIST', ofType: {kind: 'NON_NULL', ofType: {kind: 'SCALAR'}}}})).toBe('SCALAR')
  expect(gql.getOfTypeProp('kind', {kind: 'NON_NULL', ofType: {kind: 'LIST', ofType: {kind: 'NON_NULL', ofType: {kind: 'LIST', ofType: {kind: 'SCALAR'}}}}})).toBe('SCALAR')

  const testType: GQLType = {
    "name": "PostEntityResponseCollection",
    "fields": [
      {
        "name": "data",
        "type": {
          "kind": "NON_NULL",
          "ofType": {
            "kind": "LIST",
            "ofType": {
              "kind": "NON_NULL",
              "ofType": {
                "name": "PostEntity",
                "kind": "OBJECT"
              }
            }
          }
        }
      }
    ]
  }
  expect(testType.fields[0].type).not.toBeUndefined()
  expect(gql.getOfTypeProp('name', testType.fields[0].type)).toBe('PostEntity')
})

test('graphQLToType', async () => {
  const testType: GQLType = {
    "name": "PostEntityResponseCollection",
    "fields": [
      {
        "name": "data",
        "type": {
          "kind": "NON_NULL",
          "ofType": {
            "kind": "LIST",
            "ofType": {
              "kind": "NON_NULL",
              "ofType": {
                "name": "PostEntity",
                "kind": "OBJECT"
              }
            }
          }
        }
      }
    ]
  }

  const allTypes = ['PostEntityResponseCollection', 'PostEntity']

  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: () => true,
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  
  const result = gql.graphQLToType(allTypes, testType, 'SCALAR', false)
  expect(result).not.toBeUndefined()
  expect(result.label).toBe('PostEntityResponseCollection')
  expect(result.id).toBe('PostEntityResponseCollection')
  expect(result.fields).not.toBeUndefined()
  expect(result.fields).toHaveLength(1)
  expect(result.fields).toContainEqual({
    id: 'data',
    label: 'data',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  })
})

test('graphQLToField', async () => {
  const testField: GQLField = {
    "name": "posts",
    "type": {
      "name": "PostEntityResponseCollection",
      "kind": "OBJECT" as GQLKind,
    },
  }

  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })

  const result = gql.graphQLToField(testField)
  expect(result).not.toBeUndefined()
  expect(result.id).toBe('posts')
  expect(result.label).toBe('posts')
  expect(result.typeIds).toEqual(['PostEntityResponseCollection'])
})

test('connect', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  await new Promise(resolve => setTimeout(resolve, 100))
})

test('getTypes simple mocks', async () => {
  const GraphQLDataSource = (await importDataSource([simpleSchema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const types = await dataSource.getTypes()
  expect(types).not.toBeUndefined()
  expect(types!.length).toBeGreaterThan(5)
  const postsType: Type = types!.find((type: Type) => type.id === 'posts')!
  expect(postsType).not.toBeUndefined()
  expect(postsType.id).toBe('posts')
  expect(postsType.label).toBe('posts')
  expect(postsType.fields).not.toBeUndefined()
  expect(postsType.fields).toContainEqual({
    id: 'data', label: 'data', typeIds: ['PostEntity'], kind: 'list', dataSourceId: 'testDataSourceId'
  })
})

test('getTypes directus', async () => {
  const GraphQLDataSource = (await importDataSource([directusTestSchema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const types = await dataSource.getTypes()
  expect(types).not.toBeUndefined()
  expect(types!.length).toBeGreaterThan(10)
  const contactType: Type = types!.find((prop: Type) => prop.id === 'Contact')!
  expect(contactType).not.toBeUndefined()
  expect(contactType.id).toBe('Contact')
  expect(contactType.label).toBe('Contact')
  expect(contactType.fields).not.toBeUndefined()
  expect(contactType.fields).toContainEqual({id: 'id', label: 'id', typeIds: ['ID'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
  const testType: Type | undefined = types!.find((prop: Type) => prop.id === 'test')
  expect(testType).not.toBeUndefined()
  expect(testType!.fields).not.toBeUndefined()
  const testO2MField: Field | undefined = testType!.fields!.find(field => field.id === 'test_o2m')
  expect(testO2MField).not.toBeUndefined()
  expect((testO2MField as unknown as GQLType).fields).toBeUndefined()
  const testO2MType: Type | undefined = types!.find((t: Type) => testO2MField!.typeIds.includes(t.id))
  expect(testO2MType).not.toBeUndefined()
  expect(testO2MType!.id).toBe('test_o2m')
  expect(testO2MType!.fields).not.toBeUndefined()
  expect(testO2MType!.fields).toContainEqual({id: 'id', label: 'id', typeIds: ['ID'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
  expect(testO2MType!.fields).toContainEqual({id: 'label', label: 'label', typeIds: ['String'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
})

test('getTypes strapi', async () => {
  const GraphQLDataSource = (await importDataSource([strapiSchema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const types = await dataSource.getTypes()
  expect(types).not.toBeUndefined()
  expect(types!.length).toBeGreaterThan(10)
  const postsType: Type = types!.find((type: Type) => type.id === 'posts')!
  expect(postsType).not.toBeUndefined()
  expect(postsType.id).toBe('posts')
  expect(postsType.label).toBe('posts')
  expect(postsType.fields).not.toBeUndefined()
  const dataField = postsType.fields!.find(field => field.id === 'data')
  expect(dataField).not.toBeUndefined()
  expect(dataField!.label).toBe('data')
  expect(dataField!.kind).toBe('list')
})

test('getQueryables strapi', async () => {
  const GraphQLDataSource = (await importDataSource([strapiSchema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const queryables = await dataSource.getQueryables()
  const post: Field = queryables!.find((field: Field) => field.id === 'post')!
  expect(post).not.toBeUndefined()
  expect(post.id).toBe('post')
  expect(post.label).toBe('post')
  expect(post.arguments).not.toBeUndefined()
  expect(post.arguments).toHaveLength(1)
  expect(post.arguments![0].name).toBe('id')
})

test('build query from tree', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const tree: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: 'testDataSourceId',
      },
      children: [],
    }],
  }
  const query = gql.buildQuery(tree)
  expect(query)
    .toEqual(`testFieldId {
  __typename
  testFieldPropertyId
}`)
})

test('build query with fragments', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const tree: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'parentFieldId',
      label: 'test parent name',
      typeIds: ['testParentId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId1'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID1',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId1'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
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
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID2',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId2'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
        },
        children: [],
      }],
    }],
  }
  const query = gql.buildQuery(tree)
  expect(query)
    .toEqual(dedent`
    parentFieldId {
      __typename
    testFieldId {
      ...on testTypeId1 {
        __typename
        ONLY_TEST_TYPE_ID1
      }
      ...on testTypeId2 {
        __typename
        ONLY_TEST_TYPE_ID2
      }
    }
    }`)
})

test('merge trees', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const tree1: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: 'testDataSourceId',
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
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldPropertyId',
        label: 'test field property name',
        typeIds: ['testFieldPropertyTypeId'],
        kind: 'scalar',
        dataSourceId: 'testDataSourceId',
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
        dataSourceId: 'testDataSourceId',
      },
      children: [],
    }],
  }
  expect(gql.mergeTrees(tree1, tree2))
    .toEqual({
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldPropertyId2',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
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
          dataSourceId: 'testDataSourceId',
        },
        children: [],
      }],
    })
})

test('merge trees with multiple possible types', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const tree1: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'parentFieldId',
      label: 'test parent name',
      typeIds: ['testParentId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId1'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID1',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId1'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
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
      dataSourceId: 'testDataSourceId',
    },
    children: [{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId2'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'ONLY_TEST_TYPE_ID2',
          label: 'test field property name',
          typeIds: ['testFieldPropertyTypeId2'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
        },
        children: [],
      }],
    }],
  }
  expect(gql.mergeTrees(tree1, tree2))
    .toEqual({
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'parentFieldId',
        label: 'test parent name',
        typeIds: ['testParentId'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [{
        token: {
          type: 'property',
          propType: 'field',
          fieldId: 'testFieldId',
          label: 'test field name',
          typeIds: ['testTypeId1'],
          kind: 'object',
          dataSourceId: 'testDataSourceId',
        },
        children: [{
          token: {
            type: 'property',
            propType: 'field',
            fieldId: 'ONLY_TEST_TYPE_ID1',
            label: 'test field property name',
            typeIds: ['testFieldPropertyTypeId1'],
            kind: 'scalar',
            dataSourceId: 'testDataSourceId',
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
          dataSourceId: 'testDataSourceId',
        },
        children: [{
          token: {
            type: 'property',
            propType: 'field',
            fieldId: 'ONLY_TEST_TYPE_ID2',
            label: 'test field property name',
            typeIds: ['testFieldPropertyTypeId2'],
            kind: 'scalar',
            dataSourceId: 'testDataSourceId',
          },
          children: [],
        }],
      }]
    })
})

test('get tree', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const expression: Expression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }]
  expect(gql.getTrees(expression))
    .toEqual([{
      token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId',
        label: 'test field name',
        typeIds: ['testTypeId'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
      },
      children: [],
    }])
})

test('get tree with filters', async () => {
  const queryObjects: Expression = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testId1',
    label: 'test field name',
    typeIds: ['PostEntityResponseCollection'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
    quotedOptions: [],
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'data',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
    quotedOptions: [],
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'id',
    label: 'test field name',
    typeIds: ['ID'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }]
  const GQL = await importDataSource([simpleSchema])
  const gql = new GQL({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  await gql.connect()
  expect(gql.getTrees([...queryObjects]))
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

const tokens: Record<string, Token> = {
  rootField1: {
    type: 'property',
    propType: 'field',
    fieldId: 'rootField1',
    label: 'test',
    typeIds: ['rootTypeId1'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  },
  filter: {
    type: 'filter',
    id: 'filterId',
    label: 'filter name',
    validate: () => true,
    output: () => null,
    apply: () => null,
    options: {},
    quotedOptions: [],
  },
  rootField2: {
    type: 'property',
    propType: 'field',
    fieldId: 'rootField2',
    label: 'test',
    typeIds: ['rootTypeId2'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  },
  childField1: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField1',
    label: 'test',
    typeIds: ['childTypeId1'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
  childField2: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField2',
    label: 'test',
    typeIds: ['childTypeId2'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
  childField3: {
    type: 'property',
    propType: 'field',
    fieldId: 'childField3',
    label: 'test',
    typeIds: ['childTypeId3'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  },
}

// test('get query with options', () => {
//   const fn = jest.fn(expression => ([{
//     token: tokens.rootField1,
//     children: [],
//   }] as Tree[]))
//   class GQLTestQuery extends GraphQL {
//     getTrees(expression: Expression): Tree[] {
//       return fn(expression)
//     }
//   }
//   const gql = new GQLTestQuery({
//     url: 'http://localhost',
//     method: 'POST',
//     headers: {},
//     queryable: [],
//     id: 'testDataSourceId',
//     label: 'test',
//     type: 'graphql',
//   })
//   const expression: Expression = [{
//       ...tokens.rootField1,
//     }, {
//       ...tokens.filter,
//       options: {
//         id: 1,
//         childExpressionAbsolute: JSON.stringify([tokens.rootField2, tokens.childField2]),
//         childExpressionRelative: JSON.stringify([tokens.childField1]),
//       },
//     } as Filter,
//     tokens.childField3
//   ]
//   expect(() => gql.getQuery([expression])).not.toThrow()
//   fn.mockClear()
//   gql.getQuery([expression])
//   expect(fn).toHaveBeenCalledTimes(1)
//   expect(fn).toHaveBeenCalledWith(
//     [{
//       token: tokens.rootField1,
//       children: [{
//         token: tokens.childField3,
//         children: [],
//       }],
//     }, {
//       token: tokens.rootField1,
//       children: [{
//         token: tokens.childField1,
//         children: [],
//       }],
//     }, {
//       token: tokens.rootField2,
//       children: [{
//         token: tokens.childField2,
//         children: [],
//       }],
//     }]
//   )
// })

test('get tree with options', () => {
  const fn = jest.fn(() => ([{
    id: 'rootTypeId1',
    label: 'test',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'childField1',
      label: 'test',
      typeIds: ['childTypeId1'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }, {
      id: 'childField3',
      label: 'test',
      typeIds: ['childTypeId3'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }, {
    id: 'rootTypeId2',
    label: 'test',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'childField2',
      label: 'test',
      typeIds: ['childTypeId2'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }] as Type[]))
  class GQLTestTrees extends GraphQL {
    getTypes(): Type[] {
      return fn()
    }
    getTrees(expression: Expression): Tree[] {
      return super.getTrees(expression)
    }
  }
  const gql = new GQLTestTrees({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })

  // Simple expression with relative child expression
  const expression1 = [
    tokens.rootField1,
    {
      ...tokens.filter,
      options: {
        childExpressionRelative: JSON.stringify([tokens.childField1]),
      },
    } as Filter,
  ] as Expression
  expect(() => gql.getTrees(expression1)).not.toThrow()
  expect(gql.getTrees(expression1))
  .toEqual([{
    token: tokens.rootField1,
    children: [{
      token: tokens.childField1,
      children: [],
    }],
  }])
  // More complex expression with absolute child expression
  const expression2: Expression = [{
      ...tokens.rootField1,
    }, {
      ...tokens.filter,
      options: {
        id: 1,
        childExpressionAbsolute: JSON.stringify([tokens.rootField2, tokens.childField2]),
        childExpressionRelative: JSON.stringify([tokens.childField1]),
      },
    } as Filter,
    tokens.childField3
  ]
  expect(() => gql.getTrees(expression2)).not.toThrow()
  expect(gql.getTrees(expression2))
  .toEqual([{
    token: tokens.rootField1,
    children: [{
      token: tokens.childField3,
      children: [],
    }],
  }, {
    token: tokens.rootField1,
    children: [],
  }, {
    token: tokens.rootField2,
    children: [{
      token: tokens.childField2,
      children: [],
    }],
  }, {
    token: tokens.rootField1,
    children: [{
      token: tokens.childField1,
      children: [],
    }],
  }])
})

test('Get query from 1 expression', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const query = await dataSource.getQuery([[{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'test',
    label: 'test field property name',
    typeIds: ['String'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }]])
  expect(query).not.toBeUndefined()
  expect(query).toEqual(`query {
  __typename
  testFieldId {
    __typename
    test
  }
}`)
})

test('Get query from multiple expressions', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const query = await dataSource.getQuery([[{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'test',
    label: 'test field property name',
    typeIds: ['String'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'attributes',
    label: 'test field property name',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'test',
    label: 'test field property name',
    typeIds: ['String'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }]])
  expect(query).not.toBeUndefined()
  expect(query).toEqual(`query {
  __typename
  testFieldId {
    __typename
    test
    attributes {
      __typename
      test
    }
  }
}`)
})

test('Get query from multiple expressions', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const query = await dataSource.getQuery([[{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'test',
    label: 'test field property name',
    typeIds: ['String'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'id',
    label: 'test field property name',
    typeIds: ['ID'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId2',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'attributes',
    label: 'test field property name',
    typeIds: ['PostEntity'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }]])
  expect(query).not.toBeUndefined()
  expect(query).toEqual(`query {
  __typename
  testFieldId1 {
    __typename
    test
    id
  }
  testFieldId2 {
    __typename
    attributes
  }
}`)
})

test('Get query from expression with filters', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  const buildQuery = jest.fn(() => 'testQuery')
  dataSource.buildQuery = buildQuery
  await dataSource.connect()
  const queryObjects = [{
    type: 'property',
    propType: 'field',
    fieldId: 'testId1',
    label: 'test field name',
    typeIds: ['PostEntityResponseCollection'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
    quotedOptions: [],
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'data',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
  }, {
    type: 'filter',
    id: 'testFilterId1',
    label: 'test filter name',
    options: {},
    quotedOptions: [],
  }, {
    type: 'property',
    propType: 'field',
    fieldId: 'id',
    label: 'test field name',
    typeIds: ['ID'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
  }]
  await dataSource.getQuery([[...queryObjects]])
  expect(buildQuery).toHaveBeenCalledTimes(1)
  expect(buildQuery).toHaveBeenCalledWith({
    token: {
      dataSourceId: 'testDataSourceId',
      fieldId: 'query',
      kind: 'object'
    },
    children: [
      { token: queryObjects[0], children: [
        { token: queryObjects[2], children: [
          { token: queryObjects[4], children: [] }
        ]},
      ]},
    ]
  })
})

test('Get query with options', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const query = await dataSource.getQuery([[{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {id: 1},
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {id: 1},
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId2',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {name: 'test'},
  }], [{
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId3',
    label: 'test field name',
    typeIds: ['testTypeId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }]])
  expect(query).not.toBeUndefined()
  expect(query).toEqual(`query {
  __typename
  testFieldId1(id: 1) {
    __typename

  }
  testFieldId2(name: "test") {
    __typename

  }
  testFieldId3 {
    __typename

  }
}`)
})

test('Get query with property options', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  dataSource.buildQuery = jest.fn(() => 'testQuery')
  await dataSource.connect()
  await dataSource.getQuery([[{
    // LEVEL 1
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {id: 'option'},
  }, {
    // LEVEL 2
    type: 'property',
    propType: 'field',
    fieldId: 'test',
    label: 'test field property name',
    typeIds: ['String'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
    options: {prop: 'option1'},
  }], [{
    // LEVEL 1
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {id: 'option'},
  }, {
    // LEVEL 2
    type: 'property',
    propType: 'field',
    fieldId: 'id',
    label: 'test field property name',
    typeIds: ['ID'],
    kind: 'scalar',
    dataSourceId: 'testDataSourceId',
    options: {},
  }], [{
    // LEVEL 1
    type: 'property',
    propType: 'field',
    fieldId: 'testFieldId1',
    label: 'test field name',
    typeIds: ['PostEntity'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    options: {id: 'option'},
  }, {
    // LEVEL 2
    type: 'property',
    propType: 'field',
    fieldId: 'attributes',
    label: 'test field property name',
    typeIds: ['PostEntity'],
    kind: 'Object',
    dataSourceId: 'testDataSourceId',
    options: {prop: 'option3'},
  }]])
  expect(dataSource.buildQuery).toHaveBeenCalledTimes(1)
  expect(dataSource.buildQuery).toHaveBeenCalledWith({
    token: {
      dataSourceId: 'testDataSourceId',
      fieldId: 'query',
      kind: 'object'
    },
    children: [
      { token: {
        type: 'property',
        propType: 'field',
        fieldId: 'testFieldId1',
        label: 'test field name',
        typeIds: ['PostEntity'],
        kind: 'object',
        dataSourceId: 'testDataSourceId',
        options: {id: 'option'},
      }, children: [
        { token: {
          type: 'property',
          propType: 'field',
          fieldId: 'test',
          label: 'test field property name',
          typeIds: ['String'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
          options: {prop: 'option1'},
        }, children: [] },
        { token: {
          type: 'property',
          propType: 'field',
          fieldId: 'id',
          label: 'test field property name',
          typeIds: ['ID'],
          kind: 'scalar',
          dataSourceId: 'testDataSourceId',
          options: {},
        }, children: [] },
        { token: {
          type: 'property',
          propType: 'field',
          fieldId: 'attributes',
          label: 'test field property name',
          typeIds: ['PostEntity'],
          kind: 'Object',
          dataSourceId: 'testDataSourceId',
          options: {prop: 'option3'},
        }, children: [] },
      ]},
    ]
  })
})

test('Get query with filter options', () => {
  const fn = jest.fn(() => ([{
    id: 'rootTypeId1',
    label: 'test',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'childField1',
      label: 'test',
      typeIds: ['childTypeId1'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }, {
      id: 'childField3',
      label: 'test',
      typeIds: ['childTypeId3'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }, {
    id: 'rootTypeId2',
    label: 'test',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'childField2',
      label: 'test',
      typeIds: ['childTypeId2'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }] as Type[]))
  class GQLTestTrees extends GraphQL {
    getTypes(): Type[] {
      return fn()
    }
    getTrees(expression: Expression): Tree[] {
      return super.getTrees(expression)
    }
  }
  const gql = new GQLTestTrees({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    queryable: [],
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })
  const expression: Expression = [{
      ...tokens.rootField1,
    }, {
      ...tokens.filter,
      options: {
        id: 1,
        childExpressionAbsolute: JSON.stringify([tokens.rootField2, tokens.childField2]),
        childExpressionRelative: JSON.stringify([tokens.childField1]),
      },
    } as Filter,
    tokens.childField3
  ]
  expect(gql.getQuery([expression]))
    .toEqual(dedent`
      query {
        __typename
        rootField2 {
          __typename
          childField2
        }
        rootField1 {
          __typename
          childField3
          childField1
        }
      }
    `)
})

test('Merge trees with empty and no options', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const trees = [{
    "token": {
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
    ]
  }, {
    "token": {
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
          "options": {}
        },
        "children": []
      }
    ]
  }]
  expect(async () => dataSource.mergeTrees(...trees))
  .not.toThrow('Cannot have options on a field without children')
  
  // The 2 trees are the same
  // The 2nd tree has empty options which should be ignored
  expect(dataSource.mergeTrees(...trees))
  .toEqual(trees[0])
})

test('Get query with errors in options', async () => {
  const DataSource = (await importDataSource([simpleSchema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  expect(() => dataSource.mergeTrees({
    "token": {
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
    ]
  }, {
    "token": {
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
            "id": "option"
          }
        },
        "children": []
      }
    ]
  }))
    .toThrow()
})


// test('Get data', async () => {
//   const DataSource = (await importDataSource([connect, postsId, postsDetails]))
//   const dataSource = new DataSource(options)
//   await dataSource.connect()
//   const dataPostsId = await dataSource.getData({
//     name: 'posts',
//     attributes: [['limit', '1']],
//   })
//   expect(dataPostsId).not.toBeUndefined()
//   expect(dataPostsId).toHaveLength(1)
//   expect(dataPostsId[0].author).toBeUndefined()
// 
//   const dataPostsDetails = await dataSource.getData({
//     name: 'posts',
//     attributes: [['limit', '1']],
//     children: [{
//       name: 'author',
//       children: ['email', 'first_name', {
//         name: 'avatar',
//         children: ['id', 'filename_disk'],
//       }],
//     }, 'title', 'content'], 
//   })
//   expect(dataPostsDetails).not.toBeUndefined()
//   expect(dataPostsDetails).toHaveLength(1)
//   expect(dataPostsDetails[0].author).not.toBeUndefined()
//   expect(dataPostsDetails[0].author.avatar).not.toBeUndefined()
// })