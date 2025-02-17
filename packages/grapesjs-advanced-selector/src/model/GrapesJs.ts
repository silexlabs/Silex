import { Component, CssRule, Editor } from 'grapesjs'
import { ComplexSelector, EMPTY_SELECTOR, fromString } from '../model/ComplexSelector'
import { ClassSelector, IdSelector, isSameSelector, SimpleSelector, SimpleSelectorType } from './SimpleSelector'

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
        if(component?.view?.el.matches(selectorString)) console.log('MATCH', selectorString)
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
  switch(oldSelector.type) {
  case SimpleSelectorType.ID:
    if(components.length !== 1) {
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
}

export function renameCssClass(editor: Editor, oldClassName: string, newClassName: string) {
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
  component.set('selector', selector)
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
  return selector
}
