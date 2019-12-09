import { ElementData, ElementId } from '../../types';
import { getElements, getPages, getUi } from '../api';
import { getStage } from '../components/StageWrapper';
import { addToPage, createElement, getDomElement, removeElement, removeFromAllPages, reorderElements, setClassName, setLink, writeStyleToDom, getDomElementById, getContentNode } from '../dom/element-dom';
import { getSiteDocument } from '../components/UiElements';
import { Style } from '../utils/Style';

export function onAddElement(element: ElementData, doc = getSiteDocument()) {
  console.log('Adding a element to the DOM')
  // create with defaults
  const newElement: ElementData = createElement(element.id, element.type)

  // update with provided data
  onUpdateElement(newElement, element)

  getStage().addElement(getDomElement(doc, element))

  // need to call Component:initComponent (adds default data)
  console.error('not implemented: components')
}

export function onDeleteElement(element: ElementData, doc = getSiteDocument()) {
  console.log('Removing element to the DOM', element)
  getStage().removeElement(getDomElement(doc, element))
  removeElement(getDomElement(doc, element))
}

export function onUpdateElement(oldElement: ElementData, element: ElementData, doc = getSiteDocument()) {
  // console.log('Updating element to the DOM', oldElement, element, element.style !== oldElement.style, element.style.desktop !== oldElement.style.desktop)
  const domEl = getDomElement(doc, element)
  // selection
  if (element.selected !== oldElement.selected) {
    const selection = getStage().getSelection()
    const found = selection.find((s) => s.el === domEl)
    if (element.selected) {
      if (!found) {
        getStage().setSelection(selection.map((s) => s.el).concat([domEl]))
      }
    } else {
      if (found) {
        getStage().setSelection(selection.filter((s) => s !== found).map((s) => s.el))
      }
    }
  }
  if (element.pageNames !== oldElement.pageNames) {
    console.log('Updating element visibility', oldElement.pageNames, element.pageNames)
    removeFromAllPages(domEl)
    element.pageNames.forEach((name) => addToPage(domEl, getPages().find((p) => p.id === name)))
  }
  if (element.parent !== oldElement.parent) {
    const parentEl = getElements().find((el) => element.parent === el.id)
    console.log('Updating parent', oldElement.parent, element.parent)
    getDomElement(doc, parentEl).appendChild(getDomElement(doc, element))
  }
  if (element.children !== oldElement.children) {
    console.log('Updating children', oldElement.children, element.children)
    reorderElements(element
      .children
      .map((id: ElementId) => getDomElement(doc, getElements().find((el) => el.id === id))))
  }
  if (element.link !== oldElement.link) {
    setLink(domEl, element.link)
  }
  if (element.classList !== oldElement.classList) {
    setClassName(domEl, element.classList.join(' '))
  }
  if (element.visibility !== oldElement.visibility) {
    console.error('not implemented')
    // check visible in current page + in current mobile mode
    //   this.noSectionContent(element).classList.add(Constants.HIDE_ON_MOBILE);
    //   if (!wasHidden && this.view.workspace.getMobileEditor()) {
    //     this.view.stageWrapper.removeElement(element);
    //   }
    // } else {
    //   this.noSectionContent(element).classList.remove(Constants.HIDE_ON_MOBILE);
    //   if (wasHidden && this.view.workspace.getMobileEditor()) {
    //     this.view.stageWrapper.addElement(element);
    //   }
    // }
    // const wasHidden = this.getHideOnDesktop(element);
    // if (hide) {
    //   this.noSectionContent(element).classList.add(Constants.HIDE_ON_DESKTOP);
    //   if (!wasHidden && !this.view.workspace.getMobileEditor()) {
    //     this.view.stageWrapper.removeElement(element);
    //   }
    // } else {
    //   this.noSectionContent(element).classList.remove(Constants.HIDE_ON_DESKTOP);
    //   if (wasHidden && !this.view.workspace.getMobileEditor()) {
    //     this.view.stageWrapper.addElement(element);
    //   }
    // }
  }
  if (element.alt !== oldElement.alt) {
    const img: HTMLImageElement = getContentNode(domEl) as HTMLImageElement
    if (img) {
      img.alt = element.alt
    } else {
      console.error('could not set alt attribute as no image element was found')
    }
  }
  if (element.title !== oldElement.title) {
    getDomElement(doc, element).title = element.title
  }
  if (element.style !== oldElement.style) {
    // handle min-height VS height
    const mobileOrDesktop = getUi().mobileEditor ? 'mobile' : 'desktop'
    const height = element.style[mobileOrDesktop].height
    const style = Style.addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, {
      'min-height': element.useMinHeight ? height : null,
      'height': element.useMinHeight ? null : height,
    })
    // write css rules
    writeStyleToDom(doc, element.id, style[mobileOrDesktop], getUi().mobileEditor)
    // update stage for element and children
    getStage().redrawSome([getDomElement(doc, element)]
      .concat(element.children.map((id) => getDomElementById(doc, id)))
      .map((el) => getStage().getState(el)))
    // if (['top', 'left', 'width', 'height'].find((name) => !!element.style[name])) {
    // const state = getStage().getState(domEl);
    // getStage().setState(domEl, {
    //   ...state,
    //   metrics: {
    //     ...state.metrics,
    //     clientRect: {
    //       ...state.metrics.clientRect,
    //       top: element.style[mobileOrDesktop].top ? parseInt(element.style[mobileOrDesktop].top) : state.metrics.clientRect.top,
    //       left: element.style[mobileOrDesktop].left ? parseInt(element.style[mobileOrDesktop].left) : state.metrics.clientRect.left,
    //       width: element.style[mobileOrDesktop].width ? parseInt(element.style[mobileOrDesktop].width) : state.metrics.clientRect.width,
    //       height: element.style[mobileOrDesktop].height ? parseInt(element.style[mobileOrDesktop].height) : state.metrics.clientRect.height,
    //     },
    //   },
    // });
  }
}
