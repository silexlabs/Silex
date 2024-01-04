import GraphQL, { GQLField, GQLType, GQLKind, GraphQLOptions, GQLOfType } from './GraphQL'
import { directusTestSchema, simpleSchema, strapiSchema} from '../../__mocks__/graphql-mocks'
import { Field, Tree, Type } from '../types'
import dedent from 'dedent-js'
import { importDataSource } from '../test-data'

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

class GQLTest extends GraphQL {
  protected queryType = 'query'
  constructor(options: GraphQLOptions, private overrideTypes: Type[] = [], private overrideFields: Field[] = []) {
    super(options)
  }
  getTypes(): Type[] {
    return this.overrideTypes
  }
  getQueryables(): Field[] {
    return this.overrideFields
  }
  graphQLToField(field: GQLField): Field {
    return super.graphQLToField(field)
  }

  graphQLToType(allTypes: string[], type: GQLType, kind: GQLKind, queryable: boolean): Type {
    return super.graphQLToType(allTypes, type, kind, queryable)
  }

  getOfTypeProp<T>(prop: string, type: GQLOfType, defaultValue?: T): T {
    return super.getOfTypeProp(prop, type, defaultValue)
  }

  getQuery(...args: any[]): string {
    /* @ts-ignore */
    return super.getQuery(...args)
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
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  })

  const result = gql.graphQLToField({
    "name": "posts",
    "type": {
      "name": "PostEntityResponseCollection",
      "kind": "OBJECT" as GQLKind,
    },
  })
  expect(result).not.toBeUndefined()
  expect(result.id).toBe('posts')
  expect(result.label).toBe('posts')
  expect(result.typeIds).toEqual(['PostEntityResponseCollection'])

  // With possible types
  expect(gql.graphQLToField({
    "name": "posts",
    "type": {
      "name": undefined,
      "kind": "LIST",
      "possibleTypes": [
        {
          "name": "PostEntityResponseCollection",
          "kind": "OBJECT" as GQLKind,
        },
      ],
    },
  })).toEqual({
    id: 'posts',
    label: 'posts',
    typeIds: ['PostEntityResponseCollection'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  })

  expect(gql.graphQLToField({
    "name": "posts",
    "type": {
      "name": undefined,
      "kind": "LIST",
      "possibleTypes": undefined,
      "ofType": {
        "kind": "NON_NULL",
        "name": undefined,
        "possibleTypes": undefined,
        "ofType": {
          "kind": "UNION",
          "name": "PageDataModulesComponentUnionDto",
          "possibleTypes": [
            {
              "kind": "OBJECT",
              "name": "HeroWordSliderComponent"
            },
            {
              "kind": "OBJECT",
              "name": "SectionSlideshowUpComponent"
            }
          ],
          "ofType": undefined,
        }
      }
    },
  })).toEqual({
    id: 'posts',
    label: 'posts',
    typeIds: ['HeroWordSliderComponent', 'SectionSlideshowUpComponent'],
    kind: 'list',
    dataSourceId: 'testDataSourceId',
    arguments: undefined,
  })
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
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  }, [{
    id: 'query',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'posts',
      label: 'test field name',
      typeIds: ['PostEntity'],
      kind: 'object',
    }],
  }, {
    id: 'PostEntity',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'testFieldPropertyId',
      label: 'test field name',
      typeIds: ['testTypeId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    }],
  }])
  const tree: Tree = {
    token: {
      type: 'property',
      propType: 'field',
      fieldId: 'posts',
      label: 'test field name',
      typeIds: ['PostEntity'],
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
  const query = gql.getQuery(tree)
  expect(query)
    .toEqual(`query {
  __typename
  posts {
    __typename
    testFieldPropertyId

  }

}`)
})

