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

import GraphQL, { GQLField, GQLType, GQLKind, GraphQLOptions, GQLOfType } from './GraphQL'
import {directusSchema, simpleSchema, strapiSchema} from '../../__mocks__/graphql-mocks.js'
import { Field, Type } from '../types'

const bearerToken = process.env.BEARER ?? ''

const options: GraphQLOptions = {
  id: 'testDataSourceId',
  type: 'graphql',
  name: 'GraphQL',
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
    name: 'test',
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
    name: 'test',
    type: 'graphql',
  })
  
  const result = gql.graphQLToType(allTypes, testType, 'SCALAR', false)
  expect(result).not.toBeUndefined()
  expect(result.name).toBe('PostEntityResponseCollection')
  expect(result.id).toBe('PostEntityResponseCollection')
  expect(result.fields).not.toBeUndefined()
  expect(result.fields).toHaveLength(1)
  expect(result.fields).toContainEqual({
    id: 'data',
    name: 'data',
    typeIds: ['PostEntity'],
    kind: 'list',
    dataSourceId: 'testDataSourceId'
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
    name: 'test',
    type: 'graphql',
  })

  const result = gql.graphQLToField(testField)
  expect(result).not.toBeUndefined()
  expect(result.id).toBe('posts')
  expect(result.name).toBe('posts')
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
  expect(postsType.name).toBe('posts')
  expect(postsType.fields).not.toBeUndefined()
  expect(postsType.fields).toContainEqual({
    id: 'data', name: 'data', typeIds: ['PostEntity'], kind: 'list', dataSourceId: 'testDataSourceId'
  })
})

test('getTypes directus', async () => {
  const GraphQLDataSource = (await importDataSource([directusSchema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const types = await dataSource.getTypes()
  expect(types).not.toBeUndefined()
  expect(types!.length).toBeGreaterThan(10)
  const contactType: Type = types!.find((prop: Type) => prop.id === 'Contact')!
  expect(contactType).not.toBeUndefined()
  expect(contactType.id).toBe('Contact')
  expect(contactType.name).toBe('Contact')
  expect(contactType.fields).not.toBeUndefined()
  expect(contactType.fields).toContainEqual({id: 'id', name: 'id', typeIds: ['ID'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
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
  expect(testO2MType!.fields).toContainEqual({id: 'id', name: 'id', typeIds: ['ID'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
  expect(testO2MType!.fields).toContainEqual({id: 'label', name: 'label', typeIds: ['String'], kind: 'scalar', dataSourceId: 'testDataSourceId'})
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
  expect(postsType.name).toBe('posts')
  expect(postsType.fields).not.toBeUndefined()
  const dataField = postsType.fields!.find(field => field.id === 'data')
  expect(dataField).not.toBeUndefined()
  expect(dataField!.name).toBe('data')
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
  expect(post.name).toBe('post')
  expect(post.arguments).not.toBeUndefined()
  expect(post.arguments).toHaveLength(1)
  expect(post.arguments![0].name).toBe('id')
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