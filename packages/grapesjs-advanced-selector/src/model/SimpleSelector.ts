/**
 * @fileoverview The model types and functions for the simple selector
 * A Simple selector is made of a list of simple selectors, e.g `div`, `.class`, `#id`, `[attr=^value]`
 */

// //////////////
// Types

/**
 * The type of the simple selector
 */
export enum SimpleSelectorType {
  TAG = 'tag',
  CUSTOM_TAG = 'custom-tag',
  CLASS = 'class',
  ID = 'id',
  ATTRIBUTE = 'attribute',
  UNIVERSAL = 'universal',
}

/**
 * The type for tag selectors
 */
export type TAG = 'a' | 'abbr' | 'address' | 'area' | 'article' | 'aside' | 'audio' | 'b' | 'base' | 'bdi' | 'bdo' | 'blockquote' | 'body' | 'br' | 'button' | 'canvas' | 'caption' | 'cite' | 'code' | 'col' | 'colgroup' | 'data' | 'datalist' | 'dd' | 'del' | 'details' | 'dfn' | 'dialog' | 'div' | 'dl' | 'dt' | 'em' | 'embed' | 'fieldset' | 'figcaption' | 'figure' | 'footer' | 'form' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'head' | 'header' | 'hgroup' | 'hr' | 'html' | 'i' | 'iframe' | 'img' | 'input' | 'ins' | 'kbd' | 'label' | 'legend' | 'li' | 'link' | 'main' | 'map' | 'mark' | 'meta' | 'meter' | 'nav' | 'noscript' | 'object' | 'ol' | 'optgroup' | 'option' | 'output' | 'p' | 'param' | 'picture' | 'pre' | 'progress' | 'q' | 'rb' | 'rp' | 'rt' | 'rtc' | 'ruby' | 's' | 'samp' | 'script' | 'section' | 'select' | 'slot' | 'small' | 'source' | 'span' | 'strong' | 'style' | 'sub' | 'summary' | 'sup' | 'table' | 'tbody' | 'td' | 'template' | 'textarea' | 'tfoot' | 'th' | 'thead' | 'time' | 'title' | 'tr' | 'track' | 'u' | 'ul' | 'var' | 'video' | 'wbr'

/**
 * A simple selector interface
 * This is a virtual interface to be overridden by the specific simple selector types
 */
export interface SimpleSelector {
  type: SimpleSelectorType
  active: boolean
}

export interface SimpleSelectorSuggestion extends SimpleSelector {
  createText?: string
  keepEditing?: boolean
}

export interface TagSelector extends SimpleSelector {
  type: SimpleSelectorType.TAG
  value: TAG
}

export interface IdSelector extends SimpleSelector {
  type: SimpleSelectorType.ID
  value: string
}

export interface ClassSelector extends SimpleSelector {
  type: SimpleSelectorType.CLASS
  value: string
}

export interface AttributeSelector extends SimpleSelector {
  type: SimpleSelectorType.ATTRIBUTE
  value: string
  operator?: '=' | '~=' | '|=' | '^=' | '$=' | '*='
  attributeValue?: string
}

export interface UniversalSelector extends SimpleSelector {
  type: SimpleSelectorType.UNIVERSAL
}

export interface CustomTagSelector extends SimpleSelector {
  type: SimpleSelectorType.CUSTOM_TAG
  value: string
}

// //////////////
// Constants

