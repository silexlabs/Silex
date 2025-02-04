import { AttributeSelector, SimpleSelector, SimpleSelectorType } from "../model/SimpleSelector";

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

export function simpleSelectorToString(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.ATTRIBUTE: {
      const typed = selector as AttributeSelector
      return `[${typed.attributeValue}${typed.value ? `${typed.operator}"${typed.value}"` : ''}]`
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
    case SimpleSelectorType.UNIVERSAL: {
      return '*'
    }
    default:
      return '?'
  }
}

export function getDisplayName(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.ATTRIBUTE: {
      const typed = selector as AttributeSelector
      return `${typed.value}${typed.operator ? `${typed.operator}"${typed.attributeValue}"` : ''}`
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
    case SimpleSelectorType.UNIVERSAL: {
      return '*'
    }
    default:
      return '?'
  }
}

export function getFilterFromSelector(selector: SimpleSelector): string {
  switch (selector.type) {
    case SimpleSelectorType.CLASS: 
    case SimpleSelectorType.ID:
    case SimpleSelectorType.TAG:
    case SimpleSelectorType.ATTRIBUTE:
      const typed = selector as AttributeSelector
      return typed.value
    case SimpleSelectorType.UNIVERSAL:
      return '*'
    default:
      return ''
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
      return 'TAG'
    case SimpleSelectorType.UNIVERSAL:
      return '*'
    case SimpleSelectorType.CUSTOM_TAG:
      return 'TAG'
    default:
      return '?'
  }
}
