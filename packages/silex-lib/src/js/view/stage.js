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
 * @fileoverview The stage is the area where the user drag/drops elements
 *   This class is in charge of listening to the DOM of the loaded publication
 *   and retrieve information about it
 *
 */


goog.provide('silex.view.Stage');

goog.require('goog.events');
goog.require('goog.events.MouseWheelHandler');
goog.require('goog.math.Coordinate');



/**
 * the Silex stage class
 * @constructor
 * load the template and render to the given html element
 * @param  {Element}  element  DOM element to wich I render the UI
 *  has been changed by the user
 * @param  {silex.types.Controller} controller
 *                      structure which holds the controller classes
 */
silex.view.Stage = function(element, controller) {
  // store references
  this.element = element;
  this.controller = controller;
};

/**
 * class name for the stage element
 */
silex.view.Stage.STAGE_CLASS_NAME = 'silex-stage-iframe';


/**
 * input element to get the focus
 */
silex.view.Stage.BACKGROUND_CLASS_NAME = 'background';


/**
 * the document of the iframe which contains the website
 */
silex.view.Stage.prototype.documentElement = null;


/**
 * the element which contains the body of the website
 */
silex.view.Stage.prototype.bodyElement = null;


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
 * build the UI
 * called by the app constructor
 */
silex.view.Stage.prototype.buildUi = function() {
  // create an input element to get the focus
  this.focusInput = goog.dom.createElement('input');
  goog.style.setStyle(this.focusInput, 'left', '-1000px');
  goog.style.setStyle(this.focusInput, 'position', 'absolute');
  document.body.appendChild(this.focusInput);


  // Disable horizontal scrolling for Back page on Mac OS, over Silex UI
  goog.events.listen(new goog.events.MouseWheelHandler(document.body),
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      this.onPreventBackSwipe,
      false,
      this);

  // Disable horizontal scrolling for Back page on Mac OS
  // on the iframe
  goog.events.listen(new goog.events.MouseWheelHandler(this.element),
      goog.events.MouseWheelHandler.EventType.MOUSEWHEEL,
      this.onPreventBackSwipe,
      false,
      this);

  // listen on body too because user can release the mouse over the tool boxes
  goog.events.listen(document.body,
      'mouseup',
      this.onMouseUpOverUi,
      false,
      this);

  // listen on body too because user can release
  // on the tool boxes
  goog.events.listen(document.body,
      'mousemove',
      this.onMouseMoveOverUi,
      false,
      this);
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and move the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseMoveOverUi = function(event) {
  var x = event.clientX;
  var y = event.clientY;
  this.onMouseMove(/** @type {Element} */ (event.target), x, y);
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and release the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseUpOverUi = function(event) {
  // if out of stage, release from drag of the plugin
  // simulate the mouse up on the iframe body
  var newEvObj = document.createEvent('MouseEvents');
  newEvObj.initEvent('mouseup', true, true);
  newEvObj.clientX = event.clientX;
  newEvObj.clientY = event.clientY;
  this.iAmClicking = true;
  this.bodyElement.dispatchEvent(newEvObj);
  this.iAmClicking = false;
};


/**
 * Disable horizontal scrolling for back page on Mac OS,
 * Over Silex UI and over the stage
 * @param {Event} event
 */
silex.view.Stage.prototype.onPreventBackSwipe = function(event) {
  if (event.deltaX < 0 && this.getScrollX() <= 0) {
    event.preventDefault();
  }
};


/**
 * Resize the iframe body to the size of its content
 * This is to always keep space between the elements (main container etc)
 * and the stage border
 * @param {?Event=} event
 */
silex.view.Stage.prototype.bodyElementSizeToContent = function(event) {
  if (this.bodyElement) {
    var width = 0;
    var height = 0;
    var containers = goog.dom.getElementsByClass(
        silex.view.Stage.BACKGROUND_CLASS_NAME,
        this.bodyElement);

    if (containers && containers.length > 0) {
      var bb = silex.utils.Dom.getBoundingBox(containers);
      var viewportSize = this.viewport.getSize();
      var desiredBodyWidth = bb.width + 100;
      if (desiredBodyWidth < viewportSize.width) {
        // let the css handle a body of the size of the stage
        goog.style.setStyle(this.bodyElement, 'minWidth');
      }
      else {
        // we want the body to be this size
        // we use minWidth/minHeight in order to leave width/height to the user
        goog.style.setStyle(
            this.bodyElement,
            'minWidth',
            desiredBodyWidth + 'px');
      }
      var desiredBodyHeight = bb.height + 100;
      if (desiredBodyHeight < viewportSize.height) {
        // let the css handle a body of the size of the stage
        goog.style.setStyle(this.bodyElement, 'minHeight');
      }
      else {
        // we want the body to be this size
        // we use minWidth/minHeight in order to leave width/height to the user
        goog.style.setStyle(
            this.bodyElement,
            'minHeight',
            desiredBodyHeight + 'px');
      }
    }
  }
  else {
    // could not resize body to match content because
    // this.bodyElement is undefined
    // this happens at startup
  }
};


/**
 * remove stage event listeners
 * @param {Element} bodyElement the element which contains the body of the site
 */
silex.view.Stage.prototype.removeEvents = function(bodyElement) {
  goog.events.removeAll(bodyElement);
};


/**
 * init stage events
 * handle mouse events for selection,
 * events of the jquery editable plugin,
 * double click to edit,
 * and disable horizontal scrolling for back page on Mac OS
 *{Element}Element} bodyElement the element which contains the body of the site
 */
silex.view.Stage.prototype.initEvents = function(contentWindow) {
  this.bodyElement = contentWindow.document.body;
  this.documentElement = contentWindow.document;

  // handle resize and the iframe body size
  if (this.viewport) {
    goog.events.removeAll(this.viewport);
  }
  this.viewport = new goog.dom.ViewportSizeMonitor(contentWindow);
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE,
      this.bodyElementSizeToContent, false, this);
  // init iframe body size
  this.bodyElementSizeToContent();

  // listen on body instead of element because user can release
  // on the tool boxes
  goog.events.listen(this.bodyElement, 'mouseup', function(e) {
    var x = e.clientX;
    var y = e.clientY;
    this.handleMouseUp(e.target, e.shiftKey);
  }, false, this);

  // move in the iframe
  goog.events.listen(this.bodyElement, 'mousemove', function(event) {
    var x = event.clientX;
    var y = event.clientY;
    this.onMouseMove(/** @type {Element} */ (event.target), x, y);
  }, false, this);

  // detect mouse down
  goog.events.listen(this.bodyElement, 'mousedown', function(e) {
    this.lastClickWasResize = goog.dom.classlist.contains(
        e.target,
        'ui-resizable-handle');
    var x = e.clientX;
    var y = e.clientY;
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(
        e.target,
        silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
    this.handleMouseDown(editableElement, x, y, e.shiftKey);
  }, false, this);

  // dispatch event when an element has been moved
  goog.events.listen(this.bodyElement, 'dragstop', function(e) {
    this.propertyChanged();
    this.isDragging = false;
  }, false, this);

  // dispatch event when an element has been moved or resized
  goog.events.listen(this.bodyElement, 'resize', function(e) {
    this.propertyChanged();
    this.isDragging = false;
  }, false, this);

  // dispatch event when an element is dropped in a new container
  goog.events.listen(this.bodyElement, 'newContainer', function(e) {
    var newContainer = e.target.parentNode;
    // move all selected elements to the new container
    goog.array.forEach(this.selectedElements, function(element) {
      this.controller.stageController.newContainer(newContainer, element);
    }, this);
    // update property tool box
    this.propertyChanged();
  }, false, this);

  // when an element is dropped on the background
  // move it to the body
  goog.events.listen(this.bodyElement, 'droppedOutOfStage', function(e) {
    var element = e.target;
    this.controller.stageController.newContainer(this.bodyElement, element);
  }, false, this);

  // detect double click
  goog.events.listen(
      this.bodyElement,
      goog.events.EventType.DBLCLICK,
      function(e) {
        this.controller.editMenuController.editElement();
      }, false, this);
};


/**
 * redraw the properties
 * @param   {Array.<HTMLElement>} selectedElements the selected elements
 * @param   {Document} document  the document to use
 * @param   {Array.<string>} pageNames   the names of the pages
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Stage.prototype.redraw =
    function(selectedElements, document, pageNames, currentPageName) {
  // remember selection
  this.selectedElements = selectedElements;
  this.bodyElementSizeToContent();
};


/**
 * handle mouse up
 * notify the controller to select/deselect the element (multiple or single)
 * reset state:
 * - clicked DOM element
 * - mouse position
 * - scroll position
 * - isDown
 * @param   {Element} target a DOM element clicked by the user
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.handleMouseUp = function(target, shiftKey) {
  // update state
  this.isDown = false;
  // handle selection
  if (this.isDragging || this.isResizing) {
    // update property tool box
    this.propertyChanged();
    // change z order
    this.bringSelectionForward();
    // keep flags up to date
    this.isDragging = false;
    this.isResizing = false;
  }
  // if not dragging, and on stage, then change selection
  else if (this.iAmClicking !== true) {
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(
        target,
        silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;

    // single or multiple selection
    if (shiftKey === true) {
      // if the element is selected, then unselect it
      if (this.lastSelected != editableElement) {
        this.controller.stageController.deselect(editableElement);
      }
    }
    else {
      // if the user did not move the element,
      // select it in case other elements were selected
      // check if selection has changed
      // ?? do not check if selection has changed,
      // because it causes refresh bugs
      // (apply border to the next selected element)
      var hasChanged = (this.selectedElements.length === 1 &&
          this.selectedElements[0] === editableElement);
      if (!hasChanged) {
        // update selection
        this.controller.stageController.select(editableElement);
      }
    }
  }
  if (this.iAmClicking !== true) {
    this.resetFocus();
  }
};


/**
 * remove the focus from text fields
 */
silex.view.Stage.prototype.resetFocus = function() {
  this.focusInput.focus();
  this.focusInput.blur();
};


/**
 * bring the selection forward
 */
silex.view.Stage.prototype.bringSelectionForward = function() {
  goog.array.forEach(this.selectedElements, function(element) {
    var container = element.parentNode;
    goog.dom.removeNode(element);
    goog.dom.appendChild(container, element);
  }, this);
};


/**
 * Handle mouse move
 * If the mouse button isDown, then
 * - compute the offset of the mouse from the last known position
 * - handle the scroll position changes
 *       (while dragging an element near the border of the stage, it may scroll)
 * - apply the ofset to the dragged or resized element(s)
 * @param   {Element} target a DOM element clicked by the user
 *
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 */
silex.view.Stage.prototype.onMouseMove = function(target, x, y) {
  // update states
  if (this.isDown) {
    // update property tool box
    this.propertyChanged();
    // case of a drag directly after mouse down (select + drag)
    if (this.lastSelected === null) {
      var editableElement = goog.dom.getAncestorByClass(
          target, silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
      this.lastSelected = editableElement;
    }
    if (this.resizeDirection === null) {
      this.resizeDirection = this.getResizeDirection(target);
    }
    // update states
    if (!this.isDragging && !this.isResizing) {
      // notify controller that a change is about to take place
      this.controller.stageController.beforeChange();
      if (this.lastClickWasResize) {
        this.isResizing = true;
      }
      else {
        this.isDragging = true;
      }
    }
    else {
      // keep the body size while dragging or resizing
      this.bodyElementSizeToContent();
    }

    // update multiple selection according the the dragged element
    this.multipleDragged(x, y);

    // update scroll when mouse is near the border
    this.updateScroll(x, y);
  }
};


/**
 * Handle the case where mouse is near a border of the stage
 * and an element is being dragged
 * Then scroll accordingly
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 */
silex.view.Stage.prototype.updateScroll = function(x, y) {
  var iframeSize = goog.style.getSize(this.element);
  var scrollX = this.getScrollX();
  var scrollY = this.getScrollY();
  if (x < 30) {
    this.setScrollX(scrollX - 35);
  }
  else if (x > iframeSize.width - 30) {
    this.setScrollX(scrollX + 35);
  }
  if (y < 30) {
    this.setScrollY(scrollY - 35);
  }
  else if (y > iframeSize.height - 30) {
    this.setScrollY(scrollY + 35);
  }
};


/**
 * Make selected elements move as the dragged element is moving
 * Compute the offset compared to the last mouse move
 * Take the scroll delta into account (changes when dragging outside the stage)
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 */
silex.view.Stage.prototype.multipleDragged = function(x, y) {
  var scrollX = this.getScrollX();
  var scrollY = this.getScrollY();
  var offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
  var offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
  // update the latest position and scroll
  this.lastPosX = x;
  this.lastPosY = y;
  this.lastScrollLeft = scrollX;
  this.lastScrollTop = scrollY;

/*
  // handle multiple selection for size and position
  var followers = this.selectedElements.filter(goog.bind(function(element) {
    return element != this.lastSelected;
  }, this));
*/
  // follow the mouse (this means that the element dragged by the editable plugin
  // is handled here, which overrides the behavior of the plugin
  // (this is because we take the body scroll into account, and the parent's scroll too)
  var followers = this.selectedElements;
  // drag or resize
  if (this.isDragging) {
    this.followElementPosition(followers, offsetX, offsetY);
  }
  else if (this.isResizing) {
    this.followElementSize(followers, this.resizeDirection, offsetX, offsetY);
  }
};


/**
 * make the followers follow the element's position
 * @param   {Array.<HTMLElement>} followers which will follow the elements
 * @param   {number} offsetX the delta to be applied
 * @param   {number} offsetY the delta to be applied
 */
silex.view.Stage.prototype.followElementPosition =
    function(followers, offsetX, offsetY) {
  // apply offset to other selected element
  goog.array.forEach(followers, function(follower) {
    // do not move an element if one of its parent is already being moved
    if (!goog.dom.getAncestorByClass(
        follower.parentNode, silex.model.Element.SELECTED_CLASS_NAME))
    {
      var pos = goog.style.getPosition(follower);
      var scroll = this.getParentsScroll(follower);
      goog.style.setPosition(follower, pos.x + offsetX + scroll.x, pos.y + offsetY + scroll.y);
    }
  }, this);
};


/**
 * adds all parents scroll offsets and returns it
 * @param {Element} follower the element whose parents we take into account
 * @return {goog.math.Coordinate} the sum of all parent's scroll positions
 */
silex.view.Stage.prototype.getParentsScroll = function(follower){
    var scroll = new goog.math.Coordinate(0, 0);
    var parent = follower.parentNode;
    while(parent && parent.tagName.toLowerCase() != 'body'){
        if (parent.scrollLeft) scroll.x += parent.scrollLeft;
        if (parent.scrollTop) scroll.y += parent.scrollTop;
        parent = parent.parentNode;
    }
    return scroll;
};

/**
 * make the followers follow the element's size
 * @param   {Array.<HTMLElement>} followers which will follow the elements
 * @param   {string} resizeDirection the direction n, s, e, o, ne, no, se, so
 * @param   {number} offsetX the delta to be applied
 * @param   {number} offsetY the delta to be applied
 */
silex.view.Stage.prototype.followElementSize =
    function(followers, resizeDirection, offsetX, offsetY) {
  // apply offset to other selected element
  goog.array.forEach(followers, function(follower) {
    var size = goog.style.getSize(follower);
    // depending on the handle which is dragged,
    // only width and/or height should be set
    if (resizeDirection === 's') {
      offsetX = 0;
    }
    else if (resizeDirection === 'n') {
      let pos = goog.style.getPosition(follower);
      goog.style.setPosition(follower, pos.x, pos.y + offsetY);
      offsetY = -offsetY;
      offsetX = 0;
    }
    else if (resizeDirection === 'w') {
      let pos = goog.style.getPosition(follower);
      goog.style.setPosition(follower, pos.x + offsetX, pos.y);
      offsetX = -offsetX;
      offsetY = 0;
    }
    else if (resizeDirection === 'e') {
      offsetY = 0;
    }
    goog.style.setSize(follower, size.width + offsetX, size.height + offsetY);
  }, this);
};


/**
 * handle mouse down
 * notify the controller to select the element (multiple or single)
 * store state:
 * - clicked DOM element
 * - mouse position
 * - scroll position
 * - isDown
 * @param   {Element} element Silex element currently selected (text, image...)
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.handleMouseDown = function(element, x, y, shiftKey) {
  this.lastSelected = null;
  this.resizeDirection = null;
  // if the element was not already selected
  if (!goog.dom.classlist.contains(
      element,
      silex.model.Element.SELECTED_CLASS_NAME)) {
    this.lastSelected = element;
    // notify the controller
    if (shiftKey) {
      this.controller.stageController.selectMultiple(element);
    }
    else {
      this.controller.stageController.select(element);
    }
  }
  // keep track of the last mouse position and body scroll
  this.lastPosX = x;
  this.lastPosY = y;
  this.lastScrollLeft = this.getScrollX();
  this.lastScrollTop = this.getScrollY();
  // update state
  this.isDown = true;
};


/**
 * check if the target is a UI handle to resize or move -draggable jquery plugin
 * @param   {Element} target a DOM element clicked by the user,
 *                    which may be a handle to resize or move
 */
silex.view.Stage.prototype.getResizeDirection = function(target) {
  if (goog.dom.classlist.contains(target, 'ui-resizable-s')) return 's';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-n')) return 'n';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-e')) return 'e';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-w')) return 'w';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-se')) return 'se';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-sw')) return 'sw';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-ne')) return 'ne';
  else if (goog.dom.classlist.contains(target, 'ui-resizable-nw')) return 'nw';
  // Target is not a resize handle
  return null;
};


