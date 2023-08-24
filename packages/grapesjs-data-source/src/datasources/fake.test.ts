import { test } from '@jest/globals'
import Connector from './fake'
import { Item, ItemNonScalar, ItemScalar, TypeNonScalar } from '..'

const options = {}

test('init', async () => {
  const connector = new Connector(options)
  await connector.init()
})

test('getTypes', async () => {
  const connector = new Connector(options)
  await connector.init()
  const types = await connector.getTypes()
  expect(types).toHaveLength(2)
  expect(types[0].id).toBe('user')
  expect(types[1].id).toBe('post')
  const userType = types[0] as TypeNonScalar
  const postType = types[1] as TypeNonScalar
  expect(await postType.fields()).toHaveLength(4)
  expect(await userType.fields()).toHaveLength(3)
})

test('getType', async () => {
  const connector = new Connector(options)
  await connector.init()
  const type = await connector.getType('user')
  expect(type.id).toBe('user')
  expect(type.scalar).toBe(false)
  expect((type as TypeNonScalar).fields).not.toBeFalsy()
  expect((type as TypeNonScalar).fields()).toHaveLength(3)
})

test('getItems', async () => {
  const connector = new Connector(options)
  await connector.init()
  const type = await connector.getType('user')
  const items = await connector.getItems(type)
  expect(items).toHaveLength(10)
  const user0 = items[0] as Item
  expect((user0 as ItemScalar).value).toBeUndefined()
  expect(user0.type.id).toBe('user')
  expect(user0.name).not.toBeFalsy()
  const email = (user0 as ItemNonScalar).field('email') as ItemScalar
  expect(email).not.toBeUndefined()
  expect(email.value).toContain('@')
})
