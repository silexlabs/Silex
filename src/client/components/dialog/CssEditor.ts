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
import { SiteData } from '../../site/types';
import { getSite, subscribeSite, updateSite } from '../../site/store';
import { CodeEditorBase } from './CodeEditorBase';
import { getUiElements } from '../../ui/UiElements'

///////////////////
// API for the outside world
let instance: CssEditor
export function initCssEditor() {
  instance = instance || new CssEditor(getUiElements().cssEditor)
  return instance
}
export function openCssEditor() {
  return instance.open()
}

/**
 * TODO: make this only methods and write tests
 */
class CssEditor extends CodeEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement) {
    super(element, 'css');
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