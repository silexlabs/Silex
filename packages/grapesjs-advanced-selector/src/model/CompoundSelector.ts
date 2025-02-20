import { PSEUDO_CLASSES, PseudoClass } from './PseudoClass'
import { SimpleSelector, toString as toStringSimpleSelector, specificity as simpleSelectorSpecificity, getSelectorPriority, SimpleSelectorType, IdSelector, ClassSelector, AttributeSelector, UniversalSelector, TagSelector } from './SimpleSelector'
import { toString as toStringPseudoClass } from './PseudoClass'

export type CompoundSelector = {
  selectors: SimpleSelector[]
  pseudoClass?: PseudoClass | null
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

/**
 * Parses a CSS selector string and converts it into a CompoundSelector model.
 * @example fromString('div.class') // { selectors: [{ type: 'tag', value: 'div' }, { type: 'class', value: 'class' }] }
 */
export function fromString(selectorStr: string): CompoundSelector {
  const regex = /(#[-\w]+)|(\.[-\w]+)|(\*)|([a-zA-Z][-a-zA-Z0-9]*)|(\[([a-zA-Z][-a-zA-Z0-9]*)\s*([~|^$*]?=)?\s*"?([^"\]]*)"?\])|(:[-\w]+(\([^)]*\))?)/g
  const matches = selectorStr.match(regex)

  if (!matches) {
    throw new Error(`Invalid selector: ${selectorStr}`)
  }

  const selectors: SimpleSelector[] = []
  let pseudoClass: PseudoClass | undefined

  matches.forEach(match => {
    if (match.startsWith('#')) {
      selectors.push({ type: SimpleSelectorType.ID, value: match.slice(1), active: true } as IdSelector)
    } else if (match.startsWith('.')) {
      selectors.push({ type: SimpleSelectorType.CLASS, value: match.slice(1), active: true } as ClassSelector)
    } else if (match.startsWith('[')) {
      const attrMatch = match.match(/^\[([a-zA-Z][-a-zA-Z0-9]*)\s*([~|^$*]?=)?\s*"?([^"\]]*)"?\]$/)
      if (attrMatch) {
        selectors.push({
          type: SimpleSelectorType.ATTRIBUTE,
          value: attrMatch[1], // Attribute name
          operator: attrMatch[2] || undefined, // Optional operator
          attributeValue: attrMatch[3] || '', // Optional value
          active: true,
        } as AttributeSelector)
      }
    } else if (match === '*') {
      selectors.push({ type: SimpleSelectorType.UNIVERSAL, active: true } as UniversalSelector)
    } else if (match.match(/^[a-zA-Z][-a-zA-Z0-9]*$/)) {
      selectors.push({ type: SimpleSelectorType.TAG, value: match, active: true } as TagSelector)
    } else if (match.startsWith(':')) {
      const pseudoMatch = match.match(/:([-\w]+)(\([^)]*\))?/)
      if (pseudoMatch) {
        pseudoClass = {
          ...PSEUDO_CLASSES.find(pc => pc.type === pseudoMatch[1]),
        } as PseudoClass
        if (!pseudoClass) {
          throw new Error(`Pseudo-class not found: ${pseudoMatch[1]}`)
        }
        if (pseudoClass.hasParam && pseudoMatch[2]) {
          pseudoClass = {
            ...pseudoClass,
            param: pseudoMatch[2]
              .slice(1, -1) // Remove surrounding parentheses
          }
        }
      }
    }
  })

  return { selectors, pseudoClass }
}

/**
 * Merge two CompoundSelectors into one
 */
export function merge(cs1: CompoundSelector, cs2: CompoundSelector): CompoundSelector {
  const mergedSelectors = [...cs1.selectors]

  cs2.selectors.forEach(sel => {
    if (!mergedSelectors.some(existingSel => existingSel.type === sel.type && (existingSel as any).value === (sel as any).value)) {
      mergedSelectors.push(sel)
    }
  })

  return {
    selectors: mergedSelectors,
    pseudoClass: cs1.pseudoClass || cs2.pseudoClass || null, // Prend le pseudo-classe de cs1 en priorité
  }
}

/**
 * Activate or deactivate the selectors of `targetSelectors` based on `referenceSelectors`
 */
export function updateActivation(targetSelectors: SimpleSelector[], referenceSelectors: SimpleSelector[]): SimpleSelector[] {
  return targetSelectors.map(sel => {
    const matchingRef = referenceSelectors.find(ref => ref.type === sel.type && (ref as any).value === (sel as any).value)
    return matchingRef ? { ...sel, active: matchingRef.active } : sel
  })
}
