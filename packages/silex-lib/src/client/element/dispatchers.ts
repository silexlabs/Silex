/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

import { getBody, getParent, noSectionContent, getSelectedElements, getFirstPagedParent, getElementById } from './filters'
import { updateElements, createElements, getElements } from './store';
import { ElementData, CssRule, ElementType, Link } from './types';
import { DomDirection } from '../ClientTypes';
import { Style } from '../utils/Style'
import { getUi } from '../ui/store'
import { getSiteWindow } from '../ui/UiElements'
import { center, getElementSize, getEmptyElementData, getNewId } from './utils'
import { getCurrentPage } from '../page/filters'
import { Constants } from '../../constants'
import { PageData } from '../page/types'
import { getPages } from '../page/store'

/**
 * @fileoverview helpers to dispatch common actions on the store
 *
 */

/**
 * select the body
 */
export const selectBody = () => {
  const body = getBody()
  if (body && body.selected === false) {
    updateElements([{
      from: body,
      to: {
        ...body,
        selected: true,
      },
    }])
  } else {
    console.warn('Select body: no body or body already selected', body)
  }
}

/**
 * move elements order in their parent's children array
 */
export const moveElements = (elements: ElementData[], direction: DomDirection) => {
  // console.log('moveElements', elements, direction)
  updateElements(elements
    .map((el) => ({
      el,
      parent: getParent(noSectionContent(el)), // move the parent instead of the section content
    }))
    .filter(({el, parent}) => {
      if (!parent) {
        console.warn('No parent, is this the body??', el)
      }
      return !!el && !!parent
    })
    .map(({el, parent}) => ({
      el,
      parent,
      idx: parent.children.findIndex((c) => c === el.id),
    }))
    .map(({el, parent, idx}) => ({
      el, parent,
      idx: direction === DomDirection.UP ? idx - 1 : direction === DomDirection.DOWN ? idx + 1 : direction === DomDirection.TOP ? 0 : parent.children.length - 1,
      children: parent.children.filter(((c) => c !== el.id)), // remove the element in order to insert it at the right spot
    }))
    .map(({el, parent, idx, children}) => ({
      from: parent,
      to: {
        ...parent,
        children: [
          ...children.slice(0, idx),
          el.id,
          ...children.slice(idx),
        ],
      },
    })),
  )
}

/**
 * get/set the "hide on desktop" property
 * @param hide, true if the element has to be hidden on desktop
 */
export const setHideOnDesktop = (element: ElementData, hide: boolean) => {
  updateElements([{
    from: element,
    to: {
      ...element,
      visibility: {
        ...element.visibility,
        desktop: hide,
      },
    },
  }]);
}


/**
 * set a given style to the current selection
 * @param opt_isUndoable default is true
 * FIXME: useless method
 */
export const styleChanged = (name: string, value?: string, elements: ElementData[] = getSelectedElements()) => {
  // if (opt_isUndoable !== false) {
  //   // undo checkpoint
  //     //  this.undoCheckPoint();
  // }

  // build the style change object
  const newStyle = {};
  newStyle[name] = value,

  multipleStylesChanged(newStyle);
}

/**
 * set a set of styles to the current selection
 */
export const multipleStylesChanged = (style: CssRule, elements = getSelectedElements()) => {
  // undo checkpoint
    //  this.undoCheckPoint();

  // apply the change to all elements
  updateElements(elements.map((el) => ({
    from: el,
    to: {
      ...el,
      style: Style.addToMobileOrDesktopStyle(getUi().mobileEditor, el.style, style),
    },
  })));
}


/**
 * set css class names
 */
export function setClassName(name: string) {
  // undo checkpoint
    //  this.undoCheckPoint();

  // apply the change to all elements
  updateElements(getElements()
    .filter((el) => el.selected)
    .map((el) => ({
      from: el,
      to: {
        ...el,
        classList: name.split(' '),
      },
    })))
}

/**
 * create an element and add it to the stage
 * @param type the desired type for the new element
 * @param componentName the desired component type if it is a component
 * @return the new element
 */
