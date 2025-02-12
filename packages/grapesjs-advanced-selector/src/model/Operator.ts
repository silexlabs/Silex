import { CompoundSelector, toString as compoundToString } from "./CompoundSelector"

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
}

export const OPERATORS = [
  { 
    type: OperatorType.HAS, 
    hasParam: false, 
    sentencePre: 'When it contains (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has',
    isCombinator: false,
  },
  { 
    type: OperatorType.NOT, 
    hasParam: false, 
    sentencePre: 'When it does not match (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:not',
    isCombinator: false,
  },
  { 
    type: OperatorType.IS, 
    hasParam: false, 
    sentencePre: 'When it matches any of (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is',
    isCombinator: false,
  },
  { 
    type: OperatorType.WHERE, 
    hasParam: false, 
    sentencePre: 'When it loosely matches (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:where',
    isCombinator: false,
  },
  { 
    type: OperatorType.CHILD, 
    hasParam: false, 
    sentencePre: 'When it is a direct child of (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.DESCENDANT, 
    hasParam: false, 
    sentencePre: 'When it is inside (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.ADJACENT, 
    hasParam: false, 
    sentencePre: 'When it immediately follows (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator',
    isCombinator: true,
  },
  { 
    type: OperatorType.GENERAL_SIBLING, 
    hasParam: false, 
    sentencePre: 'When it follows (', 
    sentencePost: ')',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator',
    isCombinator: true,
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
    return ` ${ sel?.selectors.map(s => s.type).join('') }`
  default:
    throw new Error(`Unknown operator type: ${ op.type }`)
  }
}
