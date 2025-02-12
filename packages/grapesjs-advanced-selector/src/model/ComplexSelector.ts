import { CompoundSelector, toString as compoundToString } from "./CompoundSelector"
import { Operator, toString as operatorToString } from "./Operator"

export interface ComplexSelector {
  mainSelector: CompoundSelector
  operator: Operator
  relatedSelector: CompoundSelector
}

export function toString(cs: ComplexSelector): string {
  if (cs.operator?.isCombinator === false) {
    return `${ compoundToString(cs.mainSelector) }${ operatorToString(cs.operator, cs.relatedSelector)}`
  } else if (cs.operator?.isCombinator === true) {
    return `${ compoundToString(cs.relatedSelector) }${ operatorToString(cs.operator, cs.mainSelector)}`
  } else {
    return compoundToString(cs.mainSelector)
  }
}
