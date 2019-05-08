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
import {SilexTasks} from '../service/silex-tasks';
import {Model} from '../types';
import {View} from '../types';

import {ControllerBase} from './controller-base';
import { getUiElements } from '../view/UiElements';

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
    if (dock) {
      document.body.classList.add('dock-editors');
      this.view.propSplitter.addRight(getUiElements().cssEditor);
      this.view.propSplitter.addRight(getUiElements().jsEditor);
      this.view.propSplitter.addRight(getUiElements().htmlEditor);
    } else {
      document.body.classList.remove('dock-editors');
      this.view.propSplitter.remove(getUiElements().cssEditor);
      this.view.propSplitter.remove(getUiElements().jsEditor);
      this.view.propSplitter.remove(getUiElements().htmlEditor);
    }
  }
}
