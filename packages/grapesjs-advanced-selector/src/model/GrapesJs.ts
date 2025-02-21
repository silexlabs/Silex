import { Component, CssRule, Editor, Selector } from 'grapesjs'
import { ComplexSelector, EMPTY_SELECTOR, fromString } from '../model/ComplexSelector'
import { AttributeOperatorType, AttributeSelector, ClassSelector, IdSelector, isSameSelector, SimpleSelector, SimpleSelectorType, TAGS, TagSelector } from './SimpleSelector'
import { OperatorType } from './Operator'
import { CompoundSelector } from './CompoundSelector'

////////////////
// GrapeJs functions
/**
 * Group actions in 1 undo/redo step
 */
function groupActions(editor: Editor, actions: () => void) {
  console.log('groupActions', editor)
  //editor.UndoManager.start()
  try {
    actions()
  } catch(e) {
    console.error('Error in groupActions', e)
  } finally {
    // editor.UndoManager.forceSave()
  }
  //editor.UndoManager.stop()
}

////////////////
// Stye Manager functions
/**
 * Get all selectors that match the selected component
 */
export function getSelectors(editor: Editor): ComplexSelector[] {
  //const selectors = editor.CssComposer.getAll()
  //console.log({selectors})
  // FIXME: Handle multi-selection
  const component = editor.getSelectedAll()[0]
  console.groupCollapsed('selectors')
  const result = editor.CssComposer.getRules()
    .filter((rule: CssRule) => {
      console.log(rule.getSelectorsString(), rule.getAtRule(), rule)
      return true
    })
    .map((rule: CssRule) => rule.getSelectorsString())
    .filter((selectorString: string) => {
      try {
        return component?.view?.el.matches(selectorString)
      } catch(e) {
        // TODO: cleanup??
        console.error('Error matching selector', selectorString, e, 'TODO: cleanup?')
        return false
      }
    })
    .map((selectorString: string) => fromString(selectorString))
  console.groupEnd()
  return result
}

/**
 * Function to edit or add style based on the selector
 */
export function editStyle(editor: Editor, selector: string) {
  const currentWidth = editor.DeviceManager.getSelected()?.get('width')
  console.log('currentWidth', currentWidth)

  // Add the class (or use tag selector if it's a tag like `.title`)
  //const _class = selectedComponent.setClass(selector)
  //console.log({_class})

  // Get or create the CSS rule for the given selector
  //const style = editor.getSelected()?.getStyle()
  const opts = {
    atRuleType: currentWidth ? 'media' : '',
    atRuleParams: currentWidth ? `(max-width: ${currentWidth})` : '',
  }
  const old = editor.CssComposer.getRule(selector, opts)
  const addStyles = true// JSON.stringify(style) === '{}'
  // const rule = editor.CssComposer.setRule(selector, style)
  const rule = editor.CssComposer.setRule(selector, old?.getStyle(), {
    addStyles: !!old?.getStyle(),
    ...opts,
  })
  // const rule = addStyles ? editor.CssComposer.setRule(selector, style, { addStyles: true }) : editor.CssComposer.setRule(selector, style)
  editor.StyleManager.select(rule)
  console.log('EDIT STYLE', selector, { rule, old, addStyles })

  //// Apply some default styles (optional)
  //rule.setStyle({
  //  'color': 'blue',
  //  'font-size': '18px',
  //});

  // Ensure the component is still selected for the Style Manager to work
  //editor.select(selectedComponent);
}

export function renameSelector(editor:Editor, oldSelector: SimpleSelector, newSelector: SimpleSelector) {
  console.log('renameSelector', oldSelector, newSelector, isSameSelector(oldSelector, newSelector))
  groupActions(editor, () => {
    // Rename the selector in the Style manager
    if (oldSelector.type !== newSelector.type) {
      // Cannot rename to a different type
      console.warn('Cannot rename to a different types', oldSelector, newSelector)
      return
    }
    if (isSameSelector(oldSelector, newSelector)) {
      // No change
      console.warn('No change', oldSelector, newSelector)
      return
    }
    const components = editor.getSelectedAll()
    switch (oldSelector.type) {
    case SimpleSelectorType.ID:
      if (components.length !== 1) {
        console.error('Cannot rename ID selector for multiple components', { oldSelector, newSelector })
        throw new Error('Cannot rename ID selector for multiple components')
      }
      components[0].setId((newSelector as IdSelector).value)
      break
    case SimpleSelectorType.CLASS:
      renameCssClass(editor, (oldSelector as ClassSelector).value, (newSelector as ClassSelector).value)
      break
    case SimpleSelectorType.TAG:
      components.forEach((component) => component.set('tagName', (newSelector as ClassSelector).value))
      break
    default:
      console.error('Cannot rename selector: Unknown Type', { oldSelector, newSelector })
    }
  })
}

