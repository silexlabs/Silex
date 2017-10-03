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
 * the Silex HTML editor
 *
 */

goog.provide('silex.view.dialog.HtmlEditor');
goog.require('silex.view.dialog.AceEditorBase');


/**
 * @class {silex.view.dialog.CssEditor}
 */
class HtmlEditor extends AceEditorBase {
  /**
   * @param {!Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                               the controller instances
   */
  constructor(element, model, controller) {
    super(element, model, controller);

    // set mode
    this.ace.getSession()['setMode']('ace/mode/html');
  }


  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    this.controller.htmlEditorController.changed(this.ace.getValue());
  }
}

