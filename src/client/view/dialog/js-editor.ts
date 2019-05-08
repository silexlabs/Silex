import {Controller} from '../../types';
import {Model} from '../../types';

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
 * Silex JS editor
 *
 */

import {AceEditorBase} from './ace-editor-base';

/**
 * @class {silex.view.dialog.CssEditor}
 */
export class JsEditor extends AceEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement, model: Model, controller: Controller) {
    super(element, model, controller);

    // set mode
    this.ace.getSession()['setMode']('ace/mode/javascript');
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    this.controller.jsEditorController.changed(this.ace.getValue());
  }
}
