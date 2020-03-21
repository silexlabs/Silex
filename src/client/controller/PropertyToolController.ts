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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
import { ElementData, Link, PageData } from '../../types';
import { getPages, updateElements } from '../api';
import { Model, View } from '../ClientTypes';
import { ControllerBase } from './ControllerBase';
import { noSectionContent } from '../element/filters';

/**
 * @param view  view class which holds the other views
 */
export class PropertyToolController extends ControllerBase {
  constructor(model: Model, view: View) {

super(model, view);
  }

  /**
   * add the provided elements to a given page
   */
  addToPage(elements: ElementData[], page = getPages().find((p) => p.opened)) {
    // undo checkpoint
    this.undoCheckPoint();
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
  removeFromPage(elements: ElementData[], page: PageData) {
    // undo checkpoint
    this.undoCheckPoint();
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
  visibleOnAllPages(elements: ElementData[]) {
    // undo checkpoint
    this.undoCheckPoint();
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
  addLink(elements: ElementData[], link: Link) {
    // undo checkpoint
    this.undoCheckPoint();
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
  removeLink(elements: ElementData[]) {
    // undo checkpoint
    this.undoCheckPoint();
    updateElements(elements
      .map((el) => ({
        from: el,
        to: {
          ...el,
          link: null,
        },
      })))
  }
}
