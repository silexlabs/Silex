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
 * @fileoverview The Silex workspace class is in charge of positionning
 *   the main UI elements.
 * It refreshes the view when the window size changes, and also when
 *   it is set as dirty. There is an invalidation mechanism to prevent
 *   redraw many times in the same key frame
 *
 */
import { Controller, Model, View } from '../types';
import { SilexNotification } from '../utils/notification';
import { InvalidationManager } from '../utils/invalidation-manager';


/**
 * @param element   container to render the UI
 * @param model  model class which holds
  * the model instances - views use it for read
 * operation only
 * @param controller  controller class which holds the other controllers
 */
export class Workspace {
  /**
   * store state for the invalidation mechanism
   */
  isDirty: boolean = false;

  /**
   * invalidation mechanism
   */
  invalidationManagerRedraw: InvalidationManager;

  /**
   * invalidation mechanism
   */
  invalidationManagerResize: InvalidationManager;

  // store the window viewport for later use
  previewWindow: any;

  constructor(public element: HTMLElement, public model: Model, public controller: Controller) {
    this.invalidationManagerRedraw = new InvalidationManager(500);
    this.invalidationManagerResize = new InvalidationManager(500);
  }

  /**
   * create the menu with closure API
   * called by the app constructor
   */
  buildUi() {
  }

  /**
   * listen for the resize event and call invalidate
   */
  startWatchingResize(view: View) {
    // handle window resize event
    window.addEventListener('resize', () => {
      this.redraw(view);
    }, false);
    this.redraw(view);
  }

  /**
   * handle the "prevent leave page" mechanism
   * listen for the unload event and warn the user
   * prevent quit only when the current website is dirty
   */
  startWatchingUnload() {
    window.onbeforeunload = () => {
      if (this.controller.fileMenuController.isDirty()) {
        return 'You have unsaved modifications, are you sure you want to leave me?';
      }
      return null;
    };
  }

  /**
   * redraw the workspace, positions and sizes of the tool boxes
   * invalidation mechanism
   */
  redraw(view: View) {
    this.invalidationManagerRedraw.callWhenReady(() => {});
  }

  /**
   * loading is over, hide the loader
   */
  loadingDone() {
    document.body.classList.remove('loading-pending');
  }

  /**
   * called by silex.App when the property pannel is resized
   * here we change the number of columns in the pannel
   */
  resizeProperties() {
    this.invalidationManagerResize.callWhenReady(() => {
      let container =
          this.element.querySelector('.silex-property-tool .main-container');
      if (container.clientWidth < 500) {
        container.classList.add('size1');
        container.classList.remove('size2');
        container.classList.remove('size3');
      } else {
        if (container.clientWidth < 750) {
          container.classList.remove('size1');
          container.classList.add('size2');
          container.classList.remove('size3');
        } else {
          if (container.clientWidth < 1000) {
            container.classList.remove('size1');
            container.classList.remove('size2');
            container.classList.add('size3');
          }
        }
      }
    });
  }

  /**
   * open a popup or refresh the allready opened one
   * @param opt_location or null to refresh only
   */
  setPreviewWindowLocation(opt_location?: string) {
    if (this.previewWindow && !this.previewWindow.closed) {
      if (opt_location) {
        this.previewWindow.close();
        this.previewWindow = window.open(opt_location);
        this.previewWindow.focus();
      } else {
        try {
          if (this.previewWindow.location.href != 'about:blank') {
            // only when loaded, reload
            this.previewWindow.location.reload(true);
          }
        } catch (e) {
          // case of responsize
          this.previewWindow.frames[1].location.reload(true);
        }
      }
      this.previewWindow.focus();
    } else {
      if (opt_location) {
        this.previewWindow = window.open(opt_location);
        this.previewWindow.focus();
      }
    }
  }

  /**
   * set/get mobile editor mode
   */
  setMobileEditor(isMobileEditor: boolean) {
    if (isMobileEditor) {
      document.body.classList.add('mobile-mode');
      if (!this.model.head.getEnableMobile()) {
        SilexNotification.alert('Mobile editor warning', `
          Warning: you are entering the mobile editor, but your website is not configured to support it,
          so you need to open the menu "File", then "Settings" and "Enable mobile version".
        `,() => {});
      }
    } else {
      document.body.classList.remove('mobile-mode');
    }
    this.controller.stageController.resizeWindow();
  }

  /**
   * set/get mobile editor mode
   */
  getMobileEditor(): boolean {
    return document.body.classList.contains('mobile-mode');
  }
}
