/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals'
import { testFields } from '../test-data'
import { isDate, isString } from './liquid'

// FIXME: Workaround to avoid import of lit-html which breakes unit tests
jest.mock('lit', () => ({
  html: jest.fn(),
  render: jest.fn(),
}))

test('is string', () => {
  expect(isString(null)).toBe(false)
  expect(isString(testFields.stringField1)).toBe(true)
  expect(isString(testFields.dateField1)).toBe(false)
})

test('is date', () => {
  expect(isDate(null)).toBe(false)
  expect(isDate(testFields.stringField1)).toBe(true)
  expect(isDate(testFields.dateField1)).toBe(true)
  expect(isDate(testFields.dateField2, false)).toBe(true)
  expect(isDate(testFields.dateField2)).toBe(false)
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const grapesjs = require('grapesjs').default ?? require('grapesjs')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getLiquidFilters = require('./liquid').default

function getFilters() {
  const editor = grapesjs.init({ container: document.createElement('div') })
  return getLiquidFilters(editor)
}
const byId = (id: string) => getFilters().find((f: { id: string }) => f.id === id)
type ApplyFilter = { apply: (input: unknown, options: Record<string, unknown>) => unknown }

// `.apply(input, options)` below calls each filter's own `apply` method, not
// Function.prototype.apply — prefer-spread misreads it when input is null/undefined
/* eslint-disable prefer-spread */
describe('array filters: per-item key resolver + null guard', () => {
  test('where keeps items whose per-item key matches the value', () => {
    const where = byId('where') as ApplyFilter
    const arr = [{ code: 'FR' }, { code: 'US' }]
    expect(where.apply(arr, { key: (i: { code: string }) => i.code, value: 'FR' })).toEqual([{ code: 'FR' }])
  })
  test('where returns the input unchanged when it is not an array (null guard)', () => {
    const where = byId('where') as ApplyFilter
    expect(where.apply(null, { key: () => 1, value: 1 })).toBeNull()
    expect(where.apply(undefined, { key: () => 1, value: 1 })).toBeUndefined()
  })
  test('find returns the first item matching the per-item key', () => {
    const find = byId('find') as ApplyFilter
    expect(find.apply([{ code: 'FR' }, { code: 'US' }], { key: (i: { code: string }) => i.code, value: 'US' })).toEqual({ code: 'US' })
    expect(find.apply(null, { key: () => 1, value: 1 })).toBeNull()
  })
  test('map extracts the per-item key from each item', () => {
    const map = byId('map') as ApplyFilter
    expect(map.apply([{ name: 'a' }, { name: 'b' }], { key: (i: { name: string }) => i.name })).toEqual(['a', 'b'])
    expect(map.apply(null, { key: () => 1 })).toBeNull()
  })
})
