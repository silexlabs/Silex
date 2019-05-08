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
import {SilexNotification} from '../utils/notification';
import {ControllerBase} from './controller-base';

/**
 * @param view  view class which holds the other views
 */
export class ViewMenuController extends ControllerBase {
  constructor(model: Model, view: View) {
    super(model, view);
  }

  /**
   * edit Silex editable css styles
   */
  openCssEditor() {
    // undo checkpoint
    this.undoCheckPoint();

    // open the editor
    this.view.cssEditor.open();
    this.view.cssEditor.setValue(this.model.head.getHeadStyle());
  }

  /**
   * edit HTML head tag
   */
  openHtmlHeadEditor() {
    // undo checkpoint
    this.undoCheckPoint();

    // deselect all elements
    this.model.body.setSelection([]);

    // open the editor
    this.view.htmlEditor.open();
    this.view.htmlEditor.setValue(this.model.head.getUserHeadTag());
  }

  /**
   * edit Silex editable js scripts
   */
  openJsEditor() {
    // undo checkpoint
    this.undoCheckPoint();

    // open the editor
    this.view.jsEditor.open();
    this.view.jsEditor.setValue(this.model.head.getHeadScript());
  }

  /**
   * view this file in a new window
   */
  preview() {
    this.doPreview(false);
  }

  /**
   * view this file in responsize
   */
  previewResponsize() {
    this.doPreview(true);
  }

  /**
   * open the page pannel
   */
  showPages() {
    this.view.menu.toggleSubMenu('page-tool-visible');
  }

  /**
   * preview the website in a new window or in responsize
   * ask the user to save the file if needed
   * @param inResponsize if true this will open the preview in responsize
   *                               if false it will open the website in a new
   * window
   */
  doPreview(inResponsize: boolean) {
    this.tracker.trackAction('controller-events', 'request', 'view.file', 0);
    let doOpenPreview = function() {
      if (inResponsize) {
        this.view.workspace.setPreviewWindowLocation(
            'http://www.responsize.org/?url=' +
            this.model.file.getFileInfo().url + '#!' +
            this.model.page.getCurrentPage());
      } else {
        this.view.workspace.setPreviewWindowLocation(
            this.model.file.getFileInfo().url + '#!' +
            this.model.page.getCurrentPage());
      }
      this.tracker.trackAction('controller-events', 'success', 'view.file', 1);
    }.bind(this);

    // save before preview
    let doSaveTheFile = () => {
      this.save(
          this.model.file.getFileInfo(),
          () => {},
          (err) => {
            this.tracker.trackAction(
                'controller-events', 'error', 'view.file', -1);
          });
    };
    if (this.model.file.getFileInfo() && !this.model.file.isTemplate) {
      // open the preview window
      // it is important to do it now, on the user click so that it is not
      // blocked it will be refreshed after save
      doOpenPreview();

      // also save
      if (this.isDirty()) {
        doSaveTheFile();
      }
    } else {
      SilexNotification.alert(
        'Preview website',
        'You need to save the website before I can show a preview',
        () => {
          doSaveTheFile();
        }
      );
    }
  }
}
