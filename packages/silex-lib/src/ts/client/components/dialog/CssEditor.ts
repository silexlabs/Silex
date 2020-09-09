

/**
 * @fileoverview
 * the Silex CSS Editor
 *
 *
 */
import { SiteState } from '../../site-store/types'
import { getSite, subscribeSite, updateSite } from '../../site-store/index'
import { CodeEditorBase } from './CodeEditorBase'
import { getUiElements } from '../../ui-store/UiElements'

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
    super(element, 'css')
    subscribeSite((_: SiteState, site: SiteState) => {
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
    })
  }
}
