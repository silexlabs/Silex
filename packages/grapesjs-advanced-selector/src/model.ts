import { Editor, Component, CssRule, Selector } from 'grapesjs'

export enum SelectorType {
  SELECTOR = 'SELECTOR', // Primary selector applied directly to the target element (e.g., `.button` in `.container .button`)
  NESTED_SELECTOR = 'NESTED_SELECTOR', // Selector providing context, such as a parent (e.g., `.container` in `.container .button`)
}

export enum Combinator {
  DESCENDANT = ' ', // Matches elements that are descendants
  CHILD = '>', // Matches elements that are direct children
  ADJACENT_SIBLING = '+', // Matches elements that are adjacent siblings
  GENERAL_SIBLING = '~', // Matches elements that are general siblings
}

export type PseudoSelector {
  name: string
  param?: string
}

export type PseudoSelectorDescriptor {
  name: string
  param: boolean | { type: string, example: string }
}

export const PseudoSelectors: Record<string, PseudoSelectorDescriptor[]> = {
  Interaction: [
    { name: 'hover', param: false },
    { name: 'focus', param: false },
    { name: 'active', param: false },
    { name: 'visited', param: false },
    { name: 'link', param: false },
  ],
  State: [
    { name: 'disabled', param: false },
    { name: 'enabled', param: false },
    { name: 'checked', param: false },
    { name: 'default', param: false },
    { name: 'required', param: false },
    { name: 'optional', param: false },
    { name: 'indeterminate', param: false },
    { name: 'valid', param: false },
    { name: 'invalid', param: false },
    { name: 'read-only', param: false },
    { name: 'read-write', param: false },
  ],
  Structural: [
    { name: 'root', param: false },
    { name: 'empty', param: false },
    { name: 'first-child', param: false },
    { name: 'last-child', param: false },
    { name: 'only-child', param: false },
    { name: 'first-of-type', param: false },
    { name: 'last-of-type', param: false },
    { name: 'only-of-type', param: false },
  ],
  Positional: [
    { name: 'nth-child', param: { type: 'string', example: '2n+1' } },
    { name: 'nth-last-child', param: { type: 'string', example: '2n+1' } },
    { name: 'nth-of-type', param: { type: 'string', example: '2n+1' } },
    { name: 'nth-last-of-type', param: { type: 'string', example: '2n+1' } },
  ],
  TextContent: [
    { name: 'first-line', param: false },
    { name: 'first-letter', param: false },
    { name: 'selection', param: false },
    { name: 'placeholder', param: false },
  ],
  BeforeAfter: [
    { name: 'before', param: false },
    { name: 'after', param: false },
  ],
  Targeting: [
    { name: 'target', param: false },
    { name: 'target-within', param: false },
    { name: 'scope', param: false },
    { name: 'current', param: false },
  ],
  LanguageDirection: [
    { name: 'lang', param: { type: 'string', example: '"en"' } }, // e.g., lang("en")
    { name: 'dir', param: { type: 'string', example: '"ltr"' } }, // e.g., dir("ltr")
  ],
  Advanced: [
    { name: 'not', param: { type: 'Selector', example: '.my-class' } },
    { name: 'has', param: { type: 'Selector', example: '.my-class' } },
    { name: 'is', param: { type: 'Selector', example: '.my-class' } },
    { name: 'any-link', param: false },
    { name: 'local-link', param: false },
    { name: 'future', param: false },
    { name: 'past', param: false },
  ],
}

export interface EditableSelector {
  selectors: Selector[], // Primary selectors applied to the targeted component
  nestedSelectors: Selector[], // Additional nested selectors providing context
  combinator: Combinator, // Defines the relationship between primary and nested selectors
  pseudoSelector: PseudoSelector, // A pseudo-selector like `hover` or `nth-child`
  pseudoParam?: Selector | string, // Supports either a selector (e.g., `button.primary`) or a parameter (e.g., `2n+1`) for pseudo-classes like `:nth-child`
}

export function setClasses(components: Component[], type: SelectorType, selectors: Selector[]) {
  switch (type) {
    case SelectorType.SELECTOR:
      components.forEach(component => component.classes.set(selectors))
      break
    case SelectorType.NESTED_SELECTOR:
      components.forEach(component => component.set('nestedClasses', selectors))
      break
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

export function addClasses(components: Component[], type: SelectorType, selectors: Selector[]) {
  switch (type) {
    case SelectorType.SELECTOR:
      components.forEach(component => component.classes.add(selectors))
      break
    case SelectorType.NESTED_SELECTOR:
      components.forEach(component => component.set('nestedClasses', [...component.get('nestedClasses'), ...selectors]))
      break
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

export function removeClasses(components: Component[], type: SelectorType, selectors: Selector[]) {
  switch (type) {
    case SelectorType.SELECTOR:
      components.forEach(component => component.classes.remove(selectors))
      break
    case SelectorType.NESTED_SELECTOR:
      components.forEach(component => component.set('nestedClasses', component.get('nestedClasses').filter((nestedSelector: Selector) => !selectors.includes(nestedSelector))))
      break
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

/**
 * Utility function to get the selectors of a component based on the type
 */
function getSelectors(component: Component, type: SelectorType): Selector[] {
  switch (type) {
    case SelectorType.SELECTOR:
      return component.get('classes')?.models || []
    case SelectorType.NESTED_SELECTOR:
      return component.get('nestedClasses') || []
    default:
      throw new Error(`Unknown type: ${type}`)
  }
}

/**
 * Get the selectors that are common to the all components
 */
export function getClasses(components: Component[], type: SelectorType): Selector[] {
  //return editor.CssComposer.getRules()
  //  .filter((selector: CssRule) => components.every(component => component?.view?.el.matches(selector.getSelectorsString())))
  //  .flatMap((rule: CssRule) => rule.getSelectors())
  // Get the selectors that are applied to the all selected components
  return components
    // Get all classes of all components
    .flatMap(component => getSelectors(component, type))
    // Remove duplicates
    .filter((selector, index, self) => self.indexOf(selector) === index)
    // Keep only the ones common to all components
    .filter(selector => components.every(component => getSelectors(component, type).includes(selector)))
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

function getPseudoParam(pseudoParam: Selector | string): string {
  return pseudoParam instanceof Selector ? pseudoParam.getFullName() : pseudoParam
}

export function editSelectors(editor: Editor, { selectors, nestedSelectors, combinator, pseudoSelector, pseudoParam }: EditableSelector) {
  //const rule = editor.CssComposer.setRule(selector)
  editor.StyleManager.select(`${
    getFullName(selectors)
  }${
    combinator
  }${
    getFullName(nestedSelectors)
  }${
    pseudoSelector ? `:${pseudoSelector}${pseudoParam ? `(${getPseudoParam(pseudoParam)})` : ''}` : ''
  }`)
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