export function addElement(type: ElementType, parent: ElementData, componentName?: string): [ElementData, ElementData] {
  //    this.tracker.trackAction('controller-events', 'request', 'insert.' + type, 0);

  const win = getSiteWindow()

  // undo checkpoint
    //  this.undoCheckPoint();

  const [newElementData, newParentData] = this.createEmptyElement({
    type,
    parent,
    componentName,
    isSectionContent: false,
  })

  if (type === ElementType.TEXT) {
    newElementData.innerHtml = 'New text box';
  } else if (type === ElementType.HTML) {
    newElementData.innerHtml = '<p>New <strong>HTML</strong> box</p>';
  }

  const newElementDataPaged = {
    ...newElementData,
    pageNames: !!parent.pageNames.length || !!getFirstPagedParent(parent) ? [] : [getCurrentPage().id],
  }
  console.warn('todo: handle add in mobile')
  const centeredStyle = center(getElementSize(win, newElementDataPaged, false), getElementSize(win, newParentData, false))
  const centeredAndPaged = {
    ...newElementDataPaged,
    style: {
      ...newElementDataPaged.style,
      desktop: {
        ...newElementDataPaged.style.desktop,
        top: centeredStyle.top + 'px',
        left: centeredStyle.left + 'px',
      }
    }
  }

  if (type === ElementType.SECTION) {
    const [contentElement, newElementDataWithContent] = this.createEmptyElement({
      type: ElementType.CONTAINER,
      parent: centeredAndPaged,
      componentName: null,
      isSectionContent: true,
    })
    const contentElementWithCssClasses = {
      ...contentElement,
      classList: contentElement.classList.concat([
        Constants.ELEMENT_CONTENT_CLASS_NAME,
        Constants.WEBSITE_WIDTH_CLASS_NAME,
        Constants.PREVENT_DRAGGABLE_CLASS_NAME,
      ]),
    }
    createElements([newElementDataWithContent, contentElementWithCssClasses]);
  } else {
    createElements([centeredAndPaged]);
  }
  updateElements(getSelectedElements()
    // deselect all but the added element
    .filter((el) => el !== newParentData) // will be updated bellow
    .map((el) => ({
      from: el,
      to: {
        ...el,
        selected: el === centeredAndPaged,
      },
    }))
    // update the parent element
    .concat({
      from: getElementById(newParentData.id),
      to: {
        ...newParentData,
        selected: false,
      },
    }))

  console.info('could be dragged')
  // getStage().startDrag()

  // tracking
  //    this.tracker.trackAction('controller-events', 'success', 'insert.' + type, 1);

  return [newElementDataPaged, newParentData]
}

export function createEmptyElement({type, parent, isSectionContent, componentName}: {type: ElementType, parent: ElementData, isSectionContent: boolean, componentName?: string}): ElementData[] {
    // create the element and add it to the stage
  const element: ElementData = getEmptyElementData({id: getNewId(), type, isSectionContent, isBody: false});

  // apply component styles etc
  if (!!componentName) {
    console.error('not implemented: components')
    // FIXME: handle components data in the new model
    // this.model.component.initComponent(element, componentName);
  }
  return [{
      ...element,
      selected: true,
    }, {
      ...parent,
      children: parent.children.concat(element.id),
    },
  ]
}

/**
 * add the provided elements to a given page
 */
export function addToPage(elements: ElementData[], page = getPages().find((p) => p.opened)) {
  // undo checkpoint
    //  this.undoCheckPoint();
  updateElements(elements
    .map((el) => noSectionContent(el))
    .map((el) => ({
      from: el,
      to: {
        ...el,
        pageNames: el.pageNames.concat([page.id]),
      },
    })))
}

/**
 * remove the provided elements from a given page
 */
export function removeFromPage(elements: ElementData[], page: PageData) {
  // undo checkpoint
    //  this.undoCheckPoint();
  updateElements(elements
    .map((el) => ({
      from: el,
      to: {
        ...el,
        pageNames: el.pageNames.filter((name) => name === page.id),
      },
    })))
}

/**
 * add provided elements to all pages
 */
export function visibleOnAllPages(elements: ElementData[]) {
  // undo checkpoint
    //  this.undoCheckPoint();
  updateElements(elements
    .map((el) => ({
      from: el,
      to: {
        ...el,
        pageNames: [],
      },
    })))
}

/**
 * add link to the provided elements
 */
export function addLink(elements: ElementData[], link: Link) {
  // undo checkpoint
    //  this.undoCheckPoint();
  updateElements(elements
    .map((el) => ({
      from: el,
      to: {
        ...el,
        link,
      },
    })))

}

/**
 * remove link from the provided elements
 */
export function removeLink(elements: ElementData[]) {
  // undo checkpoint
    //  this.undoCheckPoint();
  updateElements(elements
    .map((el) => ({
      from: el,
      to: {
        ...el,
        link: null,
      },
    })))
}
