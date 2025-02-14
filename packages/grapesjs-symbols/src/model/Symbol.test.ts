import { expect } from '@jest/globals'
import { Component } from 'grapesjs'
import { getTestSymbols } from '../test-utils'
import {jest} from '@jest/globals'

test('Initialize symbol with values', () => {
  const { s1, comp1, child11, child12, child111 } = getTestSymbols()
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

  expect(s1.get('model').components().models[0].get('test')).toBe(child11.get('test'))
  expect(s1.get('model').components().models[0].components().models[0].get('test')).toBe(child111.get('test'))
})

test('Initialize symbol with default values', () => {
  const { s2 } = getTestSymbols()
  expect(s2.get('label')).not.toBeUndefined()
  expect(s2.get('icon')).not.toBeUndefined()
})

test('Test data to save has only needed data', () => {
  const { s1, comp1 } = getTestSymbols()
  expect(s1.get('model').get('symbolId')).toBe(s1.id)
  expect(s1.get('model').get('symbolId')).toBe(comp1.get('symbolId'))
  expect(s1.toJSON().instances).toBeUndefined()
  expect(s1.toJSON().model.attributes.symbolId).toBe(s1.id)
})

test('Test getAll  method', () => {
  const { s1, comp1, comp2 } = getTestSymbols()
  const tmp = {} as Component

  // no params
  expect(s1.getAll()).toHaveLength(2)

  // add 1
  expect(s1.getAll(tmp)).toHaveLength(3)
  expect(s1.getAll(tmp)[0]).toBe(tmp)

  // exclude 1
  expect(s1.getAll(null, comp1)).toHaveLength(1)
  expect(s1.getAll(null, comp1)[0]).toBe(comp2)

  // add 1 and exclude 1
  expect(s1.getAll(tmp, comp1)).toHaveLength(2)
  expect(s1.getAll(tmp, comp1)[0]).toBe(tmp)
  expect(s1.getAll(tmp, comp1)[1]).toBe(comp2)
})

test('Test browseInstancesAndModel  method', () => {
  // In this test:
  // - s1 is a symbol
  // - comp1 and comp2 are instances of s1
  // - child11 and child12 are children of comp1
  // - child21 and child22 are children of comp2
  const { s1, comp1, child11, child12, comp2, child21, child22, child111, child211 } = getTestSymbols()
  const model = s1.get('model')
  const model11 = model.components().models[0]
  const model12 = model.components().models[1]
  const model111 = model11.components().models[0]

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
  expect(model111.get('symbolChildId')).toBe(child111.cid)

  // Find the 2 symbols in s1 which correspond to child11 in the model and in comp2
  // This makes jest crash: expect(cbk).toHaveBeenCalledWith(child11)
  const cbk:any = jest.fn()
  s1.browseInstancesAndModel(comp1, [child11], cbk)
  expect(cbk).toHaveBeenCalledTimes(2)
  expect(cbk.mock.calls[0][0][0].cid).toBe(model11.cid)
  expect(cbk.mock.calls[1][0][0].cid).toBe(child21.cid)
  cbk.mockReset()
  s1.browseInstancesAndModel(comp1, [child111], cbk)
  expect(cbk).toHaveBeenCalledTimes(2)
  expect(cbk.mock.calls[0][0][0].cid).toBe(model111.cid)
  expect(cbk.mock.calls[1][0][0].cid).toBe(child211.cid)
  expect(cbk).toHaveBeenCalledTimes(2) // called with model and 1 instance
  // 1 result element correspondint to child111
  expect(cbk.mock.calls[0][0]).toHaveLength(1)
  cbk.mockReset()
  // FIXME: not sure why this breaks the test
  // // child111 not found in S3
  // expect(cbk.mock.calls[0][0][0]).toBe(null)
  // // 1 result element correspondint to child111
  // expect(cbk.mock.calls[1][0]).toHaveLength(1)
  // // child111 not found in S3
  // expect(cbk.mock.calls[1][0][0]).toBe(null)
})

test('Test getAll method', () => {
  const { s1, comp1 } = getTestSymbols()
  expect(() => s1.getAll()).not.toThrow()
  expect(s1.getAll() instanceof Array).toBe(true)
  expect(s1.get('instances').size).toBe(2)
  expect(s1.getAll()).toHaveLength(2)
  expect(s1.getAll({} as Component)).toHaveLength(3)
  expect(s1.getAll(null, {} as Component)).toHaveLength(2)
  expect(s1.getAll(null, comp1)).toHaveLength(1)
})

describe('Test applyAttributes method', () => {
  test('update attributes of instances', () => {
    const { s1, comp1, comp2 } = getTestSymbols()
    const changed = { test: 'test' }
    comp1.getChangedProps = () => changed
    comp1._previousAttributes = comp1.attributes
    expect(() => s1.applyAttributes(comp1, comp1)).not.toThrow()
    s1.applyAttributes(comp1, comp1)
    expect(comp2.get('test')).toBe(comp1.get('test'))
    expect(s1.get('model').get('test')).toBe(comp1.get('test'))
  })
  test('update attributes of comp1 children', () => {
    const { s1, comp1, child11, child21, child12, child22 } = getTestSymbols()
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

test('Test create instance', () => {
  const { s1, comp1, child11, child111 } = getTestSymbols()

  const comp1Clone = s1.createInstance()

  expect(comp1Clone.components()).toHaveLength(2)
  expect(comp1Clone.cid).not.toBe(comp1.cid)
  expect(comp1Clone.get('symbolId')).not.toBeUndefined()
  expect(comp1Clone.get('symbolId')).toBe(comp1.get('symbolId'))

  expect(comp1Clone.components()).toHaveLength(2)
  const child11Clone = comp1Clone.components().models[0]
  expect(child11Clone.cid).not.toBe(child11.cid)
  expect(child11Clone.get('symbolChildId')).not.toBeUndefined()
  expect(child11Clone.get('symbolChildId')).toBe(child11.get('symbolChildId'))
  expect(child11Clone.get('test')).toBe(child11.get('test'))

  expect(child11Clone.components().models).toHaveLength(1)
  const child111Clone = child11Clone.components().models[0]
  expect(child111Clone.cid).not.toBe(child111.cid)
  expect(child111Clone.get('symbolChildId')).not.toBeUndefined()
  expect(child111Clone.get('symbolChildId')).toBe(child111.get('symbolChildId'))
  expect(child111Clone.get('test')).toBe(child111.get('test'))
})
