import { ElementState, ElementId, ElementData } from './types';
import { StateChange } from '../store/crud-store';
import {
  createDomElement,
  deleteStyleFromDom,
  executeScripts,
  getContentNode,
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
} from './dom';
import { getState } from '../store/index';
import { getElementById } from './filters';
import { getPages } from '../page-store/index';
import { noSectionContent, getParent } from '../element-store/filters';
import { setPages } from '../page-store/dom';
import { writeDataToDom } from '../store/dom';
import { getElements } from './index'

export const onAddElements = (win: Window) => (toBeAdded: ElementState[], elements = getElements()) => {
  const doc = win.document
  const added: StateChange<ElementState>[] = []
  toBeAdded.forEach((element) => {
    // create with defaults
    const parent = getParent(element, elements) // parent may be null if the parent's children array has not yet be changed, then the element will be moved when it is set
    const parentEl = parent ? getDomElement(doc, parent) : doc.body
    const emptyElement: ElementData = createDomElement({
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
      // update with provided data
      added.push({
        from: emptyElement as ElementState, // we do not need crudId here
        to: element,
      })
    }

    // execute the scripts
    // FIXME: exec scripts in elements and components?
    // this.model.component.executeScripts(domEl)

    // need to call Component:initComponent (adds default data)
    console.error('not implemented: components')
  })
  if (added.length) {
    onUpdateElements(win)(added, elements)
  }
}

export const onDeleteElements = (win: Window) => (elements: ElementState[]) => {
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
}

export const onUpdateElements = (win: Window) => (change: StateChange<ElementState>[], elements = getElements()) => {
  const doc = win.document

  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)

    if (to.pageNames !== from.pageNames) {
      const noSection = noSectionContent(to, elements)
      const noSectionDom = getDomElement(doc, noSection)
      if (noSectionDom) {
        setPages(getPages(), noSectionDom, to.pageNames.map((pageName) => getPages().find((p) => p.id === pageName)))
      } else {
        console.warn('no section dom, why?')
      }
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
    if (to.alt !== from.alt) {
      const img: HTMLImageElement = getContentNode(domEl) as HTMLImageElement
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
      // execute the scripts
      executeScripts(win, domEl)

      // getStage().redrawSome([domEl]
      //   .map((el) => getStage().getState(el)))
    }
    if (to.style !== from.style) {
      // write css rules
      writeStyleToDom(doc, to, true)
      writeStyleToDom(doc, to, false)
      // ['mobile', 'desktop'].forEach((mobileOrDesktop) => {
      // })
    }
  })
  // save data to the dom for front-end.js
  writeDataToDom(doc, getState())
}
