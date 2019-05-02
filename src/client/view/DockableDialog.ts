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
 *   This class is in charge of the "dockable" behavior of the dialogs in Silex
 */
const DOCK_DIALOG_CLASS_NAME = 'dock-dialog';

/**
 * implement a "dockable" behavior
 */
export class DockableDialog {
  /**
   * dock the dialogs
   */
  static dock() {
    document.body.classList.add(DOCK_DIALOG_CLASS_NAME);
  }

  /**
   * undock the dialogs
   */
  static undock() {
    document.body.classList.remove(DOCK_DIALOG_CLASS_NAME);
  }
}
