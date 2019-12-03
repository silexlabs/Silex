import { ElementData, ElementId } from '../../types';
import { getElements, getPages } from '../api';
import { addToPage, createElement, getDomElement, getElementData, moveToContainer, removeElement, removeFromAllPages, reorderElements, setClassName, setLink } from '../dom/element-dom';

export function onAddElement(element: ElementData) {
  console.log('Adding a element to the DOM')
  // create with defaults
  const newElement = getElementData(createElement(element.type))
  // update with provided data
  onUpdateElement(element, newElement)

  // need to call Component:initComponent (adds default data)
  throw new Error('not implemented: components');
}

export function onDeleteElement(element: ElementData) {
  console.log('Removing element to the DOM')
  removeElement(getDomElement(element))
}

export function onUpdateElement(oldElement: ElementData, element: ElementData) {
  console.log('Updating element to the DOM')
  const domEl = getDomElement(element)
  if (element.pageNames !== oldElement.pageNames) {
    console.log('Updating page', oldElement.pageNames, element.pageNames)
    removeFromAllPages(domEl)
    element.pageNames.forEach((name) => addToPage(domEl, getPages().find((p) => p.name === name)))
  }
  if (element.parent !== oldElement.parent) {
    console.log('Updating parent', oldElement.parent, element.parent)
    const parentEl = getElements().find((el) => element.parent === el.id)
    moveToContainer(getDomElement(element), getDomElement(parentEl))
  }
  if (element.children !== oldElement.children) {
    console.log('Updating children', oldElement.children, element.children)
    reorderElements(element
      .children
      .map((id: ElementId) => getDomElement(getElements().find((el) => el.id === id))))
  }
  if (element.link !== oldElement.link) {
    setLink(domEl, element.link)
  }
  if (element.classList !== oldElement.classList) {
    setClassName(domEl, element.classList.join(' '))
  }
  if (element.visibility !== oldElement.visibility) {
    throw new Error('not implemented')
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
  if (element.style !== oldElement.style) {
    throw new Error('not implemented')
    // FIXME: handle min-height VS height
    //   model.property.writeStyleToDom(element.id, element.style)

    // if(['top', 'left', 'width', 'height', 'min-height'].indexOf(name) >= 0) {
    //   const state = getStageState(el);
    //    return state: {
    //      ...state,
    //      metrics: {
    //        ...state.metrics,
    //        computedStyleRect: {
    //          ...state.metrics.computedStyleRect,
    //          top: name === 'top' ? parseInt(value) : state.metrics.computedStyleRect.top,
    //          left: name === 'left' ? parseInt(value) : state.metrics.computedStyleRect.left,
    //          width: name === 'width' ? parseInt(value) : state.metrics.computedStyleRect.width,
    //          height: name === 'height' || name === 'min-height' ? parseInt(value) : state.metrics.computedStyleRect.height,
    //        },
    //      },
    //    },
    //  });
    // else this.model.property.setStyle(element, style);

  }
}
