import { CompoundSelector, toString, specificity, fromString } from './CompoundSelector'
import { SimpleSelectorType, SimpleSelector, TagSelector, IdSelector, ClassSelector, AttributeSelector, UniversalSelector } from './SimpleSelector'
import { PseudoClass } from './PseudoClass'

type AnySelector = TagSelector | IdSelector | ClassSelector | AttributeSelector | UniversalSelector

const tagSelector: TagSelector = { type: SimpleSelectorType.TAG, value: 'div', active: true }
const IdSelector: IdSelector = { type: SimpleSelectorType.ID, value: 'main', active: true }
const classSelector: ClassSelector = { type: SimpleSelectorType.CLASS, value: 'container', active: true }
const attributeSelector: AttributeSelector = { type: SimpleSelectorType.ATTRIBUTE, value: 'data-test', active: true }
const universalSelector: UniversalSelector = { type: SimpleSelectorType.UNIVERSAL, active: true }

const pseudoClass = {
  type: 'hover',
  hasParam: false,
  sentencePre: 'prefix ',
}

// Mock functions from SimpleSelector and PseudoClass
jest.mock('./SimpleSelector', () => ({
  ...jest.requireActual('./SimpleSelector'),
  toString: (selector: AnySelector) => {
    switch (selector.type) {
    case 'id': return `#${selector.value}`
    case 'class': return `.${selector.value}`
    case 'tag': return selector.value
    case 'attribute': return `[${selector.value}]`
    case 'universal': return '*'
    default: return ''
    }
  },
  specificity: (selector: SimpleSelector) => {
    switch (selector.type) {
    case 'id': return 100
    case 'class': return 10
    case 'tag': return 1
    case 'attribute': return 10
    case 'universal': return 0
    default: return 0
    }
  }
}))

jest.mock('./PseudoClass', () => ({
  toString: (pseudoClass: PseudoClass) => `:${pseudoClass.type}`,
  PSEUDO_CLASSES: jest.requireActual('./PseudoClass').PSEUDO_CLASSES,
}))

describe('CompoundSelector', () => {
  test('toString - builds correct selector string', () => {
    expect(toString({
      selectors: [
        tagSelector,
        classSelector,
        IdSelector,
      ]
    } as CompoundSelector)).toBe('div#main.container')

    expect(toString({
      selectors: [
        classSelector,
      ],
      pseudoClass,
    } as CompoundSelector)).toBe('.container:hover')

    expect(toString({
      selectors: [
        tagSelector,
        {
          ...IdSelector,
          active: false,
        },
        classSelector,
      ]
    })).toBe('div.container')

    expect(toString({
      selectors: [
        IdSelector,
        classSelector,
      ]
    })).toBe('#main.container')

    expect(toString({
      selectors: [
        classSelector,
        IdSelector,
      ]
    })).toBe('#main.container')

    expect(toString({
      selectors: [
        classSelector,
        tagSelector,
        IdSelector,
      ]
    })).toBe('div#main.container')

    expect(() => toString({
      selectors: [
        universalSelector,
        classSelector,
        tagSelector,
        IdSelector,
      ]
    })).toThrow()

    expect(toString({
      selectors: [
        attributeSelector,
        classSelector,
        tagSelector,
        IdSelector,
      ]
    })).toBe('div#main.container[data-test]')
  })

  test('specificity - calculates correct specificity', () => {
    expect(specificity({
      selectors: [
        IdSelector,
        classSelector,
        tagSelector,
      ]
    })).toBe(100 + 10 + 1) // ID (100) + Class (10) + Tag (1)

    expect(specificity({
      selectors: [
        classSelector,
      ],
      pseudoClass,
    } as CompoundSelector)).toBe(10 + 10) // Class (10) + Pseudo-Class (10)

    expect(specificity({
      selectors: [
        {
          ...classSelector,
          active: false,
        },
        classSelector,
      ]
    })).toBe(10) // Only the active class contributes
  })
})

describe('parseSelectorString', () => {
  test('parses a tag selector', () => {
    const result = fromString('div')
    expect(result.selectors).toEqual([{ type: SimpleSelectorType.TAG, value: 'div', active: true }])
  })

  test('parses an ID selector', () => {
    const result = fromString('#main')
    expect(result.selectors).toEqual([{ type: SimpleSelectorType.ID, value: 'main', active: true }])
  })

  test('parses a class selector', () => {
    const result = fromString('.container')
    expect(result.selectors).toEqual([{ type: SimpleSelectorType.CLASS, value: 'container', active: true }])
  })

  test('parses a universal selector', () => {
    const result = fromString('*')
    expect(result.selectors).toEqual([{ type: SimpleSelectorType.UNIVERSAL, active: true }])
  })

  test('parses an attribute selector', () => {
    const result = fromString('[data-role=button]')
    expect(result.selectors).toEqual([
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-role', operator: '=', attributeValue: 'button', active: true },
    ])
  })

  test('parses an attribute selector with quotes', () => {
    const result = fromString('[data-id="123"]')
    expect(result.selectors).toEqual([
      { type: SimpleSelectorType.ATTRIBUTE, value: 'data-id', operator: '=', attributeValue: '123', active: true },
    ])
  })

  test('parses a tag with a class', () => {
    const result = fromString('button.primary')
    expect(result.selectors).toEqual([
      { type: SimpleSelectorType.TAG, value: 'button', active: true },
      { type: SimpleSelectorType.CLASS, value: 'primary', active: true },
    ])
  })

  test('parses a tag with an ID', () => {
    const result = fromString('nav#main-menu')
    expect(result.selectors).toEqual([
      { type: SimpleSelectorType.TAG, value: 'nav', active: true },
      { type: SimpleSelectorType.ID, value: 'main-menu', active: true },
    ])
  })

  test('parses a selector with a pseudo-class', () => {
    const result = fromString('a:hover')
    expect(result.selectors).toEqual([{ type: SimpleSelectorType.TAG, value: 'a', active: true }])
    expect(result.pseudoClass?.type).toBe('hover')
  })

  test('parses a selector with multiple classes and a pseudo-class', () => {
    const result = fromString('.button.large:focus')
    expect(result.selectors).toEqual([
      { type: SimpleSelectorType.CLASS, value: 'button', active: true },
      { type: SimpleSelectorType.CLASS, value: 'large', active: true },
    ])
    expect(result.pseudoClass?.type).toBe('focus')
  })

  test('parses a selector with a pseudo-class with params', () => {
    const result = fromString(':nth-child(2)')
    expect(result.selectors).toEqual([])
    expect(result.pseudoClass?.type).toBe('nth-child')
    expect(result.pseudoClass?.param).toBe('2')
  })
})