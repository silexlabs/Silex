import {
  ComponentData,
  ElementState,
} from '../element-store/types'
import {
  ComponentDefinition,
  ComponentsDefinition,
  Prodotype
} from '../externs'
import { config } from '../ClientConfig'
import { Constants } from '../../constants'
import { PseudoClass, PseudoClassData, StyleData, StyleName, Visibility } from '../site-store/types'
import { addMediaQuery, renderWithProdotype } from '../element-store/dom'
import { getElements } from '../element-store/index'
import { getPseudoClassData } from '../site-store/utils'
import { getSite, updateSite } from '../site-store/index'
import { getUi, updateUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'

/**
 * @fileoverview
 *   This class is used to manage Prodotype components
 *   Components are based on Silex elements, use Prodotype to render a templates
 */

let prodotypeComponent: Prodotype
let prodotypeStyle: Prodotype
let styleEditorElement: HTMLElement
let componentEditorElement: HTMLElement
let prodotypeLoaded = false

// wait for the Prodotype library to be loaded
// FIXME: this is useless, it can be done directly on module import
export function initProdotype() {
  // init style editor
  styleEditorElement = getUiElements().propertyTool.querySelector('.prodotype-style-editor .prodotype-container')

  // tslint:disable:no-string-literal
  prodotypeStyle = new window['Prodotype'](styleEditorElement, './prodotype/styles')
  // tslint:enable:no-string-literal

  // init component editor
  loadComponents(config.componentFolders)
}

function getProdotypeComponent(): Prodotype {
  if(!prodotypeComponent) initProdotype()
  return prodotypeComponent
}

function getProdotypeStyle(): Prodotype {
  if(!prodotypeStyle) initProdotype()
  return prodotypeStyle
}

export function loadComponents(paths: string[]) {
  // store the element in which to render
  componentEditorElement = getUiElements().propertyTool.querySelector('.prodotype-component-editor')
  // tslint:disable:no-string-literal
  const compEd: Prodotype = new window['Prodotype'](componentEditorElement, paths)
  // tslint:enable:no-string-literal
  // first load
  if (!prodotypeComponent) prodotypeComponent = compEd
  // wait for prodotype to load the components.json files
  compEd.ready((err) => {
    if (err) {
      console.error(err)
    } else {
      prodotypeComponent = compEd
      prodotypeLoaded = true
      updateUi({
        ...getUi(),
        components: getComponentsDef(Constants.COMPONENT_TYPE),
      })
    }
  })
}

/**
 * get Prodotype descriptor of the components
 * @return component descriptors
 */
export function getComponentsDef(type: string): ComponentsDefinition {
  const obj = type === Constants.COMPONENT_TYPE ? getProdotypeComponent() : getProdotypeStyle()
  return obj ? obj.componentsDef : ({} as ComponentsDefinition)
}

export function isComponent(element: ElementState) {
  return !!element.data.component && !!element.data.component.templateName
}

/**
 * @param element component just added
 * @param templateName type of component
 */
export function initComponent(element: ElementState, templateName: string): Promise<ElementState> {
  const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE)
  const comp = componentsDef[templateName]
  if (comp) {
    const name = getProdotypeComponent()
      .createName(templateName, getElements()
        .filter((el) => isComponent(el))
        .map((el) => el.data.component))

    // for selection (select all components)
    // element.classList.add(Constants.COMPONENT_CLASS_NAME)

    // apply the style found in component definition
    // this includes the css class of the component (component-templateName)
    const cssClasses = getCssClasses(templateName) || []

    // apply the style found in component definition
    const initialCss = comp.initialCss || {}

    // same for the container inside the element (content node)
    if (comp.initialCssContentContainer) {
      // applyStyleTo(
      //     model.element.getContentNode(element),
      //     comp.initialCssContentContainer)
      console.error('not implemented', comp.initialCssContentContainer)
    }

    // first rendering of the component
    return renderWithProdotype(getProdotypeComponent(), {
      templateName,
      data: {},
      dataSources: getSite().dataSources,
    })
    .then((html) => {
      return {
        ...element,
        classList: element.classList.concat(cssClasses),
        data: {
          ...element.data,
          component: {
            name,
            templateName,
            data: {},
          },
        },
        innerHtml: html,
        style: {
          ...element.style,
          desktop: {
            ...element.style.desktop,
            ...initialCss,
          },
        },
      }
    })
  } else {
    console.error('Component definition not found in prodotype data')
  }
}

/**
 * get the class names specified in the definition of the prodotype component
 * this is in the className attribute of the component .md file
 */
export function getComponentClassName(element) {
  if (isComponent(element)) {
    const templateName = (element.data.component.templateName as string)
    return getCssClasses(templateName)
  }
  return []
}

/**
 * get all CSS classes set on this component when it is created
 * this includes the css class of the component (component-templateName)
 * @param templateName the component's template name
 * @return an array of CSS classes
 */
