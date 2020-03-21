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

import { getBody, getParent, noSectionContent } from './filters'
import { updateElements } from './store';
import { ElementData } from './types';
import { DomDirection } from '../ClientTypes';

/**
 * @fileoverview helpers to dispatch common actions on the store
 *
 */

/**
 * select the body
 * TODO: unselect other elements?
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

