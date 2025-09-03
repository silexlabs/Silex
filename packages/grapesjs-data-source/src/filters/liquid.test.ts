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
  expect(isDate(testFields.stringField1)).toBe(false)
  expect(isDate(testFields.dateField1)).toBe(true)
  expect(isDate(testFields.dateField2, false)).toBe(true)
  expect(isDate(testFields.dateField2)).toBe(false)
})
