import { getTestSymbols } from '../test-utils'
import Symbols, { closestInstance } from './Symbols.js'

describe('Make sure everything has the correct data type and default values', () => {
  // mock editor
  let editor, options
  beforeEach(() => {
    editor = {}
    options =  {
      headless: true,
    }
  })

  test('Initialize symbols with test data', () => {
    const { s1, s1Data, comp1 } = getTestSymbols()
    const symbols = new Symbols([s1], { options, editor})
    expect(symbols).toHaveLength(1)
    expect(comp1.get('symbolId')).toBe(s1Data.symbolId)
    expect(symbols.get(s1Data.symbolId)).not.toBeUndefined()
    expect(symbols.get(s1Data.symbolId).get('label')).toBe(s1Data.label)
    expect(symbols.get(s1Data.symbolId).get('instances')).not.toBeUndefined()
    expect(symbols.get(s1Data.symbolId).get('instances') instanceof Map).toBe(true)
  })

  test('Initialize symbols with default values', () => {
    const { s1, s2 } = getTestSymbols()
    const symbols = new Symbols([s1], { options, editor})
    const s2Inst = symbols.add(s2)
    const symbolId = s2Inst.get('symbolId')
    expect(symbols).toHaveLength(2)
    expect(symbolId).not.toBeUndefined()
    expect(symbols.get(symbolId)).not.toBeUndefined()
    expect(symbols.get(symbolId).get('label')).not.toBeUndefined()
    expect(symbols.get(symbolId).get('instances')).not.toBeUndefined()
    expect(symbols.get(symbolId).get('instances') instanceof Map).toBe(true)
  })
})

// describe('Test event listeners which maintain the components list up to date', () => {
//   let s1, s2, comp1
//   let editor, options
//   beforeEach(() => {
//     // mock editor
//     editor = {}
//     options =  {
//       headless: true,
//     }
//     const symbols = getTestSymbols()
//     s1 = symbols.s1
//     s2 = symbols.s2
//     comp1 = symbols.comp1
//     editor.Symbols = new Symbols([s1, s2], { options, editor})
//   })
// 
//   test('onAdd method', () => {
//     const comp = new Backbone.Model({
//       tagName: 'div',
//       content: 'comp S1',
//       symbolId: 'S1',
//     })
// 
//     const components = s1.getComponents()
//     expect(components.size).toBe(2)
//     onAdd(editor, comp)
//     const added = components.get(comp.cid)
//     expect(added).toBe(comp)
//     expect(components.size).toBe(3)
//   })
// 
//   test('onRemove method', () => {
//     const components = s1.getComponents()
//     onRemove(editor, comp1)
//     expect(components.size).toBe(1)
//     expect(components.get(comp1.cid)).toBeUndefined()
//   })
// })
// 
// test('Test closestSymbol', () => {
//   const { child11, child12, child21, child22, comp1, comp2, s1, s2, s1Data } = getTestSymbols()
//   expect(() => closestSymbol(child11)).not.toThrow()
//   expect(closestSymbol(comp1)).toBe(comp1)
//   expect(closestSymbol(child11)).toBe(comp1)
//   expect(closestSymbol(child21)).toBe(comp2)
// })
