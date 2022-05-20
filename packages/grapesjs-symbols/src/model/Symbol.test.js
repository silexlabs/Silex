import { jest } from '@jest/globals'

import { getTestSymbols } from '../test-utils'

test('Initialize symbol with values', () => {
  const { s1, comp1, child11, child12, s1Data } = getTestSymbols()
  expect(s1.get('symbolId')).toBe(s1Data.symbolId)
  expect(s1.get('instances')).not.toBeUndefined()
  expect(s1.get('instances') instanceof Map).toBe(true)
  expect(s1.get('instances').size).toBe(2)
  expect(s1.get('label')).toBe('S1')
  expect(s1.get('icon')).toBe('fa-cog')
  expect(comp1.get('symbolId')).toBe(s1Data.symbolId)
  expect(comp1.get('symbolChildId')).toBeUndefined()
  expect(child11.get('symbolChildId')).not.toBeUndefined()
  expect(child11.get('symbolId')).toBeUndefined()

  expect(s1.get('model').get('symbolId')).toBe(s1Data.symbolId)
  expect(comp1.get('symbolId')).toBe(s1Data.symbolId)
  expect(child11.get('symbolChildId')).toBe(s1Data.symbolId)
  expect(child12.get('symbolChildId')).toBe(s1Data.symbolId)
})

test('Initialize symbol with default values', () => {
  const { s2, comp3 } = getTestSymbols()
  expect(s2.get('label')).not.toBeUndefined()
  expect(s2.get('icon')).not.toBeUndefined()
})

test('Test data to save has only needed data', () => {
  const { s1, s1Data, comp1, child11, child12 } = getTestSymbols()
  expect(s1.get('model').get('symbolId')).toBe(s1Data.symbolId)
  expect(s1.get('model').get('symbolId')).toBe(comp1.get('symbolId'))
  expect(s1.toJSON().instances).toBeUndefined()
  expect(s1.toJSON().symbolId).toBe(s1Data.symbolId)
  //expect(s1.toJSON().attributes.symbolId).toBe(s1Data.symbolId)
  expect(s1.toJSON().model.attributes.symbolId).toBe(s1Data.symbolId)
  // this test makes jest crash:
  // expect(s1.toJSON()).toEqual({
  //   ...s1Data,
  //   symbolId,
  //   model: comp1,
  // })
})

test('Test getAll method', () => {
  const { s1, comp1 } = getTestSymbols()
  expect(() => s1.getAll()).not.toThrow()
  expect(s1.getAll() instanceof Array).toBe(true)
  expect(s1.get('instances').size).toBe(2)
  expect(s1.getAll()).toHaveLength(2)
  expect(s1.getAll({})).toHaveLength(3)
  expect(s1.getAll(null, {})).toHaveLength(2)
  expect(s1.getAll(null, comp1)).toHaveLength(1)
})

test('Test applyAttributes method', () => {
  let { s1, comp1, comp2, child21 } = getTestSymbols()
  expect(s1.getAll()[0]).toBe(comp1)
  expect(() => s1.applyAttributes(comp1, comp1)).not.toThrow()
  // update attributes of comp2
  const changed = { test: 'test' }
  const _previousAttributes = comp1.attributes
  comp1.getChangedProps = () => changed
  comp1._previousAttributes = _previousAttributes
  child21.getChangedProps = () => changed
  child21._previousAttributes = _previousAttributes
  expect(() => s1.applyAttributes(comp1, comp1)).not.toThrow()
  s1.applyAttributes(comp1, comp1)
  expect(comp2.get('test')).toBe('test')
  // update attribute of  child1 in comp2 (child21)
  s1.applyAttributes(comp1, child21)
  expect(child21.get('test')).toBe('test')
})
