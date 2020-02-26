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
import { ElementData, ElementType, SiteData } from '../../../types';
import { getSelectedElements, getSite, subscribeElements, subscribeSite, updateElements, updateSite } from '../../api';
import { Controller, Model } from '../../ClientTypes';
import { getDomElement } from '../../dom/element-dom';
import { getSiteDocument } from '../UiElements';
import { CodeEditorBase } from './CodeEditorBase';

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
    subscribeSite((_: SiteData, site: SiteData) => {
      this.redraw()
    })
    subscribeElements((_: ElementData[], __: ElementData[]) => {
      this.redraw()
    })
  }
  forSelection({ htmlBox, body, error }: { htmlBox: (el: ElementData) => void, body: () => void, error: () => void }) {
    const elements = getSelectedElements()
    if (elements.length === 1) {
      const domEl = getDomElement(getSiteDocument(), elements[0])
      if (elements[0].type === ElementType.HTML) {
        htmlBox(elements[0])
      } else if (domEl && domEl.tagName.toLowerCase() === 'body') {
        body()
      } else {
        error()
      }
    } else {
      error()
    }
  }
  redraw() {
    const headTag = getSite().headTag
    this.forSelection({
      htmlBox: (el) => el.innerHtml !== this.getValue() ? this.setValue(el.innerHtml) : null,
      body: () => headTag !== this.getValue() ? this.setValue(headTag) : null,
      error: () => this.setError('-select an HTML box-'),
    })
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    this.forSelection({
      htmlBox: (el) => updateElements([{
        from: el,
        to: {
          ...el,
          innerHtml: this.getValue(),
        },
      }]),
      body: () => updateSite({
        ...getSite(),
        headTag: this.getValue(),
      }),
      error: () => {},
    })
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
