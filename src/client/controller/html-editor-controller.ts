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
export class HtmlEditorController extends ControllerBase {
  constructor(model: Model, view: View) {

super(model, view);
  }

  /**
   * htmlEditor event handler
   */
  changed(element: HTMLElement, content: string) {
    if (!element || element.tagName.toLowerCase() === 'body') {
      // edit head tag
      this.model.head.setUserHeadTag(content);
    } else {
      // edit current selection
      this.model.element.setInnerHtml(element, content);
    }
  }
}
