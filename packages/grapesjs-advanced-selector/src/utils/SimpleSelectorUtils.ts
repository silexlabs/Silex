import { AttributeSelector, SELECTOR_OPERATORS, SimpleSelector, SimpleSelectorType, SimpleSelectorSuggestion, TAGS, ClassSelector, IdSelector, TagSelector, TAG } from "../model/SimpleSelector"

const MAX_SUGGEST_RELATED = 5

export function isSameSelector(a: SimpleSelector, b: SimpleSelector): boolean {
  if (a.type !== b.type) return false
  switch (a.type) {
    case SimpleSelectorType.TAG:
    case SimpleSelectorType.CUSTOM_TAG:
    case SimpleSelectorType.CLASS:
    case SimpleSelectorType.ID: {
      const typedA = a as AttributeSelector
      const typedB = b as AttributeSelector
      return typedA.value === typedB.value
    }
    case SimpleSelectorType.ATTRIBUTE: {
      const typedA = a as AttributeSelector
      const typedB = b as AttributeSelector
      return typedA.attributeValue === typedB.attributeValue && typedA.operator === typedB.operator && typedA.value === typedB.value
    }
    case SimpleSelectorType.UNIVERSAL: {
      return true
    }
    default:
      return false
  }
}

export function toString(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.ATTRIBUTE: {
      const typed = selector as AttributeSelector
      return `[${typed.value}${typed.operator ? `${typed.operator}"${typed.attributeValue ?? ''}"` : ''}]`
    }
    case SimpleSelectorType.CLASS: {
      const typed = selector as AttributeSelector
      return `.${typed.value}`
    }
    case SimpleSelectorType.ID: {
      const typed = selector as AttributeSelector
      return `#${typed.value}`
    }
    case SimpleSelectorType.TAG: {
      const typed = selector as AttributeSelector
      return typed.value
    }
    case SimpleSelectorType.CUSTOM_TAG: {
      const typed = selector as AttributeSelector
      return typed.value
    }
    case SimpleSelectorType.UNIVERSAL: {
      return '*'
    }
    default:
      return '?'
  }
}

export function getDisplayType(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.ATTRIBUTE:
      return '[ ]'
    case SimpleSelectorType.CLASS:
      return '.'
    case SimpleSelectorType.ID:
      return '#'
    case SimpleSelectorType.TAG:
      return ''
    case SimpleSelectorType.UNIVERSAL:
      return '*'
    case SimpleSelectorType.CUSTOM_TAG:
      return '⚛'
    default:
      return '?'
  }
}

export function getFilterFromSelector(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.CLASS: 
      return `.${(selector as ClassSelector).value}`
    case SimpleSelectorType.ID:
      return `#${(selector as IdSelector).value}`  
    case SimpleSelectorType.TAG:
      return (selector as TagSelector).value
    case SimpleSelectorType.ATTRIBUTE:
      return `[${(selector as AttributeSelector).value}]`
    case SimpleSelectorType.UNIVERSAL:
      return '*'
    case SimpleSelectorType.CUSTOM_TAG:
      return (selector as AttributeSelector).value
    default:
      return ''
  }
}

/**
 * Determines if the value is valid for the selector
 * If not valid, will try to suggest a valid value
 */
export function validate(_value: string): string | false {
  // Special cases
  if (_value === '') return _value
  if (_value === '*') return _value
  // Escape special characters for the regular expression
  const escapedOperators = SELECTOR_OPERATORS.map(op => `\\${op}`).join('|')
  const value = _value
   .toLowerCase()
   .replace(new RegExp(escapedOperators, 'g'), '-')
  // No starting with number or -
  if (value.match(/^[0-9-]/)) return false
  if (value.startsWith('-')) return false
  // Custom attributes should start with data-
  if (value.match(/^data-./)) return value
  // Custom tags should contain a -
  if(value.match(/^[a-z-]*[a-z]$/) && value.includes('-')) return value
  // Tags should be from the TAGS list
  if (value.match(/^[a-z]*$/) && TAGS.includes(value as TAG)) return value
  return false
}

/**
 * Get a list of suggestions, filtered and with creation suggestions
 */
export function suggest(filter: string, suggestions: SimpleSelector[]): SimpleSelectorSuggestion[] {
  if (filter === '') {
    // Suggest to start typing `.`, `#`, `[`, `*`, or a tag name
    return [
      { createText: 'Start typing "." for classes', type: SimpleSelectorType.CLASS, value: '', active: true, },
      { createText: 'Start typing "#" for IDs', type: SimpleSelectorType.ID, value: '', active: true, },
      { createText: 'Start typing "[" for attributes', type: SimpleSelectorType.ATTRIBUTE, value: '', active: true, },
      { createText: `Start typing a tag name (e.g., "${TAGS[0]}")`, type: SimpleSelectorType.TAG, value: TAGS[0], active: true, },
      { createText: 'Start typing a custom tag name', type: SimpleSelectorType.CUSTOM_TAG, value: '', active: true, },
      { createText: 'Start typing "*" for universal selector', type: SimpleSelectorType.UNIVERSAL, active: true, },
    ] as SimpleSelectorSuggestion[]
  }
  if (filter === '*') {
    // Suggest to start typing a tag name
    return [{ type: SimpleSelectorType.UNIVERSAL, active: true, }]
  }
  // Limit the number of suggestions by type of selector
  const typeCount = new Map<SimpleSelectorType, number>()
  return suggestions
    // Limit the number of suggestions by type of selector
    .reduce((acc, selector) => {
      const type = selector.type
      const count = typeCount.get(type) || 0
      if (count < MAX_SUGGEST_RELATED) {
        acc.push(selector)
        typeCount.set(type, count + 1)
      }
      return acc
    }, [] as SimpleSelector[])
}
