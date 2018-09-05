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
goog.provide('silex.controller.TextEditorController');

goog.require('silex.controller.ControllerBase');

const MENU_WIDTH = 35;
const CONTEXT_MENU_HEIGHT = 35;

/**
 * @class
 * @extends {silex.controller.ControllerBase}
 */
silex.controller.TextEditorController = class extends silex.controller.ControllerBase {
  /**
   * listen to the view events and call the main controller's methods}
   * @param {silex.types.Model} model
   * @param  {silex.types.View} view  view class which holds the other views
   */
  constructor(model, view) {
    super(model, view);
  }

  attachToTextBox(textBox, toolbar) {
    const pos = textBox.getBoundingClientRect();
    const stageSize = this.view.stage.element.getBoundingClientRect();

    const theoricalBottom = stageSize.height + stageSize.top - pos.top;
    const bottom = Math.max(theoricalBottom - pos.height + CONTEXT_MENU_HEIGHT, Math.min(stageSize.height - 20, theoricalBottom));
    const left = pos.left + MENU_WIDTH;
    toolbar.style.bottom = bottom + 'px';
    toolbar.style.left = left + 'px';
  }
}

