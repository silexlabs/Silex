import { CompoundSelector, toString as compoundToString, fromString as compoundFromString, specificity as compoundSpecificity, merge as mergeCompoundSelectors, updateActivation } from './CompoundSelector'
import { Operator, toString as operatorToString, fromString as operatorFromString } from './Operator'

export interface ComplexSelector {
  mainSelector: CompoundSelector
  operator?: Operator
  relatedSelector?: CompoundSelector
}

export const EMPTY_SELECTOR = {
  mainSelector: {
    selectors: [],
  },
} as ComplexSelector

export function toString(cs: ComplexSelector): string {
  const operatorAndRelated = cs.operator ? operatorToString(cs.operator, cs.relatedSelector) : ''
  if (!operatorAndRelated) {
    // No operator or related active selector
    return compoundToString(cs.mainSelector)
  } else if (cs.operator?.isCombinator === true) {
    // Combinator operator
    return `${cs.relatedSelector ? compoundToString(cs.relatedSelector) : ''}${operatorToString(cs.operator, cs.mainSelector)}`
  }
  // Non combinator operator
  return `${compoundToString(cs.mainSelector)}${operatorToString(cs.operator!, cs.relatedSelector)}`
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
export function fromString(selector: string): ComplexSelector {
  const operatorMatch = selector.match(/:(\w+)\((.+)\)$/)
  if (operatorMatch) {
    const [, operator, relatedSelector] = operatorMatch
    const mainSelector = selector.replace(operatorMatch[0], '')
    return {
      mainSelector: mainSelector ? compoundFromString(mainSelector) : { selectors: [] },
      operator: operatorFromString(`:${operator}`),
      relatedSelector: compoundFromString(relatedSelector),
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
    }
  }
  return {
    mainSelector: relatedSelector ? compoundFromString(relatedSelector) : { selectors: [] },
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
    if (cs1.mainSelector !== cs2.mainSelector) {
      return false
    }
    if (cs1.operator !== cs2.operator) {
      return false
    }
    if (cs1.relatedSelector !== cs2.relatedSelector) {
      return false
    }
  }

  return {
    mainSelector: cs1.mainSelector,
    operator: cs1.operator,
    relatedSelector: cs1.relatedSelector,
  }
}
