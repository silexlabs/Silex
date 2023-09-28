import { GraphQLConnectorOptions } from './GraphQL'
import {connect, postsDetails, postsId, schema} from '../../mocks/graphql-mocks.js'
import { Field, Property } from '..'

const bearerToken = process.env.BEARER ?? ''

const options: GraphQLConnectorOptions = {
  name: 'GraphQL',
  type: 'graphql',
  url: `https://sandbox.internet2000.net/cms/graphql?access_token=${bearerToken}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + bearerToken,
  },
}

async function importDataSource(datas?: any[]) {
  if (datas?.length) {
    global.fetch = jest.fn()
    datas && datas.forEach(data => {
      global.fetch = (global.fetch as jest.Mock)
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        }),
      )
    })
  }
  return import('./GraphQL')
}
beforeEach(() => {
  jest.resetAllMocks()
})

test('connect', async () => {
  const DataSource = (await importDataSource([connect])).default
  const dataSource = new DataSource(options)
  await dataSource.connect()
})

test('getSchema', async () => {
  const GraphQLDataSource = (await importDataSource([connect, schema])).default
  const dataSource = new GraphQLDataSource(options)
  await dataSource.connect()
  const {properties} = await dataSource.getSchema()
  expect(properties).not.toBeUndefined()
  expect(properties!.length).toBeGreaterThan(10)
  const contactProp: Property = properties![0]
  expect(contactProp.name).toBe('Contact')
  const testProp: Property | undefined = properties!.find(prop => prop.name === 'test')
  expect(testProp).not.toBeUndefined()
  expect(testProp!.fields).not.toBeUndefined()
  const testO2MField: Field | undefined = testProp!.fields!.find(field => field.name === 'test_o2m')
  expect(testO2MField).not.toBeUndefined()
  expect((testO2MField as any).fields).toBeUndefined()
  const testO2MProp: Property | undefined = properties!.find(prop => prop.name === testO2MField!.type)
  expect(testO2MProp).not.toBeUndefined()
  expect(testO2MProp!.name).toBe('test_o2m')
  expect(testO2MProp!.kind).toBe('LIST')
  expect(testO2MProp!.fields).not.toBeUndefined()
  expect(testO2MProp!.fields).toContainEqual({name: 'id', type: 'ID', kind: 'SCALAR'})
  expect(testO2MProp!.fields).toContainEqual({name: 'label', type: 'String', kind: 'SCALAR'})
})

//test('Get data', async () => {
//  const DataSource = (await importDataSource([connect, postsId, postsDetails])).default
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