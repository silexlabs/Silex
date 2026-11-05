import { Component, Editor } from 'grapesjs'
import { getSelectors, getOrCreateRule, matchSelectorAll, ruleOptions } from './model/GrapesJsSelectors'
import { ComplexSelector, toString as complexSelectorToString, fromString as complexSelectorFromString, getSelector } from './model/ComplexSelector'
import { CompoundSelector } from './model/CompoundSelector'
import { PSEUDO_CLASSES } from './model/PseudoClass'

const NOTHING_CHANGED = 'Nothing was changed.'
const MAX_LISTED = 5

function elementsOf(editor: Editor, id?: string): Component[] {
  return editor.runCommand('agent-ids:elements', { element_id: id, several: true })
}

interface StyleOptions {
  element_id?: string
  selector?: string
  css?: string
  property?: string
}

// null until the style panel chose a selector for every selected element
function storedSelector(components: Component[]): ComplexSelector | null {
  if (!components.length || components.some(component => !component.get('selector'))) return null
  return getSelector(components)
}

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
    compound.pseudoClass && !PSEUDO_CLASSES.find(pseudo => pseudo.type === compound.pseudoClass!.type)?.structural ? { ...compound, pseudoClass: undefined } : compound
  return { ...cs, mainSelector: strip(cs.mainSelector), relatedSelector: cs.relatedSelector && strip(cs.relatedSelector) }
}

function chosenSelector(editor: Editor, components: Component[]): string {
  const cs = storedSelector(components)
  const selector = cs && complexSelectorToString(cs)
  if (!selector) {
    if (components.length > 1 && components.every(component => component.get('selector'))) {
      throw new Error(`The selected elements have no selector in common. ${NOTHING_CHANGED} Set selector to one that matches them all, or element(action:'select') to select one.`)
    }
    const own = components[0].getClasses().map((name: string) => `.${name}`)
    throw new Error(`No selector chosen for ${describe(editor, components[0])}. ${NOTHING_CHANGED} Set selector${own.length ? `, like "${own[0]}"` : ''}.`)
  }
  // The classes can have changed since the selector was chosen
  if (!matchSelectorAll(complexSelectorToString(withoutStates(cs)), components)) {
    throw new Error(`Selector "${selector}" does not match the element anymore: its classes changed. ${NOTHING_CHANGED} Set selector, or element(action:'update', add_class) to put the class back.`)
  }
  return selector
}

function agentId(editor: Editor, component: Component): string {
  return editor.runCommand('agent-ids:get', { component })
}

function describe(editor: Editor, component: Component): string {
  return editor.runCommand('agent-ids:describe', { component })
}

function listed<T>(items: T[], name: (item: T) => string = String): string {
  const more = items.length - MAX_LISTED
  return items.slice(0, MAX_LISTED).map(name).join(', ') + (more > 0 ? ` and ${more} more` : '')
}

function notMatching(editor: Editor, component: Component, selector: string, target: string): string {
  const matching: Component[] = []
  editor.getWrapper()!.forEachChild((child: Component) => {
    if (child.view?.el?.nodeType === Node.ELEMENT_NODE && matchSelectorAll(target, [child])) matching.push(child)
  })
  if (!matching.length) {
    return `No element on this page matches "${selector}". ${NOTHING_CHANGED} Add the class to the element with element(action:'update', add_class) first.`
  }
  const own = component.getClasses().map((name: string) => `.${name}`)
  const htmlId = component.getAttributes().id
  if (htmlId) own.push(`#${htmlId}`)
  return [
    `Selector "${selector}" does not match the element ${describe(editor, component)}. ${NOTHING_CHANGED}`,
    own.length ? `Selectors that match this element: ${listed(own)}.` : 'This element has no class: add one with element(action:\'update\', add_class).',
    `Elements on this page that match "${selector}": ${listed(matching, child => agentId(editor, child))}. To style them, set element_id to one of these ids.`,
  ].join(' ')
}

function parseDeclarations(editor: Editor, css: string): Record<string, string> {
  // A "}" in the text would close the rule and open another one
  const rules = editor.Parser.parseCss(`x{${css}}`)
  if (rules.length > 1) throw new Error(`Invalid CSS "${css}". ${NOTHING_CHANGED} Write it like "display: flex; gap: 16px".`)
  return Object.fromEntries(Object.entries(rules[0]?.style ?? {})
    .map(([name, value]) => [name.startsWith('--') ? name : name.toLowerCase(), String(value)]))
}

/**
 * A selector the elements can be styled with: one relation and one state at most,
 * matching them as they are now. Never changes their classes
 */
