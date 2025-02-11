import { PseudoClass } from "./PseudoClass"
import { SimpleSelector, toString as toStringSimpleSelector } from "./SimpleSelector"
import { toString as toStringPseudoClass } from "./PseudoClass"

export type CompoundSelector = {
  selectors: SimpleSelector[]
  pseudoClass?: PseudoClass
}

/**
 * Get the full CSS selector string from a CompoundSelector
 */
export function toString(cs: CompoundSelector): string {
  return `${ cs.selectors
    .filter(s => s.active)
    .map(toStringSimpleSelector).join('')
  }${
    cs.pseudoClass ? toStringPseudoClass(cs.pseudoClass) : ''
  }`
}
