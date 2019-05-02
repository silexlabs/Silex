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

import {ControllerBase} from './controller-base';

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
  addToPage(elements: HTMLElement[], name: string) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.page.addToPage(element, name);
    });
  }

  /**
   * remove the provided elements from a given page
   */
  removeFromPage(elements: HTMLElement[], name: string) {
    // undo checkpoint
    this.undoCheckPoint();
    elements.forEach((element) => {
      this.model.page.removeFromPage(element, name);
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
