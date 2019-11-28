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
import { PageData } from '../model-new/page-model';
import {Model} from '../types';
import {View} from '../types';
import {SilexNotification} from '../utils/Notification';
import {ControllerBase} from './ControllerBase';
import { pageStore, createPage, updatePage, deletePage, movePage } from '../model-new/page-model';
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
        createPage({
          name,
          displayName,
          previewLink: '#!' + name,
          element: null,
          idx: null,
          isOpen: false,
          canDelete: true,
          canRename: true,
          canMove: true,
          canProperties: true,
        });

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
  editPage(pageData: PageData = pageStore.getState().find(p => p.isOpen)) {
    this.editPageSettings(pageData)
      .then(({name, displayName}) => {
        // undo checkpoint
        this.undoCheckPoint();

        // update model
        if (pageData.name !== name && pageData.canRename) {
          updatePage(pageData, {
            ...pageData,
            name,
            displayName,
            previewLink: '#!' + name,
          });
        }
      })
      .catch((e) => {
      });
  }

  /**
   * remvove a page
   */
  removePage(page: PageData = pageStore.getState().find(p => p.isOpen)) {
    // confirm and delete
    SilexNotification.confirm(
      'Delete page',
      `I am about to <strong>delete the page "${page.displayName}"</strong>, are you sure?`,
        (accept) => {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();

          // update model
          deletePage(page);
        }
      }, 'delete', 'cancel',
    );
  }

  /**
   * move a page
   * @param pageName name of the page to be moved
   * @param offset
   */
  movePageTo(page: PageData, idx: number) {
    movePage(page, idx);
  }
}
