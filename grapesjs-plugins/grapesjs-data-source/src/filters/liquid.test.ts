/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals'
import { testFields } from '../test-data'
import { isDate, isString } from './liquid'
import { evaluateFilterToken, EvaluationContext } from '../model/expressionEvaluator'
import { Filter, FIXED_TOKEN_ID } from '../types'

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

// The option forms of the string filters submit the string "[]" when their option is left
// unset (`value=${options.value || '[]'}` in liquid.ts), and `isExpression([])` is
// vacuously true. An unset option was therefore evaluated as an expression, which returns
// null, and a string filter interpolates that as the literal text "null".
// See https://github.com/silexlabs/Silex/issues/1672
describe('string filters: option values', () => {
  const DS = 'ds1'

  // Run a filter through the real evaluator, the way the editor does
  function runFilter(id: string, input: unknown, optionValue: unknown, previewData: Record<string, unknown> = {}) {
    const filters = getFilters()
    const token = {
      type: 'filter',
      id,
      label: id,
      options: { value: optionValue },
    } as unknown as Filter
    const context = {
      dataSources: [],
      filters,
      previewData,
      component: {},
      resolvePreviewIndex: false,
    } as unknown as EvaluationContext
    return evaluateFilterToken(token, [], context, input)
  }

  // An option value is stored as the JSON of an expression. A "fixed value" is what the
  // option form stores when the user typed a plain text
  const fixedOption = (value: string) => JSON.stringify([{
    type: 'property',
    propType: 'field',
    fieldId: FIXED_TOKEN_ID,
    label: 'Fixed value',
    kind: 'scalar',
    typeIds: ['String'],
    options: { value },
  }])

  // ...and this is what it stores when the user picked a data field instead
  const fieldOption = (fieldId: string) => JSON.stringify([{
    type: 'property',
    propType: 'field',
    dataSourceId: DS,
    fieldId,
    label: fieldId,
    typeIds: ['String'],
    kind: 'scalar',
  }])

  test('append puts the option value after the input', () => {
    expect(runFilter('append', '/uploads/', fixedOption('test.pdf'))).toBe('/uploads/test.pdf')
  })

  test('prepend puts the option value before the input', () => {
    expect(runFilter('prepend', 'test.pdf', fixedOption('/uploads/'))).toBe('/uploads/test.pdf')
  })

  test('append resolves an option value which is a data field', () => {
    expect(runFilter('append', '/uploads/', fieldOption('name'), { [DS]: { name: 'test.pdf' } })).toBe('/uploads/test.pdf')
  })

  test('prepend resolves an option value which is a data field', () => {
    expect(runFilter('prepend', 'test.pdf', fieldOption('dir'), { [DS]: { dir: '/uploads/' } })).toBe('/uploads/test.pdf')
  })

  // The regression: the option is unset, so the value must not become the text "null"
  test('append does not append the text "null" when its option is unset', () => {
    expect(runFilter('append', '/uploads/', '[]')).toBe('/uploads/')
  })

  test('prepend does not prepend the text "null" when its option is unset', () => {
    expect(runFilter('prepend', 'test.pdf', '[]')).toBe('test.pdf')
  })

  test('an unset option leaves an empty input empty', () => {
    expect(runFilter('append', '', '[]')).toBe('')
  })

  // An option which is a plain string is not an expression and must be used as is
  test('a plain string option value is used as is', () => {
    expect(runFilter('append', '/uploads/', 'test.pdf')).toBe('/uploads/test.pdf')
    expect(runFilter('prepend', 'test.pdf', '/uploads/')).toBe('/uploads/test.pdf')
  })
})
