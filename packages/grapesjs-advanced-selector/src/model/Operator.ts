import { CompoundSelector, toString as compoundToString } from './CompoundSelector'

/**
 * @fileoverview An Operator is either a combinator or a relational pseudo-class
 */

export enum OperatorType {
  HAS = 'has',
  NOT = 'not',
  IS = 'is',
  WHERE = 'where',
  CHILD = '>',
  DESCENDANT = ' ',
  ADJACENT = '+',
  GENERAL_SIBLING = '~'
}

export interface Operator {
  type: OperatorType
  hasParam: boolean
  sentencePre: string
  sentencePost?: string
  helpLink: string
  isCombinator: boolean
  displayName?: string
}

export const OPERATORS = [
  { 
    type: OperatorType.DESCENDANT, 
    hasParam: false, 
    sentencePre: 'When it is', 
    displayName: 'inside of',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.CHILD, 
    hasParam: false, 
    sentencePre: 'When it is a', 
    displayName: 'direct child of',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.ADJACENT, 
    hasParam: false, 
    sentencePre: 'When it is',
    displayName: 'adjacent to',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.GENERAL_SIBLING, 
    hasParam: false, 
    sentencePre: 'When it is',
    displayName: 'after',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.HAS, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'contains',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has',
    isCombinator: false,
  },
  { 
    type: OperatorType.NOT, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'does not match',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:not',
    isCombinator: false,
  },
  { 
    type: OperatorType.IS, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'matches',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is',
    isCombinator: false,
  },
  { 
    type: OperatorType.WHERE, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'matches (no spec)',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:where',
    isCombinator: false,
  }
]

export function toString(op: Operator, sel?: CompoundSelector): string {
  switch (op.type) {
  case OperatorType.HAS:
  case OperatorType.NOT:
  case OperatorType.IS:
  case OperatorType.WHERE:
    return `:${ op.type }(${ sel ? compoundToString(sel) : '' })`
  case OperatorType.CHILD:
  case OperatorType.ADJACENT:
  case OperatorType.GENERAL_SIBLING:
    return ` ${ op.type } ${ sel ? compoundToString(sel) : '' }`
  case OperatorType.DESCENDANT:
    // special case, limit to 1 space, not 2, before the selector
    return ` ${ sel ? compoundToString(sel) : '' }`
  default:
    throw new Error(`Unknown operator type: ${ op.type }`)
  }
}

export function fromString(operatorStr: string): Operator {
  const operator = OPERATORS.find(op => operatorStr.includes(op.type))
  if (!operator) {
    throw new Error(`Operator not found: ${ operatorStr }`)
  }
  return { ...operator }
}
