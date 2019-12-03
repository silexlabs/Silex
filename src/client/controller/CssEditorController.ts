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
import { getSite, updateSite } from '../api';
import { Model, View } from '../ClientTypes';
import { ControllerBase } from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class CssEditorController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * cssEditor event handler
   */
  changed(headStyle: string) {
    updateSite({
      ...getSite(),
      headStyle,
    });
  }
}
