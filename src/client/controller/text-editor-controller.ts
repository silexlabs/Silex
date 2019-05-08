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
import {Model} from '../types';
import {View} from '../types';
import {ControllerBase} from './controller-base';
import { getUiElements } from '../view/UiElements';
const MENU_WIDTH = 35;
const CONTEXT_MENU_HEIGHT = 35;

/**
 * @class
 */
export class TextEditorController extends ControllerBase {
  /**
   * listen to the view events and call the main controller's methods}
   * @param view  view class which holds the other views
   */
  constructor(model: Model, view: View) {
    super(model, view);
  }

  attachToTextBox(textBox, toolbar) {
    const pos = textBox.getBoundingClientRect();
    const stageSize = getUiElements().stage.getBoundingClientRect();
    const theoricalBottom = stageSize.height + stageSize.top - pos.top;
    const bottom = Math.max(theoricalBottom - pos.height + CONTEXT_MENU_HEIGHT, Math.min(stageSize.height - 20, theoricalBottom));
    const left = pos.left + MENU_WIDTH;
    toolbar.style.bottom = bottom + 'px';
    toolbar.style.left = left + 'px';
  }
}
