import { find, closestInstance } from './utils.js'
import { getTestSymbols } from './test-utils.js'

test('Test find', () =>{
  const { comp1, child11, s1 } = getTestSymbols()
  // all components have symbolId or symbolChildId set
  expect(find(comp1, null)).toBeUndefined()
  // find one child
  const id = 'testChildId'
  const oldId = child11.get('symbolChildId')
  child11.set('symbolChildId', id)
  expect(find(comp1, id)).toBe(child11)
  child11.set('symbolChildId', oldId)
})

test('Test closestInstance', () =>{
  const { comp1, child11 } = getTestSymbols()
  expect(closestInstance(null)).toBeNull()
  expect(closestInstance(comp1)).toBe(comp1)
  expect(closestInstance(child11)).toBe(comp1)
})

