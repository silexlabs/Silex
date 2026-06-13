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
  stringRepresentation: string
}

export const OPERATORS: Operator[] = [
  { 
    type: OperatorType.DESCENDANT, 
    hasParam: false, 
    sentencePre: 'When it is', 
    displayName: 'inside of',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_combinator',
    isCombinator: true,
    stringRepresentation: ' ',
  },
  { 
    type: OperatorType.CHILD, 
    hasParam: false, 
    sentencePre: 'When it is a', 
    displayName: 'direct child of',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Child_combinator',
    isCombinator: true,
    stringRepresentation: ' > ',
  },
  { 
    type: OperatorType.ADJACENT, 
    hasParam: false, 
    sentencePre: 'When it is',
    displayName: 'adjacent to',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Adjacent_sibling_combinator',
    isCombinator: true,
    stringRepresentation: ' + ',
  },
  { 
    type: OperatorType.GENERAL_SIBLING, 
    hasParam: false, 
    sentencePre: 'When it is',
    displayName: 'after',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/General_sibling_combinator',
    isCombinator: true,
    stringRepresentation: ' ~ ',
  },
  { 
    type: OperatorType.HAS, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'contains',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:has',
    isCombinator: false,
    stringRepresentation: ':has',
  },
  { 
    type: OperatorType.NOT, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'does not match',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:not',
    isCombinator: false,
    stringRepresentation: ':not',
  },
  { 
    type: OperatorType.IS, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'matches',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:is',
    isCombinator: false,
    stringRepresentation: ':is',
  },
  { 
    type: OperatorType.WHERE, 
    hasParam: false, 
    sentencePre: 'When it', 
    displayName: 'matches (no spec)',
    helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:where',
    isCombinator: false,
    stringRepresentation: ':where',
  }
]

export function toString(op: Operator, sel?: CompoundSelector): string {
  const compound = sel ? compoundToString(sel) : ''
  if (!compound) return ''
  switch (op.type) {
  case OperatorType.HAS:
  case OperatorType.NOT:
  case OperatorType.IS:
  case OperatorType.WHERE:
    return `${ op.stringRepresentation }(${ compound })`
  case OperatorType.CHILD:
  case OperatorType.ADJACENT:
  case OperatorType.GENERAL_SIBLING:
  case OperatorType.DESCENDANT:
    return `${ op.stringRepresentation }${ compound }`
  default:
    throw new Error(`Unknown operator type: ${ op.type }`)
  }
}

export function fromString(operatorStr: string): Operator {
  const operator = OPERATORS.find(op => operatorStr === op.stringRepresentation)
  if (!operator) {
    throw new Error(`Operator not found: ${ operatorStr }`)
  }
  return { ...operator }
}
