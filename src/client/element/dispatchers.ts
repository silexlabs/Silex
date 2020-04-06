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

import { Constants } from '../../constants'
import { CssRule } from '../site/types'
import {
  DomDirection,
  ElementData,
  ElementType,
  Link,
  StyleObject
} from './types';
import { PageData } from '../page/types'
import { Style } from '../utils/Style'
import {
  createElements,
  deleteElements,
  getElements,
  updateElements
} from './store';
import {
  getBody,
  getChildrenRecursive,
  getElementById,
  getFirstPagedParent,
  getParent,
  getSelectedElements,
  isBody,
  noSectionContent
} from './filters';
import { getCurrentPage } from '../page/filters'
import { getEmptyElementData, getNewId } from './utils';
import { getPages } from '../page/store'
import { getUi } from '../ui/store'

/**
 * @fileoverview helpers to dispatch common actions on the store
 *
 */

/**
 * select the body and only the body
 */
export const selectBody = () => {
  selectElements([getBody()])
}

/**
 * select the body and only the body
 */
export const selectElements = (elements: ElementData[]) => {
  updateElements(getSelectedElements()
    // unselect all but the one to select
    .filter((el) => !elements.includes(el))
    .map((el) => ({ from: el, to: { ...el, selected: false }}))
    // select the once to select
    .concat(elements
      .map((el) => ({
        from: el,
        to: {
          ...el,
          selected: true,
        },
      })))
    )
}

/**
 * move elements order in their parent's children array
 */
export const moveElements = (elements: ElementData[], direction: DomDirection) => {
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
  //     //  undoCheckPoint();
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
    //  undoCheckPoint();

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
    //  undoCheckPoint();

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
 * local function to be used in addElement
 */
function createEmptyElement({type, parent, isSectionContent, componentName}: {
  type: ElementType,
  parent: ElementData,
  isSectionContent: boolean,
  componentName?: string,
}): ElementData[] {
    // create the element and add it to the stage
  const element: ElementData = getEmptyElementData({id: getNewId(), type, isSectionContent, isBody: false});

  // apply component styles etc
  if (!!componentName) {
    console.error('not implemented: components')
    // model.component.initComponent(element, componentName);
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
 * create an element and add it to the stage
 * componentName the desired component type if it is a component
 * @return [element, updatedParentData]
 */
export function addElement({type, parent, style, componentName} : {
  type: ElementType,
  parent: ElementData,
  style: StyleObject,
  componentName?: string,
}): [ElementData, ElementData] {
  // create an element
  const [newElementData, updatedParentData] = createEmptyElement({
    type,
    parent,
    componentName,
    isSectionContent: false,
  })

  // add it to the current page only if it has no parent which already are in a page
  const newElementDataPaged = {
    ...newElementData,
    pageNames: !!parent.pageNames.length || !!getFirstPagedParent(parent) ? [] : [getCurrentPage().id],
  }
  console.warn('todo: handle add in mobile')

  const element = ((() => {
    // if it is a section add its container element
    if (type === ElementType.SECTION) {

      if (!isBody(parent)) throw new Error('Sections can only be added to the body')
      const [contentElement, newElementDataWithContent] = createEmptyElement({
        type: ElementType.CONTAINER,
        parent: newElementDataPaged,
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
      // add the elements to the store
      createElements([newElementDataWithContent, contentElementWithCssClasses]);
      return newElementDataWithContent
    } else {
      // add the elements to the store
      createElements([newElementDataPaged]);
      return newElementDataPaged
    }
  })())

  updateElements(
    // unselect all
    getSelectedElements()
    .filter((el) => el !== parent && el !== element) // will be updated bellow
    .map((el) => ({
      from: el,
      to: {
        ...el,
        selected: false,
      },
    }))
    // apply style + select the created element
    .concat([{
      from: element,
      to: {
        ...element,
        selected: true,
        style: {
          mobile: {
            ...element.style.mobile,
            ...style.mobile,
          },
          desktop: {
            ...element.style.desktop,
            ...style.desktop,
          },
        },
      },
    },
    // update the parent element
    {
      from: parent,
      to: {
        ...updatedParentData,
        selected: false,
      },
    }]))

  console.log('TODO: drag to insert?')
  // TODO: drag to insert?
  // getStage().startDrag()

  return [getElementById(newElementDataPaged.id), getElementById(updatedParentData.id)]
}

export function removeElementsWithoutConfirm(elements) {
  // get the elements and their children
  const deleted = elements.concat(elements
    .reduce((prev, el) => prev.concat(getChildrenRecursive(el)), []))

  // delete the elements from the store
  deleteElements(deleted)

  // update the parents to remove deleted elements from children lists
  updateElements(getElements()
    .filter((element: ElementData) => element.children.some((id) => !!deleted.find((el) => el.id === id))) // keep the parents
    .map((element: ElementData) => ({
      from: element,
      to: {
        ...element,
        children: element.children.filter((id) => !deleted.find((el) => el.id === id)),
      }
    })))
}

/**
 * add the provided elements to a given page
 */
export function addToPage(elements: ElementData[], page = getPages().find((p) => p.opened)) {
  // undo checkpoint
    //  undoCheckPoint();
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
    //  undoCheckPoint();
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
    //  undoCheckPoint();
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
    //  undoCheckPoint();
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
    //  undoCheckPoint();
  updateElements(elements
    .map((el) => ({
      from: el,
      to: {
        ...el,
        link: null,
      },
    })))
}
