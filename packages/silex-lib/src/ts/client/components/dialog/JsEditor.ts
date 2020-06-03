
/**
 * @fileoverview
 * Silex JS editor
 *
 */
import { CodeEditorBase } from './CodeEditorBase'
import { subscribeSite, updateSite, getSite } from '../../site-store/index'
import { SiteState } from '../../site-store/types'
import { getUiElements } from '../../ui-store/UiElements'

///////////////////
// API for the outside world
let instance: JsEditor
export function initJsEditor() {
  instance = instance || new JsEditor(getUiElements().jsEditor)
  return instance
}
export function openJsEditor() {
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
    super(element, 'javascript')
    subscribeSite((_: SiteState, site: SiteState) => {
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
    })
  }
}
