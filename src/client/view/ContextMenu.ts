import {Controller} from '../types';
import {Model} from '../types';

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

import {ControllerBase} from '../controller/ControllerBase';
import {InvalidationManager} from '../utils/InvalidationManager';
import { getPages } from '../api';

/**
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class ContextMenu {
  /**
   * hold the element in the context menu which has the current page name
   */
  currentPageElement: HTMLElement;

  /**
   * invalidation mechanism
   */
  invalidationManager: InvalidationManager;

  constructor(public element: HTMLElement, public model: Model, public controller: Controller) {
    this.currentPageElement = element.querySelector('.current-page');
    this.currentPageElement.onclick = (e) => this.controller.viewMenuController.showPages();
    this.invalidationManager = new InvalidationManager(500);
  }

  /**
   * create the context menu
   * called by the app constructor
   */
  buildUi() {
    this.element.querySelector('.delete').addEventListener('click', () => {
      this.controller.editMenuController.removeSelectedElements();
    });
    this.element.querySelector('.edit').addEventListener('click', () => {
      this.controller.editMenuController.editElement();
    });
    this.element.querySelector('.copy').addEventListener('click', () => {
      this.controller.editMenuController.copySelection();
    });
    this.element.querySelector('.paste').addEventListener('click', () => {
      this.controller.editMenuController.pasteClipBoard();
    });
    this.element.querySelector('.duplicate').addEventListener('click', () => {
      this.controller.editMenuController.duplicate();
    });
    this.element.querySelector('.top').addEventListener('click', () => {
      this.controller.editMenuController.moveToTop();
    });
    this.element.querySelector('.up').addEventListener('click', () => {
      this.controller.editMenuController.moveUp();
    });
    this.element.querySelector('.down').addEventListener('click', () => {
      this.controller.editMenuController.moveDown();
    });
    this.element.querySelector('.bottom').addEventListener('click', () => {
      this.controller.editMenuController.moveToBottom();
    });
    this.element.querySelector('.sticky-elements').addEventListener('click', (e) => {
      this.controller.stageController.toggleSticky();
    });
  }

  /**
   * the selection has changed
   * called by silex.model.Body
   * @param opt_selectedElements the selected elements
   */
  redraw(opt_selectedElements?: HTMLElement[]) {
    this.invalidationManager.callWhenReady(() => {
      const page = getPages().find(p => p.isOpen);
      // update page name
      if (page) {
        const fileInfo = this.model.file.getFileInfo();
        this.currentPageElement.innerHTML = `
          ${fileInfo.path ? fileInfo.path + ' - ' : ''}
          ${page.displayName}
        `;
      }

      // get the selection if not provided
      if (!opt_selectedElements) {
        opt_selectedElements = this.model.body.getSelection();
      }

      // update menu items according to selection
      if (opt_selectedElements.length === 1 &&
          opt_selectedElements[0].tagName.toLowerCase() === 'body') {
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
      if (this.controller.contextMenuController.hasElementsToPaste()) {
        this.element.querySelector('.paste').classList.remove('off');
      } else {
        this.element.querySelector('.paste').classList.add('off');
      }
      if (this.controller.stageController.getEnableSticky()) {
        this.element.querySelector('.sticky-elements').classList.remove('off');
      } else {
        this.element.querySelector('.sticky-elements').classList.add('off');
      }
    });
  }
}
