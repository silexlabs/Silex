import { formatValidValues, requireStyleProperty } from './commands'

describe('styles:remove guards', () => {
  it('rejects a property that is not set and lists current keys', () => {
    expect(() => requireStyleProperty({ color: 'red', 'font-size': '16px' }, 'margin'))
      .toThrow('Property "margin" is not set. Current properties: color, font-size.')
  })

  it('rejects when the rule has no properties', () => {
    expect(() => requireStyleProperty({}, 'color'))
      .toThrow('Property "color" is not set. Current properties: (none).')
  })

  it('accepts a property that is set, including an empty value', () => {
    expect(() => requireStyleProperty({ color: 'red' }, 'color')).not.toThrow()
    expect(() => requireStyleProperty({ color: '' }, 'color')).not.toThrow()
  })

  it('formatValidValues joins or falls back to (none)', () => {
    expect(formatValidValues(['card', 'hero'])).toBe('card, hero')
    expect(formatValidValues([])).toBe('(none)')
  })
})