/**
 * get the scroll property, working around cross browser issues
 * utility method
 * @private
 * @param {string} propDoc, name of the property to get on document element
 * @param {string} propBody, name of the property to get on the document body
 * @return {number} the value
 */
silex.view.Stage.prototype.getScroll = function(propDoc, propBody) {
  return Math.max(
      this.documentElement[propDoc] || 0,
      this.bodyElement[propBody] || 0);
};


/**
 * set the scroll property, working around cross browser issues
 * utility method
 * @private
 * @param {string} propDoc, name of the property to set on document element
 * @param {string} propBody, name of the property to set on the document body
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScroll = function(value, propDoc, propBody) {
  this.documentElement[propDoc] = value;
  this.bodyElement[propBody] = value;
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollX = function(value) {
  this.setScroll(value, 'scrollLeft', 'scrollLeft');
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollY = function(value) {
  this.setScroll(value, 'scrollTop', 'scrollTop');
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollX = function() {
  return this.getScroll('scrollLeft', 'scrollLeft');
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollY = function() {
  return this.getScroll('scrollTop', 'scrollTop');
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxX = function() {
  return this.getScroll('scrollLeftMax', 'scrollWidth');
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxY = function() {
  return this.getScroll('scrollTopMax', 'scrollHeight');
};


/**
 * notify the controller that the properties of the selection have changed
 */
silex.view.Stage.prototype.propertyChanged = function() {
  // check position and size are int and not float
  goog.array.forEach(this.selectedElements, function(element) {
    // round position
    var position = goog.style.getPosition(element);
    if (goog.isDefAndNotNull(position.x)) position.x = Math.floor(position.x);
    if (goog.isDefAndNotNull(position.y)) position.y = Math.floor(position.y);
    if (goog.isDefAndNotNull(position.x) || goog.isDefAndNotNull(position.y)) {
      goog.style.setPosition(element, position.x, position.y);
    }
    // round size
    var size = goog.style.getSize(element);
    if (goog.isDefAndNotNull(size.x)) size.x = Math.floor(size.x);
    if (goog.isDefAndNotNull(size.y)) size.y = Math.floor(size.y);
    if (goog.isDefAndNotNull(size.x) || goog.isDefAndNotNull(size.y)) {
      goog.style.setSize(element, size.x, size.y);
    }
  }, this);
  // update property tool box
  this.controller.stageController.change();
};
