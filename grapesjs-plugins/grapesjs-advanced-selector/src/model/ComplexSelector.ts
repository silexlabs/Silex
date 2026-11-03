import { Component } from 'grapesjs'
import { CompoundSelector, toString as compoundToString, fromString as compoundFromString, specificity as compoundSpecificity, merge as mergeCompoundSelectors, updateActivation } from './CompoundSelector'
import { Operator, toString as operatorToString, fromString as operatorFromString } from './Operator'
import { IdSelector, SimpleSelector, SimpleSelectorType, TagSelector } from './SimpleSelector'
import { getComponentSelector } from './GrapesJsSelectors'

export interface ComplexSelector {
  mainSelector: CompoundSelector
  operator?: Operator
  relatedSelector?: CompoundSelector
  atRule?: string
}

export const EMPTY_SELECTOR = {
  mainSelector: {
    selectors: [],
  },
} as ComplexSelector

export function toString(cs: ComplexSelector, ignorePseudoClass: boolean = false): string {
  const operatorAndRelated = cs.operator ? operatorToString(cs.operator, cs.relatedSelector) : ''
  if (!operatorAndRelated) {
    // No operator or related active selector
    return compoundToString(cs.mainSelector, ignorePseudoClass)
  } else if (cs.operator?.isCombinator === true) {
    // Combinator operator
    return `${cs.relatedSelector ? compoundToString(cs.relatedSelector, ignorePseudoClass) : ''}${operatorToString(cs.operator, cs.mainSelector)}`
  }
  // Non combinator operator
  return `${compoundToString(cs.mainSelector, ignorePseudoClass)}${operatorToString(cs.operator!, cs.relatedSelector)}`
}

export function noPseudo(cs: ComplexSelector) {
  return {
    ...cs,
    mainSelector: {
      ...cs.mainSelector,
      pseudoClass: undefined,
    },
    relatedSelector: cs.relatedSelector ? {
      ...cs.relatedSelector,
      pseudoClass: undefined,
    } : undefined,
  }
}

export function specificity(cs: ComplexSelector): number {
  let specificity = 0

  if (cs.mainSelector) {
    specificity += compoundSpecificity(cs.mainSelector)
  }

  if (cs.relatedSelector) {
    specificity += compoundSpecificity(cs.relatedSelector)
  }

  return specificity
}

/**
 * Parses a CSS selector string and converts it into a ComplexSelector model
 * @example fromString('div > .class') // { mainSelector: { selectors: [{ type: 'tag', value: 'div' }] }, operator: { isCombinator: true, value: '>' }, relatedSelector: { selectors: [{ type: 'class', value: 'class' }] } }
 * @example fromString('.main:has(.related)') // { mainSelector: { selectors: [{ type: 'class', value: 'main' }] }, operator: { isCombinator: false, value: ':has' }, relatedSelector: { selectors: [{ type: 'class', value: 'related' }] } }
 */
export function fromString(selector: string, atRule: string): ComplexSelector {
  const atRuleObj = atRule ? { atRule } : {} // Omit atRule if it's empty
  const operatorMatch = selector.match(/:(\w+)\((.+)\)$/)
  if (operatorMatch) {
    const [, operator, relatedSelector] = operatorMatch
    const mainSelector = selector.replace(operatorMatch[0], '')
    return {
      mainSelector: mainSelector ? compoundFromString(mainSelector) : { selectors: [] },
      operator: operatorFromString(`:${operator}`),
      relatedSelector: compoundFromString(relatedSelector),
      ...atRuleObj,
    }
  }

  const parts = selector
    // Trim the space between >, +, ~ and the selector
    .replace(/ ([>+~]) /, '$1')
    .split(/([>+~ ])/)

  // Extract the related selector and operator
  const relatedSelector = parts.shift()
  const timedOperator = parts.shift()

  // put back the space if it was a space
  const operator = !timedOperator || timedOperator === ' ' ? timedOperator : ` ${ timedOperator } `

  if (operator && relatedSelector) {
    const mainSelector = parts.join('')
    return {
      mainSelector: mainSelector ? compoundFromString(mainSelector) : { selectors: [] },
      operator: operatorFromString(operator),
      relatedSelector: compoundFromString(relatedSelector),
      ...atRuleObj,
    }
  }
  return {
    mainSelector: relatedSelector ? compoundFromString(relatedSelector) : { selectors: [] },
    ...atRuleObj,
  }
}

/**
 * Merge two ComplexSelectors into one
 * This will add the relatedSelector of cs2 to the mainSelector of cs1, same for the relatedSelector
 * If both selectors have an operator, the operator of cs1 will be kept
 */
export function merge(cs1: ComplexSelector, cs2: ComplexSelector): ComplexSelector {
  return {
    mainSelector: mergeCompoundSelectors(cs1.mainSelector, cs2.mainSelector),
    relatedSelector: cs1.relatedSelector && cs2.relatedSelector
      ? mergeCompoundSelectors(cs1.relatedSelector, cs2.relatedSelector)
      : cs1.relatedSelector || cs2.relatedSelector, // Prend celui qui existe si l'autre est null
    operator: cs1.operator || cs2.operator, // Garde l'opérateur de cs1 si existant, sinon celui de cs2
    atRule: cs1.atRule || cs2.atRule,
  }
}

