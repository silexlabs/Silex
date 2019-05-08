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
   * empty/reset selection
   */
  selectNone() {
    this.model.body.setSelection([this.model.body.getBodyElement()]);
  }

  /**
   * the user has selected an element
   * @param target selected element
   */
  select(target: HTMLElement) {
    this.model.body.setSelection([target]);
  }

  /**
   * the user has selected an element with shift
   * @param target selected element
   */
  selectMultiple(target: HTMLElement) {
    let selection = this.model.body.getSelection();
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
    let selection = this.model.body.getSelection();
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

  // /**
  //  * an element is dropped in a new container
  //  * this will always occure when the user drops elements,
  //  * even in the same container as before since we move the elements to the body
  //  * while dragging (stage.js)
  //  * @param container the container
  //  * @param element the dropped element
  //  */
  // newContainer(container: HTMLElement, element: HTMLElement) {
  //   // initial positions
  //   let elementPos = element.getBoundingClientRect();
  //   let newContainerPos = container.getBoundingClientRect();

  //   // move to the new container
  //   element.parentElement.removeChild(element);
  //   container.appendChild(element);

  //   // restore position
  //   this.styleChanged('left', Math.round(elementPos.left - newContainerPos.left) + 'px', [element], false);
  //   this.styleChanged('top', Math.round(elementPos.top - newContainerPos.top) + 'px', [element], false);

  //   // check if a parent is visible only on some pages,
  //   // then element should be visible everywhere
  //   this.checkElementVisibility(element);
  // }

  stopEdit() {
    this.view.stageWrapper.setEditMode(false);
  }
  startEdit() {
    this.view.stageWrapper.setEditMode(true);
  }
  resizeWindow() {
    this.view.stageWrapper.resizeWindow();
  }
}
