import { CompoundSelector, toString as compoundToString, fromString as compoundFromString, specificity as compoundSpecificity } from './CompoundSelector'
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
  if (cs.operator?.isCombinator === false) {
    return `${ compoundToString(cs.mainSelector) }${ operatorToString(cs.operator, cs.relatedSelector)}`
  } else if (cs.operator?.isCombinator === true) {
    return `${ cs.relatedSelector ? compoundToString(cs.relatedSelector) : '' }${ operatorToString(cs.operator, cs.mainSelector)}`
  } else {
    // No operator
    return compoundToString(cs.mainSelector)
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

export function fromString(selector: string): ComplexSelector {
  const parts = selector.split(/([>+~ ])/)
  const mainSelector = parts.shift()
  const operator = parts.shift()
  const relatedSelector = parts.join('')

  return {
    mainSelector: mainSelector ? compoundFromString(mainSelector) : { selectors: [] },
    operator: operator ? operatorFromString(operator) : undefined,
    relatedSelector: relatedSelector ? compoundFromString(relatedSelector) : undefined,
  }
}

/**
 * Make sure all ComplexSelectors have the same mainSelector, operator, and relatedSelector
 */
export function same(all: ComplexSelector[]): ComplexSelector | false {
  if(all.length === 0) return false
  if(all.length === 1) return all[0]
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
