// ////////////
// Types

export enum PseudoClassType {
  // User interaction
  HOVER = 'hover',
  ACTIVE = 'active',
  FOCUS = 'focus',
  FOCUS_WITHIN = 'focus-within',
  FOCUS_VISIBLE = 'focus-visible',

  // Link states
  VISITED = 'visited',
  LINK = 'link',
  ANY_LINK = 'any-link', // Deprecated, but some usage

  // Child and type-based selection
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

  // Structural
  EMPTY = 'empty',
  ROOT = 'root',
  SCOPE = 'scope',
  TARGET = 'target',

  // Form states
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

  // Other pseudo-classes
  LANG = 'lang',
  DIR = 'dir'
}

export interface PseudoClass {
  type: PseudoClassType
  hasParam: boolean
  param?: string
  sentencePre: string
  sentencePost?: string
  helpLink?: string
  displayName?: string
}

// ////////////
// Constants

export const PSEUDO_CLASSES: PseudoClass[] = [
  // User interaction
  { type: PseudoClassType.HOVER, hasParam: false, sentencePre: 'On mouse', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:hover' },
  { type: PseudoClassType.ACTIVE, hasParam: false, sentencePre: 'When', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:active' },
  { type: PseudoClassType.FOCUS, hasParam: false, sentencePre: 'When it has the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus' },
  { type: PseudoClassType.FOCUS_WITHIN, hasParam: false, sentencePre: 'When the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within' },
  { type: PseudoClassType.FOCUS_VISIBLE, hasParam: false, sentencePre: 'When the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible' },

  // Link states
  { type: PseudoClassType.VISITED, hasParam: false, sentencePre: 'When', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:visited' },
  { type: PseudoClassType.LINK, hasParam: false, sentencePre: 'When it is a', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:link' },
  { type: PseudoClassType.ANY_LINK, hasParam: false, sentencePre: 'When it is a', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:any-link' },

  // Child and type-based selection
  { type: PseudoClassType.FIRST_CHILD, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:first-child' },
  { type: PseudoClassType.LAST_CHILD, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:last-child' },
  { type: PseudoClassType.NTH_CHILD, hasParam: true, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-child' },
  { type: PseudoClassType.NTH_LAST_CHILD, hasParam: true, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-child' },
  { type: PseudoClassType.ONLY_CHILD, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:only-child' },
  { type: PseudoClassType.FIRST_OF_TYPE, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:first-of-type' },
  { type: PseudoClassType.LAST_OF_TYPE, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:last-of-type' },
  { type: PseudoClassType.NTH_OF_TYPE, hasParam: true, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-of-type' },
  { type: PseudoClassType.NTH_LAST_OF_TYPE, hasParam: true, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:nth-last-of-type' },
  { type: PseudoClassType.ONLY_OF_TYPE, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:only-of-type' },

  // Structural
  { type: PseudoClassType.EMPTY, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:empty' },
  { type: PseudoClassType.ROOT, hasParam: false, sentencePre: 'When it is the', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:root' },
  { type: PseudoClassType.SCOPE, hasParam: false, sentencePre: 'When it is within', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:scope' },
  { type: PseudoClassType.TARGET, hasParam: false, sentencePre: 'When URL matches', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:target' },

  // Form states
  { type: PseudoClassType.ENABLED, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:enabled' },
  { type: PseudoClassType.DISABLED, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:disabled' },
  { type: PseudoClassType.CHECKED, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:checked' },
  { type: PseudoClassType.INDETERMINATE, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:indeterminate' },
  { type: PseudoClassType.REQUIRED, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:required' },
  { type: PseudoClassType.OPTIONAL, hasParam: false, sentencePre: 'When it is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:optional' },

  // Other pseudo-classes
  { type: PseudoClassType.LANG, hasParam: true, sentencePre: 'When it matches', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:lang' },
  { type: PseudoClassType.DIR, hasParam: true, sentencePre: 'When the text direction is', helpLink: 'https://developer.mozilla.org/en-US/docs/Web/CSS/:dir' }
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
