import { AttributeSelector, ClassSelector, CustomTagSelector, IdSelector, SimpleSelector, SimpleSelectorType, TAGS, TagSelector, UniversalSelector } from "../model/SimpleSelector"
import { isSameSelector, toString, getDisplayType, getFilterFromSelector, validate, suggest } from "./SimpleSelectorUtils"

describe('SimpleSelectorUtils', () => {
  test('isSameSelector should return true for same selectors', () => {
    const selectorA: SimpleSelector = { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector
    const selectorB: SimpleSelector = { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector
    expect(isSameSelector(selectorA, selectorB)).toBe(true)
  })

  test('isSameSelector should return false for different selectors', () => {
    const selectorRef: SimpleSelector = { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector
    expect(isSameSelector(selectorRef, { type: SimpleSelectorType.CLASS, value: 'test2' } as ClassSelector)).toBe(false)
    expect(isSameSelector(selectorRef, { type: SimpleSelectorType.ID, value: 'test' } as IdSelector)).toBe(false)
    expect(isSameSelector(selectorRef, { type: SimpleSelectorType.UNIVERSAL } as UniversalSelector)).toBe(false)
  })

  test('toString should return correct string representation', () => {
    const active = true
    const value = 'test'
    expect(toString({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe('.test')
    expect(toString({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe('#test')
    expect(toString({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(toString({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe(TAGS[0])
    expect(toString({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('the-component')
    expect(toString({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('[data-test]')
  })

  test('getDisplayType should return correct display type', () => {
    const active = true
    const value = 'test'
    expect(getDisplayType({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe('.')
    expect(getDisplayType({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe('#')
    expect(getDisplayType({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(getDisplayType({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe('')
    expect(getDisplayType({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('⚛')
    expect(getDisplayType({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('[ ]')
  })

  test('getFilterFromSelector should return correct filter', () => {
    const active = true
    const value = 'test'
    expect(getFilterFromSelector({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe(`.${value}`)
    expect(getFilterFromSelector({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe(`#${value}`)
    expect(getFilterFromSelector({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(getFilterFromSelector({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe(TAGS[0])
    expect(getFilterFromSelector({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('the-component')
    expect(getFilterFromSelector({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe(`[data-test]`)
  })

  test('validate should return false for invalid value', () => {
    expect(validate('1invalid')).toBe(false)
    expect(validate('')).toBe('')
    expect(validate(' ')).toBe(false) // starting with space
    expect(validate('-')).toBe(false)
    expect(validate('the-')).toBe(false)
    expect(validate('the-component')).toBe('the-component')
    expect(validate('almost -valid')).toBe('almost--valid') // custom tag not starting with data-
    expect(validate('invalid')).toBe(false) // tag not in the tag list
    expect(validate('data-')).toBe(false)
    expect(validate('data-test')).toBe('data-test')
    expect(validate('div')).toBe('div')
    expect(validate('a')).toBe('a')
    expect(validate('A')).toBe('a')
  })

  test('suggest should return creation suggestions for empty filter', () => {
    const suggestions = suggest('', [])
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].createText).toBe('Start typing "." for classes')
  })

  test('suggest should return filtered suggestions', () => {
    const selector: SimpleSelector = { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector
    const suggestions = suggest('test', [selector])
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].type).toBe(SimpleSelectorType.CLASS)
  })
})
