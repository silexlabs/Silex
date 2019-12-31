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

/**
 * @fileoverview
 * the Silex bread crumbs, which displays the selection's containers
 *
 */

import { ElementData, ElementType } from '../../types';
import { getElements, getParent, subscribeElements, updateElements, getSelectedElements } from '../api';
import { Controller, Model } from '../ClientTypes';
import { getDomElement } from '../dom/element-dom';
import { getSiteDocument } from './UiElements';

/**
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class BreadCrumbs {
  constructor(private element: HTMLElement, public model: Model, public controller: Controller) {
    subscribeElements((oldElements, elements) => this.redraw())
  }

  /**
   * build the UI
   */
  buildUi() {}

  /**
   * the selection has changed
   */
  private redraw() {

    // get the common ancesters to all selected elements
    function getParents(element: ElementData): ElementData[] {
      const parent = getParent(element)
      return parent ? (getParent(parent) ? [parent].concat(getParents(parent)) : [parent]) : []
    }

    // find the selected element which is the "deepest" in the dom, i.e. has
    // the greater number of parent nodes
    const selectedElements = getSelectedElements()
      .map((el) => ({
        el,
        parents: getParents(el),
      }))
      .sort((elem1, elem2) => elem2.parents.length - elem1.parents.length);

    if (selectedElements.length) {
      const deepest = selectedElements.shift();

      // for this "deepest" element, find the common ancestors with all others
      let ancestors = deepest.parents;
      selectedElements.forEach(({el, parents}) => {
        const newAncestors = [];
        let idx = 0;
        while (idx < ancestors.length && idx < parents.length && ancestors[idx] === parents[idx]) {
          newAncestors.push(ancestors[idx++]);
        }
        ancestors = newAncestors;
      });

      // if only 1 element is selected, display it in the crumbs
      if (selectedElements.length === 0) {
        ancestors.unshift(deepest.el);
      }

      // empty current bread crumbs
      while (this.element.childNodes.length) {
        this.removeCrumb((this.element.childNodes[0] as HTMLElement));
      }

      // create a button for each ancester
      ancestors
        .reverse()
        .forEach((ancestor) => this.addCrumb(ancestor));
    }
  }

  /**
   * add a button in the bread crumb container
   */
  private addCrumb(element: ElementData) {
    const domEl = getDomElement(getSiteDocument(), element)
    const crumb = document.createElement('DIV');
    const cssClasses = element.classList.length ? '.' + element.classList.join('.') : '';

    const displayName = domEl.tagName.toLowerCase() === 'body' ? 'Body' : element.type === ElementType.COMPONENT ? 'Component' : this.model.element.getDisplayName(element);
    crumb.classList.add('crumb');
    crumb.innerHTML = displayName + cssClasses;
    crumb.style.zIndex = (100 - this.element.childNodes.length).toString();
    this.element.appendChild(crumb);
    crumb.onclick = () => updateElements(getElements()
      .filter((el) => el.selected || el === element)
      .map((el) => ({
        from: el,
        to: {
          ...el,
          selected: el === element,
        },
      })));
    const svg = '<svg class="svg" viewBox="0 0 7 28" height="28" width="7"><path d="M.5 0l6 14-6 14H7V0z" fill="currentColor"></path><path d="M1 0H0l6 14-6 14h1l6-14z" fill="#858585"></path></svg>';
    const sep = document.createElement('DIV');
    sep.classList.add('sep');
    sep.innerHTML = svg;
    this.element.appendChild(sep);
  }

  /**
   * remove events and deletes a bread crumb
   */
  private removeCrumb(crumb: HTMLElement) {
    this.element.removeChild(crumb);
  }
}
