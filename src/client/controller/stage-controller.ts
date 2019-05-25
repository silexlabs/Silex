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

import { Model, View } from '../types';
import { ControllerBase } from './controller-base';

/**
 * @param view  view class which holds the other views
 */
export class StageController extends ControllerBase {
  constructor(model: Model, view: View) {

    super(model, view);
  }

  /**
   * the user has selected an element with shift
   * @param target selected element
   */
  selectMultiple(target: HTMLElement) {
    const selection = this.model.body.getSelection();
    selection.push(target);
    this.model.body.setSelection(selection);
  }

  /**
   * the user has clicked on an element
   * which was already selected,
   * with the shift key down
   * @param target selected element
   */
  deselect(target: HTMLElement) {
    const selection = this.model.body.getSelection();
    selection.splice(selection.indexOf(target), 1);
    this.model.body.setSelection(selection);
  }

  /**
   * mark the state for undo/redo
   */
  markAsUndoable() {
    // undo checkpoint
    this.undoCheckPoint();
  }

  stopEdit() {
    this.view.stageWrapper.setEditMode(false);
  }
  startEdit() {
    this.view.stageWrapper.setEditMode(true);
  }
  resizeWindow() {
    this.view.stageWrapper.resizeWindow();
  }
  subscribeMouseEvent(type: string, cbk: (e) => void): () => void {
    return this.view.stageWrapper.subscribeMouseEvent(type, cbk);
  }
  hideScrolls(hide: boolean) {
    return this.view.stageWrapper.hideScrolls(hide);
  }
  redraw() {
    this.view.stageWrapper.redraw();
  }
  getEnableSticky(): boolean {
    return this.view.stageWrapper.getEnableSticky();
  }
  setEnableSticky(enable: boolean) {
    this.view.stageWrapper.setEnableSticky(enable);
    this.view.contextMenu.redraw();
  }
  toggleSticky() {
    this.view.stageWrapper.toggleSticky();
    this.view.contextMenu.redraw();
  }
}
