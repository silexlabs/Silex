import { insertAt, flat } from './array'

test('insert at 1 object', () => {
  const obj1 = 'obj1'
  const obj2 = 'obj2'
  const obj3 = 'obj3'
  const arr1 = [obj1, obj2]
  expect(insertAt<string>(arr1, 0, obj3)[0]).toBe(obj3)
  expect(insertAt<string>(arr1, 1, obj3)[1]).toBe(obj3)
  expect(insertAt<string>(arr1, 2, obj3)[2]).toBe(obj3)
  expect(insertAt<string>(arr1, -1, obj3)[1]).toBe(obj3)
  expect(insertAt<string>(arr1, 3, obj3)[2]).toBe(obj3)
  expect(arr1).toHaveLength(2)
})

test('insert at 2 objects', () => {
  const obj1 = 'obj1'
  const obj2 = 'obj2'
  const obj3 = 'obj3'
  const obj4 = 'obj4'
  const arr1 = [obj1, obj2]
  const result = insertAt<string>(arr1, 1, obj3, obj4)
  expect(result[0]).toEqual(obj1)
  expect(result[1]).toEqual(obj3)
  expect(result[2]).toEqual(obj4)
  expect(result[3]).toEqual(obj2)
})

test('insert at strnage number of objects', () => {
  expect(insertAt([1, 2], 0, null)).toHaveLength(3)
  expect(insertAt([], 0, 1)).toHaveLength(1)
  expect(insertAt([2], null,1)).toHaveLength(2)
})

test('flat', () => {
  expect(flat([['a', 'b'], 'c'])).toEqual(['a', 'b', 'c'])
  expect(flat(['a', ['b', 'c']])).toEqual(['a', 'b', 'c'])
  expect(flat([['a', 'b', 'c']])).toEqual(['a', 'b', 'c'])
  expect(flat(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
})
