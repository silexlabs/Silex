/**
 * @fileoverview helpers to dispatch common actions on the store
 * TODO: 1- remove all references to the store or dispatch => every function should take ElementState[] and return the changes to be made as an ElementState[]
 * TODO: 2- move this file to a cross platform package (e.g. in src/ts/helpers/)
 */

import { StyleName, StyleData, StyleDataObject, PseudoClass, PseudoClassData, Visibility } from './types'
import { getElements } from '../element-store/index'
import { getPseudoClassData } from './utils'
import { getSite, updateSite } from './index'
import { store } from '../store/index'
import { updateElements } from '../element-store/index'

/**
 * save an empty style or reset a style
 */
export function initStyle(displayName: string, className: StyleName, opt_data?: StyleData, site = getSite(), dispatch = store.dispatch) {
  const newData = !!opt_data ? JSON.parse(JSON.stringify(opt_data)) : ({
    className: '',
    displayName: '',
    templateName: '',
    styles: {desktop: {normal: {}}},
  } as StyleData)
  // check that style does not exist
  if (site.styles[className]) {
    throw new Error('This style already exists')
  } else {
    // render all pseudo classes in all visibility object
    getPseudoClassData(newData)
    .forEach((pseudoClassData) => {
      componentStyleChanged(className, pseudoClassData.pseudoClass, pseudoClassData.visibility, pseudoClassData.data, displayName, site, dispatch)
    })
  }
}

/**
 * update the style in the store (style of the style editor)
 * FIXME: this should be at the site level
 */
export function componentStyleChanged(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility, opt_data?: PseudoClassData, opt_displayName?: string, site = getSite(), dispatch = store.dispatch) {
  // expose the class name and pseudo class to the prodotype template
  const newData = {
    ...opt_data,
    className,
    pseudoClass,
  }

  // store the component's data for later edition
  const styleData = !!site.styles[className] ? {
    // clone the data object
    ...site.styles[className],
  } : {
    className,
    templateName: 'text',
    displayName: opt_displayName,
    styles: {},
  } as StyleData
  if (!styleData.styles[visibility]) {
    styleData.styles[visibility] = {}
  }
  styleData.styles[visibility][pseudoClass] = newData

  const style: StyleDataObject = {
    ...site.styles,
    [className]: styleData,
  }
  updateSite({
    ...site,
    styles: style,
  }, dispatch)
}

export function removeStyle(className: string, site = getSite(), elements = getElements(), dispatch = store.dispatch) {
  // clone the site and style objects
  const newSite = {
    ...site,
    styles: {
      ...site.styles,
    }
  }

  // delete the style
  delete newSite.styles[className]

  // remove style from all elements
  updateElements(elements
    .filter((el) => el.classList.includes(className))
    .map((el) => ({
      ...el,
      classList: el.classList.filter((c) => c !== className),
    })), dispatch)

  // update the store
  updateSite(newSite, dispatch)
}
