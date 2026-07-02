import { fromString, PSEUDO_CLASSES, toString } from './PseudoClass'

describe('PseudoClass', () => {
  test('toString should return correct string representation', () => {
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'hover')!)).toBe(':hover')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'nth-child')!)).toBe(':nth-child()')
  })
  test('toString should use :: for pseudo-elements', () => {
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'before')!)).toBe('::before')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'after')!)).toBe('::after')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'first-line')!)).toBe('::first-line')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'first-letter')!)).toBe('::first-letter')
    expect(toString(PSEUDO_CLASSES.find(p => p.type === 'selection')!)).toBe('::selection')
  })
  test('fromString should return correct pseudo-class object', () => {
    expect(fromString(':hover')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'hover'))
    expect(fromString(':nth-child()')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'nth-child'))
    expect(fromString(':nth-child(2n+1)')).toEqual({
      ...PSEUDO_CLASSES.find(p => p.type === 'nth-child'),
      param: '2n+1',
    })
  })
  test('fromString should parse both :: and : for pseudo-elements', () => {
    expect(fromString('::selection')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'selection'))
    expect(fromString('::before')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'before'))
    expect(fromString(':before')).toEqual(PSEUDO_CLASSES.find(p => p.type === 'before'))
  })
  test('fromString should throw error if pseudo-class is invalid', () => {
    expect(() => fromString(':NOTVALID')).toThrow()
  })
})