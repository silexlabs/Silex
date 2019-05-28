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
import { Constants } from '../../../Constants';
import {Model} from '../../types';
import {Controller} from '../../types';
import {CodeEditorBase} from './CodeEditorBase';

/**
 * @class {silex.view.dialog.HtmlEditor}
 */
export class HtmlEditor extends CodeEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement, model: Model, controller: Controller) {
    super(element, model, controller, 'html');
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    const selection = this.model.body.getSelection();
    if (selection.length <= 1) {
      this.controller.htmlEditorController.changed(selection[0], this.getValue());
    }
  }

  setSelection(selection) {
    if (selection.length === 0) {
      // edit head tag
      this.setValue(this.model.head.getUserHeadTag());
      this.setReadOnly(false);
    } else {
      if (selection.length === 1) {
        if (selection[0].tagName.toLowerCase() === 'body') {
          // edit head tag
          this.setValue(this.model.head.getUserHeadTag());
          this.setReadOnly(false);
        } else {
          if (this.model.element.getType(selection[0]) ===  Constants.TYPE_HTML) {
            // edit current selection
            this.setValue(this.model.element.getInnerHtml(selection[0]));
            this.setReadOnly(false);
          } else {
            this.setValue('-select an HTML box or press ESC-');
            this.setReadOnly(true);
          }
        }
      } else {
        this.setValue('-select an HTML box or press ESC-');
        this.setReadOnly(true);
      }
    }
  }
}
