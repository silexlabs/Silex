import { GraphQLConnectorOptions } from './GraphQL'
import {connect, postsDetails, postsId, schema} from '../../mocks/graphql-mocks.js'

const bearerToken = process.env.BEARER ?? ''

const options: GraphQLConnectorOptions = {
  name: 'GraphQL',
  type: 'graphql',
  url: `https://sandbox.internet2000.net/cms/graphql?access_token=${bearerToken}`,
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
  const {types} = await dataSource.getSchema()
  expect(types.length).toBeGreaterThan(10)
  const Query = types[0]
  expect(Query.name).toBe('Query')
  const users = types.find(type => type.name === 'directus_users')
  expect(users).not.toBeUndefined()
  expect(users!.fields).not.toBeUndefined()
  const avatar = users!.fields.find(field => field.name === 'avatar')
  expect(avatar).not.toBeUndefined()
  expect(avatar!.type.name).toBe('directus_files')
  expect(avatar!.type.fields).toBeUndefined()
  expect(avatar!.type.kind).toBe('OBJECT')
})

test('Get data', async () => {
  const DataSource = (await importDataSource([connect, postsId, postsDetails])).default
  const dataSource = new DataSource(options)
  await dataSource.connect()
  const dataPostsId = await dataSource.getData({
    name: 'posts',
    attributes: [['limit', '1']],
  })
  expect(dataPostsId).not.toBeUndefined()
  expect(dataPostsId).toHaveLength(1)
  expect(dataPostsId[0].author).toBeUndefined()

  const dataPostsDetails = await dataSource.getData({
    name: 'posts',
    attributes: [['limit', '1']],
    children: [{
      name: 'author',
      children: ['email', 'first_name', {
        name: 'avatar',
        children: ['id', 'filename_disk'],
      }],
    }, 'title', 'content'], 
  })
  expect(dataPostsDetails).not.toBeUndefined()
  expect(dataPostsDetails).toHaveLength(1)
  expect(dataPostsDetails[0].author).not.toBeUndefined()
  expect(dataPostsDetails[0].author.avatar).not.toBeUndefined()
})