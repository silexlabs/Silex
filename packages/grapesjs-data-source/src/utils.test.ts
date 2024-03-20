import { cleanStateName, concatWithLength } from "./utils"

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

test('test name fall new state', () => {
  expect(cleanStateName(null)).toBeUndefined()
  expect(cleanStateName('')).toBe('')
  expect(cleanStateName('New State')).toBe('new-state')
  expect(cleanStateName('1-+ eée')).toBe('1---e-e')
  expect(cleanStateName('-e-')).toBe('-e')
  expect(cleanStateName('e:e')).toBe('e:e')
  expect(cleanStateName('--test')).toBe('--test')  
})

test('Test string length', () => {
  expect(concatWithLength(5, 'a')).toHaveLength(5)
  expect(concatWithLength(5, 'a', 'b')).toHaveLength(5)
  expect(concatWithLength(5, 'a', 'b', 'c')).toHaveLength(5)
  expect(concatWithLength(5, 'aa', 'bbb')).toHaveLength(5)
  expect(concatWithLength(5, 'aaa', 'bb')).toHaveLength(5)
  expect(concatWithLength(5, 'a ', 'b')).toHaveLength(5)
  expect(concatWithLength(5, 'aaa', 'bbb')).toHaveLength(6)
  expect(concatWithLength(5, ' a ', ' b ')).toHaveLength(6)
})
