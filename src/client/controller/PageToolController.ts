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
import { LinkType, PageData } from '../../types';
import { createPages, deletePages, getPages, movePage, updatePages } from '../api';
import { Model, View } from '../ClientTypes';
import { SilexNotification } from '../utils/Notification';
import { ControllerBase } from './ControllerBase';

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
        createPages([{
          name,
          displayName,
          link: {
            type: LinkType.PAGE,
            value: '#!' + name,
          },
          element: null,
          isOpen: false,
          canDelete: true,
          canRename: true,
          canMove: true,
          canProperties: true,
        }]);

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
  editPage(pageData: PageData = getPages().find((p) => p.isOpen)) {
    this.editPageSettings(pageData)
      .then(({name, displayName}) => {
        // undo checkpoint
        this.undoCheckPoint();

        // update model
        if (pageData.name !== name && pageData.canRename) {
          updatePages([
            {
              from: pageData, to: {
              ...pageData,
              name,
              displayName,
              link: {
                type: LinkType.PAGE,
                value: '#!' + name,
              },
            },
          }]);
        }
      })
      .catch((e) => {
      });
  }

  /**
   * remvove a page
   */
  removePage(page: PageData = getPages().find((p) => p.isOpen)) {
    // confirm and delete
    SilexNotification.confirm(
      'Delete page',
      `I am about to <strong>delete the page "${page.displayName}"</strong>, are you sure?`,
        (accept) => {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();

          // update model
          this.doRemovePage(page);
        }
      }, 'delete', 'cancel',
    );
  }

  doRemovePage(pageData: PageData) {
    const pages = getPages()
    if (pages.length < 2) {
      SilexNotification.alert('Error', 'I can not delete this page because <strong>it is the only page</strong>.', () => {})
    } else {
      if (pageData.canDelete) {
        deletePages([pageData])
      } else {
        SilexNotification.alert('Error', 'I can not delete this page because <strong>it is a protected page</strong>.', () => {})
      }
    }
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
