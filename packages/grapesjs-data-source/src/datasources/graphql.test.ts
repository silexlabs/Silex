import { GQLType, GraphQLOptions } from './GraphQL'
import {schema} from '../../__mocks__/graphql-mocks.js'
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
  queryable: ['posts', 'Contact', 'test'],
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
beforeEach(async () => {
  jest.resetAllMocks()
})

test('connect', async () => {
  const DataSource = (await importDataSource([schema]))
  const dataSource = new DataSource(options)
  await dataSource.connect()
  await new Promise(resolve => setTimeout(resolve, 100))
})

test('getTypes', async () => {
  const GraphQLDataSource = (await importDataSource([schema]))
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const types = await dataSource.getTypes()
  expect(types).not.toBeUndefined()
  expect(types!.length).toBeGreaterThan(10)
  const contactProp: Type = types!.find((prop: Type) => prop.id === 'Contact')!
  expect(contactProp.id).toBe('Contact')
  expect(contactProp.name).toBe('Contact')
  expect(contactProp.kind).toBe('object') // Contact collection is a singleton in directus
  expect(contactProp.fields).not.toBeUndefined()
  expect(contactProp.fields).toContainEqual({id: 'id', name: 'id', typeId: 'ID', kind: 'scalar', dataSourceId: 'testDataSourceId'})
  const testProp: Type | undefined = types!.find((prop: Type) => prop.id === 'test')
  expect(testProp).not.toBeUndefined()
  expect(testProp!.fields).not.toBeUndefined()
  const testO2MField: Field | undefined = testProp!.fields!.find(field => field.id === 'test_o2m')
  expect(testO2MField).not.toBeUndefined()
  expect((testO2MField as unknown as GQLType).fields).toBeUndefined()
  const testO2MProp: Type | undefined = types!.find((prop: Type) => prop.id === testO2MField!.typeId)
  expect(testO2MProp).not.toBeUndefined()
  expect(testO2MProp!.id).toBe('test_o2m')
  expect(testO2MProp!.kind).toBe('list')
  expect(testO2MProp!.fields).not.toBeUndefined()
  expect(testO2MProp!.fields).toContainEqual({id: 'id', name: 'id', typeId: 'ID', kind: 'scalar', dataSourceId: 'testDataSourceId'})
  expect(testO2MProp!.fields).toContainEqual({id: 'label', name: 'label', typeId: 'String', kind: 'scalar', dataSourceId: 'testDataSourceId'})
})

//test('Get data', async () => {
//  const DataSource = (await importDataSource([connect, postsId, postsDetails]))
//  const dataSource = new DataSource(options)
//  await dataSource.connect()
//  const dataPostsId = await dataSource.getData({
//    name: 'posts',
//    attributes: [['limit', '1']],
//  })
//  expect(dataPostsId).not.toBeUndefined()
//  expect(dataPostsId).toHaveLength(1)
//  expect(dataPostsId[0].author).toBeUndefined()
//
//  const dataPostsDetails = await dataSource.getData({
//    name: 'posts',
//    attributes: [['limit', '1']],
//    children: [{
//      name: 'author',
//      children: ['email', 'first_name', {
//        name: 'avatar',
//        children: ['id', 'filename_disk'],
//      }],
//    }, 'title', 'content'], 
//  })
//  expect(dataPostsDetails).not.toBeUndefined()
//  expect(dataPostsDetails).toHaveLength(1)
//  expect(dataPostsDetails[0].author).not.toBeUndefined()
//  expect(dataPostsDetails[0].author.avatar).not.toBeUndefined()
//})