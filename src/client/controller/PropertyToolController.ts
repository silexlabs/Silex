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
import {Model} from '../types';
import {View} from '../types';
import { PageData } from '../store/page-store';

import {ControllerBase} from './ControllerBase';

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
  addToPage(elements: HTMLElement[], opt_name = this.model.element.getCurrentPage()) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.element.addToPage(element, opt_name);
    });
  }

  /**
   * remove the provided elements from a given page
   */
  removeFromPage(elements: HTMLElement[], page: PageData) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.element.removeFromPage(element, name);
    });
  }

  /**
   * add provided elements to all pages
   */
  visibleOnAllPages(elements: HTMLElement[]) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.element.removeFromAllPages(element);
    });
  }

  /**
   * add link to the provided elements
   */
  addLink(elements: HTMLElement[], name: string) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.element.setLink(element, name);
    });
  }

  /**
   * remove link from the provided elements
   */
  removeLink(elements: HTMLElement[]) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.element.setLink(element);
    });
  }
}
