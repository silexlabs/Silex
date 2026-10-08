import { Component, CssRule, Editor } from 'grapesjs'
import { getSelectors, getOrCreateRule, matchSelectorAll, ruleOptions } from './model/GrapesJsSelectors'
import { ComplexSelector, toString as complexSelectorToString, fromString as complexSelectorFromString, getSelector } from './model/ComplexSelector'
import { CompoundSelector } from './model/CompoundSelector'
import { ClassSelector, SimpleSelectorType } from './model/SimpleSelector'
import { PSEUDO_CLASSES, PseudoClassType } from './model/PseudoClass'
import { fitsModel } from './model/selectorText'

const NOTHING_CHANGED = 'Nothing was changed.'
const MAX_LISTED = 5
const STRUCTURAL = new Set<string>([
  PseudoClassType.FIRST_CHILD, PseudoClassType.LAST_CHILD, PseudoClassType.NTH_CHILD, PseudoClassType.NTH_LAST_CHILD,
  PseudoClassType.ONLY_CHILD, PseudoClassType.FIRST_OF_TYPE, PseudoClassType.LAST_OF_TYPE, PseudoClassType.NTH_OF_TYPE,
  PseudoClassType.NTH_LAST_OF_TYPE, PseudoClassType.ONLY_OF_TYPE, PseudoClassType.EMPTY, PseudoClassType.ROOT,
])
const PSEUDO_ELEMENTS = new Set<string>([
  PseudoClassType.BEFORE, PseudoClassType.AFTER, PseudoClassType.FIRST_LINE, PseudoClassType.FIRST_LETTER, PseudoClassType.SELECTION,
])

function selectedElements(editor: Editor): Component[] {
  const components = editor.getSelectedAll()
  if (!components.length) throw new Error('No element selected. Call components_select first.')
  return components
}

// null until selector_set, or the style panel, chose a selector for every selected element
function storedSelector(components: Component[]): ComplexSelector | null {
  if (!components.length || components.some(component => !component.get('selector'))) return null
  return getSelector(components)
}

/**
 * The selector styles_set writes to
 */
function currentSelector(editor: Editor): string | null {
  const cs = storedSelector(editor.getSelectedAll())
  return cs ? complexSelectorToString(cs) || null : null
}

function media(editor: Editor): string | undefined {
  return ruleOptions(editor).atRuleParams || undefined
}

// What the element is now, without the states it may take later nor the pseudo-elements
function withoutStates(cs: ComplexSelector): ComplexSelector {
  const strip = (compound: CompoundSelector): CompoundSelector =>
    compound.pseudoClass && !STRUCTURAL.has(compound.pseudoClass.type) ? { ...compound, pseudoClass: undefined } : compound
  return { ...cs, mainSelector: strip(cs.mainSelector), relatedSelector: cs.relatedSelector && strip(cs.relatedSelector) }
}

function chosenSelector(editor: Editor): string {
  const components = selectedElements(editor)
  const cs = storedSelector(components)
  const selector = cs && complexSelectorToString(cs)
  if (!selector) {
    if (components.length > 1 && components.every(component => component.get('selector'))) {
      throw new Error(`The selected elements have no selector in common. ${NOTHING_CHANGED} Call selector_set with a selector that matches them all, or components_select to select one.`)
    }
    throw new Error(`No selector chosen. ${NOTHING_CHANGED} Call selector_set first.`)
  }
  // The classes can have changed since the selector was chosen
  if (!matchSelectorAll(complexSelectorToString(withoutStates(cs)), components)) {
    throw new Error(`Selector "${selector}" does not match the selected element anymore: its classes changed. ${NOTHING_CHANGED} Call selector_set again, or classes_add to put the class back.`)
  }
  return selector
}

// Silex names elements with ids of its own for agents
function agentId(editor: Editor, component: Component): string {
  return editor.Commands.has('agent-ids:get') ? editor.runCommand('agent-ids:get', { component }) : component.getId()
}

function describe(editor: Editor, component: Component): string {
  const classes = component.getClasses().join(' ')
  return `"${agentId(editor, component)}" <${component.tagName}${classes ? ` class="${classes}"` : ''}>`
}

