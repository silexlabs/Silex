import { CompoundSelector, toString, specificity } from './CompoundSelector'
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
  toString: (pseudoClass: PseudoClass) => `:${pseudoClass.type}`
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
