import { CompoundSelector } from "./CompoundSelector"

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
}

export const OPERATORS = [
  { 
    type: OperatorType.HAS, 
    hasParam: true, 
    sentencePre: 'When it contains', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has' 
  },
  { 
    type: OperatorType.NOT, 
    hasParam: true, 
    sentencePre: 'When it does not match', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:not' 
  },
  { 
    type: OperatorType.IS, 
    hasParam: true, 
    sentencePre: 'When it matches any of', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is' 
  },
  { 
    type: OperatorType.WHERE, 
    hasParam: true, 
    sentencePre: 'When it loosely matches', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:where' 
  },
  { 
    type: OperatorType.CHILD, 
    hasParam: false, 
    sentencePre: 'When it is a direct child of', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator' 
  },
  { 
    type: OperatorType.DESCENDANT, 
    hasParam: false, 
    sentencePre: 'When it is inside', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator' 
  },
  { 
    type: OperatorType.ADJACENT, 
    hasParam: false, 
    sentencePre: 'When it immediately follows', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator' 
  },
  { 
    type: OperatorType.GENERAL_SIBLING, 
    hasParam: false, 
    sentencePre: 'When it follows', 
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator' 
  }
]

export function toString(op: Operator, sel?: CompoundSelector): string {
  switch (op.type) {
  case OperatorType.HAS:
  case OperatorType.NOT:
  case OperatorType.IS:
  case OperatorType.WHERE:
    return `:${ op.type }(${ sel?.selectors.map(s => s.type).join('') })`
  case OperatorType.CHILD:
  case OperatorType.ADJACENT:
  case OperatorType.GENERAL_SIBLING:
    return `${ op.type } ${ sel?.selectors.map(s => s.type).join('') }`
  case OperatorType.DESCENDANT:
    return ` ${ sel?.selectors.map(s => s.type).join('') }`
  default:
    throw new Error(`Unknown operator type: ${ op.type }`)
  }
}
