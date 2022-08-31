/**
 * @fileoverview The Silex PageTool class displays the list of pages
 *     and let the user interact with them.
 * @see silex.model.Page
 *
 */

import { createPage, removePage, movePageTo, editPage } from '../page-store/dispatchers'
import { getCurrentPage } from '../page-store/filters'
import { getPages, movePage, subscribePages } from '../page-store/index'
import { getUi, subscribeUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'
import { keyboardAddShortcut } from './Menu'
import { openPage } from '../ui-store/dispatchers'
import { renderList } from '../utils/dom'
import Sortable from 'sortablejs/modular/sortable.core.esm.js'

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
    subscribePages((_, pages) => this.redraw())
    subscribeUi(() => this.redraw())

    // add shortcuts for pages
    // on PC
    this.pageShortcuts(['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'], { modifiers: false })
    // on mac, for keyboard without F* keys
    this.pageShortcuts(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], { ctrlKey: true })
    // in case you have to press "shift" to type a number
    this.pageShortcuts(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], { ctrlKey: true, shiftKey: true })

    // listen for the click on a page
    this.element.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('page-delete')) {
        // remove the page
        this.removePageAtIndex(
            this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement))
      } else {
        if ((e.target as HTMLElement).classList.contains('page-properties')) {
          // rename the page
          this.editPageAtIndex(
              this.getCellIndex((e.target as HTMLElement).parentElement.parentElement as HTMLElement))
        } else {
          // select page
          const cellIndex = this.getCellIndex((e.target as HTMLElement).parentElement as HTMLElement)
          if (cellIndex >= 0) {
            this.setSelectedIndex(cellIndex, true)
          }
        }
      }
      e.preventDefault()
    }, false)

    function attach(className, cbk) {
      Array.from(document.querySelectorAll(className))
      .forEach((el) => el.onclick = cbk)
    }
    attach('.add-page', (e) => createPage())
    attach('.remove-page', (e) => removePage())
    attach('.move-page-up', (e) => {
      const currentPage = getCurrentPage()
      const idx = getPages().indexOf(currentPage)
      movePageTo(currentPage, idx - 1)
    })
    attach('.move-page-down', (e) => {
      const currentPage = getCurrentPage()
      const idx = getPages().indexOf(currentPage)
      movePageTo(currentPage, idx + 1)
    })
    const container: HTMLElement = this.element.querySelector('.page-tool-container')
    Sortable.create(container, {
      ghostClass: 'page-ghost',
      animation: 150,
      handle: '.page-handle',
      onSort: (e) => {
        const pages = getPages()
        movePage({page: pages[e.oldIndex], idx: e.newIndex})
      },
    })
  }

  pageShortcuts(keys: string[], options: any) {
    keys.forEach((key, idx) => keyboardAddShortcut({
      label: 'Go to page ' + (idx + 1),
      key,
      input: true,
      ...options,
    }, (e) => {
      const page = getPages()[idx]
      if (page) openPage(page)
    }))

  }

  /**
   * user wants to remove a page
   * @param idx index of the page
   */
  removePageAtIndex(idx: number) {
    removePage(getPages()[idx])
  }

  /**
   * user wants to rename a page
   * @param idx index of the page
   */
  editPageAtIndex(idx: number) {
    editPage(getPages()[idx])
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
    const pageIdx = element.getAttribute('data-page-idx')
    if (pageIdx) {
      return parseInt(pageIdx, 10)
    } else {
      return -1
    }
  }

  /**
   * refresh the pages
   * find all pages in the dom
   */
  private redraw() {
    // prepare the data for the template
    // make an array with name, displayName, linkName
    const { currentPageId } = getUi()
    const templateData = getPages()
      .map((p, idx) => Object.assign({
        className: (p.id === currentPageId ? ' ui-selected' : '') + (p.canDelete ? ' ui-can-delete' : ' ui-can-not-delete') + (p.canProperties ? ' ui-can-properties' : ' ui-can-not-properties') + (p.canMove ? ' ui-can-move' : ' ui-can-not-move'),
        idx,
        shortcutText: p.id !== currentPageId && idx < 9 ? `Click to open this page (Ctrl+${idx+1} or F${idx+1})` : '',
      }, p))
    // refresh the list with new pages
    const container = this.element.querySelector('.page-tool-container')
    const templateHtml = this.element.querySelector('.page-tool-template').innerHTML
    container.innerHTML = renderList(templateHtml, templateData)
  }
}
