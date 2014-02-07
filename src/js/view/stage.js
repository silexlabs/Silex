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


goog.require('silex.view.ViewBase');
goog.provide('silex.view.Stage');

goog.require('silex.utils.EditablePlugin');

goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');

/**
 * the Silex stage class
 * @constructor
 * load the template and render to the given html element
 * @param  {Element}  element  DOM element to wich I render the UI
 *  has been changed by the user
 */
silex.view.Stage = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  // init the view
  this.initEvents()

  // create an input element to get the focus
  this.focusInput = goog.dom.createElement('input');
  //this.focusInput.style.visibility = 'hidden';
  this.focusInput.style.left = '-1000px';
  this.focusInput.style.position = 'absolute';
  document.body.appendChild(this.focusInput);
}

// inherit from silex.view.ViewBase
goog.inherits(silex.view.Stage, silex.view.ViewBase);

/**
 * class name for the stage element
 */
silex.view.Stage.STAGE_CLASS_NAME = 'silex-stage-body';

/**
 * input element to get the focus
 */
silex.view.Stage.BACKGROUND_CLASS_NAME = 'background';

/**
 * input element to get the focus
 */
silex.view.Stage.prototype.focusInput;

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
 * init stage events
 * handle mouse events for selection,
 * events of the jquery editable plugin,
 * double click to edit,
 * and disable horizontal scrolling for back page on Mac OS
 */
silex.view.Stage.prototype.initEvents = function () {

  // multiple selection move
  goog.events.listen(this.element, 'mousemove', function(e) {
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
      var dragged = silex.utils.EditablePlugin.getFirstEditableParent(e.target);
      var elements = goog.dom.getElementsByClass(silex.model.Element.SELECTED_CLASS_NAME, this.bodyElement);
      goog.array.forEach(elements, function(element) {
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
  goog.events.listen(this.element, 'mousedown', function(e) {
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = silex.utils.EditablePlugin.getFirstEditableParent(e.target);
    this.lastSelected = null;
    // if the element was not already selected
    if (!goog.dom.classes.has(editableElement, silex.model.Element.SELECTED_CLASS_NAME)){
      this.lastSelected = editableElement;
      // notify the controller
      if (this.onStatus){
        if (e.shiftKey){
          this.onStatus('selectMultiple', editableElement);
        }
        else{
          this.onStatus('select', editableElement);
        }
      }
    }
    // keep track of the last maouse position
    this.lastPosX = e.screenX;
    this.lastPosY = e.screenY;
    // update state
    this.isDown = true;
  }, false, this);
  // listen on body instead of element because user can release
  // on the tool boxes
  goog.events.listen(document.body, 'mouseup', function(e) {
    // update state
    this.isDown = false;
    // handle selection
    if (this.isDragging || this.isResizing) {
      if (this.onStatus) this.onStatus('change', e.target);
      this.isDragging = false;
      this.isResizing = false;
    }
    // do nothing if it is mousup outside the stage
    else if(goog.dom.contains(this.element, e.target)){
      if(e.shiftKey === true){
        // if the element is selected, then unselect it
        if (this.onStatus){
          // get the first parent node which is editable (silex-editable css class)
          var editableElement = silex.utils.EditablePlugin.getFirstEditableParent(e.target);
          if (this.lastSelected != editableElement){
            this.onStatus('deselect', editableElement);
          }
        }
      }
      else{
        // if the user did not move the element select it in case other elements were selected
        if (this.onStatus){
          // get the first parent node which is editable (silex-editable css class)
          var editableElement = silex.utils.EditablePlugin.getFirstEditableParent(e.target);
          this.onStatus('select', editableElement);
        }
      }
    }
    // remove the focus from text fields
    if(goog.dom.contains(this.element, e.target)){
      this.focusInput.focus();
      this.focusInput.blur();
    }
  }, false, this);
  // dispatch event when an element has been moved
  goog.events.listen(this.element, 'dragstop', function(e) {
    if (this.onStatus) this.onStatus('change', e.target);
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element has been moved or resized
  goog.events.listen(this.element, 'resize', function(e) {
    if (this.onStatus) this.onStatus('change', e.target);
    this.isDragging = false;
  }, false, this);
  // dispatch event when an element is dropped in a new container
  goog.events.listen(this.element, 'newContainer', function(e) {
    var newContainer = e.target.parentNode;
    // move all selected elements to the new container
    var elements = this.getSelection();
    goog.array.forEach(elements, function(element) {
      if (element.parentNode !== newContainer){
        // store initial position
        var pos = goog.style.getPageOffset(element);
        // move to the new container
        goog.dom.appendChild(newContainer, element);
        // restore position
        goog.style.setPageOffset(element, pos);
      }
      if (this.onStatus) this.onStatus('newContainer', element);
    }, this);
  }, false, this);
  // detect double click
  goog.events.listen(this.element, goog.events.EventType.DBLCLICK, function(e) {
    if (this.onStatus) this.onStatus('edit');
  }, false, this);
  // Disable horizontal scrolling for Back page on Mac OS
  var mwh = new goog.events.MouseWheelHandler(this.element);
  goog.events.listen(mwh, goog.events.MouseWheelHandler.EventType.MOUSEWHEEL, function (e) {
    if (e.deltaX<0 && this.bodyElement.parentNode.scrollLeft<=0){
      e.preventDefault();
    }
  }, false, this);
};


/**
 * @return {object} object of fonts which are used in the text fields (key is the font name)
 */
silex.view.Stage.prototype.getNeededFonts = function() {
  var innerHTML = this.bodyElement.innerHTML;
  var neededFonts = [];
  innerHTML.replace(/<font[^"]*face="?([^"]*)"/g, function(match, group1, group2) {
    neededFonts[group1] = true;
    return match;
  });
  return neededFonts;
};
