import { fromString, Operator, OPERATORS, OperatorType, toString } from './Operator'

// Mock CompoundSelector toString
const compoundToString = jest.fn()
jest.mock('./CompoundSelector', () => ({
  toString: (compound: any) => compoundToString(compound),
}))

describe('Operator', () => {
  test('toString - builds correct operator string', () => {
    const compound = { selectors: [] }
    compoundToString.mockReturnValue('#div')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.DESCENDANT) as Operator, compound)).toBe(' #div')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.CHILD) as any, compound)).toBe(' > #div')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.ADJACENT) as any, compound)).toBe(' + #div')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.GENERAL_SIBLING) as any, compound)).toBe(' ~ #div')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.HAS) as any, compound)).toBe(':has(#div)')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.NOT) as any, compound)).toBe(':not(#div)')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.IS) as any, compound)).toBe(':is(#div)')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.WHERE) as any, compound)).toBe(':where(#div)')
  })

  test('toString - builds correct operator string when there is no related selector', () => {
    const compound = { selectors: [] }
    compoundToString.mockReturnValue('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.DESCENDANT) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.CHILD) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.ADJACENT) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.GENERAL_SIBLING) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.HAS) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.NOT) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.IS) as any, compound)).toBe('')
    expect(toString(OPERATORS.find(o => o.type === OperatorType.WHERE) as any, compound)).toBe('')
  })
  
  test('fromString - builds correct operator object', () => {
    expect(fromString(' > ').type).toEqual(OperatorType.CHILD)
    expect(fromString(' + ').type).toEqual(OperatorType.ADJACENT)
    expect(fromString(' ~ ').type).toEqual(OperatorType.GENERAL_SIBLING)
    expect(fromString(':has').type).toEqual(OperatorType.HAS)
    expect(fromString(':not').type).toEqual(OperatorType.NOT)
    expect(fromString(':is').type).toEqual(OperatorType.IS)
    expect(fromString(':where').type).toEqual(OperatorType.WHERE)
  })
})
