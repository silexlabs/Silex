import {
  AttributeSelector,
  ClassSelector,
  CustomTagSelector,
  IdSelector,
  SimpleSelector,
  SimpleSelectorType,
  TAGS,
  TagSelector,
  UniversalSelector,
  isSameSelector,
  toString,
  getDisplayType,
  getDisplayName,
  validate,
  suggest,
  getCreationSuggestions,
  getEditableName
} from './SimpleSelector'

describe('SimpleSelector', () => {
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
    expect(isSameSelector({ type: SimpleSelectorType.ATTRIBUTE, value: 'test', operator: undefined, attributeValue: 'test2' } as AttributeSelector, { type: SimpleSelectorType.ATTRIBUTE, value: 'test' } as AttributeSelector)).toBe(true)
    expect(isSameSelector({ type: SimpleSelectorType.ATTRIBUTE, value: 'test', operator: '=', attributeValue: 'test2' } as AttributeSelector, { type: SimpleSelectorType.ATTRIBUTE, value: 'test' } as AttributeSelector)).toBe(false)
    // Active is irrelevant
    expect(isSameSelector({ type: SimpleSelectorType.CLASS, value: 'test', active: true } as ClassSelector, { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector)).toBe(true)
    expect(isSameSelector({ type: SimpleSelectorType.CLASS, value: 'test', active: true } as ClassSelector, { type: SimpleSelectorType.CLASS, value: 'test', active: false } as ClassSelector)).toBe(true)
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
    expect(getDisplayType({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe('•')
    expect(getDisplayType({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe('#')
    expect(getDisplayType({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(getDisplayType({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe('⚛')
    expect(getDisplayType({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('⚛')
    expect(getDisplayType({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('[ ]')
  })

  test('getDisplayName should return correct string', () => {
    const active = true
    const value = 'test'
    expect(getDisplayName({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe(value)
    expect(getDisplayName({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe(value)
    expect(getDisplayName({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(getDisplayName({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe(TAGS[0])
    expect(getDisplayName({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('the-component')
    expect(getDisplayName({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('data-test')
    expect(getDisplayName({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', operator: '=', attributeValue: 'test', active } as AttributeSelector)).toBe('data-test')
  })

  test('getEditableName should return the correct selector string', () => {
    const active = true
    const value = 'test'
    expect(getEditableName({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe(`.${value}`)
    expect(getEditableName({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe(`#${value}`)
    expect(getEditableName({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(getEditableName({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe(TAGS[0])
    expect(getEditableName({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('the-component')
    expect(getEditableName({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('[data-test]')
    expect(getEditableName({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', operator: '=', attributeValue: 'test', active } as AttributeSelector)).toBe('[data-test]')
  })

  test('toString should return the full selector string', () => {
    const active = true
    const value = 'test'
    expect(toString({ type: SimpleSelectorType.CLASS, value, active } as ClassSelector)).toBe(`.${value}`)
    expect(toString({ type: SimpleSelectorType.ID, value, active } as IdSelector)).toBe(`#${value}`)
    expect(toString({ type: SimpleSelectorType.UNIVERSAL, active } as UniversalSelector)).toBe('*')
    expect(toString({ type: SimpleSelectorType.TAG, value: TAGS[0], active } as TagSelector)).toBe(TAGS[0])
    expect(toString({ type: SimpleSelectorType.CUSTOM_TAG, value: 'the-component', active } as CustomTagSelector)).toBe('the-component')
    expect(toString({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active } as AttributeSelector)).toBe('[data-test]')
    expect(toString({ type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', operator: '=', attributeValue: 'test', active } as AttributeSelector)).toBe('[data-test="test"]')
  })

  test('validate should return false for invalid value, and the fixed value otherwise', () => {
    expect(validate('1invalid')).toBe(false)
    expect(validate('')).toBe('')
    expect(validate(' ')).toBe(false) // starting with space
    expect(validate('-')).toBe(false)
    expect(validate('*')).toBe('*')
    expect(validate('the')).toBe('.the')
    expect(validate('the-')).toBe(false)
    expect(validate('the-component')).toBe('the-component')
    expect(validate('almost -valid')).toBe('almost--valid') // custom tag not starting with data-
    expect(validate('9invalid')).toBe(false)
    expect(validate('invalid ')).toBe(false)
    expect(validate('inva lid')).toBe('inva-lid')
    expect(validate('data-')).toBe(false)
    expect(validate('data-test')).toBe('data-test')
    expect(validate('div')).toBe('div')
    expect(validate('a')).toBe('a')
    expect(validate('A')).toBe('a')
    expect(validate('.')).toBe(false)
    expect(validate('.valid')).toBe('.valid')
    expect(validate('.almost -valid')).toBe('.almost--valid')
    expect(validate('#')).toBe(false)
    expect(validate('#valid')).toBe('#valid')
    expect(validate('#almost -valid')).toBe('#almost--valid')
    expect(validate('[')).toBe(false)
    expect(validate('[placeholder]')).toBe('[placeholder]')
    expect(validate('[test')).toBe(false)
    expect(validate('[test]')).toBe(false)
    expect(validate('[data-')).toBe(false)
    expect(validate('[data-test]')).toBe('[data-test]')
    expect(validate('[data-test')).toBe('[data-test]')
  })

  test('suggest should return creation suggestions for empty filter or *', () => {
    //expect(suggest('', []).length).toBeGreaterThan(0)
    //expect(suggest('', [])[0].createValue).toBe('.')
    expect(suggest('*', [])).toHaveLength(0)
  })

  test('suggest should return filtered suggestions', () => {
    const selector: SimpleSelector = { type: SimpleSelectorType.CLASS, value: 'test' } as ClassSelector
    const suggestions = suggest('test', [selector])
    expect(suggestions.length).toBe(1)
    expect(suggestions[0].type).toBe(SimpleSelectorType.CLASS)
  })

  test('addCreationSuggestions', () => {
    expect(getCreationSuggestions('.test')[0].type).toBe(SimpleSelectorType.CLASS)
    expect(getCreationSuggestions('#test')).toEqual([]) // The IDs exist so they will be suggested
    expect(getCreationSuggestions('div')).toEqual([]) // The tag exists so it will be suggested
    expect(getCreationSuggestions('[data-test]')[0].type).toBe(SimpleSelectorType.ATTRIBUTE)
    expect(getCreationSuggestions('[data-test]')[0].type).toBe(SimpleSelectorType.ATTRIBUTE)
    expect(getCreationSuggestions('*')[0].type).toBe(SimpleSelectorType.UNIVERSAL)

    const suggestAttr = getCreationSuggestions('[data-test="test value"]')
    expect(suggestAttr).toHaveLength(1)
    expect((suggestAttr[0] as AttributeSelector).type).toBe(SimpleSelectorType.ATTRIBUTE)
    expect((suggestAttr[0] as AttributeSelector).value).toEqual('data-test="test value"')

    expect(getCreationSuggestions('test')).toHaveLength(0)
    expect(getCreationSuggestions('.test')).toHaveLength(1)
    expect(getCreationSuggestions('.test')[0].type).toBe(SimpleSelectorType.CLASS)
    expect((getCreationSuggestions('.test')[0] as ClassSelector).value).toBe('test')

    expect(getCreationSuggestions(false)).toHaveLength(0)
  })
})
