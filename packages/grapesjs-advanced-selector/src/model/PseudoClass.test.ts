import { PSEUDO_CLASSES, toString } from "./PseudoClass"

describe('PseudoClass', () => {
  test('toString should return correct string representation', () => {
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'hover')!)).toBe(':hover')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'nth-child')!)).toBe(':nth-child()')
  })

})