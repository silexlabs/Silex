import { Editor, Component, Selector } from 'grapesjs'

export enum SelectorType {
  PRIMARY = 'PRIMARY', // Primary selector applied directly to the target element (e.g., `.button` in `.container .button`)
  CONTEXT = 'CONTEXT', // Selector providing context, such as a parent (e.g., `.container` in `.container .button`)
}

export enum Combinator {
  DESCENDANT = ' ', // Matches elements that are descendants
  CHILD = '>', // Matches elements that are direct children
  ADJACENT_SIBLING = '+', // Matches elements that are adjacent siblings
  GENERAL_SIBLING = '~', // Matches elements that are general siblings
}

export type PseudoSelector = {
  name: string
  param?: string
}

export type PseudoSelectorDescriptor = {
  name: string
  param: boolean | { type: string, example: string }
}

export const PSEUDO_SELECTORS: Record<string, Record<string, PseudoSelectorDescriptor>> = {
  Interaction: {
    hover: { name: 'hover', param: false },
    focus: { name: 'focus', param: false },
    active: { name: 'active', param: false },
    visited: { name: 'visited', param: false },
    link: { name: 'link', param: false },
  },
  State: {
    disabled: { name: 'disabled', param: false },
    enabled: { name: 'enabled', param: false },
    checked: { name: 'checked', param: false },
    default: { name: 'default', param: false },
    required: { name: 'required', param: false },
    optional: { name: 'optional', param: false },
    indeterminate: { name: 'indeterminate', param: false },
    valid: { name: 'valid', param: false },
    invalid: { name: 'invalid', param: false },
    readOnly: { name: 'read-only', param: false },
    readWrite: { name: 'read-write', param: false },
 },
  Structural: {
    root: { name: 'root', param: false },
    empty: { name: 'empty', param: false },
    firstChild: { name: 'first-child', param: false },
    lastChild: { name: 'last-child', param: false },
    onlyChild: { name: 'only-child', param: false },
    firstOfType: { name: 'first-of-type', param: false },
    lastOfType: { name: 'last-of-type', param: false },
    onlyOfType: { name: 'only-of-type', param: false },
 },
  Positional: {
    nthChild: { name: 'nth-child', param: { type: 'string', example: '2n+1' } },
    nthLastChild: { name: 'nth-last-child', param: { type: 'string', example: '2n+1' } },
    nthOfType: { name: 'nth-of-type', param: { type: 'string', example: '2n+1' } },
    nthLastOfType: { name: 'nth-last-of-type', param: { type: 'string', example: '2n+1' } },
 },
  TextContent: {
    firstLine: { name: 'first-line', param: false },
    firstLetter: { name: 'first-letter', param: false },
    selection: { name: 'selection', param: false },
    placeholder: { name: 'placeholder', param: false },
 },
  BeforeAfter: {
    before: { name: 'before', param: false },
    after: { name: 'after', param: false },
 },
  Targeting: {
    target: { name: 'target', param: false },
    targetWithin: { name: 'target-within', param: false },
    scope: { name: 'scope', param: false },
    current: { name: 'current', param: false },
 },
  LanguageDirection: {
    lang: { name: 'lang', param: { type: 'string', example: '"en"' } }, // e.g., lang("en")
    dir: { name: 'dir', param: { type: 'string', example: '"ltr"' } }, // e.g., dir("ltr")
 },
  Advanced: {
    not: { name: 'not', param: { type: 'Selector', example: '.my-class' } },
    has: { name: 'has', param: { type: 'Selector', example: '.my-class' } },
    is: { name: 'is', param: { type: 'Selector', example: '.my-class' } },
    anyLink: { name: 'any-link', param: false },
    localLink: { name: 'local-link', param: false },
    future: { name: 'future', param: false },
    past: { name: 'past', param: false },
 },
}

export interface ComplexSelector {
  selectors: Selector[], // Primary selectors applied directly to the target element
  contextSelectors: Selector[], // Additional selectors providing context, e.g., parent selectors
  combinator: Combinator | null, // Defines the relationship between primary and context selectors
  pseudoSelector: PseudoSelector | null, // A pseudo-selector like `:hover` or `::before` for the primary selectors - this groups pseudo-classes and pseudo-elements
  pseudoSelectorParam: Selector | string | null, // Supports either a selector (e.g., `button.primary`) or a parameter (e.g., `2n+1`) for pseudo-classes like `:nth-child`
  pseudoSelectorContext: PseudoSelector | null, // Same as `pseudoSelector`, but for the context selectors
  pseudoSelectorContextParam: Selector | string | null, // Same as `pseudoSelectorParam`, but for the context selectors
}

