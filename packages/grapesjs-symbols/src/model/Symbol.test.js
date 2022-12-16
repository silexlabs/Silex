import { getTestSymbols } from '../test-utils'
import {jest} from '@jest/globals'

test('Initialize symbol with values', () => {
  const { s1, comp1, child11, child12, s1Data } = getTestSymbols()
  expect(s1.get('instances')).not.toBeUndefined()
  expect(s1.get('instances') instanceof Map).toBe(true)
  expect(s1.get('instances').size).toBe(2)
  expect(s1.get('label')).toBe('S1')
  expect(s1.get('icon')).toBe('fa-cog')
  expect(comp1.get('symbolId')).toBe(s1.id)
  expect(comp1.get('symbolChildId')).toBeUndefined()
  expect(child11.get('symbolChildId')).not.toBeUndefined()
  expect(child11.get('symbolId')).toBeUndefined()

  expect(s1.get('model').get('symbolId')).toBe(s1.id)
  expect(comp1.get('symbolId')).toBe(s1.id)
  expect(child11.get('symbolChildId')).toBe(child11.cid)
  expect(child12.get('symbolChildId')).toBe(child12.cid)
})

test('Initialize symbol with default values', () => {
  const { s2, comp3 } = getTestSymbols()
  expect(s2.get('label')).not.toBeUndefined()
  expect(s2.get('icon')).not.toBeUndefined()
})

test('Test data to save has only needed data', () => {
  const { s1, s1Data, comp1, child11, child12 } = getTestSymbols()
  expect(s1.get('model').get('symbolId')).toBe(s1.id)
  expect(s1.get('model').get('symbolId')).toBe(comp1.get('symbolId'))
  expect(s1.toJSON().instances).toBeUndefined()
  expect(s1.toJSON().model.attributes.symbolId).toBe(s1.id)
})

test('Test browseInstancesAndModel  method', () => {
  // In this test:
  // - s1 is a symbol
  // - comp1 and comp2 are instances of s1
  // - child11 and child12 are children of comp1
  // - child21 and child22 are children of comp2
  const { s1, comp1, child11, child12, comp2, child21, child22 } = getTestSymbols()
  const model = s1.get('model')
  const model11 = model.components().models[0]
  const model12 = model.components().models[1]
  // console.log([
  //   {name: 's1', cid: s1.cid},
  //   {name: 'comp1', cid: comp1.cid},
  //   {name: 'child11', cid: child11.cid},
  //   {name: 'child12', cid: child12.cid},
  //   {name: 'comp2', cid: comp2.cid},
  //   {name: 'child21', cid: child21.cid},
  //   {name: 'child22', cid: child22.cid},
  //   {name: 'model', cid: model.cid},
  //   {name: 'model11', cid: model11.cid},
  //   {name: 'model12', cid: model12.cid},
  // ])

  // First make sure the structure is right
  expect(comp1.get('symbolId')).toBe(s1.id)
  expect(child12.get('symbolChildId')).toBe(child12.cid)
  expect(child11.get('symbolChildId')).toBe(child11.cid)
  expect(comp2.get('symbolId')).toBe(s1.id)
  expect(child21.get('symbolChildId')).toBe(child11.cid)
  expect(child22.get('symbolChildId')).toBe(child12.cid)
  expect(model.get('symbolId')).toBe(s1.id)
  expect(model11.get('symbolChildId')).toBe(child11.cid)
  expect(model12.get('symbolChildId')).toBe(child12.cid)

  // Find the 2 symbols in s1 which correspond to child11 in the model and in comp2
  const cbk = jest.fn()
  s1.browseInstancesAndModel(comp1, child11, cbk)
  expect(cbk).toHaveBeenCalledTimes(2)
  expect(cbk.mock.calls[0][0].cid).toBe(model11.cid)
  expect(cbk.mock.calls[1][0].cid).toBe(child21.cid)
  // This makes jest crash:
  //expect(cbk).toHaveBeenCalledWith(child11)
  //expect(cbk).toHaveBeenCalledWith(child12)
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

describe('Test applyAttributes method', () => {
  test('update attributes of instances', () => {
    let { s1, comp1, comp2, child11, child21, child12, child22 } = getTestSymbols()
    const changed = { test: 'test' }
    comp1.getChangedProps = () => changed
    comp1._previousAttributes = comp1.attributes
    expect(() => s1.applyAttributes(comp1, comp1)).not.toThrow()
    s1.applyAttributes(comp1, comp1)
    expect(comp2.get('test')).toBe(comp1.get('test'))
    expect(s1.get('model').get('test')).toBe(comp1.get('test'))
  })
  test('update attributes of comp1 children', () => {
    let { s1, comp1, comp2, child11, child21, child12, child22 } = getTestSymbols()
    const changed = { test: 'test' }
    child11.getChangedProps = () => changed
    child11._previousAttributes = child11.attributes
    child11.set('symbolChildId', 'symbolChildId1')
    child21.set('symbolChildId', 'symbolChildId1')
    child12.set('symbolChildId', 'symbolChildId2')
    child22.set('symbolChildId', 'symbolChildId2')
    s1.get('model').components().models[0].set('symbolChildId', 'symbolChildId1')
    s1.get('model').components().models[1].set('symbolChildId', 'symbolChildId2')
    s1.applyAttributes(comp1, child11)
    expect(child21.get('test')).toBe(child11.get('test'))
    // the model children should be updated too
    expect(s1.get('model').components().models[0].get('test')).toBe(child11.get('test'))
  })
})
