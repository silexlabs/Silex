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
import { SiteData } from '../../../types';
import { getSite, subscribeSite, updateSite } from '../../api';
import { Controller, Model } from '../../ClientTypes';
import { CodeEditorBase } from './CodeEditorBase';


/**
 * @class {silex.view.dialog.CssEditor}
 */
export class JsEditor extends CodeEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement, model: Model, controller: Controller) {
    super(element, model, controller, 'javascript');
    subscribeSite((_: SiteData, site: SiteData) => {
      if (site.headScript !== this.getValue()) {
        this.setValue(site.headScript)
      }
    })
  }

  /**
   * the content has changed, notify the controler
   */
  contentChanged() {
    updateSite({
      ...getSite(),
      headScript: this.getValue(),
    });
  }
}
