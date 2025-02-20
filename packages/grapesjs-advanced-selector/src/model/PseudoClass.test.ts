import { fromString, PSEUDO_CLASSES, toString } from './PseudoClass'

describe('PseudoClass', () => {
  test('toString should return correct string representation', () => {
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'hover')!)).toBe(':hover')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'nth-child')!)).toBe(':nth-child()')
  })
  test('fromString should return correct pseudo-class object', () => {
    expect(fromString(':hover')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'hover'))
    expect(fromString(':nth-child()')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'nth-child'))
    expect(fromString(':nth-child(2n+1)')).toEqual({
      ...PSEUDO_CLASSES.find(p => p.type === 'nth-child'),
      param: '2n+1',
    })
  })
  test('fromString should throw error if pseudo-class is invalid', () => {
    expect(() => fromString(':NOTVALID')).toThrow()
  })
})