export function setSelectorsByType(components: Component | Component[], type: SelectorType, selectors: Selector[] | Selector) {
  components = Array.isArray(components) ? components : [components]
  selectors = Array.isArray(selectors) ? selectors : [selectors]
  switch (type) {
  case SelectorType.PRIMARY:
    components.forEach(component => component.classes.set(selectors))
    break
  case SelectorType.CONTEXT:
    components.forEach(component => component.set('contextClasses', selectors))
    break
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

export function addSelectorsByType(components: Component | Component[], type: SelectorType, selectors: Selector[] | Selector) {
  components = Array.isArray(components) ? components : [components]
  selectors = Array.isArray(selectors) ? selectors : [selectors]
  switch (type) {
  case SelectorType.PRIMARY:
    components.forEach(component => component.classes.add(selectors))
    break
  case SelectorType.CONTEXT:
    components.forEach(component => component.set('contextClasses', (component.get('contextClasses') || []).concat(selectors)))
    break
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

export function removeSelectorsByType(components: Component | Component | Component[], type: SelectorType, selectors: Selector[] | Selector) {
  components = Array.isArray(components) ? components : [components]
  selectors = Array.isArray(selectors) ? selectors : [selectors]
  switch (type) {
  case SelectorType.PRIMARY:
    components.forEach(component => component.classes.remove(selectors))
    break
  case SelectorType.CONTEXT:
    components.forEach(component => component.set('contextClasses', (component.get('contextClasses') || []).filter((contextSelector: Selector) => !selectors.includes(contextSelector))))
    break
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

/**
 * Utility function to get the selectors of a component based on the type
 */
function getComponentSelectorsByType(component: Component, type: SelectorType): Selector[] {
  switch (type) {
  case SelectorType.PRIMARY:
    return component.classes.models
    //return component.get('classes')?.models || []
  case SelectorType.CONTEXT:
    return component.get('contextClasses') || []
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

/**
 * Get the selectors that are common to the all components
 */
export function getSelectorsByType(components: Component | Component[], type: SelectorType): Selector[] {
  components = Array.isArray(components) ? components : [components]
  //return editor.CssComposer.getRules()
  //  .filter((selector: CssRule) => components.every(component => component?.view?.el.matches(selector.getSelectorsString())))
  //  .flatMap((rule: CssRule) => rule.getSelectors())
  // Get the selectors that are applied to the all selected components
  return components
    // Get all classes of all components
    .flatMap(component => getComponentSelectorsByType(component, type))
    // Remove duplicates
    .filter((selector, index, self) => self.indexOf(selector) === index)
    // Keep only the ones common to all components
    .filter(selector => components.every(component => getComponentSelectorsByType(component, type).includes(selector)))
}

export function getSelectors(components: Component | Component[]): ComplexSelector {
  const selectors = getSelectorsByType(components, SelectorType.PRIMARY)
  const contextSelectors = getSelectorsByType(components, SelectorType.CONTEXT)
  const combinator = getCombinator(components)
  const pseudoSelector = getPseudoSelector(components, SelectorType.PRIMARY)
  const pseudoSelectorParam = getPseudoParam(components, SelectorType.PRIMARY)
  const pseudoSelectorContext = getPseudoSelector(components, SelectorType.CONTEXT)
  const pseudoSelectorContextParam = getPseudoParam(components, SelectorType.CONTEXT)
  return {
    selectors,
    contextSelectors,
    combinator,
    pseudoSelector,
    pseudoSelectorParam,
    pseudoSelectorContext,
    pseudoSelectorContextParam,
  }
}

export function setSelectors(components: Component | Component[], complexSelector: ComplexSelector) {
  setSelectorsByType(components, SelectorType.PRIMARY, complexSelector.selectors)
  setSelectorsByType(components, SelectorType.CONTEXT, complexSelector.contextSelectors)
  setCombinator(components, complexSelector.combinator)
  setPseudoSelector(components, complexSelector.pseudoSelector, SelectorType.PRIMARY)
  setPseudoParam(components, complexSelector.pseudoSelectorParam, SelectorType.PRIMARY)
  setPseudoSelector(components, complexSelector.pseudoSelectorContext, SelectorType.CONTEXT)
  setPseudoParam(components, complexSelector.pseudoSelectorContextParam, SelectorType.CONTEXT)
}

function getFullName(selectors: Selector[]): string {
  return selectors
    // Tag names first, then ids, then classes
    .sort((a, b) => {
      if (a.getFullName().startsWith('#')) return 1
      if (b.getFullName().startsWith('#')) return -1
      if (a.getFullName().startsWith('.')) return 1
      if (b.getFullName().startsWith('.')) return -1
      return 0
    })
    // Get the full name of the selector
    .map(selector => selector.getFullName()).join('')
}

export function getSelectorString({ selectors, contextSelectors, combinator, pseudoSelector, pseudoSelectorParam, pseudoSelectorContext, pseudoSelectorContextParam }: ComplexSelector): string {
  const selectorString = getFullName(selectors)
  const combinatorString = combinator ? combinator === Combinator.DESCENDANT ? combinator : ` ${ combinator } ` : ''
  const contextSelectorString = combinator ? getFullName(contextSelectors) : ''
  const pseudoParamString = pseudoSelectorParam ? typeof pseudoSelectorParam === 'string' ? pseudoSelectorParam : (pseudoSelectorParam as Selector).getFullName() : ''
  const pseudoSelectorString = pseudoSelector ? `:${pseudoSelector.name}${pseudoSelectorParam ? `(${pseudoParamString})` : ''}` : ''
  const pseudoContextParamString = pseudoSelectorContextParam ? typeof pseudoSelectorContextParam === 'string' ? pseudoSelectorContextParam : (pseudoSelectorContextParam as Selector).getFullName() : ''
  const pseudoContextSelectorString = pseudoSelectorContext ? `:${pseudoSelectorContext.name}${pseudoSelectorContextParam ? `(${pseudoContextParamString})` : ''}` : ''

  return `${ contextSelectorString }${ pseudoSelectorContext ? pseudoContextSelectorString : '' }${ combinatorString }${ selectorString }${ pseudoSelectorString }`
}

export function editSelectors(editor: Editor, complexSelector: ComplexSelector) {
  //const rule = editor.CssComposer.setRule(selector)
  editor.StyleManager.select(getSelectorString(complexSelector))
}

export function deleteSelectors(editor: Editor, selectors: Selector[]) {
  selectors.forEach(selector => editor.CssComposer.remove(selector.getFullName()))
  //selectors.forEach(selector => editor.CssComposer.getRule(selector.getFullName())?.remove())
}

export function createSelectors(editor: Editor, fullName: string): Selector[] {
  const rule = editor.CssComposer.getRule(fullName) || editor.CssComposer.setRule(fullName)
  if (!rule) {
    throw new Error(`Failed to create rule for selector: ${fullName}`)
  }
  return rule.getSelectors().toArray()
}

function setOptionalAttribute<TEnum>(components: Component | Component[], pseudoSelector: TEnum | null, attributeName: string ) {
  components = Array.isArray(components) ? components : [components]
  components.forEach(component => {
    if (pseudoSelector) {
      component.set(attributeName, pseudoSelector)
    } else {
      component.unset(attributeName)
    }
  })
}

function getOptionalAttribute<TEnum>(components: Component | Component[], attributeName: string): TEnum | null {
  components = Array.isArray(components) ? components : [components]
  return components
    .map(component => component.get(attributeName))
    .reduce((pseudoSelector, currentPseudoSelector) => pseudoSelector === currentPseudoSelector ? pseudoSelector || null : null)
}

export function setCombinator(components: Component | Component[], combinator: Combinator | null) {
  setOptionalAttribute(components, combinator, 'combinator')
}

export function getCombinator(components: Component | Component[]): Combinator | null {
  return getOptionalAttribute(components, 'combinator')
}

export function setPseudoSelector(components: Component | Component[], pseudoSelector: PseudoSelector | null, type: SelectorType) {
  switch (type) {
  case SelectorType.PRIMARY:
    setOptionalAttribute(components, pseudoSelector, 'pseudoSelector')
    break
  case SelectorType.CONTEXT:
    setOptionalAttribute(components, pseudoSelector, 'pseudoContext')
    break
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

export function getPseudoSelector(components: Component | Component[], type: SelectorType): PseudoSelector | null {
  switch (type) {
  case SelectorType.PRIMARY:
    return getOptionalAttribute(components, 'pseudoSelector')
  case SelectorType.CONTEXT:
    return getOptionalAttribute(components, 'pseudoContext')
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

export function setPseudoParam(components: Component | Component[], pseudoParam: Selector | string | null, type: SelectorType) {
  switch (type) {
  case SelectorType.PRIMARY:
    setOptionalAttribute(components, pseudoParam, 'pseudoParam')
    break
  case SelectorType.CONTEXT:
    setOptionalAttribute(components, pseudoParam, 'pseudoContextParam')
    break
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}

export function getPseudoParam(components: Component | Component[], type: SelectorType): Selector | string | null {
  switch (type) {
  case SelectorType.PRIMARY:
    return getOptionalAttribute(components, 'pseudoParam')
  case SelectorType.CONTEXT:
    return getOptionalAttribute(components, 'pseudoContextParam')
  default:
    throw new Error(`Unknown type: ${type}`)
  }
}
