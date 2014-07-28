//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

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
 * @extends {silex.controller.ControllerBase
 * listen to the view events and call the main controller's methods}
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 * @param {silex.types.Model} model
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.controller.EditMenuController = function(controller, model, view) {
  // call super
  silex.controller.ControllerBase.call(this, controller, model, view);
};

// inherit from silex.controller.ControllerBase
goog.inherits(silex.controller.EditMenuController, silex.controller.ControllerBase);


/**
 * copy the selection for later paste
* TODO: Move this elsewhere?
 */
silex.controller.EditMenuController.prototype.copySelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'copy', 0);
  // default is selected element
  var elements = this.model.body.getSelection();
  if (elements.length > 0) {
    // reset clipboard
    silex.controller.ControllerBase.clipboard = [];
    // add each selected element to the clipboard
    goog.array.forEach(elements, function(element) {
      if (this.model.body.getBodyElement() != element) {
        // disable editable
        this.model.body.setEditable(element, false);
        // duplicate the node
        silex.controller.ControllerBase.clipboard.push(element.cloneNode(true));
        silex.controller.ControllerBase.clipboardParent = element.parentNode;
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
* TODO: Move this elsewhere?
 */
silex.controller.EditMenuController.prototype.pasteSelection = function() {
  this.tracker.trackAction('controller-events', 'request', 'paste', 0);
  // default is selected element
  if (silex.controller.ControllerBase.clipboard) {
    // find the container: original container, main background container or the stage
    var container;
    if (silex.controller.ControllerBase.clipboardParent &&
        goog.dom.contains(this.model.body.getBodyElement(), silex.controller.ControllerBase.clipboardParent)) {
      container = silex.controller.ControllerBase.clipboardParent;
    }
    else {
      container = goog.dom.getElementByClass(silex.view.Stage.BACKGROUND_CLASS_NAME, this.model.body.getBodyElement());
      if (!container) {
        container = this.model.body.getBodyElement();
      }
    }
    // take the scroll into account (drop at (100, 100) from top left corner of the window, not the stage)
    var bb = silex.utils.Dom.getBoundingBox(silex.controller.ControllerBase.clipboard);
    var offsetX = 100 + this.view.workspace.getWindow().document.body.scrollLeft - bb.left;
    var offsetY = 100 + this.view.workspace.getWindow().document.body.scrollTop - bb.top;
    var selection = [];
    // duplicate and add to the container
    goog.array.forEach(silex.controller.ControllerBase.clipboard, function(clipboardElement) {
      var element = clipboardElement.cloneNode(true);
      this.model.element.appendChild(container, element);
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
          goog.array.forEach(elements, function(element) {
            this.model.element.removeElement(element);
          },this);
        }
      }, this), 'delete', 'cancel');
};


/**
 * edit an {Element} element
 * take its type into account and open the corresponding editor
 */
silex.controller.EditMenuController.prototype.editElement = function(opt_element) {
  // default is selected element
  if (!opt_element) opt_element = this.model.body.getSelection()[0];
  switch (this.model.element.getType(opt_element)) {
    case silex.model.Element.TYPE_TEXT:
      var bgColor = silex.utils.Style.computeBgColor(opt_element);
      if (!bgColor) {
        // case where all parents are transparent
        bgColor = [255, 255, 255, 255];
      }
      // open the text editor with the same bg color as the element
      this.view.textEditor.openEditor(this.model.element.getInnerHtml(opt_element),
          opt_element.className,
          goog.color.rgbToHex(
          Math.round(bgColor[0]),
          Math.round(bgColor[1]),
          Math.round(bgColor[2])
          ));
      break;
    case silex.model.Element.TYPE_HTML:
      this.view.htmlEditor.openEditor(this.model.element.getInnerHtml(opt_element));
      break;
    case silex.model.Element.TYPE_IMAGE:
      this.view.fileExplorer.openDialog(
          goog.bind(function(url) {
            // absolute url only on stage
            var baseUrl = silex.utils.Url.getBaseUrl();
            url = silex.utils.Url.getAbsolutePath(url, baseUrl);
            // load the image
            this.model.element.setImageUrl(opt_element, url);
          }, this),
          { mimetypes: ['image/jpeg', 'image/png', 'image/gif'] },
          goog.bind(function(error) {
            silex.utils.Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''));
          }, this)
      );
      break;
  }
};


