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
import { CodeEditorBase } from './CodeEditorBase';
import { subscribeSite, updateSite, getSite } from '../../site/store'
import { SiteData } from '../../site/types'
import { getUiElements } from '../../ui/UiElements'

///////////////////
// API for the outside world
let instance: JsEditor
function initJsEditor() {
  instance = instance || new JsEditor(getUiElements().jsEditor)
  return instance
}
export function openJsEditor() {
  initJsEditor()
  return instance.open()
}

/**
 * TODO: make this only methods and write tests
 */
class JsEditor extends CodeEditorBase {
  /**
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(element: HTMLElement) {
    super(element, 'javascript');
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
