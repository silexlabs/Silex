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
 * @fileoverview
 * the Silex context menu
 *
 */
import { getElements, subscribeElements } from '../element/store';
import { getCurrentPage } from '../page/filters'
import { getParent } from '../element/filters'
import { getUiElements } from '../ui/UiElements'
import { showPages } from '../api/view'
import { removeSelectedElements, editElement, moveUp, moveToTop, moveDown, moveToBottom } from '../api/element'
import { copySelection, pasteClipBoard, duplicateSelection, hasElementsToPaste } from '../api/copy'
import { getSite } from '../site/store'
import { getEnableSticky, toggleSticky } from './StageWrapper'

export function initContextMenu() {
  return new ContextMenu(getUiElements().contextMenu)
}

/**
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
class ContextMenu {
  /**
   * hold the element in the context menu which has the current page name
   */
  currentPageElement: HTMLElement;

  constructor(public element: HTMLElement) {
    this.currentPageElement = element.querySelector('.current-page');
    this.currentPageElement.onclick = (e) => showPages();
    subscribeElements((oldElements, elements) => this.redraw())
  }

  /**
   * create the context menu
   * called by the app constructor
   */
  buildUi() {
    this.element.querySelector('.delete').addEventListener('click', () => {
      removeSelectedElements();
    });
    this.element.querySelector('.edit').addEventListener('click', () => {
      editElement();
    });
    this.element.querySelector('.copy').addEventListener('click', () => {
      copySelection();
      this.redraw();
    });
    this.element.querySelector('.paste').addEventListener('click', () => {
      pasteClipBoard();
    });
    this.element.querySelector('.duplicate').addEventListener('click', () => {
      duplicateSelection();
    });
    this.element.querySelector('.top').addEventListener('click', () => {
      moveToTop();
    });
    this.element.querySelector('.up').addEventListener('click', () => {
      moveUp();
    });
    this.element.querySelector('.down').addEventListener('click', () => {
      moveDown();
    });
    this.element.querySelector('.bottom').addEventListener('click', () => {
      moveToBottom();
    });
    this.element.querySelector('.sticky-elements').addEventListener('click', (e) => {
      toggleSticky();
    });
  }

  /**
   * the selection has changed
   * called by silex.model.Body
   * @param opt_selectedElements the selected elements
   */
  private redraw() {
    const page = getCurrentPage();
    // update page name
    if (page) {
      const fileInfo = getSite().file;
      this.currentPageElement.innerHTML = `
        ${fileInfo.path ? fileInfo.path + ' - ' : ''}
        ${page.displayName}
      `;
    }

    // get the selection without the body
    const selectedElements = getElements()
      .filter((el) => el.selected && getParent(el))

    // update menu items according to selection
    if (selectedElements.length === 0) {
      // only body is selected
      this.element.querySelector('.delete').classList.add('off');
      this.element.querySelector('.edit').classList.add('off');
      this.element.querySelector('.copy').classList.add('off');
      this.element.querySelector('.top').classList.add('off');
      this.element.querySelector('.up').classList.add('off');
      this.element.querySelector('.down').classList.add('off');
      this.element.querySelector('.bottom').classList.add('off');
      this.element.querySelector('.duplicate').classList.add('off');
    } else {
      this.element.querySelector('.delete').classList.remove('off');
      this.element.querySelector('.edit').classList.remove('off');
      this.element.querySelector('.copy').classList.remove('off');
      this.element.querySelector('.top').classList.remove('off');
      this.element.querySelector('.up').classList.remove('off');
      this.element.querySelector('.down').classList.remove('off');
      this.element.querySelector('.bottom').classList.remove('off');
      this.element.querySelector('.duplicate').classList.remove('off');
    }
    if (hasElementsToPaste()) {
      this.element.querySelector('.paste').classList.remove('off');
    } else {
      this.element.querySelector('.paste').classList.add('off');
    }
    if (getEnableSticky()) {
      this.element.querySelector('.sticky-elements').classList.remove('off');
    } else {
      this.element.querySelector('.sticky-elements').classList.add('off');
    }
  }
}
