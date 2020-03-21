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
 * the Silex CSS Editor
 *
 *
 */
import { SiteData } from '../../../types';
import { getSite, subscribeSite, updateSite } from '../../api';
import { Controller, Model } from '../../ClientTypes';
import { CodeEditorBase } from './CodeEditorBase';

/**
 * @class {silex.view.dialog.CssEditor}
 */
export class CssEditor extends CodeEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement, model: Model, controller: Controller) {
    super(element, model, controller, 'css');
    subscribeSite((_: SiteData, site: SiteData) => {
      if (site.headStyle !== this.getValue()) {
        this.setValue(site.headStyle)
      }
    })
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    updateSite({
      ...getSite(),
      headStyle: this.getValue(),
    });
  }
}
