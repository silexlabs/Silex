import { fromString, OperatorType, toString } from './Operator'

describe('Operator', () => {
  test('toString - builds correct operator string', () => {
    expect(toString({ type: OperatorType.DESCENDANT } as any)).toBe(' ')
    expect(toString({ type: OperatorType.CHILD } as any)).toBe(' > ')
    expect(toString({ type: OperatorType.ADJACENT } as any)).toBe(' + ')
    expect(toString({ type: OperatorType.GENERAL_SIBLING } as any)).toBe(' ~ ')
    expect(toString({ type: OperatorType.HAS } as any)).toBe(':has()')
    expect(toString({ type: OperatorType.NOT } as any)).toBe(':not()')
    expect(toString({ type: OperatorType.IS } as any)).toBe(':is()')
    expect(toString({ type: OperatorType.WHERE } as any)).toBe(':where()')
  })
  
  test('fromString - builds correct operator object', () => {
    expect(fromString('>').type).toEqual(OperatorType.CHILD)
    expect(fromString('+').type).toEqual(OperatorType.ADJACENT)
    expect(fromString('~').type).toEqual(OperatorType.GENERAL_SIBLING)
    expect(fromString(':has()').type).toEqual(OperatorType.HAS)
    expect(fromString(':not()').type).toEqual(OperatorType.NOT)
    expect(fromString(':is()').type).toEqual(OperatorType.IS)
    expect(fromString(':where()').type).toEqual(OperatorType.WHERE)
  })
})
