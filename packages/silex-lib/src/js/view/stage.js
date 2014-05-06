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
 * @fileoverview The stage is the area where the user drag/drops elements
 *   This class is in charge of listening to the DOM of the loaded publication
 *   and retrieve information about it
 *
 */


goog.provide('silex.view.Stage');

goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');

/**
 * the Silex stage class
 * @constructor
 * load the template and render to the given html element
 * @param  {Element}  element  DOM element to wich I render the UI
 *  has been changed by the user
 * @param  {silex.types.Controller} controller  structure which holds the controller classes
 */
silex.view.Stage = function(element, view , controller) {
  // store references
  this.element = element;
  this.view = view;
  this.controller = controller;

  // TODO: this should go in a controller
  // create an input element to get the focus
  this.focusInput = goog.dom.createElement('input');
  //this.focusInput.style.visibility = 'hidden';
  this.focusInput.style.left = '-1000px';
  this.focusInput.style.position = 'absolute';
  document.body.appendChild(this.focusInput);


  // Disable horizontal scrolling for Back page on Mac OS
  // on Silex UI
  var mwh = new goog.events.MouseWheelHandler(document.body);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, function (e) {
    if (e.deltaX<0 && document.body.parentNode.scrollLeft<=0){
      e.preventDefault();
    }
  }, false, this);
  // Disable horizontal scrolling for Back page on Mac OS
  // on the iframe
  var mwh = new goog.events.MouseWheelHandler(element);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, function (e) {
    if (e.deltaX<0 && element.scrollLeft<=0){
      e.preventDefault();
    }
  }, false, this);

  // listen on body too because user can release
  // on the tool boxes
  goog.events.listen(document.body, 'mouseup', function(){
    // force drop the selected elements
    if (this.bodyElement && (this.isDragging || this.isResizing)){
      // simulate the mous up on the iframe body
      var evObj = document.createEvent('MouseEvents');
      evObj.initEvent( 'mouseup', true, true);
      this.bodyElement.dispatchEvent(evObj);
    }
  }, false, this);
}

/**
 * class name for the stage element
 */
silex.view.Stage.STAGE_CLASS_NAME = 'silex-stage-iframe';

/**
 * input element to get the focus
 */
silex.view.Stage.BACKGROUND_CLASS_NAME = 'background';

/**
 * input element to get the focus
 */
silex.view.Stage.prototype.focusInput = null;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isResizing = false;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isDragging = false;

/**
 * flag to store the state
 */
silex.view.Stage.prototype.isDown = false;

/**
 * remove stage event listeners
 * @param {Element}  bodyElement   the element which contains the body of the website
 */
silex.view.Stage.prototype.removeEvents = function (bodyElement) {
  goog.events.removeAll(bodyElement);
};
/**
 * init stage events
 * handle mouse events for selection,
 * events of the jquery editable plugin,
 * double click to edit,
 * and disable horizontal scrolling for back page on Mac OS
 * @param {Element}  bodyElement   the element which contains the body of the website
 */
