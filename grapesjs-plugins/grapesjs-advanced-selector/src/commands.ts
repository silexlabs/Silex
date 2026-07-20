import { Editor } from 'grapesjs'
import { getComponentSelector, setComponentSelector, editStyle, getSelectors, getOrCreateRule } from './model/GrapesJsSelectors'
import { toString as complexSelectorToString, fromString as complexSelectorFromString, getSelector } from './model/ComplexSelector'
import { PseudoClassType } from './model/PseudoClass'
import { OperatorType } from './model/Operator'

const PSEUDO_CLASS_NAMES = Object.values(PseudoClassType)
const OPERATOR_NAMES = Object.values(OperatorType)

export default function registerCommands(editor: Editor) {
  editor.Commands.add('selector:get', {
    run() {
      const component = editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')
      const cs = getComponentSelector(component)
      return {
        selector: complexSelectorToString(cs),
        hasOperator: !!cs.operator,
        hasPseudoClass: !!cs.mainSelector?.pseudoClass,
        atRule: cs.atRule || null,
      }
    },
  })

  editor.Commands.add('selector:set', {
    run(_ed: Editor, _sender: unknown, cmdOpts: { selector?: string } = {}) {
      const component = editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')
      const { selector } = cmdOpts
      if (!selector) throw new Error('Required: selector (CSS selector string). Examples: ".my-class", "div.card:hover", ".parent > .child", ".card:has(.icon)"')
      try {
        const cs = complexSelectorFromString(selector, '')
        setComponentSelector(component, cs)
        editStyle(editor, selector)
      } catch(e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`Invalid selector "${selector}". ${msg}. Valid formats: ".class", "#id", "tag", ".parent > .child", ".el:hover", ".el:has(.child)", ".el:not(.excluded)". Pseudo-classes: ${PSEUDO_CLASS_NAMES.slice(0, 10).join(', ')} (${PSEUDO_CLASS_NAMES.length} total — use selector:info for full list). Operators: ${OPERATOR_NAMES.join(', ')}`, { cause: e })
      }
    },
  })

  editor.Commands.add('selector:list-rules', {
    run() {
      const component = editor.getSelected()
      if (!component) throw new Error('No component selected. Use components:select first.')
      const selectors = getSelectors(editor)
      return selectors.map(cs => ({
        selector: complexSelectorToString(cs),
        hasOperator: !!cs.operator,
        hasPseudoClass: !!cs.mainSelector.pseudoClass,
        atRule: cs.atRule || null,
      }))
    },
  })

  // Resolve the styling target from the component's stored selector at call
  // time — StyleManager.getSelected() is unreliable here: it is set by a race
  // between GrapesJS's native targeting and the panel's debounced re-selection
  const activeRule = () => {
    const components = editor.getSelectedAll()
    const cs = getSelector(components)
    if (!cs) throw new Error('No component selected. Use components:select first.')
    const selStr = complexSelectorToString(cs)
    if (!selStr) throw new Error('No selector active. Use selector:set first.')
    const rule = getOrCreateRule(editor, selStr)
    editor.StyleManager.select(rule)
    return rule
  }

  editor.Commands.add('styles:get', {
    run() {
      const rule = activeRule()
      return {
        selector: rule.selectorsToString?.() ?? '',
        style: rule.getStyle(),
        mediaText: rule.get('mediaText') ?? '',
      }
    },
  })

  editor.Commands.add('styles:set', {
    run(_ed: Editor, _sender: unknown, cmdOpts: Record<string, string> = {}) {
      const rule = activeRule()
      const { property, value, ...rest } = cmdOpts
      const existing = rule.getStyle?.() ?? {}
      if (property && value !== undefined) {
        rule.setStyle({ ...existing, [property]: value })
      } else if (Object.keys(rest).length) {
        rule.setStyle({ ...existing, ...rest })
      } else {
        throw new Error('Required: {property, value} or CSS key-value pairs. Example: {property: "color", value: "red"} or {"color": "red", "font-size": "16px"}')
      }
    },
  })

  editor.Commands.add('styles:remove', {
    run(_ed: Editor, _sender: unknown, cmdOpts: { property?: string } = {}) {
      const rule = activeRule()
      const { property } = cmdOpts
      if (!property) throw new Error('Required: property (CSS property name, e.g. "color", "font-size", "margin")')
      const style = rule.getStyle()
      delete style[property]
      rule.setStyle(style)
    },
  })

  editor.Commands.add('selector:info', {
    run() {
      return {
        pseudoClasses: PSEUDO_CLASS_NAMES,
        operators: OPERATOR_NAMES,
        examples: [
          { selector: '.my-class', description: 'Simple class selector' },
          { selector: 'div.card', description: 'Tag + class' },
          { selector: '.card:hover', description: 'Class with pseudo-class' },
          { selector: '.parent > .child', description: 'Direct child combinator' },
          { selector: '.list .item', description: 'Descendant combinator' },
          { selector: '.item + .item', description: 'Adjacent sibling' },
          { selector: '.item ~ .footer', description: 'General sibling' },
          { selector: '.card:has(.icon)', description: 'Has relational pseudo-class' },
          { selector: '.btn:not(.disabled)', description: 'Negation pseudo-class' },
          { selector: '.item:nth-child(2n+1)', description: 'Nth-child with parameter' },
        ],
      }
    },
  })
}
