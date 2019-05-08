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
import {SilexNotification} from '../utils/notification';

/**
 * @param view  view class which holds the other views
 */
export class PageToolController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * rename a page
   * @param opt_pageName name of the page to be renamed
   */
  renamePage(opt_pageName?: string) {
    // default to the current page
    if (!opt_pageName) {
      opt_pageName = this.model.page.getCurrentPage();
    }
    this.getUserInputPageName(
        this.model.page.getDisplayName(opt_pageName),
          (name, newDisplayName) => {
            if (newDisplayName) {
              // undo checkpoint
              this.undoCheckPoint();

              // update model
              this.model.page.renamePage(
                  (opt_pageName as string), name, newDisplayName);
            } else {
              // just open the new page
              this.openPage((opt_pageName as string));
            }
          });
  }

  /**
   * remvove a page
   * @param opt_pageName name of the page to be renamed
   */
  removePage(opt_pageName?: string) {
    // default to the current page
    if (!opt_pageName) {
      opt_pageName = this.model.page.getCurrentPage();
    }

    // confirm and delete
    SilexNotification.confirm(
      'Delete page',
      'I am about to <strong>delete the page "' + this.model.page.getDisplayName(opt_pageName) + '"</strong>, are you sure?',
        accept => {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();

          // update model
          this.model.page.removePage((opt_pageName as string));
        }
      }, 'delete', 'cancel'
    );
  }

  /**
   * move a page up/down
   * @param opt_pageName name of the page to be moved
   */
  movePageUp(opt_pageName?: string) {
    this.model.page.movePage(
        (opt_pageName || this.model.page.getCurrentPage() as string), 'up');
  }

  /**
   * move a page up/down
   * @param opt_pageName name of the page to be moved
   */
  movePageDown(opt_pageName?: string) {
    this.model.page.movePage(
        (opt_pageName || this.model.page.getCurrentPage() as string), 'down');
  }
}
