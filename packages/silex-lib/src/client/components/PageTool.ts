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
import { deletePages, getPages, movePage, openPage, subscribePages } from '../page/store';
import { Dom } from '../utils/Dom';
import { PageData } from '../page/types';
import { createPage, removePage, movePageTo, editPage } from '../api/page'
import { getUiElements } from '../ui/UiElements'

///////////////////
// API for the outside world
export function initPageTool() {
  return new PageTool(getUiElements().pageTool)
}

/**
 * TODO: make this only methods and write tests
 */
class PageTool {
  constructor(public element: HTMLElement) {
    subscribePages((_, pages) => this.redraw(_, pages))
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
    attach('.add-page', (e) => createPage());
    attach('.remove-page', (e) => removePage());
    attach('.move-page-up', (e) => {
      const idx = getPages().findIndex((page) => page.opened);
      const currentPage = getPages()[idx];
      movePageTo(currentPage, idx - 1);
    });
    attach('.move-page-down', (e) => {
      const idx = getPages().findIndex((page) => page.opened);
      const currentPage = getPages()[idx];
      movePageTo(currentPage, idx + 1);
    });
    const container: HTMLElement = this.element.querySelector('.page-tool-container');
    Sortable.create(container, {
      ghostClass: 'page-ghost',
      animation: 150,
      handle: '.page-handle',
      onSort: (e) => {
        const pages = getPages();
        movePage({page: pages[e.oldIndex], idx: e.newIndex});
      },
    });
  }

  /**
   * user wants to remove a page
   * @param idx index of the page
   */
  removePageAtIndex(idx: number) {
    deletePages([getPages()[idx]]);
  }

  /**
   * user wants to rename a page
   * @param idx index of the page
   */
  editPageAtIndex(idx: number) {
    editPage(getPages()[idx]);
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

  /**
   * refresh the pages
   * find all pages in the dom
   */
  private redraw(_, pages: PageData[]) {
    // prepare the data for the template
    // make an array with name, displayName, linkName
    const templateData = pages
      .map((p, idx) => Object.assign({
        className: (p.opened ? ' ui-selected' : '') + (p.canDelete ? ' ui-can-delete' : ' ui-can-not-delete') + (p.canProperties ? ' ui-can-properties' : ' ui-can-not-properties') + (p.canMove ? ' ui-can-move' : ' ui-can-not-move'),
        idx,
      }, p))
    // refresh the list with new pages
    const container = this.element.querySelector('.page-tool-container');
    const templateHtml = this.element.querySelector('.page-tool-template').innerHTML;
    container.innerHTML = Dom.renderList(templateHtml, templateData);
  }
}
