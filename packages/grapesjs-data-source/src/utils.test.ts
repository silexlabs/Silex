import { cleanStateName, concatWithLength } from './utils'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

test('test name fall new state', () => {
  expect(cleanStateName(null)).toBeUndefined()
  expect(cleanStateName('')).toBe('')
  expect(cleanStateName('New State')).toBe('new-state')
  expect(cleanStateName('1-+ eée')).toBe('----e-e')
  expect(cleanStateName('-e-')).toBe('-e-')
  expect(cleanStateName('e:e')).toBe('e:e')
  expect(cleanStateName('--test')).toBe('--test')
  // Bug fix: "0" should not be replaced with "-"
  expect(cleanStateName('0ab')).toBe('-ab')
  expect(cleanStateName('a0b')).toBe('a0b')
  expect(cleanStateName('ab0')).toBe('ab0')
  expect(cleanStateName('0ab-')).toBe('-ab-')
  expect(cleanStateName('a-0-b')).toBe('a-0-b')
  expect(cleanStateName('a-b-0')).toBe('a-b-0')
  expect(cleanStateName('a 0 b')).toBe('a-0-b')
  expect(cleanStateName('a b 0')).toBe('a-b-0')
  expect(cleanStateName('-a b 0-')).toBe('-a-b-0-')
  // Test special chars: -, _, ., :
  expect(cleanStateName('test-name')).toBe('test-name')
  expect(cleanStateName('test_name')).toBe('test_name')
  expect(cleanStateName('test.name')).toBe('test.name')
  expect(cleanStateName('test:name')).toBe('test:name')
  expect(cleanStateName('test-_.:')).toBe('test-_.:')
  expect(cleanStateName('a-b_c.d:e')).toBe('a-b_c.d:e')
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
