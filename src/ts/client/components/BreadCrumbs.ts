import { Constants } from '../../constants'
import { ElementState } from '../element-store/types'
import { getDisplayName } from '../element-store/utils'
import { getDomElement } from '../element-store/dom'
import {
  getParent,
  getSelectedElements,
  isBody
} from '../element-store/filters'
import { getSiteDocument } from './SiteFrame'
import { getUiElements } from '../ui-store/UiElements'
import { isComponent } from '../element-store/component'
import { subscribeElements, updateElements, getElements } from '../element-store/index'

/**
 * @fileoverview
 * the Silex bread crumbs, which displays the selection's containers
 *
 */

///////////////////
// API for the outside world
export function initBreadCrumbs() {
  return new BreadCrumbs(getUiElements().breadCrumbs)
}

/**
 * TODO: make this only methods and write tests
 */
class BreadCrumbs {
  constructor(private element: HTMLElement) {
    subscribeElements(() => this.redraw())
  }

  /**
   * the selection has changed
   */
  private redraw() {
    // get the common ancesters to all selected elements
    function getParents(element: ElementState): ElementState[] {
      const parent = getParent(element)
      return parent ? (getParent(parent) ? [parent].concat(getParents(parent)) : [parent]) : []
    }

    // empty current bread crumbs
    while (this.element.childNodes.length) {
      this.removeCrumb((this.element.childNodes[0] as HTMLElement))
    }

    // find the selected element which is the "deepest" in the dom, i.e. has
    // the greater number of parent nodes
    const selectedElements = getSelectedElements()
      .map((el) => ({
        el,
        parents: getParents(el),
      }))
      .sort((elem1, elem2) => elem2.parents.length - elem1.parents.length)

    if (selectedElements.length) {
      const deepest = selectedElements.shift()

      // for this "deepest" element, find the common ancestors with all others
      let ancestors = deepest.parents
      selectedElements.forEach(({el, parents}) => {
        const newAncestors = []
        let idx = 0
        while (idx < ancestors.length && idx < parents.length && ancestors[idx] === parents[idx]) {
          newAncestors.push(ancestors[idx++])
        }
        ancestors = newAncestors
      })

      // if only 1 element is selected, display it in the crumbs
      if (selectedElements.length === 0) {
        ancestors.unshift(deepest.el)
      }

      // create a button for each ancester
      ancestors
        .reverse()
        .forEach((ancestor) => this.addCrumb(ancestor))
    }
  }

  /**
   * add a button in the bread crumb container
   */
  private addCrumb(element: ElementState) {
    const domEl = getDomElement(getSiteDocument(), element)
    if(!domEl) return // element is in the model but its parent has not been updated yet, so it is not yet in the dom

    const crumb = document.createElement('DIV')
    const filteredClasses = element.classList
      .filter((className) => !Constants.SILEX_CLASS_NAMES.includes(className))
    const cssClasses = filteredClasses.length ? '.' + filteredClasses.join('.') : ''

    const _isBody = isBody(element)
    const displayName = _isBody ? 'Body' : isComponent(element) ? 'Component' : getDisplayName(element)
    crumb.classList.add('crumb')
    crumb.innerHTML = displayName + cssClasses
    crumb.style.zIndex = (100 - this.element.childNodes.length).toString()
    this.element.appendChild(crumb)
    crumb.onclick = () => updateElements(getElements()
      .filter((el) => el.selected || el === element)
      .map((el) => ({
        ...el,
        selected: el === element,
      })))
    const svg = '<svg class="svg" viewBox="0 0 7 28" height="28" width="7"><path d="M.5 0l6 14-6 14H7V0z" fill="currentColor"></path><path d="M1 0H0l6 14-6 14h1l6-14z" fill="#858585"></path></svg>'
    const sep = document.createElement('DIV')
    sep.classList.add('sep')
    sep.innerHTML = svg
    this.element.appendChild(sep)
  }

  /**
   * remove events and deletes a bread crumb
   */
  private removeCrumb(crumb: HTMLElement) {
    this.element.removeChild(crumb)
  }
}
