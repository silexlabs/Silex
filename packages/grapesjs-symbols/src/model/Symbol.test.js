import { jest } from '@jest/globals';

import { getTestSymbols } from '../test-utils';

test('Initialize symbol with values', () => {
  const { s1 } = getTestSymbols()
  expect(s1.get('id')).not.toBeUndefined()
  expect(s1.get('id')).toBe(s1.id)
  expect(s1.get('components')).not.toBeUndefined()
  expect(s1.get('components') instanceof Map).toBe(true)
  expect(s1.get('components').size).toBe(2)
  expect(s1.get('label')).not.toBeUndefined()
  expect(s1.get('icon')).not.toBeUndefined()
})

test('Initialize symbol with default values', () => {
  const { s2 } = getTestSymbols()
  expect(s2.get('id')).not.toBeUndefined()
  expect(s2.get('id')).toBe(s2.cid)
  expect(s2.get('components')).not.toBeUndefined()
  expect(s2.get('components') instanceof Map).toBe(true)
  expect(s2.get('components').size).toBe(0)
  expect(s2.get('label')).not.toBeUndefined()
  expect(s2.get('icon')).not.toBeUndefined()
})

test('Test data to save has only needed data', () => {
  const { s1, s1Data } = getTestSymbols()
  expect(s1.toJSON()).toEqual(s1Data)
})

test('Test getComponents method', () => {
  const { s1 } = getTestSymbols()
  expect(() => s1.getComponents()).not.toThrow()
  expect(s1.getComponents() instanceof Map).toBe(true)
  expect(s1.getComponents().size).toBe(2)
})

test('Test sync method', () => {
  const { s1, comp1 } = getTestSymbols()
  const component = s1.getComponents().get(comp1.cid)
  expect(component).not.toBeUndefined()
  expect(() => s1.sync(jest.fn(), component)).not.toThrow()
  const cbk = jest.fn()
  // all components
  s1.sync(cbk)
  expect(cbk).toHaveBeenCalledTimes(2)
  // all components but 1
  cbk.mockClear()
  s1.sync(cbk, component)
  expect(cbk).toHaveBeenCalledTimes(1)
})

test('Test syncAttributes method', () => {
  let { s1, comp1, comp2, child21 } = getTestSymbols()
  //s1.sync = jest.fn((cbk) => cbk(comp1))
  // update attributes of comp2
  const changed = { test: 'test' }
  const _previousAttributes = comp1.attributes
  comp1.changed = changed
  comp1._previousAttributes = _previousAttributes
  child21.changed = changed
  child21._previousAttributes = _previousAttributes

  expect(() => s1.syncAttributes(comp1, comp1)).not.toThrow()
  s1.syncAttributes(comp1, comp1)
  expect(comp2.get('test')).toBe('test')
  // update attribute of  child1 in comp2 (child21)
  s1.syncAttributes(comp1, child21)
  expect(child21.get('test')).toBe('test')
})
