import { ComplexSelector } from '../model/ComplexSelector'
import { CompoundSelector } from '../model/CompoundSelector'
import { AttributeSelector, ClassSelector, IdSelector, SimpleSelector, SimpleSelectorType, TagSelector, UniversalSelector } from '../model/SimpleSelector'
import { Operator, OperatorType } from '../model/Operator'
import { CssRule, Selector } from 'grapesjs'
import { PSEUDO_CLASSES, PseudoClass } from '../model/PseudoClass'

/**
 * Converts GrapesJS rules (from `editor.CssComposer.getRules()`) into your custom selector model.
 */
export function convertRulesToModel(rules: CssRule[]): ComplexSelector[] {
  console.log('convertRulesToModel', { rules })
  return rules.map((rule) => {
    const selectors = rule.getSelectors().models // Get selector models from rule
    const compoundSelectors: CompoundSelector[] = []

    selectors.forEach(selector => {
      if (!selector.get('name')) {
        console.error('Selector name is required', selector)
        throw new Error('Selector name is required')
      }
      const parsedSelectors = parseSelectorString(selector.get('name')!)
      compoundSelectors.push(parsedSelectors)
    })

    console.log('convertRulesToModel', { compoundSelectors, selectors })
    return {
      mainSelector: compoundSelectors[0], // First compound selector is the main one
      operator: getOperator(selectors), // Extract combinator if present
      relatedSelector: compoundSelectors.length > 1 ? compoundSelectors[1] : null, // Second one is related
    } as ComplexSelector
  })
}

/**
 * Parses a selector string (e.g., `.class1:hover > div`) into a CompoundSelector object.
 */
function parseSelectorString(selectorStr: string): CompoundSelector {
  const parts = selectorStr.split(/\s*([>+~ ])\s*/) // Split by combinators
  const simpleSelectors: SimpleSelector[] = []

  parts.forEach(part => {
    if (isCombinator(part)) return // Skip combinators for now

    const simpleSelector = parseSimpleSelector(part)
    if (simpleSelector) simpleSelectors.push(simpleSelector)
  })

  return {
    selectors: simpleSelectors,
    pseudoClass: extractPseudoClass(selectorStr),
  }
}

/**
 * Parses an individual simple selector (e.g., `.class`, `#id`, `[attr]`, `div`).
 */
function parseSimpleSelector(selector: string): SimpleSelector | null {
  if (selector.startsWith('#')) {
    return { type: SimpleSelectorType.ID, value: selector.slice(1), active: true } as IdSelector
  } else if (selector.startsWith('.')) {
    return { type: SimpleSelectorType.CLASS, value: selector.slice(1), active: true } as ClassSelector
  } else if (selector.startsWith('[')) {
    return { type: SimpleSelectorType.ATTRIBUTE, value: selector.slice(1, -1), active: true } as AttributeSelector
  } else if (selector === '*') {
    return { type: SimpleSelectorType.UNIVERSAL, active: true } as UniversalSelector
  } else {
    return { type: SimpleSelectorType.TAG, value: selector, active: true } as TagSelector
  }
}

/**
 * Extracts a pseudo-class (e.g., `:hover`, `:nth-child(2)`) from a selector string.
 */
function extractPseudoClass(selectorStr: string): PseudoClass | null {
  const match = selectorStr.match(/:(\w+)(\([^)]+\))?/)
  if (match) {
    const name = match[1]
    const pseudoClass = PSEUDO_CLASSES.find(pc => pc.type === name)
    if (!pseudoClass) {
      console.error(`Pseudo-class not found: ${name}`)
      throw new Error(`Pseudo-class not found: ${name}`)
    }
    if(pseudoClass.hasParam && !match[2]) {
      return { ...pseudoClass, param: match[2] || null }
    } else {
      return { ...pseudoClass }
    }
  }
  return null
}

/**
 * Determines if a given string is a combinator.
 */
function isCombinator(part: string): boolean {
  return part === '>' || part === '+' || part === '~' || part === ' '
}

/**
 * Extracts the combinator (operator) from a selector list.
 */
function getOperator(selectors: Selector[]): Operator | null {
  for (let i = 0; i < selectors.length - 1; i++) {
    const name = selectors[i].get('name')
    if (!name) {
      console.error('Selector name is required', selectors[i])
      throw new Error('Selector name is required')
    }
    if (isCombinator(name)) {
      return { type: name as OperatorType, isCombinator: true, hasParam: false, sentencePre: 'When it is', displayName: 'inside of', helpLink: '' }
    }
  }
  return null
}