function listed<T>(items: T[], name: (item: T) => string = String): string {
  const more = items.length - MAX_LISTED
  return items.slice(0, MAX_LISTED).map(name).join(', ') + (more > 0 ? ` and ${more} more` : '')
}

// One object for all the elements: the style panel compares the stored selectors by reference.
// The other classes stay listed but off, as the panel stores them
function toStore(cs: ComplexSelector, components: Component[]): ComplexSelector {
  const used = cs.mainSelector.selectors
    .filter(simple => simple.type === SimpleSelectorType.CLASS)
    .map(simple => (simple as ClassSelector).value)
  const others = [...new Set(components.flatMap(component => component.getClasses() as string[]))]
    .filter(name => !used.includes(name))
    .map(value => ({ type: SimpleSelectorType.CLASS, value, active: false } as ClassSelector))
  return { ...cs, mainSelector: { ...cs.mainSelector, selectors: [...cs.mainSelector.selectors, ...others] } }
}

function notMatching(editor: Editor, component: Component, selector: string, target: string): string {
  const matching: Component[] = []
  const walk = (parent: Component) => parent.components().forEach((child: Component) => {
    if (child.view?.el?.nodeType === Node.ELEMENT_NODE && matchSelectorAll(target, [child])) matching.push(child)
    walk(child)
  })
  walk(editor.getWrapper()!)
  if (!matching.length) {
    return `No element on this page matches "${selector}". ${NOTHING_CHANGED} Add the class to the selected element with classes_add, then call selector_set again.`
  }
  const own = component.getClasses().map((name: string) => `.${name}`)
  const htmlId = component.getAttributes().id
  if (htmlId) own.push(`#${htmlId}`)
  return [
    `Selector "${selector}" does not match the selected element ${describe(editor, component)}. ${NOTHING_CHANGED}`,
    own.length ? `Selectors that match this element: ${listed(own)}.` : 'This element has no class: add one with classes_add.',
    `Elements on this page that match "${selector}": ${listed(matching, child => agentId(editor, child))}. To style them, call components_select with one of these ids, then selector_set again.`,
  ].join(' ')
}

