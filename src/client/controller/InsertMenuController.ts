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
import {SilexTasks} from '../service/SilexTasks';
import {Model} from '../types';
import {View} from '../types';

import {ControllerBase} from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class InsertMenuController extends ControllerBase {
  constructor(model: Model, view: View) {

super(model, view);
  }

  /**
   * create a page
   */
  createPage(): Promise<void> {
    this.tracker.trackAction('controller-events', 'request', 'insert.page', 0);
    return this.editPageSettings()
      .then(({name, displayName}) => {
        // undo checkpoint
        this.undoCheckPoint();

        // create the page model
        this.model.page.createPage(name, displayName);

        // tracking
        this.tracker.trackAction(
          'controller-events', 'success', 'insert.page', 1);
      })
      .catch((e) => {
        // tracking
        this.tracker.trackAction('controller-events', 'cancel', 'insert.page', 0);
      });
  }
}
