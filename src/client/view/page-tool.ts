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

import { PageData } from '../model/page';
import { Controller, Model } from '../types';
import { Dom } from '../utils/dom';
import { InvalidationManager } from '../utils/invalidation-manager';

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
   * page list based on what is passed to redraw
   * array of pages for the opened website
   * @see silex.model.PageData
   */
  pages: PageData[] = [];

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
    this.element.addEventListener('click', e => {
      if ((e.target as HTMLElement).classList.contains('delete')) {
        // remove the page
        this.removePageAtIndex(
            this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement));
      } else {
        if ((e.target as HTMLElement).classList.contains('label')) {
          // rename the page
          this.renamePageAtIndex(
              this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement));
        } else {
          // select page
          let cellIndex = this.getCellIndex((e.target as HTMLElement).parentElement as HTMLElement);
          if (cellIndex >= 0) {
            this.setSelectedIndex(cellIndex, true);
          }
        }
      }
      e.preventDefault();
    }, false);

    function attach(className, cbk) {
      const addBtns = document.querySelectorAll(className);
      for (let idx = 0; idx < addBtns.length; idx++) {
        addBtns[idx].onclick = cbk;
      }
    }
    attach(
        '.add-page', (e) => this.controller.insertMenuController.createPage());
    attach(
        '.remove-page', (e) => this.controller.pageToolController.removePage());
    attach(
        '.move-page-up',
        (e) => this.controller.pageToolController.movePageUp());
    attach(
        '.move-page-down',
        (e) => this.controller.pageToolController.movePageDown());
  }

  /**
   * refresh the pages
   * find all pages in the dom
   * @param selectedElements the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(
      selectedElements: HTMLElement[], pageNames: string[],
      currentPageName: string) {
    this.invalidationManager.callWhenReady(() => {
      // prepare the data for the template
      // make an array with name, displayName, linkName and className
      let idx = 0;
      this.pages = pageNames.map((pageName) => {
        const pageElement =
            this.model.file.getContentDocument().getElementById(pageName);
        if (!pageElement) {
          // this happens while undoing or redoing
          return null;
        }
        let res = {
          'name': pageName,
          'displayName': this.model.file.getContentDocument()
            .getElementById(pageName)
            .innerHTML,
          'linkName': '#!' + pageName,
          'idx': idx++,
          'className': '',
        };
        if (currentPageName === pageName) {
          res.className = 'ui-selected';
        }
        return res;
      });

      // refresh the list with new pages
      let container = this.element.getElementsByClassName('page-tool-container')[0];
      let templateHtml = this.element.getElementsByClassName('page-tool-template')[0].innerHTML;
      container.innerHTML = Dom.renderList(templateHtml, this.pages);
    });
  }

  /**
   * user wants to remove a page
   * @param idx index of the page
   */
  removePageAtIndex(idx: number) {
    this.controller.pageToolController.removePage(this.pages[idx].name);
  }

  /**
   * user wants to rename a page
   * @param idx index of the page
   */
  renamePageAtIndex(idx: number) {
    this.controller.pageToolController.renamePage(this.pages[idx].name);
  }

  /**
   * set the selection of pages
   * @param opt_notify    if true, then notify by calling the onChanged callback
   */
  setSelectedIndex(idx: number, opt_notify?: boolean) {
    // notify the controller
    if (opt_notify) {
      this.controller.pageToolController.openPage(this.pages[idx].name);
    }
  }

  /**
   * get the index of the given cell
   * @param element which represents the cell in the dom
   */
  getCellIndex(element: HTMLElement): number {
    let pageIdx = element.getAttribute('data-page-idx');
    if (pageIdx) {
      return parseInt(pageIdx, 10);
    } else {
      return -1;
    }
  }
}
