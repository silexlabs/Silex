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
goog.provide('silex.controller.EditMenuController');

goog.require('silex.controller.ControllerBase');
goog.require('silex.service.SilexTasks');



/**
 * @constructor
 * @extends {silex.controller.ControllerBase}
 * listen to the view events and call the main controller's methods}
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.EditMenuController = function(model, view) {
  // call super
  silex.controller.ControllerBase.call(this, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.EditMenuController, silex.controller.ControllerBase);


/**
 * undo the last action
 */
silex.controller.EditMenuController.prototype.undo = function() {
  if (this.undoHistory.length > 0) {
    var html = this.model.file.getHtml();
    var page = this.model.page.getCurrentPage();
    this.redoHistory.push({
      html: html,
      page: page
    });
    var prevState = this.undoHistory.pop();
    if (html !== prevState.html) {
      this.model.file.setHtml(prevState.html, goog.bind(function() {
        this.model.page.setCurrentPage(prevState.page);
      }, this), false);
    }
    else {
      this.model.page.setCurrentPage(prevState.page);
    }
  }
};


/**
 * redo the last action
 */
silex.controller.EditMenuController.prototype.redo = function() {
  if (this.redoHistory.length > 0) {
    var html = this.model.file.getHtml();
    var page = this.model.page.getCurrentPage();
    this.undoHistory.push({
      html: html,
      page: page
    });
    var prevState = this.redoHistory.pop();
    if (html !== prevState.html) {
      this.model.file.setHtml(prevState.html, goog.bind(function() {
        this.model.page.setCurrentPage(prevState.page);
      }, this), false);
    }
    else {
      this.model.page.setCurrentPage(prevState.page);
    }
  }
};


/**
 * copy the selection for later paste
 */
silex.controller.EditMenuController.prototype.copySelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'copy', 0);
  // default is selected element
  var elements = this.model.body.getSelection();
  if (elements.length > 0) {
    // reset clipboard
    this.clipboard = [];
    // add each selected element to the clipboard
    goog.array.forEach(elements, function(element) {
      if (this.model.body.getBodyElement() != element) {
        // disable editable
        this.model.body.setEditable(element, false);
        // duplicate the node
        this.clipboard.push(element.cloneNode(true));
        this.clipboardParent = element.parentNode;
        // re-enable editable
        this.model.body.setEditable(element, true);
      }
      else {
        console.error('could not copy this element (', element, ') because it is the stage element');
      }
    }, this);
    this.tracker.trackAction('controller-events', 'success', 'copy', 1);
  }
};


/**
 * paste the previously copied element
 */
silex.controller.EditMenuController.prototype.pasteSelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'paste', 0);
  // default is selected element
  if (this.clipboard) {
    // undo checkpoint
    this.undoCheckPoint();
    // find the container: original container, main background container or the stage
    var container;
    if (this.clipboardParent &&
        goog.dom.contains(this.model.body.getBodyElement(), this.clipboardParent)) {
      container = this.clipboardParent;
    }
    else {
      container = goog.dom.getElementByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, this.model.body.getBodyElement());
      if (!container) {
        container = this.model.body.getBodyElement();
      }
    }
    // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
    var bb = silex.utils.Dom.getBoundingBox(this.clipboard);
    var offsetX = 100 + this.view.workspace.getWindow().document.body.scrollLeft - bb.left;
    var offsetY = 100 + this.view.workspace.getWindow().document.body.scrollTop - bb.top;
    var selection = [];
    // duplicate and add to the container
    goog.array.forEach(this.clipboard, function(clipboardElement) {
      var element = clipboardElement.cloneNode(true);
      this.model.element.addElement(container, element);
      // add to the selection
      selection.push(element);
      // apply the offset to the element, according to the scroll position
      var bbElement = silex.utils.Dom.getBoundingBox([element]);
      element.style.left = (bbElement.left + offsetX) + 'px';
      element.style.top = (bbElement.top + offsetY) + 'px';
      // reset editable option
      this.doAddElement(element);
    }, this);
    // reset selection
    this.model.body.setSelection(selection);
  }
  this.tracker.trackAction('controller-events', 'success', 'paste', 1);
};


/**
 * remove selected elements from the stage
 */
silex.controller.EditMenuController.prototype.removeSelectedElements = function() {
  var elements = this.model.body.getSelection();
  // confirm and delete
  silex.utils.Notification.confirm('I am about to <strong>delete the selected element(s)</strong>, are you sure?',
      goog.bind(function(accept) {
        if (accept) {
          // undo checkpoint
          this.undoCheckPoint();
          // do remove selected elements
          goog.array.forEach(elements, function(element) {
            this.model.element.removeElement(element);
          },this);
        }
      }, this), 'delete', 'cancel');
};


/**
 * edit an {Element} element
 * take its type into account and open the corresponding editor
 * @param {?HTMLElement=} opt_element
 */
silex.controller.EditMenuController.prototype.editElement = function(opt_element) {
  // undo checkpoint
  this.undoCheckPoint();
  // default is selected element
  var element = opt_element || this.model.body.getSelection()[0];
  switch (this.model.element.getType(element)) {
    case silex.model.Element.TYPE_TEXT:
      var bgColor = silex.utils.Style.computeBgColor(element);
      if (!bgColor) {
        // case where all parents are transparent
        bgColor = [255, 255, 255, 255];
      }
      // open the text editor with the same bg color as the element
      this.view.textEditor.openEditor();
      this.view.textEditor.setValue(this.model.element.getInnerHtml(element));
      this.view.textEditor.setElementClassNames(element.className);
      this.view.textEditor.setBackgroundColor(goog.color.rgbToHex(
          Math.round(bgColor[0]),
          Math.round(bgColor[1]),
          Math.round(bgColor[2])
          ));
      break;
    case silex.model.Element.TYPE_HTML:
      this.view.htmlEditor.openEditor();
      this.view.htmlEditor.setValue(this.model.element.getInnerHtml(element));
      break;
    case silex.model.Element.TYPE_IMAGE:
      this.view.fileExplorer.openDialog(
          goog.bind(function(url) {
            // absolute url only on stage
            var baseUrl = silex.utils.Url.getBaseUrl();
            url = silex.utils.Url.getAbsolutePath(url, baseUrl);
            // load the image
            this.model.element.setImageUrl(element, url);
          }, this),
          { 'mimetypes': ['image/jpeg', 'image/png', 'image/gif'] },
          goog.bind(function(error) {
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
          }, this)
      );
      break;
  }
};
