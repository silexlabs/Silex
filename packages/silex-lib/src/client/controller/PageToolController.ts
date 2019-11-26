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
import { PageData } from '../model/Page';
import {Model} from '../types';
import {View} from '../types';
import {SilexNotification} from '../utils/Notification';
import {ControllerBase} from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class PageToolController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * create a page
   */
  createPage(): Promise<void> {
    this.tracker.trackAction('controller-events', 'request', 'insert.page', 0);
    return this.editPageSettings(null)
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

  /**
   * edit a page properties
   * @param pageData data of the page edited, defaults to current page
   */
  editPage(pageData: PageData = this.model.page.getPageData(this.model.page.getCurrentPage())) {
    this.editPageSettings(pageData)
      .then(({name, displayName}) => {
        // undo checkpoint
        this.undoCheckPoint();

        // update model
        if(pageData.name !== name && pageData.canRename) {
          this.model.page.renamePage(pageData.name, name, displayName);
        }
      })
      .catch((e) => {
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
        (accept) => {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();

          // update model
          this.model.page.removePage((opt_pageName as string));
        }
      }, 'delete', 'cancel',
    );
  }

  /**
   * move a page
   * @param pageName name of the page to be moved
   * @param offset
   */
  movePageTo(pageName: string, idx: number) {
    this.model.page.movePage(pageName, idx);
  }
}