test('build query with fragments', () => {
  const gql = new GQLTest({
    url: 'http://localhost',
    method: 'POST',
    headers: {},
    id: 'testDataSourceId',
    label: 'test',
    type: 'graphql',
  }, [{
    id: 'query',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'parentFieldId',
      label: 'test field name',
      typeIds: ['testParentId'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    }],
  }, {
    id: 'testParentId',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'testFieldId',
      label: 'test field name',
      typeIds: ['testTypeId1', 'testTypeId2'],
      kind: 'object',
      dataSourceId: 'testDataSourceId',
    }],
  }, {
    id: 'testTypeId1',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'ONLY_TEST_TYPE_ID1',
      label: 'test field property name',
      typeIds: ['testFieldPropertyTypeId1'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }, {
    id: 'testTypeId2',
    label: 'test type name',
    dataSourceId: 'testDataSourceId',
    fields: [{
      id: 'ONLY_TEST_TYPE_ID2',
      label: 'test field property name',
      typeIds: ['testFieldPropertyTypeId2'],
      kind: 'scalar',
      dataSourceId: 'testDataSourceId',
    }],
  }], [{
    id: 'testFieldId',
    label: 'test field name',
    typeIds: ['testTypeId1', 'testTypeId2'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
    arguments: [{
      name: 'id',
      typeId: 'ID',
    }],
  }, {
    id: 'parentFieldId',
    label: 'test field name',
    typeIds: ['testParentId'],
    kind: 'object',
    dataSourceId: 'testDataSourceId',
  }])
  // Simple case
  expect(gql.getQuery({
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
      children: [],
    }],
  }))
    .toEqual(dedent`
    query {
      __typename
      parentFieldId {
        __typename

      testFieldId {
          ...on testTypeId1 {
          __typename


        }
    }
      }

    }`)
  // More complex
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
  const query = gql.getQuery(tree)
  expect(query)
    .toEqual(dedent`
    query {
      __typename
      parentFieldId {
        __typename

      testFieldId {
          ...on testTypeId1 {
          __typename
          ONLY_TEST_TYPE_ID1

        }
    }
      testFieldId {
          ...on testTypeId2 {
          __typename
          ONLY_TEST_TYPE_ID2

        }
    }
      }

    }`)
})

// test('get query with options', () => {
//   const fn = jest.fn(expression => ([{
//     token: testTokens.rootField1,
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
//     id: 'testDataSourceId',
//     label: 'test',
//     type: 'graphql',
//   })
//   const expression: Expression = [{
//       ...testTokens.rootField1,
//     }, {
//       ...testTokens.filter,
//       options: {
//         id: 1,
//         childExpressionAbsolute: JSON.stringify([testTokens.rootField2, testTokens.childField2]),
//         childExpressionRelative: JSON.stringify([testTokens.childField1]),
//       },
//     } as Filter,
//     testTokens.childField3
//   ]
//   expect(() => gql.getQuery([expression])).not.toThrow()
//   fn.mockClear()
//   gql.getQuery([expression])
//   expect(fn).toHaveBeenCalledTimes(1)
//   expect(fn).toHaveBeenCalledWith(
//     [{
//       token: testTokens.rootField1,
//       children: [{
//         token: testTokens.childField3,
//         children: [],
//       }],
//     }, {
//       token: testTokens.rootField1,
//       children: [{
//         token: testTokens.childField1,
//         children: [],
//       }],
//     }, {
//       token: testTokens.rootField2,
//       children: [{
//         token: testTokens.childField2,
//         children: [],
//       }],
//     }]
//   )
// })

//// test('Get data', async () => {
////   const DataSource = (await importDataSource([connect, postsId, postsDetails]))
////   const dataSource = new DataSource(options)
////   await dataSource.connect()
////   const dataPostsId = await dataSource.getData({
////     name: 'posts',
////     attributes: [['limit', '1']],
////   })
////   expect(dataPostsId).not.toBeUndefined()
////   expect(dataPostsId).toHaveLength(1)
////   expect(dataPostsId[0].author).toBeUndefined()
//// 
////   const dataPostsDetails = await dataSource.getData({
////     name: 'posts',
////     attributes: [['limit', '1']],
////     children: [{
////       name: 'author',
////       children: ['email', 'first_name', {
////         name: 'avatar',
////         children: ['id', 'filename_disk'],
////       }],
////     }, 'title', 'content'], 
////   })
////   expect(dataPostsDetails).not.toBeUndefined()
////   expect(dataPostsDetails).toHaveLength(1)
////   expect(dataPostsDetails[0].author).not.toBeUndefined()
////   expect(dataPostsDetails[0].author.avatar).not.toBeUndefined()
//// })