export const ATTRIBUTES = ['id', 'class', 'style', 'name', 'type', 'value', 'placeholder', 'href', 'src', 'alt', 'title', 'width', 'height', 'disabled', 'checked', 'selected', 'hidden', 'readonly', 'multiple', 'required', 'min', 'max', 'step', 'pattern', 'autocomplete', 'autofocus', 'spellcheck', 'contenteditable', 'dir', 'lang', 'tabindex', 'accesskey', 'role']
export const ATTRIBUTE_OPERATORS = ['=', '~=', '|=', '^=', '$=', '*=']
export const SELECTOR_PREFIXES = ['.', '#', '[', '*']
export const TAGS: TAG[] = [ 'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rb', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr' ]
export const SELECTOR_OPERATORS = [' ', '>', '+', '~']

const MAX_SUGGEST_RELATED = 5

// //////////////
// Functions

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
  // Attributes should be from the ATTRIBUTES list
  if (value.match(/^\[[a-z-]*\]?$/) && ATTRIBUTES.includes(value.replace('[', '').replace(']', ''))) return value.replace(']', '') + ']'
  // Custom attributes should start with data-
  if (value.match(/^\[data-[_a-zA-Z]+[_a-zA-Z0-9-]*\]?$/)) return value.replace(']', '') + ']'
  // Custom tags should contain a -
  if(value.match(/^[a-z-]*[a-z]$/) && value.includes('-')) return value
  // Tags should be from the TAGS list
  if (value.match(/^[a-z]*$/) && TAGS.includes(value as TAG)) return value
  // Classes should start with . then a letter
  if (value.match(/^\.-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/)) return value
  // IDs should start with # then a letter
  if (value.match(/^#-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/)) return value
  // Not a valid selector and not fixable
  return false
}

/**
 * Get a list of suggestions, filtered and with creation suggestions
 */
export function suggest(filter: string, suggestions: SimpleSelector[]): SimpleSelectorSuggestion[] {
  if (filter === '') {
    // Suggest to start typing `.`, `#`, `[`, `*`, or a tag name
    return [
      { keepEditing: true, createText: 'Start typing "." for classes', type: SimpleSelectorType.CLASS, value: '', active: true, },
      { keepEditing: true, createText: 'Start typing "#" for IDs', type: SimpleSelectorType.ID, value: '', active: true, },
      { keepEditing: true, createText: 'Start typing "[" for attributes', type: SimpleSelectorType.ATTRIBUTE, value: '', active: true, },
      { keepEditing: true, createText: `Start typing a tag name (e.g., "${TAGS[0]}")`, type: SimpleSelectorType.TAG, value: TAGS[0], active: true, },
      { keepEditing: true, createText: 'Start typing a custom tag name', type: SimpleSelectorType.CUSTOM_TAG, value: '', active: true, },
      { createText: 'Type "*" for universal selector', type: SimpleSelectorType.UNIVERSAL, active: true, },
    ] as SimpleSelectorSuggestion[]
  }
  if (filter === '*') {
    // The universal selector will be suggested in the creation suggestions (getCreationSuggestions)
    return []
  }

  // Limit the number of suggestions by type of selector
  const typeCount = new Map<SimpleSelectorType, number>()
  return suggestions
    // Filter by the filter
    .filter(selector => {
      const value = getFilterFromSelector(selector)
      return value.toLowerCase().includes(filter.toLowerCase())
    })
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

export function getCreationSuggestions(filter: string): SimpleSelectorSuggestion[] {
  // Creation suggestions
  const  creationSuggestions = [] as SimpleSelectorSuggestion[]
  const active = true
  const validated = validate(filter)
  if (validated) {
    if (filter === '*') {
      creationSuggestions.push({ createText: 'Select *', type: SimpleSelectorType.UNIVERSAL, active, } as UniversalSelector)
    } else if (filter.startsWith('.')) {
      creationSuggestions.push({ createText: `Select class ${ validated }`, type: SimpleSelectorType.CLASS, value: filter.slice(1), active, } as ClassSelector)
    } else if (filter.startsWith('[data-')) {
      creationSuggestions.push({ createText: `Select custom attribute ${ validated }`, type: SimpleSelectorType.ATTRIBUTE, value: filter.replace('[', '').replace(']', ''), active, } as AttributeSelector)
    } else if (filter.startsWith('[')) {
      creationSuggestions.push({ createText: `Select attribute ${ validated }`, type: SimpleSelectorType.ATTRIBUTE, value: filter.replace('[', '').replace(']', ''), active, } as AttributeSelector)
    } else if (filter.match(/^[a-z-]*-[a-z]*$/)) {
      creationSuggestions.push({ createText: `Select custom tag ${ validated }`, type: SimpleSelectorType.CUSTOM_TAG, value: filter, active, } as CustomTagSelector)
    }
  }
  return creationSuggestions
}
