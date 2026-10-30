import { expect, test } from '@jest/globals'
import { getSliceOptions, SLICE_ALL_LENGTH } from './slice'

const ALL = String(SLICE_ALL_LENGTH)

test('publish the numbers typed by the user without quotes', () => {
  expect(getSliceOptions(['"2"', '"3"'])).toEqual(['2', '3'])
  expect(getSliceOptions(['" 2 "', '"03"'])).toEqual(['2', '3'])
  expect(getSliceOptions(['"-2"', '"1"'])).toEqual(['-2', '1'])
  expect(getSliceOptions(['2', '3'])).toEqual(['2', '3'])
})

test('keep the quotes of text and keep variables as they are', () => {
  expect(getSliceOptions(['"abc"', '"3"'])).toEqual(['"abc"', '3'])
  expect(getSliceOptions(['post.start', 'post.count'])).toEqual(['post.start', 'post.count'])
})

test('an empty start is 0', () => {
  expect(getSliceOptions(['', '"3"'])).toEqual(['0', '3'])
  expect(getSliceOptions(['""', '"3"'])).toEqual(['0', '3'])
})

test('an empty or 0 length keeps all the items after start', () => {
  expect(getSliceOptions(['"2"'])).toEqual(['2', ALL])
  expect(getSliceOptions(['"2"', ''])).toEqual(['2', ALL])
  expect(getSliceOptions(['"2"', '""'])).toEqual(['2', ALL])
  expect(getSliceOptions(['"2"', '"0"'])).toEqual(['2', ALL])
  expect(getSliceOptions(['"2"', 0])).toEqual(['2', ALL])
  expect(getSliceOptions([])).toEqual(['0', ALL])
})

