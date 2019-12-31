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
 * @fileoverview A controller listens to a view element,
 *      and call the main {silex.controller.Controller} controller's methods
 *
 */
import {Model} from '../ClientTypes';
import {View} from '../ClientTypes';
import {SilexTasks} from '../service/SilexTasks';

import { ModalDialog } from '../components/ModalDialog';
import { getUiElements } from '../components/UiElements';
import {ControllerBase} from './ControllerBase';

/**
 * @param view  view class which holds the other views
 */
export class ToolMenuController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * dock panels
   * @param dock or undock
   */
  dockPanel(dock: boolean) {
    const { cssEditor, jsEditor, htmlEditor } = getUiElements();
    if (dock) {
      document.body.classList.add('dock-editors');
      this.view.propSplitter.addRight(cssEditor);
      this.view.propSplitter.addRight(jsEditor);
      this.view.propSplitter.addRight(htmlEditor);
    } else {
      document.body.classList.remove('dock-editors');
      this.view.propSplitter.remove(cssEditor);
      this.view.propSplitter.remove(jsEditor);
      this.view.propSplitter.remove(htmlEditor);
    }
  }
}
