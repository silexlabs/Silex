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

import { Model, View } from '../ClientTypes';
import { ControllerBase } from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class StageController extends ControllerBase {
  constructor(model: Model, view: View) {

    super(model, view);
  }

  stopEdit() {
    this.view.stageWrapper.setEditMode(false);
  }
  startEdit() {
    this.view.stageWrapper.setEditMode(true);
  }
  getEnableSticky(): boolean {
    return this.view.stageWrapper.getEnableSticky();
  }
  setEnableSticky(enable: boolean) {
    this.view.stageWrapper.setEnableSticky(enable);
  }
  toggleSticky() {
    this.view.stageWrapper.toggleSticky();
  }
  subscribeMouseEvent(type: string, cbk: (e) => void): () => void {
    return this.view.stageWrapper.subscribeMouseEvent(type, cbk);
  }
  hideScrolls(hide: boolean) {
    return this.view.stageWrapper.hideScrolls(hide);
  }
}
