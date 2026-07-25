import { jest } from '@jest/globals'
import { cleanStateName, concatWithLength, isSecondaryToken, filterDisplayedCompletion, toId } from './utils'
import { IDataSource, Token } from './types'

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

const prop = (fieldId: string, dataSourceId = 'wp'): Token => ({
  type: 'property', propType: 'field', dataSourceId, fieldId,
  label: fieldId, kind: 'scalar', typeIds: ['String'],
} as Token)
const wpDs = { id: 'wp', getSecondaryFieldNames: () => ['databaseId', 'guid'] } as unknown as IDataSource
const genericDs = { id: 'gen' } as unknown as IDataSource

test('isSecondaryToken flags only declared plumbing property tokens', () => {
  expect(isSecondaryToken(prop('databaseId'), [wpDs])).toBe(true)
  expect(isSecondaryToken(prop('title'), [wpDs])).toBe(false)
  // data source that does not declare secondary fields
  expect(isSecondaryToken(prop('databaseId', 'gen'), [genericDs])).toBe(false)
  // filter/state tokens are never secondary
  expect(isSecondaryToken({ type: 'filter', id: 'x', label: 'x', options: {} } as Token, [wpDs])).toBe(false)
})

test('filterDisplayedCompletion hides secondary fields unless showAll or kept', () => {
  const completion = [prop('title'), prop('databaseId'), prop('guid')]
  const isSecondary = (t: Token) => isSecondaryToken(t, [wpDs])
  expect(filterDisplayedCompletion(completion, isSecondary, false).map(t => (t as Extract<Token, { fieldId: string }>).fieldId))
    .toEqual(['title'])
  expect(filterDisplayedCompletion(completion, isSecondary, true)).toHaveLength(3)
  // Edge case: a currently selected secondary token (in keepIds) stays visible
  const keep = toId(prop('databaseId'))
  expect(filterDisplayedCompletion(completion, isSecondary, false, [keep]).map(t => (t as Extract<Token, { fieldId: string }>).fieldId))
    .toEqual(['title', 'databaseId'])
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
