import { CompoundSelector, toString as compoundToString, specificity as compoundSpecificity } from './CompoundSelector'
import { Operator, toString as operatorToString } from './Operator'

export interface ComplexSelector {
  mainSelector: CompoundSelector
  operator?: Operator
  relatedSelector?: CompoundSelector
}

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
