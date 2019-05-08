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
import {Model} from '../../types';
import {Controller} from '../../types';
import {AceEditorBase} from './ace-editor-base';
import { Constants } from '../../../Constants';


/**
 * @class {silex.view.dialog.HtmlEditor}
 */
export class HtmlEditor extends AceEditorBase {
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
    const session = this.ace.getSession();

    // set mode
    session['setMode']('ace/mode/html');

    // dirty hack to prevent errors not applicable in our case (we edit a part
    // of an html doc only) comes from this discussion
    // https://groups.google.com/forum/#!topic/ace-discuss/qOVHhjhgpsU
    session['on']('changeAnnotation', () => {
      const annotations = session['getAnnotations']() || [];
      const len = annotations.length;
      let i = len;
      while (i--) {
        if (/doctype/i.test(annotations[i].text)) {
          annotations.splice(i, 1);
        }
      }
      if (len > annotations.length) {
        session['setAnnotations'](annotations);
      }
    });
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    let selection = this.model.body.getSelection();
    if (selection.length <= 1) {
      this.controller.htmlEditorController.changed(
          selection[0], this.ace.getValue());
    }
  }

  setSelection(selection) {
    if (selection.length === 0) {
      // edit head tag
      this.setValue(this.model.head.getUserHeadTag());
      this.ace.setReadOnly(false);
    } else {
      if (selection.length === 1) {
        if (selection[0].tagName.toLowerCase() === 'body') {
          // edit head tag
          this.setValue(this.model.head.getUserHeadTag());
          this.ace.setReadOnly(false);
        } else {
          if (this.model.element.getType(selection[0]) ===
              Constants.TYPE_HTML) {
            // edit current selection
            this.setValue(this.model.element.getInnerHtml(selection[0]));
            this.ace.setReadOnly(false);
          } else {
            this.setValue('-select an HTML box or press ESC-');
            this.ace.setReadOnly(true);
          }
        }
      } else {
        this.setValue('-select an HTML box or press ESC-');
        this.ace.setReadOnly(true);
      }
    }
  }
}