// Splits on ";" outside of quotes and parentheses, as in url("data:...;base64,...")
function parseDeclarations(css: string): Record<string, string> {
  const invalid = (text: string) => new Error(`Invalid CSS "${text}". ${NOTHING_CHANGED} Write it like "display: flex; gap: 16px".`)
  const declarations: string[] = []
  let current = ''
  let depth = 0
  let quote = ''
  let escaped = false
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (escaped) escaped = false
    else if (char === '\\') escaped = true
    else if (quote) {
      if (char === quote) quote = ''
    } else if (char === '"' || char === '\'') quote = char
    else if (char === '{' || char === '}') throw invalid(css)
    else if (char === '(') depth++
    else if (char === ')' && --depth < 0) throw invalid(css)
    else if (char === ';' && depth === 0) {
      declarations.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (quote || depth) throw invalid(css)
  declarations.push(current)
  const style: Record<string, string> = {}
  for (const declaration of declarations.map(d => d.trim()).filter(Boolean)) {
    const colon = declaration.indexOf(':')
    const name = declaration.slice(0, colon).trim()
    const property = name.startsWith('--') ? name : name.toLowerCase()
    const value = declaration.slice(colon + 1).trim()
    if (colon < 1 || !/^(--[\w-]+|-?[a-zA-Z][\w-]*)$/.test(property)) throw invalid(declaration)
    if (!value) throw new Error(`No value for "${property}". ${NOTHING_CHANGED} To remove a property, call styles_remove.`)
    style[property] = value
  }
  return style
}

export default function registerCommands(editor: Editor) {
  editor.Commands.add('selector:get', {
    run() {
      selectedElements(editor)
      return { selector: currentSelector(editor), media: media(editor) }
    },
  })

  editor.Commands.add('selector:set', {
    run(_ed: Editor, _sender: unknown, cmdOpts: { selector?: string } = {}) {
      const components = selectedElements(editor)
      const selector = cmdOpts.selector?.trim()
      if (!selector) throw new Error('Required: selector. Example: ".card" or ".card:hover".')
      const outside = selector.replace(/\([^)]*\)|\[[^\]]*\]/g, '')
      if (outside.includes(',') || outside.startsWith('@')) {
        throw new Error(`Selector "${selector}" is not supported: use one selector, without "," or "@media". ${NOTHING_CHANGED} For a screen size, call device_set.`)
      }
      const invalid = `Invalid selector "${selector}". ${NOTHING_CHANGED} Examples: ".card", ".card:hover", ".list > .card".`
      const unsupported = `Selector "${selector}" is not supported. ${NOTHING_CHANGED} Use one relation at most and a state from selector_info, like ".list > .card" or ".card:hover".`
      try {
        document.createDocumentFragment().querySelector(selector)
      } catch (e) {
        throw new Error(invalid, { cause: e })
      }
      let cs: ComplexSelector
      try {
        cs = complexSelectorFromString(selector, '')
      } catch (e) {
        throw new Error(unsupported, { cause: e })
      }
      const target = complexSelectorToString(withoutStates(cs))
      if (!target) throw new Error(`Selector "${selector}" has no class, tag or id. ${NOTHING_CHANGED} Put one before the state, like ".card:hover".`)
      if (!fitsModel(selector, cs)) throw new Error(unsupported)
      // Despite its name, matchSelectorAll is true when some of the elements match
      if (!matchSelectorAll(target, components)) throw new Error(notMatching(editor, components[0], selector, target))
      const stored = toStore(cs, components)
      components.forEach(component => component.set('selector', stored))
      const left = components.filter(component => !matchSelectorAll(target, [component]))
      return left.length
        ? { warning: `Selector "${selector}" is chosen, but styles_set will not change these selected elements: ${listed(left, component => agentId(editor, component))}. To style them all, call selector_set with a selector they all match.` }
        : {}
    },
  })

  editor.Commands.add('selector:list-rules', {
    run() {
      selectedElements(editor)
      return getSelectors(editor).map(cs => complexSelectorToString(cs))
    },
  })

  const chosenRule = (): CssRule => getOrCreateRule(editor, chosenSelector(editor))

  editor.Commands.add('styles:get', {
    run() {
      const selector = chosenSelector(editor)
      return {
        selector,
        media: media(editor),
        css: editor.CssComposer.getRule(selector, ruleOptions(editor))?.styleToString() ?? '',
      }
    },
  })

  editor.Commands.add('styles:set', {
    run(_ed: Editor, _sender: unknown, cmdOpts: { css?: string } = {}) {
      const style = typeof cmdOpts.css === 'string' ? parseDeclarations(cmdOpts.css) : {}
      if (!Object.keys(style).length) throw new Error('Required: css. Example: {"css": "display: flex; gap: 16px"}.')
      chosenRule().addStyle(style)
    },
  })

  editor.Commands.add('styles:remove', {
    run(_ed: Editor, _sender: unknown, cmdOpts: { property?: string } = {}) {
      const selector = chosenSelector(editor)
      const { property } = cmdOpts
      if (!property) throw new Error('Required: property. Example: "color".')
      const rule = editor.CssComposer.getRule(selector, ruleOptions(editor))
      const style = rule?.getStyle() ?? {}
      if (!rule || !Object.prototype.hasOwnProperty.call(style, property)) {
        const set = Object.keys(style)
        const screen = media(editor) ? ` for the screen size ${media(editor)}` : ''
        throw new Error(`Property "${property}" is not set on "${selector}"${screen}. ${set.length ? `Set properties: ${set.join(', ')}.` : 'It has no properties set.'} ${NOTHING_CHANGED}`)
      }
      rule.removeStyle(property)
    },
  })

  editor.Commands.add('selector:info', {
    run() {
      return {
        states: PSEUDO_CLASSES.filter(pseudo => !PSEUDO_ELEMENTS.has(pseudo.type)).map(pseudo => pseudo.type),
        examples: ['.card', '.card:hover', '.list > .card', '.list .card', '.card + .card', '.card:has(img)', '.btn:not(.off)', '.item:nth-child(2n)'],
      }
    },
  })
}