silex.view.Stage.prototype.initEvents = function (bodyElement) {
  this.bodyElement = bodyElement;

  // listen on body instead of element because user can release
  // on the tool boxes
  goog.events.listen(bodyElement, 'mouseup', function(e) {
    // update state
    this.isDown = false;
    // handle selection
    if (this.isDragging || this.isResizing) {
      this.controller.stageController.change(e.target);
      this.isDragging = false;
      this.isResizing = false;
    }
    // do nothing if it is mousup outside the stage
    else if(goog.dom.contains(bodyElement, e.target)){
      if(e.shiftKey === true){
        // if the element is selected, then unselect it
        // get the first parent node which is editable (silex-editable css class)
        var editableElement = goog.dom.getAncestorByClass(e.target, silex.model.Body.EDITABLE_CLASS_NAME) || bodyElement;
        if (this.lastSelected != editableElement){
          this.controller.stageController.deselect(editableElement);
        }
      }
      else{
        // if the user did not move the element select it in case other elements were selected
        // get the first parent node which is editable (silex-editable css class)
        var editableElement = goog.dom.getAncestorByClass(e.target, silex.model.Body.EDITABLE_CLASS_NAME) || bodyElement;
        // check if selection has changed
        // ?? do not check if selection has changed, becaus it causes refresh bugs (apply border to the next selected element)
        var hasChanged = (this.selectedElements.length === 1 && this.selectedElements[0] === editableElement);
        if (!hasChanged){
          // update selection
          this.controller.stageController.select(editableElement);
        }
      }
    }
    // remove the focus from text fields
    if(goog.dom.contains(bodyElement, e.target)){
      this.focusInput.focus();
      this.focusInput.blur();
    }
  }, false, this);

  // multiple selection move
  goog.events.listen(bodyElement, 'mousemove', function(e) {
    // update states
    if (this.isDown){
      // update states
      if (!this.isDragging && !this.isResizing){
        if (goog.dom.classes.has(e.target, 'ui-resizable-handle')){
          this.isResizing = true;
        }
        else{
          this.isDragging = true;
        }
      }
      // compute the offset compared to the last mouse move
      var offsetX = e.screenX - this.lastPosX;
      var offsetY = e.screenY - this.lastPosY;
      this.lastPosX = e.screenX;
      this.lastPosY = e.screenY;
      // apply offset to other selected element
      var dragged = goog.dom.getAncestorByClass(e.target, silex.model.Body.EDITABLE_CLASS_NAME) || bodyElement;
      goog.array.forEach(this.selectedElements, function(element) {
        if (element !== dragged){
          if (this.isResizing){
            var pos = goog.style.getSize(element);
            //goog.style.setSize(element, pos.width + offsetX, pos.height + offsetY);
          }
          else if (this.isDragging){
            // do not move an element if one of its parent is already being moved
            if (!goog.dom.getAncestorByClass(element.parentNode, silex.model.Element.SELECTED_CLASS_NAME)){
              var pos = goog.style.getPosition(element);
              goog.style.setPosition(element, pos.x + offsetX, pos.y + offsetY);
            }
          }
        }
      }, this);
    }
  }, false, this);
  // detect mouse down
  goog.events.listen(bodyElement, 'mousedown', function(e) {
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(e.target, silex.model.Body.EDITABLE_CLASS_NAME) || bodyElement;
    this.lastSelected = null;
    // if the element was not already selected
    if (!goog.dom.classes.has(editableElement, silex.model.Element.SELECTED_CLASS_NAME)){
      this.lastSelected = editableElement;
      // notify the controller
      if (e.shiftKey){
        this.controller.stageController.selectMultiple(editableElement);
      }
      else{
        this.controller.stageController.select(editableElement);
      }
    }
    // keep track of the last maouse position
    this.lastPosX = e.screenX;
    this.lastPosY = e.screenY;
    // update state
    this.isDown = true;
  }, false, this);
  // dispatch event when an element has been moved
  goog.events.listen(bodyElement, 'dragstop', function(e) {
    this.controller.stageController.change(e.target);
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element has been moved or resized
  goog.events.listen(bodyElement, 'resize', function(e) {
    this.controller.stageController.change(e.target);
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element is dropped in a new container
  goog.events.listen(bodyElement, 'newContainer', function(e) {
    var newContainer = e.target.parentNode;
    // move all selected elements to the new container
    goog.array.forEach(this.selectedElements, function(element) {
      if (element.parentNode !== newContainer){
        // store initial position
        var pos = goog.style.getPageOffset(element);
        // move to the new container
        goog.dom.appendChild(newContainer, element);
        // restore position
        goog.style.setPageOffset(element, pos);
      }
      this.controller.stageController.newContainer(element);
    }, this);
  }, false, this);
  // dispatch event when an element is dropped in a new container
  goog.events.listen(bodyElement, 'droppedOutOfStage', function(e) {
/*
    var element = e.target;
    // store initial position
    var pos = goog.style.getPageOffset(element);
    // move to the new container (the stage)
    goog.dom.appendChild(this.bodyElement, element);
    // restore position
    goog.style.setPageOffset(element, pos);
*/
  }, false, this);
  // detect double click
  goog.events.listen(bodyElement, goog.events.EventType.DBLCLICK, function(e) {
    this.controller.stageController.editElement();
  }, false, this);
};

/**
 * redraw the properties
 * @param   {Array<element>} selectedElements the elements currently selected
 * @param   {HTMLDocument} document  the document to use
 * @param   {Array<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Stage.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
  // remember selection
  this.selectedElements = selectedElements;
};
