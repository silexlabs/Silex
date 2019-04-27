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
import {SilexTasks} from '../service/silex-tasks';
import {Model} from '../types';
import {View} from '../types';

import {ControllerBase} from './controller-base';

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
  createPage(successCbk?: (() => any), cancelCbk?: (() => any)) {
    this.tracker.trackAction('controller-events', 'request', 'insert.page', 0);
    this.getUserInputPageName(
        'Your new page name', (name, displayName) => {
          if (name) {
            // undo checkpoint
            this.undoCheckPoint();

            // create the page model
            this.model.page.createPage(name, displayName);

            // update view
            if (successCbk) {
              successCbk();
            }
            this.tracker.trackAction(
                'controller-events', 'success', 'insert.page', 1);
          } else {
            if (cancelCbk) {
              cancelCbk();
            }
            this.tracker.trackAction(
                'controller-events', 'cancel', 'insert.page', 0);
          }
        });
  }
}
