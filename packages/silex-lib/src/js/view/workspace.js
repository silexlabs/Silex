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


goog.provide('silex.view.Workspace');

goog.require('goog.dom.ViewportSizeMonitor');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  controller class which holds the other controllers
 */
silex.view.Workspace = function(element, model, controller) {
  // store references
  /**
   * @type {Element}
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;


  /**
   * invalidation mechanism
   * @type {InvalidationManager}
   */
  this.invalidationManagerRedraw = new InvalidationManager(500);


  /**
   * invalidation mechanism
   * @type {InvalidationManager}
   */
  this.invalidationManagerResize = new InvalidationManager(500);

};


/**
 * handle of the preview popup window
 */
silex.view.Workspace.prototype.previewWindow = null;


/**
 * store the window viewport
 * @type {?goog.dom.ViewportSizeMonitor}
 */
silex.view.Workspace.prototype.viewport = null;


/**
 * store state for the invalidation mechanism
 * @type {?boolean}
 */
silex.view.Workspace.prototype.isDirty = false;


/**
 * create the menu with closure API
 * called by the app constructor
 */
silex.view.Workspace.prototype.buildUi = function() {
  // store the window viewport for later use
  this.viewport = new goog.dom.ViewportSizeMonitor();
};


/**
 * listen for the resize event and call invalidate
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.startWatchingResize = function(view) {
  // handle window resize event
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
      function() {
        this.redraw(view);
      }, false, this);
  this.redraw(view);
};


/**
 * handle the "prevent leave page" mechanism
 * listen for the unload event and warn the user
 * prevent quit only when the current website is dirty
 */
silex.view.Workspace.prototype.startWatchingUnload = function() {
  window.onbeforeunload = () => {
    if (this.controller.fileMenuController.isDirty()) {
      return 'You have unsaved modifications, are you sure you want to leave me?';
    }
    return null;
  };
};


/**
 * redraw the workspace, positions and sizes of the tool boxes
 * invalidation mechanism
 * @param {!silex.types.View} view
 */
silex.view.Workspace.prototype.redraw = function(view) {
  this.invalidationManagerRedraw.callWhenReady(() => {
    // do something here?
  });
};


/**
 * loading is over, hide the loader
 */
silex.view.Workspace.prototype.loadingDone = function() {
  goog.dom.classlist.remove(document.body, 'loading-pending');
};


/**
 * center an editor in the viewport
 * @param {!silex.view.dialog.DialogBase|silex.view.dialog.FileExplorer} editor whith an element property to center
 * @param {goog.math.Size} viewportSize viewport size
 */
silex.view.Workspace.prototype.center = function(editor, viewportSize) {
  if (editor.element) {
    var editorSize = goog.style.getSize(editor.element);
    var posX = (viewportSize.width - editorSize.width) / 2;
    var posY = (viewportSize.height - editorSize.height) / 2;
    goog.style.setPosition(editor.element, posX, posY);
  }
};


/**
 * called by silex.App when the property pannel is resized
 * here we change the number of columns in the pannel
 */
silex.view.Workspace.prototype.resizeProperties = function () {
  this.invalidationManagerResize.callWhenReady(() => {
    var container = this.element.querySelector('.silex-property-tool .main-container');
    if(container.offsetWidth < 500) {
      container.classList.add('size1');
      container.classList.remove('size2');
      container.classList.remove('size3');
    }
    else if(container.offsetWidth < 750) {
      container.classList.remove('size1');
      container.classList.add('size2');
      container.classList.remove('size3');
    }
    else if(container.offsetWidth < 1000) {
      container.classList.remove('size1');
      container.classList.remove('size2');
      container.classList.add('size3');
    }
  });
};

/**
 * open a popup or refresh the allready opened one
 * @param {?string=} opt_location or null to refresh only
 */
silex.view.Workspace.prototype.setPreviewWindowLocation = function (opt_location) {
  if(this.previewWindow && !this.previewWindow.closed) {
    if(opt_location) {
      this.previewWindow.close();
      this.previewWindow = window.open(opt_location);
      this.previewWindow.focus();
    }
    else {
      try {
        if(this.previewWindow.location.href != 'about:blank') {
          // only when loaded, reload
          this.previewWindow.location.reload(true);
        }
      }
      catch(e) {
        // case of responsize
        this.previewWindow.frames[1].location.reload(true);
      }
    }
    this.previewWindow.focus();
  }
  else {
    if(opt_location) {
      this.previewWindow = window.open(opt_location);
      this.previewWindow.focus();
    }
  }
};


/**
 * set/get mobile editor mode
 * @param {boolean} isMobileEditor
 */
silex.view.Workspace.prototype.setMobileEditor = function(isMobileEditor) {
  if(isMobileEditor) {
    document.body.classList.add('mobile-mode');
    if(!this.model.head.getEnableMobile()) {
      silex.utils.Notification.alert('Warning: you are entering the mobile editor, but your website is not configured to support it, so you need to open the menu "File", then "Settings" and "Enable mobile version".', () => {});
    }
  }
  else {
    document.body.classList.remove('mobile-mode');
  }
};


/**
 * set/get mobile editor mode
 * @return {boolean}
 */
silex.view.Workspace.prototype.getMobileEditor = function() {
  return document.body.classList.contains('mobile-mode');
};

