import { ElementData, ElementId } from './types';
import { createDomElement, getDomElement, hideOnDesktop, hideOnMobile, removeElement, reorderElements, setLink, showOnDesktop, showOnMobile, writeStyleToDom } from './dom';
import { setPages } from '../page/dom';
import { setWebsiteWidth } from '../site/dom';
import { writeDataToDom } from '../flux/dom';
import { StateChange } from '../flux/crud-store';
import { executeScripts, getContentNode, setInnerHtml } from './dom';
import { noSectionContent, getParent } from '../element/filters';
import { getPages } from '../page/store';
import { getElements } from './store';
import { getUi } from '../ui/store';
import { getData } from '../flux/store';

export const onAddElements = (win: Window) => (elements: ElementData[]) => {
  console.log('onAddElements', elements)
  const doc = win.document
  const added = []
  elements.forEach((element) => {
    // create with defaults
    const parent = getParent(element) // parent may be null if the parent's children array has not yet be changed, then the element will be moved when it is set
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
        from: emptyElement,
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
    onUpdateElements(win)(added)
  }
}

export const onDeleteElements = (win: Window) => (elements: ElementData[]) => {
  const doc = win.document
  elements
  .map((element) => getDomElement(doc, element))
  .forEach((element) => {
    removeElement(element)
  })
}

export const onUpdateElements = (win: Window) => (change: StateChange<ElementData>[]) => {
  // console.log('onUpdateElements', change)
  const doc = win.document

  change.forEach(({from, to}) => {
    const domEl = getDomElement(doc, to)

    if (to.pageNames !== from.pageNames) {
      const noSection = noSectionContent(to)
      const noSectionDom = getDomElement(doc, noSection)
      if (noSectionDom) {
        setPages(getPages(), noSectionDom, to.pageNames.map((pageName) => getPages().find((p) => p.id === pageName)))
      } else {
        console.warn('no section dom, why?')
      }
    }
    if (to.children !== from.children) {
      reorderElements(domEl, to.children
        .map((id: ElementId) => getDomElement(doc, getElements().find((el) => el.id === id)))
        .filter((el) => !!el)) // FIXME: what should we do while the child is not yet added
    }
    if (to.link !== from.link) {
      setLink(domEl, to.link)
    }
    if (to.classList !== from.classList) {
      from.classList.forEach((c) => domEl.classList.remove(c))
      to.classList.forEach((c) => domEl.classList.add(c))
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
      ['mobile', 'desktop'].forEach((mobileOrDesktop) => {
        if (to.style[mobileOrDesktop] !== from.style[mobileOrDesktop]) {
          // handle min-height VS height
          const height = to.style[mobileOrDesktop].height
          const style = {
            ...to.style[mobileOrDesktop],
            'min-height': to.useMinHeight ? height : null,
            'height': to.useMinHeight ? null : height,
          }
          // write css rules
          writeStyleToDom(doc, to.id, style, getUi().mobileEditor)
        }
      })
      // website width is also section containers width
      if (!getUi().mobileEditor && to.style.desktop !== from.style.desktop) {
        if (to.isSectionContent && !!to.style.desktop.width) {
          const style = {
            ...to.style.desktop,
            width: null,
          }
          // write css rules
          writeStyleToDom(doc, to.id, style, false)
          // set website width
          setWebsiteWidth(doc, parseInt(to.style.desktop.width))
        }
      }
    }
  })
  // save data to the dom for front-end.js
  writeDataToDom(doc, getData())
}
