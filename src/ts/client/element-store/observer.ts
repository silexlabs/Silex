import { ElementState, ElementId, ElementData } from './types'
import { StateChange } from '../store/crud-store'
import {
  createDomElement,
  deleteStyleFromDom,
  executeScripts,
  getDomElement,
  hideOnDesktop,
  hideOnMobile,
  removeElement,
  reorderElements,
  setInnerHtml,
  setLink,
  showOnDesktop,
  showOnMobile,
  writeStyleToDom
} from './dom'
import { getCurrentPage } from '../page-store/filters'
import { getElementById } from './filters'
import { getElements } from './index'
import { getEmptyElementData } from './utils'
import { getPages } from '../page-store/index'
import { getParent } from '../element-store/filters'
import { getSiteWindow } from '../components/SiteFrame'
import { getState } from '../store/index'
import { isComponent, updateComponentsDependencies } from './component'
import { openPageDom, setPages } from '../page-store/dom'
import { resetStage } from '../components/StageWrapper'
import { setTagName } from '../utils/dom'
import { writeDataToDom } from '../store/dom'

export const onAddElements = (win: Window) => (toBeAdded: ElementState[], elements = getElements()) => {
  const doc = win.document
  const added: StateChange<ElementState>[] = []
  toBeAdded.forEach((element) => {
    // create with defaults
    const parent = getParent(element, elements) // parent may be null if the parent's children array has not yet be changed, then the element will be moved when it is set
    const parentEl = parent ? getDomElement(doc, parent) : doc.body
    createDomElement({
      doc,
      id: element.id,
      type: element.type,
      parent: parentEl,
      isSectionContent: element.isSectionContent,
    })

    if (parent && !parentEl) {
      // no parent element yet but will come soon
      console.warn('no parent element yet but will come soon hopefully')
    } else {
      // create a temporary empty element in order to update it with onUpdateElements
      const emptyElement: ElementData = getEmptyElementData({
        id: element.id,
        type: element.type,
        isSectionContent: element.isSectionContent,
        isBody: false,
      })

      // update with provided data
      added.push({
        from: emptyElement as ElementState, // we do not need crudId here
        to: element,
      })
    }
  })
  if (added.length) {
    onUpdateElements(win)(added, elements)
    // setTimeout: observers are not supposed to dispatch
    setTimeout(() => {
      // update components dependencies if there is 1 or more components
      if(added.find(({to}) => isComponent(to))) {
        updateComponentsDependencies()
      }
    })
  }
}

export const onDeleteElements = (win: Window) => (elements: ElementState[]) => {
  // remove elements from dom
  const doc = win.document
  elements
  .map((element) => {
    deleteStyleFromDom(doc, element.id, true)
    deleteStyleFromDom(doc, element.id, false)

    return getDomElement(doc, element)
  })
  .forEach((element) => {
    removeElement(element)
  })
  // setTimeout: observers are not supposed to dispatch
  setTimeout(() => {
    // update components dependencies if there is 1 or more components
    if(elements.find((el) => isComponent(el))) {
      updateComponentsDependencies()
    }
  }, 0)
}

export const onUpdateElements = (win: Window) => (change: StateChange<ElementState>[], elements = getElements()) => {
  const doc = win.document

  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)

    if (to.pageNames !== from.pageNames) {
      // apply visibility
      const pages = getPages()
      setPages(pages, domEl, to.pageNames.map((pageName) => pages.find((p) => p.id === pageName)))
      // reopen the current page in case the element is not visible on the current page anymore
      openPageDom(getSiteWindow(), getCurrentPage())
    }
    if (to.children !== from.children) {
      reorderElements(domEl, to.children
        .map((id: ElementId) => getElementById(id, elements))
        .filter((el: ElementState) => !!el) // filter out elements which have their ID in children but can not be found, which should never happen?
        .map((el: ElementState) => getDomElement(doc, el))
        .filter((el: HTMLElement) => !!el) //  filter out elements which have no DOM elements, i.e. recently added, should never happen??
      )
    }
    if (to.link !== from.link) {
      setLink(domEl, to.link)
    }
    if (to.attr !== from.attr) {
      const fromAttr = from.attr || {}
      Object.entries(fromAttr)
      .forEach(([name, val]) => {
        try {
          domEl.removeAttribute(name)
        } catch(e) {
          console.error('could not remove HTML attr', {name, val, domEl})
        }
      })
      const toAttr = to.attr || {}
      Object.entries(toAttr)
      .forEach(([name, val]) => {
        try {
          domEl.setAttribute(name, val || '')
        } catch(e) {
          console.error('could not add HTML attr', {name, val, domEl})
        }
      })
    }
    if (to.classList !== from.classList) {
      // remove only the old css classes
      // this will keep the element SilexId, type,  etc.
      from.classList.forEach((c) => domEl.classList.remove(c))
      domEl.classList.add(...to.classList)
    }
    // element visibility destkop and mobile
    if (to.visibility.desktop !== from.visibility.desktop) {
      if (to.visibility.desktop) {
        showOnDesktop(domEl)
      } else {
        hideOnDesktop(domEl)
      }
    }
    if (to.visibility.mobile !== from.visibility.mobile) {
      if (to.visibility.mobile) {
        showOnMobile(domEl)
      } else {
        hideOnMobile(domEl)
      }
    }
    if (to.link) {
      if (domEl.tagName !== 'A') {
        setTagName(domEl, 'A')
        // reset the stage because stage component holds references to dom elements
        // of selected Silex elements
        // FIXME: this is a problem in drag-drop-stage-component module
        resetStage()
      }
    } else if (to.tagName.toUpperCase() !== domEl.tagName.toUpperCase()) {
      // Here to.tagName may be the same as from.tagName and still the node can have a tag name "A"
      // This happens when we remove a link
      setTagName(domEl, to.tagName)
    }
    if (to.alt !== from.alt) {
      const img: HTMLImageElement = (domEl.querySelector('img')) as HTMLImageElement
      if (img) {
        img.alt = to.alt
      } else {
        console.error('could not set alt attribute as no image element was found')
      }
    }
    if (to.title !== from.title) {
      domEl.title = to.title
    }
    if (to.innerHtml !== from.innerHtml) {
      // FIXME: keep children in the dom ??
      // remove the editable elements temporarily
      // const tempElements = saveEditableChildren(domEl)

      setInnerHtml(domEl, to.innerHtml)

      // FIXME: keep children in the dom ??
      // put back the editable elements
      // domEl.appendChild(tempElements)

      // FIXME: should exec scripts only after dependencies are loaded
      // getStage().redrawSome([domEl]
      //   .map((el) => getStage().getState(el)))
    }
    // update styles in the dom
    if (to.style !== from.style) {
      // write css rules
      writeStyleToDom(doc, to, true)
      writeStyleToDom(doc, to, false)
    }
    // execute the scripts
    if (isComponent(to)
      && (from.style.mobile.width !== to.style.mobile.width
        || from.style.mobile.height !== to.style.mobile.height
        || from.style.desktop.width !== to.style.desktop.width
        || from.style.desktop.height !== to.style.desktop.height
        || to.innerHtml !== from.innerHtml)) {
      executeScripts(win, domEl)
    }
  })
  // save data to the dom for front-end.js
  writeDataToDom(doc, getState())
}
