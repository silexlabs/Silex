import { PseudoClass } from "./PseudoClass"
import { SimpleSelector, toString as toStringSimpleSelector, specificity as simpleSelectorSpecificity, getSelectorPriority } from "./SimpleSelector"
import { toString as toStringPseudoClass } from "./PseudoClass"

export type CompoundSelector = {
  selectors: SimpleSelector[]
  pseudoClass?: PseudoClass
}

/**
 * Get the full CSS selector string from a CompoundSelector
 */
export function toString(cs: CompoundSelector): string {
  // The universal selector can only be used alone
  if (cs.selectors.length > 1 && cs.selectors.some(s => s.type === 'universal')) {
    throw new Error('The universal selector can only be used alone')
  }
  return `${ cs.selectors
    .filter(s => s.active)
    .sort((a, b) => getSelectorPriority(a) - getSelectorPriority(b)) // Sort based on priority
    .map(toStringSimpleSelector).join('')
  }${
    cs.pseudoClass ? toStringPseudoClass(cs.pseudoClass) : ''
  }`
}

export function specificity(compound: CompoundSelector) {
  return compound.selectors
    .filter(s => s.active)
    .reduce((total, selector) => {
      return total + simpleSelectorSpecificity(selector)
    }, 0) + (compound.pseudoClass ? 10 : 0)
}