function renameCssClass(editor: Editor, oldClassName: string, newClassName: string) {
  if (!oldClassName || !newClassName || oldClassName === newClassName) {
    console.warn('Invalid class names or same names provided.')
    return
  }

  const sm = editor.SelectorManager

  // Check if oldClassName exists
  const oldSelector = sm.get(oldClassName)
  if (!oldSelector) {
    console.warn(`Class "${oldClassName}" not found.`)
    return
  }

  // No, overwrite the existing class
  // // Check if newClassName already exists
  // const existingNewSelector = sm.get(newClassName);
  // if (existingNewSelector) {
  //   console.warn(`Class "${newClassName}" already exists.`);
  //   const confirmed = confirm(`Class "${newClassName}" already exists. Do you want to replace it with the new class?`);
  //   if (!confirmed) {
  //     return;
  //   }
  // }

  // Rename the class in all the components of the site
  // Get all the components which match .oldClassName
  editor.Pages
    .getAll()
    .forEach((page) => {
      page
        .getMainComponent()
        .find(`.${oldClassName}`)
        .forEach((component) => {
          const selector = getComponentSelector(component)
          const newSelector = {
            ...selector,
            mainSelector: {
              ...selector.mainSelector,
              selectors: selector.mainSelector.selectors.map((simpleSelector) => {
                if (simpleSelector.type === SimpleSelectorType.CLASS && (simpleSelector as ClassSelector).value === oldClassName) {
                  return {
                    ...simpleSelector,
                    value: newClassName,
                  }
                }
                return simpleSelector
              }),
            },
            relatedSelectors: {
              ...selector.relatedSelector || {},
              selectors: selector.relatedSelector?.selectors.map((relatedSelector) => {
                if (relatedSelector.type === SimpleSelectorType.CLASS && (relatedSelector as ClassSelector).value === oldClassName) {
                  return {
                    ...relatedSelector,
                    value: newClassName,
                  }
                }
                return relatedSelector
              }),
            }
          }
          setComponentSelector(component, newSelector)
        })
    })

  // Rename the class
  oldSelector.set('name', newClassName)
}

////////////////
// Component functions
/**
 * Store a selector in a component's attributes
 */
export function setComponentSelector(component: Component, selector: ComplexSelector) {
  component.set('selector', {
    ...selector,
  })
  const classes: string[] = []
  selector.mainSelector.selectors.forEach((simpleSelector) => {
    switch(simpleSelector.type) {
    case 'id':
      component.setId((simpleSelector as IdSelector).value)
      break
    case 'class':
      classes.push((simpleSelector as ClassSelector).value)
      break
    default:
      console.info('Unhandled selector type', simpleSelector)
    }
  })
  // FIXME: Add back the protected classes
  component.setClass(classes)
}

export function getComponentSelector(component: Component): ComplexSelector {
  const selector = component.get('selector') ?? EMPTY_SELECTOR
  // *****
  // return selector
  // FIXME: Backward compatibility should be handled in the app
  const oldClasses: string[] = component.getClasses()
  const classesMissingInSelector: string[] = oldClasses
    .filter((oldClass) => !selector.mainSelector.selectors.some((simpleSelector: ClassSelector) => simpleSelector.type === 'class' && simpleSelector.value === oldClass))
  const classesMissingInComponent: ClassSelector[] = selector.mainSelector.selectors
    .filter((simpleSelector: ClassSelector) => simpleSelector.type === 'class' && !oldClasses.includes(simpleSelector.value))
  if (classesMissingInComponent.length > 0) {
    component.addClass(classesMissingInComponent.map((simpleSelector) => simpleSelector.value))
  }
  if(classesMissingInSelector.length > 0) {
    const newSelector = {
      ...selector,
      mainSelector: {
        ...selector.mainSelector,
        selectors: [
          ...selector.mainSelector.selectors,
          ...classesMissingInSelector
            .map((value) => ({ type: SimpleSelectorType.CLASS, value, active: false, })),
        ],
      },
    }
    setComponentSelector(component, newSelector)
    return newSelector
  }
  return {
    ...selector,
  }
}

