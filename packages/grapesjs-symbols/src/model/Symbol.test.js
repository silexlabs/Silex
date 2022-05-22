import { getTestSymbols } from '../test-utils'

// test('Initialize symbol with values', () => {
//   const { s1, comp1, child11, child12, s1Data } = getTestSymbols()
//   expect(s1.get('symbolId')).toBe(s1Data.symbolId)
//   expect(s1.get('instances')).not.toBeUndefined()
//   expect(s1.get('instances') instanceof Map).toBe(true)
//   expect(s1.get('instances').size).toBe(2)
//   expect(s1.get('label')).toBe('S1')
//   expect(s1.get('icon')).toBe('fa-cog')
//   expect(comp1.get('symbolId')).toBe(s1Data.symbolId)
//   expect(comp1.get('symbolChildId')).toBeUndefined()
//   expect(child11.get('symbolChildId')).not.toBeUndefined()
//   expect(child11.get('symbolId')).toBeUndefined()
// 
//   expect(s1.get('model').get('symbolId')).toBe(s1Data.symbolId)
//   expect(comp1.get('symbolId')).toBe(s1Data.symbolId)
//   expect(child11.get('symbolChildId')).toBe(s1Data.symbolId)
//   expect(child12.get('symbolChildId')).toBe(s1Data.symbolId)
// })
// 
// test('Initialize symbol with default values', () => {
//   const { s2, comp3 } = getTestSymbols()
//   expect(s2.get('label')).not.toBeUndefined()
//   expect(s2.get('icon')).not.toBeUndefined()
// })
// 
// test('Test data to save has only needed data', () => {
//   const { s1, s1Data, comp1, child11, child12 } = getTestSymbols()
//   expect(s1.get('model').get('symbolId')).toBe(s1Data.symbolId)
//   expect(s1.get('model').get('symbolId')).toBe(comp1.get('symbolId'))
//   expect(s1.toJSON().instances).toBeUndefined()
//   expect(s1.toJSON().symbolId).toBe(s1Data.symbolId)
//   //expect(s1.toJSON().attributes.symbolId).toBe(s1Data.symbolId)
//   expect(s1.toJSON().model.attributes.symbolId).toBe(s1Data.symbolId)
//   // this test makes jest crash:
//   // expect(s1.toJSON()).toEqual({
//   //   ...s1Data,
//   //   symbolId,
//   //   model: comp1,
//   // })
// })
// 
// test('Test getAll method', () => {
//   const { s1, comp1 } = getTestSymbols()
//   expect(() => s1.getAll()).not.toThrow()
//   expect(s1.getAll() instanceof Array).toBe(true)
//   expect(s1.get('instances').size).toBe(2)
//   expect(s1.getAll()).toHaveLength(2)
//   expect(s1.getAll({})).toHaveLength(3)
//   expect(s1.getAll(null, {})).toHaveLength(2)
//   expect(s1.getAll(null, comp1)).toHaveLength(1)
// })

describe('Test applyAttributes method', () => {
  test('update attributes of instances', () => {
    let { s1, comp1, comp2, child11, child21, child12, child22 } = getTestSymbols()
    const changed = { test: 'test' }
    comp1.getChangedProps = () => changed
    comp1._previousAttributes = comp1.attributes
    expect(() => s1.applyAttributes(comp1, comp1)).not.toThrow()
    s1.applyAttributes(comp1, comp1)
    expect(comp2.get('test')).toBe('test')
    expect(s1.get('model').get('test')).toBe('test')
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
    expect(child21.get('test')).toBe('test')
    // the model children should be updated too
    expect(s1.get('model').components().models[0].get('test')).toBe('test')
  })
})
