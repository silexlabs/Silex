// ////////////
// Types

export enum PseudoClassType {
  HOVER = 'hover',
  ACTIVE = 'active',
  FOCUS = 'focus',
  FOCUS_WITHIN = 'focus-within',
  FOCUS_VISIBLE = 'focus-visible',
  VISITED = 'visited',
  LINK = 'link',
  FIRST_CHILD = 'first-child',
  LAST_CHILD = 'last-child',
  NTH_CHILD = 'nth-child',
  NTH_LAST_CHILD = 'nth-last-child',
  ONLY_CHILD = 'only-child',
  FIRST_OF_TYPE = 'first-of-type',
  LAST_OF_TYPE = 'last-of-type',
  NTH_OF_TYPE = 'nth-of-type',
  NTH_LAST_OF_TYPE = 'nth-last-of-type',
  ONLY_OF_TYPE = 'only-of-type',
  EMPTY = 'empty',
  ROOT = 'root',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  CHECKED = 'checked',
  INDETERMINATE = 'indeterminate',
  DEFAULT = 'default',
  VALID = 'valid',
  INVALID = 'invalid',
  IN_RANGE = 'in-range',
  OUT_OF_RANGE = 'out-of-range',
  REQUIRED = 'required',
  OPTIONAL = 'optional',
  READ_ONLY = 'read-only',
  READ_WRITE = 'read-write',
  HAS = 'has',
}

export interface PseudoClass {
  type: PseudoClassType
  hasParam: boolean
  param?: string
  displayName: string
  sentencePre: string
  sentencePost: string
}

// ////////////
// Constants

export const PSEUDO_CLASSES: PseudoClass[] = [
  { type: PseudoClassType.HOVER, hasParam: false, displayName: 'hover', sentencePre: 'On mouse', sentencePost: ' the element' },
  { type: PseudoClassType.ACTIVE, hasParam: false, displayName: 'active', sentencePre: 'When', sentencePost: '' },
  { type: PseudoClassType.FOCUS, hasParam: false, displayName: 'focus', sentencePre: 'When it has the', sentencePost: '' },
  { type: PseudoClassType.FOCUS_WITHIN, hasParam: false, displayName: 'focus is within', sentencePre: 'When the', sentencePost: '' },
  { type: PseudoClassType.FOCUS_VISIBLE, hasParam: false, displayName: 'focus is visible', sentencePre: 'When the', sentencePost: '' },
  { type: PseudoClassType.VISITED, hasParam: false, displayName: 'visited', sentencePre: 'When', sentencePost: '' },
  { type: PseudoClassType.LINK, hasParam: false, displayName: 'link', sentencePre: 'When it is a', sentencePost: '' },
  { type: PseudoClassType.FIRST_CHILD, hasParam: false, displayName: 'first child', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.LAST_CHILD, hasParam: false, displayName: 'last child', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.NTH_CHILD, hasParam: true, displayName: 'nth child', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.NTH_LAST_CHILD, hasParam: true, displayName: 'nth last child', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.ONLY_CHILD, hasParam: false, displayName: 'only child', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.FIRST_OF_TYPE, hasParam: false, displayName: 'first of type', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.LAST_OF_TYPE, hasParam: false, displayName: 'last of type', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.NTH_OF_TYPE, hasParam: true, displayName: 'nth of type', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.NTH_LAST_OF_TYPE, hasParam: true, displayName: 'nth last of type', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.ONLY_OF_TYPE, hasParam: false, displayName: 'only of type', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.EMPTY, hasParam: false, displayName: 'empty', sentencePre: 'When it is', sentencePost: '' },
  { type: PseudoClassType.ROOT, hasParam: false, displayName: 'root', sentencePre: 'When it is the', sentencePost: '' },
  { type: PseudoClassType.ENABLED, hasParam: false, displayName: 'enabled', sentencePre: 'When it is', sentencePost: '' },
  { type: PseudoClassType.DISABLED, hasParam: false, displayName: 'disabled', sentencePre: 'When it is', sentencePost: '' },
  { type: PseudoClassType.CHECKED, hasParam: false, displayName: 'checked', sentencePre: 'When it is', sentencePost: '' },
]

// ////////////
// Functions

export function toString(pseudoClass: PseudoClass): string {
  if (pseudoClass.hasParam) {
    return `:${pseudoClass.type}(${pseudoClass.param ?? ''})`
  } else {
    return `:${pseudoClass.type}`
  }
}
