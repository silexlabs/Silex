import { concatWithLength } from "./utils"

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

test('Test string length', () => {
  console.log('concatWithLength', concatWithLength(5, 'xxx', 'yyy'))
  expect(concatWithLength(5, 'a')).toHaveLength(5)
  expect(concatWithLength(5, 'a', 'b')).toHaveLength(5)
  expect(concatWithLength(5, 'a', 'b', 'c')).toHaveLength(5)
  expect(concatWithLength(5, 'aa', 'bbb')).toHaveLength(5)
  expect(concatWithLength(5, 'aaa', 'bb')).toHaveLength(5)
  expect(concatWithLength(5, 'a ', 'b')).toHaveLength(5)
  expect(concatWithLength(5, 'aaa', 'bbb')).toHaveLength(6)
  expect(concatWithLength(5, ' a ', ' b ')).toHaveLength(6)
})