/**
 * Activate or deactivate the selectors of a ComplexSelector (main and related)
 * Depending on the selectors of another ComplexSelector
 * @example activateSelectors({ mainSelector: { selectors: [{ type: 'tag', value: 'div', active: false }, { type: 'class', value: '.test', active: true }] }, { mainSelector: { selectors: [{ type: 'tag', value: 'div', active: true }] }) // { mainSelector: { selectors: [{ type: 'tag', value: 'div', active: true }, { type: 'class', value: '.test', active: false } }
 */
export function activateSelectors(cs: ComplexSelector, other: ComplexSelector): ComplexSelector {
  return {
    mainSelector: {
      selectors: updateActivation(cs.mainSelector.selectors, other.mainSelector.selectors),
      pseudoClass: cs.mainSelector.pseudoClass, // Keep pseudo-class unchanged
    },
    relatedSelector: cs.relatedSelector
      ? {
        selectors: other.relatedSelector
          ? updateActivation(cs.relatedSelector.selectors, other.relatedSelector.selectors)
          : cs.relatedSelector.selectors.map(selector => ({ ...selector, active: false })), // Deactivate all if `other` has no relatedSelector
        pseudoClass: cs.relatedSelector.pseudoClass, // Keep pseudo-class unchanged
      }
      : undefined, // Keep `relatedSelector` as undefined if it doesn't exist
    operator: cs.operator, // Keep the operator unchanged
    atRule: cs.atRule,
  }
}

/**
 * Make sure all ComplexSelectors have the same mainSelector, operator, and relatedSelector
 */
export function same(all: ComplexSelector[]): ComplexSelector | false {
  if (all.length === 0) return false
  if (all.length === 1) return all[0]
  const [cs1, ...others] = all
  for (const cs2 of others) {
    if (cs1.atRule !== cs2.atRule) return false
    if (cs1.mainSelector !== cs2.mainSelector) return false // FIXME: should make a string or compare each selector?
    if (cs1.operator !== cs2.operator) return false // FIXME: should make a string or compare each selector?
    if (cs1.relatedSelector !== cs2.relatedSelector) return false
  }

  return {
    mainSelector: cs1.mainSelector,
    operator: cs1.operator,
    relatedSelector: cs1.relatedSelector,
    atRule: cs1.atRule,
  }
}

/**
 * Make sure that the selector always contains a default fallback:
 * - For body components: the `body` tag selector
 * - For other components: the component ID selector
 */
export function getSelector(components: Component[]): ComplexSelector | null {
  if(components.length === 0) return null
  const selectors: ComplexSelector[] = components
    .map((component) => getComponentSelector(component) || EMPTY_SELECTOR)
  const selector = same(selectors)
  if(!selector) return null

  // Body components use `body` tag as the default, others use the component ID
  const isBody = components.some(c => c.tagName?.toLowerCase() === 'body')
  const defaultOff = isBody
    ? { type: SimpleSelectorType.TAG, value: 'body', active: false } as TagSelector
    : { type: SimpleSelectorType.ID, value: components[0].getId(), active: false } as IdSelector
  const defaultOn = { ...defaultOff, active: true }
  const isDefault = isBody
    ? (s: SimpleSelector) => s.type === SimpleSelectorType.TAG && (s as TagSelector).value === 'body'
    : (s: SimpleSelector) => s.type === SimpleSelectorType.ID

  // Handle the case when the component ID has changed (only relevant for ID selectors)
  const cleaned = JSON.parse(JSON.stringify(selector))
  if (!isBody) {
    cleaned.mainSelector.selectors = selector.mainSelector.selectors
      .filter(s => s.type !== SimpleSelectorType.ID || (s as IdSelector).value === components[0].getId())
  }

  // Check if the default was explicitly stored as active (before merge adds it)
  const storedDefaultActive = isBody && cleaned.mainSelector.selectors
    .some((s: SimpleSelector) => isDefault(s) && s.active)

  // Ensure the default selector is present
  const newSelector = merge(cleaned, { mainSelector: { selectors: [defaultOff] } })

  // For body: if body tag was explicitly stored as active, deactivate ID (mutual exclusion)
  if (storedDefaultActive) {
    newSelector.mainSelector.selectors = newSelector.mainSelector.selectors.map((s) => {
      if (s.type === SimpleSelectorType.ID) return { ...s, active: false }
      return s
    })
  }

  // Deactivate the default if there are other active selectors
  // But respect the stored state: if default was explicitly stored as active, keep it
  const hasOtherActive = newSelector.mainSelector.selectors
    .some((s) => !isDefault(s) && s.active)
  if(hasOtherActive && !storedDefaultActive) {
    newSelector.mainSelector.selectors = newSelector.mainSelector.selectors.map((s) => {
      if (isDefault(s)) return defaultOff
      return s
    })
  }
  // Activate the default if the selector would be empty
  if (!toString(newSelector)) {
    newSelector.mainSelector.selectors = newSelector.mainSelector.selectors.map((s) => {
      if (isDefault(s)) return defaultOn
      return s
    })
  }
  return newSelector
}