////////////////
// Selector functions
/**
 * Get the suggestions for the selected components which have the provided selector
 * We want to suggest the main selector:
 * - The component tag name and ID
 * - Any classes that are in the current website (will be added to the component if selected) but no classes that are already in the component
 */
export function getSuggestionsMain(editor: Editor, components: Component[], selector: ComplexSelector): SimpleSelector[] {
  const suggestions: SimpleSelector[] = []
  
  components.forEach(component => {
    // Add the component tag name and ID
    addTagNames(component, suggestions, selector.mainSelector)

    // Add the website classes
    const classes = component.getClasses()
    editor.CssComposer.getAll().forEach((rule) => {
      rule.getSelectors().forEach((sel: Selector) => {
        const s = {
          type: SimpleSelectorType.CLASS,
          value: sel.get('name'),
          active: true,
        } as ClassSelector
        if (sel.get('type') === 1 &&
          !sel.get('private') &&
          !classes.includes(sel.get('name')) &&
          canIadd(s, selector.mainSelector, suggestions)
        ) {
          suggestions.push(s)
        }
      })
    })
    // Add attributes
    const attributes = component.getAttributes({ noStyle: true, noClass: true })
    Object.keys(attributes).forEach((attr) => {
      const s = {
        type: SimpleSelectorType.ATTRIBUTE,
        value: attr,
        active: true,
      } as AttributeSelector
      if (attributes[attr]) {
        s.operator = AttributeOperatorType.EQUALS
        s.attributeValue = attributes[attr]
      }
      if (canIadd(s, selector.mainSelector, suggestions)) {
        suggestions.push(s)
      }
    })
  })
  return suggestions
}

/**
 * Get the suggestions for the related selectors. Depending on the operator (> => look for children, '+' => look for siblings, ' ' => look for parents):
 * - Any classes that are in the parents/children/siblings of the selected components
 * - Add the classes that are on each parent/child/sibling but not on the selected components
 * - Same for IDs, tag names
 */
export function getSuggestionsRelated(editor: Editor, components: Component[], selector: ComplexSelector): SimpleSelector[] {
  if (!selector.operator) {
    return []
  }
  const suggestions: SimpleSelector[] = []
  switch (selector.operator?.type) {
  case OperatorType.HAS:
    // Add the children classes, tag names, and IDs inside the selected components
    components
      .forEach((component) => {
        suggestions.push(...getSuggestions(getChildren(component), selector.relatedSelector || { selectors: [] }))
      })
    break
  case OperatorType.NOT:
    suggestions.push(...TAGS.map((tag) => ({
      type: SimpleSelectorType.TAG,
      value: tag,
      active: true,
    } as TagSelector)))
    components.forEach((component) => {
      const classes = component.getClasses()

      editor.CssComposer.getAll().forEach((rule) => {
        rule.getSelectors().forEach((sel: Selector) => {
          if (sel.get('private')) {
            return
          }
          if (sel.get('type') === 1 && !classes.includes(sel.get('name'))) {
            const classSelector = {
              type: SimpleSelectorType.CLASS,
              value: sel.get('name'),
              active: true,
            } as ClassSelector
            if (canIadd(classSelector, selector.relatedSelector!, suggestions)) {
              suggestions.push(classSelector)
            }
          } else if (sel.get('type') === 2) {
            const idSelector = {
              type: SimpleSelectorType.ID,
              value: sel.get('name'),
              active: true,
            } as IdSelector
            if (canIadd(idSelector, selector.relatedSelector!, suggestions)) {
              suggestions.push(idSelector)
            }
          }
        })
      })
    })
    break
  case OperatorType.IS:
  case OperatorType.WHERE:
    suggestions.push(...getSuggestions(components, selector.relatedSelector || { selectors: [] }))
    break
  case OperatorType.CHILD:
    components.forEach((component) => {
      const parent = component.parent()
      if (parent) {
        // Add the parent tag names, IDs, and classes
        suggestions.push(...getSuggestions([parent], selector.relatedSelector || { selectors: [] }))
      }
    })
    break
  case OperatorType.DESCENDANT:
    components.forEach((component) => {
      suggestions.push(...getSuggestions(getParents(component), selector.relatedSelector || { selectors: [] }))
    })
    break
  case OperatorType.ADJACENT:
    // Only the sibling immediately before each component
    const siblingsAdjacent: Component[] = components
      .map((comp) => getSiblingsBefore(comp)[0])
      .filter((c): c is Component => !!c)
    suggestions.push(...getSuggestions(siblingsAdjacent, selector.relatedSelector || { selectors: [] }))
    break
  case OperatorType.GENERAL_SIBLING:
    // All siblings before each component
    const siblingsGeneral: Component[] = components
      .flatMap(getSiblingsBefore)
      .filter((c): c is Component => !!c)
    suggestions.push(...getSuggestions(siblingsGeneral, selector.relatedSelector || { selectors: [] }))
    break
  default:
    console.error('Unhandled operator', selector.operator)
    throw new Error(`Unhandled operator: ${selector.operator}`)
  }
  return suggestions
}

