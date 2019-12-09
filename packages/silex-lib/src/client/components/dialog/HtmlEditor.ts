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
import { getElements, getSite, updateSite } from '../../api';
import { Controller, Model } from '../../ClientTypes';
import { getDomElement } from '../../dom/element-dom';
import { CodeEditorBase } from './CodeEditorBase';
import { getSiteDocument } from '../UiElements';

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
    const selection = getElements().filter((el) => el.selected);
    if (selection.length === 0) {
      updateSite({
        ...getSite(),
        headTag: this.getValue(),
      });
    } else {
      this.model.element.setInnerHtml(getDomElement(getSiteDocument(), selection[0]), this.getValue());
    }
  }

  // setSelection(selection) {
  //   if (selection.length === 0) {
  //     // edit head tag
  //     this.setValue(this.model.head.getUserHeadTag());
  //     this.setReadOnly(false);
  //   } else {
  //     if (selection.length === 1) {
  //       if (selection[0].tagName.toLowerCase() === 'body') {
  //         // edit head tag
  //         this.setValue(this.model.head.getUserHeadTag());
  //         this.setReadOnly(false);
  //       } else {
  //         if (this.model.element.getType(selection[0]) ===  ElementType.HTML) {
  //           // edit current selection
  //           this.setValue(this.model.element.getInnerHtml(selection[0]));
  //           this.setReadOnly(false);
  //         } else {
  //           this.setValue('-select an HTML box-');
  //           this.setReadOnly(true);
  //         }
  //       }
  //     } else {
  //       this.setValue('-select an HTML box-');
  //       this.setReadOnly(true);
  //     }
  //   }
  // }
}
