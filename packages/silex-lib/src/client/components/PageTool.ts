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
 * @fileoverview The Silex PageTool class displays the list of pages
 *     and let the user interact with them.
 * @see silex.model.Page
 *
 */

import Sortable from '../../../node_modules/sortablejs/modular/sortable.core.esm.js';
import { PageData } from '../flux/page-store';
import { Controller, Model } from '../types';
import { Dom } from '../utils/Dom';
import { InvalidationManager } from '../utils/InvalidationManager';
import { getPages, openPage, movePage, deletePage } from '../api';

/**
 *
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class PageTool {

  /**
   * invalidation mechanism
   */
  invalidationManager: InvalidationManager;

  constructor(public element: HTMLElement, public model: Model, public controller: Controller) {
    this.invalidationManager = new InvalidationManager(500);
  }

  /**
   * add listeners on the tool container
   * called by the app constructor
   */
  buildUi() {
    // listen for the click on a page
    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('page-delete')) {
        // remove the page
        this.removePageAtIndex(
            this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement));
      } else {
        if ((e.target as HTMLElement).classList.contains('page-properties')) {
          // rename the page
          this.editPageAtIndex(
              this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement));
        } else {
          // select page
          const cellIndex = this.getCellIndex((e.target as HTMLElement).parentElement as HTMLElement);
          if (cellIndex >= 0) {
            this.setSelectedIndex(cellIndex, true);
          }
        }
      }
      e.preventDefault();
    }, false);

    function attach(className, cbk) {
      Array.from(document.querySelectorAll(className))
      .forEach((el) => el.onclick = cbk);
    }
    attach('.add-page', (e) => this.controller.pageToolController.createPage());
    attach('.remove-page', (e) => this.controller.pageToolController.removePage());
    attach('.move-page-up', (e) => {
      const currentPage = getPages().find(page => page.isOpen);
      this.controller.pageToolController.movePageTo(currentPage, currentPage.idx - 1);
    });
    attach('.move-page-down', (e) => {
      const currentPage = getPages().find(page => page.isOpen);
      this.controller.pageToolController.movePageTo(currentPage, currentPage.idx + 1);
    });
  }

  /**
   * refresh the pages
   * find all pages in the dom
   * @param selectedElements the elements currently selected
   */
  redraw(selectedElements: HTMLElement[]) {
    this.invalidationManager.callWhenReady(() => {
      const pages = getPages();
      // prepare the data for the template
      // make an array with name, displayName, linkName
      const templateData = pages
        .map((p) => Object.assign({
          className: (p.isOpen ? ' ui-selected' : '') + (p.canDelete ? ' ui-can-delete' : ' ui-can-not-delete') + (p.canProperties ? ' ui-can-properties' : ' ui-can-not-properties') + (p.canMove ? ' ui-can-move' : ' ui-can-not-move'),
        }, p))
      // refresh the list with new pages
      const container = this.element.getElementsByClassName('page-tool-container')[0];
      const templateHtml = this.element.getElementsByClassName('page-tool-template')[0].innerHTML;
      container.innerHTML = Dom.renderList(templateHtml, templateData);
      Sortable.create(container, {
        ghostClass: 'page-ghost',
        animation: 150,
        handle: '.page-handle',
        onSort: (e) => {
          movePage(pages[e.oldIndex], e.newIndex);
        },
      });
    });
  }

  /**
   * user wants to remove a page
   * @param idx index of the page
   */
  removePageAtIndex(idx: number) {
    deletePage(getPages()[idx]);
  }

  /**
   * user wants to rename a page
   * @param idx index of the page
   */
  editPageAtIndex(idx: number) {
    this.controller.pageToolController.editPage(getPages()[idx]);
  }

  /**
   * set the selection of pages
   * @param opt_notify    if true, then notify by calling the onChanged callback
   */
  setSelectedIndex(idx: number, opt_notify?: boolean) {
    // notify the controller
    if (opt_notify) {
      openPage(getPages()[idx])
    }
  }

  /**
   * get the index of the given cell
   * @param element which represents the cell in the dom
   */
  getCellIndex(element: HTMLElement): number {
    const pageIdx = element.getAttribute('data-page-idx');
    if (pageIdx) {
      return parseInt(pageIdx, 10);
    } else {
      return -1;
    }
  }
}