/**
 * Add classes, tag names to the suggestions
 */
function getSuggestions(components: Component[], selector: CompoundSelector): SimpleSelector[] {
  const suggestions: SimpleSelector[] = []

  // Tag names
  components.forEach((component) => {
    addTagNames(component, suggestions, selector)
  })

  // Classes
  components
    .flatMap((comp) => comp.getClasses())
    .forEach((cl: string) => {
      // Only classes not in the suggestions yet
      if (suggestions.some((s) => s.type === SimpleSelectorType.CLASS && (s as ClassSelector).value === cl)) {
        return
      }
      // Only classes not in the related selector yet
      if (selector.selectors.some((s) => s.active && s.type === SimpleSelectorType.CLASS && (s as ClassSelector).value === cl)) {
        return
      }
      // Add the class
      suggestions.push({
        type: SimpleSelectorType.CLASS,
        value: cl,
        active: true,
      } as ClassSelector)
    })
  return suggestions
}

// Add the component tag name
function addTagNames(component: Component, suggestions: SimpleSelector[], selector: CompoundSelector) {
  // Tag names
  const tagName = component.tagName
  const tagSelector = {
    type: SimpleSelectorType.TAG,
    value: tagName,
    active: true,
  }
  if (canIadd(tagSelector, selector, suggestions)) {
    suggestions.push(tagSelector as TagSelector)
  }
  // // IDs
  // const id = component.getId()
  // const idSelector = {
  //   type: SimpleSelectorType.ID,
  //   value: id,
  //   active: true,
  // }
  // if (canIadd(idSelector, selector, suggestions)) {
  //   suggestions.push(idSelector as IdSelector)
  // }
}

// function sameType(gjs: Selector, sel: SimpleSelector): boolean {
//   return (gjs.get('type') === 1 && sel.type === SimpleSelectorType.CLASS) || (gjs.get('type') === 2 && sel.type === SimpleSelectorType.ID)
// }
// 
// function sameValue(gjs: Selector, sel: SimpleSelector): boolean {
//   if(sel.type !== SimpleSelectorType.CLASS && sel.type !== SimpleSelectorType.ID) return false // Only classes and IDs are supported by grapesjs
//   return (gjs.get('name') === (sel as ClassSelector | IdSelector).value)
// }

function canIadd(sel: SimpleSelector, selector: CompoundSelector, suggestions: SimpleSelector[]): boolean {
  if(selector.selectors.some((s) => isSameSelector(s, sel))) {
    return false
  }
  if(suggestions.some((s) => isSameSelector(s, sel))) {
    return false
  }
  return true
}

function getChildren(component: Component): Component[] {
  const children: Component[] = []
  component.components().forEach((child) => {
    children.push(child)
    children.push(...getChildren(child))
  })
  return children
}

function getParents(component: Component): Component[] {
  const parents: Component[] = []
  let parent = component.parent()
  while(parent) {
    parents.push(parent)
    parent = parent.parent()
  }
  return parents
}

function getSiblingsBefore(component: Component): Component[] {
  const prev = [] as Component[]
  const found = component.parent()?.components()
    .some((c) => {
      if (!!c && c === component) {
        return true
      }
      prev.push(c)
      return false
    })
  return found ? prev || [] : []
}