function checkedSelector(editor: Editor, text: string | undefined, components: Component[]): { cs: ComplexSelector, target: string } {
  const selector = text?.trim()
  if (!selector) throw new Error('Required: selector. Example: ".card" or ".card:hover".')
  const outside = selector.replace(/\([^)]*\)|\[[^\]]*\]/g, '')
  if (outside.includes(',') || outside.startsWith('@')) {
    throw new Error(`Selector "${selector}" is not supported: use one selector, without "," or "@media". ${NOTHING_CHANGED} For a breakpoint, call breakpoint(action:'select').`)
  }
  const invalid = `Invalid selector "${selector}". ${NOTHING_CHANGED} Examples: ".card", ".card:hover", ".list > .card".`
  const states = PSEUDO_CLASSES.map(pseudo => `:${pseudo.type}`)
  const unsupported = `Selector "${selector}" is not supported. ${NOTHING_CHANGED} Use one relation at most, like ".list > .card", and one state at most among ${states.join(' ')}.`
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
  // Despite its name, matchSelectorAll is true when some of the elements match
  if (!matchSelectorAll(target, components)) throw new Error(notMatching(editor, components[0], selector, target))
  return { cs, target }
}

// With element_id or selector, a call writes there without changing what is
// selected: the user may be working on another element
function styleTarget(editor: Editor, opts: StyleOptions): string {
  const components = elementsOf(editor, opts.element_id)
  if (!opts.selector?.trim()) return chosenSelector(editor, components)
  const { cs, target } = checkedSelector(editor, opts.selector, components)
  if (components.length > 1 && components.some(component => !matchSelectorAll(target, [component]))) {
    throw new Error(`Selector "${opts.selector}" does not match all the selected elements. ${NOTHING_CHANGED} Set element_id, or a selector they all match.`)
  }
  return complexSelectorToString(cs)
}

function breakpointOf(editor: Editor, atRule: string | undefined): string {
  const device = atRule && editor.Devices.getDevices().find(d => d.get('widthMedia') && atRule.includes(`(${editor.getConfig().mediaCondition}: ${d.get('widthMedia')})`))
  return device ? ` (breakpoint ${device.getName()})` : atRule ? ` (${atRule})` : ''
}

export default function registerCommands(editor: Editor) {
  editor.Commands.add('selector:get', {
    run() {
      elementsOf(editor)
      return { selector: currentSelector(editor), media: media(editor) }
    },
  })

  editor.Commands.add('selector:list-rules', {
    run(_ed: Editor, _sender: unknown, cmdOpts: StyleOptions = {}) {
      const lines = getSelectors(editor, elementsOf(editor, cmdOpts.element_id))
        .map(cs => complexSelectorToString(cs) + breakpointOf(editor, cs.atRule))
      return lines.length ? [...new Set(lines)].join('\n') : 'No style applies to this element yet.'
    },
  })

  editor.Commands.add('styles:get', {
    run(_ed: Editor, _sender: unknown, cmdOpts: StyleOptions = {}) {
      const selector = styleTarget(editor, cmdOpts)
      return {
        selector,
        media: media(editor),
        css: editor.CssComposer.getRule(selector, ruleOptions(editor))?.styleToString() ?? '',
      }
    },
  })

  editor.Commands.add('styles:set', {
    run(_ed: Editor, _sender: unknown, cmdOpts: StyleOptions = {}) {
      const style = typeof cmdOpts.css === 'string' ? parseDeclarations(editor, cmdOpts.css) : {}
      if (!Object.keys(style).length) throw new Error('Required: css. Example: {"css": "display: flex; gap: 16px"}.')
      getOrCreateRule(editor, styleTarget(editor, cmdOpts)).addStyle(style)
    },
  })

  editor.Commands.add('styles:remove', {
    run(_ed: Editor, _sender: unknown, cmdOpts: StyleOptions = {}) {
      const selector = styleTarget(editor, cmdOpts)
      const { property } = cmdOpts
      if (!property) throw new Error('Required: property. Example: "color".')
      const rule = editor.CssComposer.getRule(selector, ruleOptions(editor))
      const style = rule?.getStyle() ?? {}
      if (!rule || !Object.prototype.hasOwnProperty.call(style, property)) {
        const set = Object.keys(style)
        const screen = media(editor) ? ` for breakpoint ${editor.Devices.getSelected()?.getName()}` : ''
        throw new Error(`Property "${property}" is not set on "${selector}"${screen}. ${set.length ? `Set properties: ${set.join(', ')}.` : 'It has no properties set.'} ${NOTHING_CHANGED}`)
      }
      rule.removeStyle(property)
    },
  })
}