export function getCssClasses(templateName: string): string[] {
  const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE)
  const comp: ComponentDefinition = componentsDef[templateName]
  let cssClasses = [Constants.COMPONENT_CLASS_NAME + '-' + templateName]
  if (comp) {
    // class name is either an array
    // or a string or null
    switch (typeof comp.initialCssClass) {
      case 'undefined':
        break
      case 'string':
        cssClasses = cssClasses.concat(comp.initialCssClass.split(' '))
        break
      default:
        cssClasses = cssClasses.concat(comp.initialCssClass)
    }
  } else {
    console.error(`Error: component's definition not found in prodotype templates, with template name "${templateName}".`)
  }
  return cssClasses
}

/**
 * update the dependencies of Prodotype components
 * FIXME: should have a callback to know if/when scripts are loaded
 * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
 */
export function updateDepenedencies(type: string) {
  if (type !==  Constants.COMPONENT_TYPE) {
    // TODO: cleanup since this would need to support several types of components?
    throw new Error('Not supported, all dependencies are for components for now, not styles')
  }
  const components: ComponentData[] = getElements()
    .filter((el) => isComponent(el))
    .map((el) => el.data.component)
  const prodotypeDependencies = getProdotypeComponent().getDependencies(components)

  const oldDependencies = getSite().prodotypeDependencies
  const isDifferent = (() => {
    for(const compName in oldDependencies)
      if(!prodotypeDependencies[compName]) return true
    for(const compName in prodotypeDependencies)
      if(!oldDependencies[compName]) return true
    return false
  })()

  if(isDifferent) {
    updateSite({
      ...getSite(),
      prodotypeDependencies,
    })
  }
}

/**
 * hide component editors
 * FIXME: this should be in the component
 */
export function resetComponentEditor() {
  if (prodotypeLoaded) {
    componentEditorElement.classList.add('hide-panel')
    getProdotypeComponent().edit()
  }
}

/**
 * show component editors and edit the selection
 * FIXME: this should be in the component
 */
export function openComponentEditor(options: {
  data?: any,
  dataSources?: object,
  templateName?: string,
  events?: any
}) {
  if (prodotypeLoaded) {
    getProdotypeComponent().edit(options.data, options.dataSources, options.templateName, options.events)
    componentEditorElement.classList.remove('hide-panel')
  }
}

/**
 * edit a style in the style editor
 */
export function openStyleEditor(options: {
  data?: any,
  dataSources?: object,
  templateName?: string,
  events?: any
}) {
  if (prodotypeLoaded) {
    getProdotypeStyle().edit(options.data, options.dataSources, options.templateName, options.events)
  }
}

/**
 * remove the editable elements from an HTML element and store them in an HTML
 * fragment
 * @param parentElement, the element whose children we want to save
 * @return an HTML fragment with the editable children in it
 */
export function saveEditableChildren(parentElement: HTMLElement): DocumentFragment {
  const fragment = document.createDocumentFragment()
  Array.from(parentElement.children)
  .forEach((el) => {
    if (el.classList.contains('editable-style')) {
      fragment.appendChild(el.cloneNode(true))
    }
  })
  return fragment
}

/**
 * add a media query around the style string
 * when needed for mobile-only
 */
export function addMediaQueryIfMobileOnly(html: string, visibility: Visibility) {
  if (visibility === Constants.STYLE_VISIBILITY[0]) {
    return html
  }
  return addMediaQuery(html)
}

/**
 * create or update a style
 * if data is not provided, create the style with defaults
 */
export function setStyleToDom(doc: HTMLDocument, className: StyleName, pseudoClass: PseudoClass, visibility: Visibility, data: PseudoClassData, displayName: string) {

  // expose the class name and pseudo class to the prodotype template
  const newData = data || {}
  newData.className = className
  newData.pseudoClass = pseudoClass

  // store the component's data for later edition
  const styleData = (getSite().styles[className] || {
    className,
    templateName: 'text',
    displayName,
    styles: {},
  } as StyleData)
  if (!styleData.styles[visibility]) {
    styleData.styles[visibility] = {}
  }
  styleData.styles[visibility][pseudoClass] = newData

  const head = doc.head

  // update the head style with the new template
  let elStyle = head.querySelector(`[data-style-id="${className}"]`)
  if (!elStyle) {
    elStyle = doc.createElement('style')
    elStyle.className = Constants.STYLE_CLASS_NAME
    elStyle.setAttribute('type', 'text/css')
    elStyle.setAttribute('data-style-id', className)
    head.appendChild(elStyle)
  }

  // render all pseudo classes in all visibility object
  const pseudoClassData = getPseudoClassData(styleData)
  if (pseudoClassData.length > 0) {
    Promise.all(pseudoClassData.map((obj) => {
          return renderWithProdotype(getProdotypeStyle(), {
            templateName: 'text',
            data: obj.data,
            dataSources: getSite().dataSources,
          })
          .then((html) => addMediaQueryIfMobileOnly(html, obj.visibility))
        }) as Promise<string>[])
        .then((htmlStrings) => {
          elStyle.innerHTML = htmlStrings.join('')
        })
  }
}
