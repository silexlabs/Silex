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
  var pos =  goog.style.getRelativePosition(event, this.element);
  this.onMouseMove(/** @type {Element} */ (event.target), pos.x, pos.y);
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and release the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseUpOverUi = function(event) {
  // if out of stage, release from drag of the plugin
  // simulate the mouse up on the iframe body
  var pos =  goog.style.getRelativePosition(event, this.element);
  var newEvObj = document.createEvent('MouseEvents');
  newEvObj.initEvent('mouseup', true, true);
  newEvObj.clientX = pos.x;
  newEvObj.clientY = pos.y;
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
    this.handleMouseUp(e.target, x, y, e.shiftKey);
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
  this.currentPageName = currentPageName;
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
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.handleMouseUp = function(target, x, y, shiftKey) {
  // update state
  this.isDown = false;
  if(this.isDragging){
    // new container
    var dropZone = this.getDropZone(x, y) || {'element': this.bodyElement, 'zIndex': 0};
    // move all selected elements to the new container
    goog.array.forEach(this.selectedElements, function(element) {
      this.controller.stageController.newContainer(dropZone.element, element);
    }, this);
    // change z order
    this.bringSelectionForward();
    // reset dropzone marker
    this.markAsDropZone(null);
  }
  // handle selection
  if (this.isDragging || this.isResizing) {
    // update property tool box
    this.propertyChanged();
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
    // det the drop zone under the cursor
    var dropZone = this.getDropZone(x, y) || {'element': this.bodyElement, 'zIndex': 0};
    // handle the css class applyed to the dropzone
    this.markAsDropZone(dropZone.element);
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
 * add a css class to the drop zone
 * and remove from non dropzones
 */
silex.view.Stage.prototype.markAsDropZone = function(opt_element){
    var els = goog.dom.getElementsByClass('drop-zone-candidate', this.bodyElement.parentNode);
    goog.array.forEach(els, function(e){goog.dom.classlist.remove(/** @type {Element} */ (e),'drop-zone-candidate')});
    if(opt_element){
      goog.dom.classlist.add(/** @type {Element} */ (opt_element), 'drop-zone-candidate');
    }
};


/**
 * recursively get the top most element which is under the mouse cursor
 * excludes the selected elements
 * takes the zIndex into account, or the order in the DOM
 *
 * @param {number} x    mouse position
 * @param {number} y    mouse position
 * @param {?Element=} opt_container   element into which to seach for the dropzone, by default the body
 * @return {{element: ?Element, zIndex: number}}  if not null this is the drop zone under the mouse cursor
 *                                              zIndex being the highest z-index encountered while browsing children
 */
silex.view.Stage.prototype.getDropZone = function(x, y, opt_container){
  // default value
  var container =  opt_container || this.bodyElement;
  var children = goog.dom.getChildren(container);
  var topMost = null;
  var zTopMost = 0;
  // find the best drop zone
  for (var idx=0; idx < children.length; idx++){
    var element = children[idx];
    if (this.getVisibility(element)
        && !goog.dom.classlist.contains(element, silex.model.Body.PREVENT_DROPPABLE_CLASS_NAME)
        && !goog.dom.classlist.contains(element, 'silex-selected')
        && goog.dom.classlist.contains(element, 'container-element')){
      var bb = goog.style.getBounds(element);
      var scrollX = this.getScrollX();
      var scrollY = this.getScrollY();
      if (bb.left < x + scrollX && bb.left + bb.width > x + scrollX
        && bb.top < y + scrollY && bb.top + bb.height > y + scrollY){
          var candidate = this.getDropZone(x, y, element);
          // if zIndex is 0 then there is no value to css zIndex, considere the DOM order
          if (candidate.element){
            var zIndex = goog.style.getComputedZIndex(element);
            if (zIndex === 'auto') zIndex = 0;
            if (zIndex >= zTopMost){
              topMost = candidate;
              zTopMost = zIndex;
              // keep track of the highest z-index in for the given result
              if(zIndex > candidate.zIndex){
                candidate.zIndex = /** @type {number} */ (zIndex);
              }
            }
          }
      }
    }
  }
  return topMost || {'element': container, 'zIndex': 0};
};


/**
 * compute the page visibility of the element
 * @param {Element} element     the element to check
 * @return {boolean} true if the element is in the current page or not in any page
 */
silex.view.Stage.prototype.getVisibility = function(element){
  /** @type {Element|null} */
  var parent = /** @type {Element|null} */ (element.parentNode);
  while (parent &&
        (!goog.dom.classlist.contains(/** @type {Element} */ (parent), silex.model.Page.PAGED_CLASS_NAME) ||
        goog.dom.classlist.contains(/** @type {Element} */ (parent), this.currentPageName))) {
    parent = /** @type {Element|null} */ (parent.parentNode);
  }
  return parent === null;
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
    this.setScrollX(scrollX - 25);
  }
  else if (x > iframeSize.width - 30) {
    this.setScrollX(scrollX + 25);
  }
  if (y < 30) {
    this.setScrollY(scrollY - 25);
  }
  else if (y > iframeSize.height - 30) {
    this.setScrollY(scrollY + 25);
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
        follower.parentNode, silex.model.Element.SELECTED_CLASS_NAME)
      && !goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME)) {
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
    if (!goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME)) {
      var size = goog.style.getSize(follower);
      // depending on the handle which is dragged,
      // only width and/or height should be set
      if (resizeDirection === 's') {
        offsetX = 0;
      }
      else if (resizeDirection === 'n') {
        var pos = goog.style.getPosition(follower);
        goog.style.setPosition(follower, pos.x, pos.y + offsetY);
        offsetY = -offsetY;
        offsetX = 0;
      }
      else if (resizeDirection === 'w') {
        var pos = goog.style.getPosition(follower);
        goog.style.setPosition(follower, pos.x + offsetX, pos.y);
        offsetX = -offsetX;
        offsetY = 0;
      }
      else if (resizeDirection === 'e') {
        offsetY = 0;
      }
      var borderBox = goog.style.getBorderBox(follower);
      goog.style.setContentBoxSize(follower,
              new goog.math.Size(size.width + offsetX - borderBox.left - borderBox.right,
                    size.height + offsetY - borderBox.top - borderBox.bottom));
    }
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
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollX = function(value) {
  //this.setScroll(value, 'scrollLeft', 'scrollLeft');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScrollElement().scrollLeft = value;
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollY = function(value) {
  // this.setScroll(value, 'scrollTop', 'scrollTop');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScrollElement().scrollTop = value;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollX = function() {
  //return this.getScroll('scrollLeft', 'scrollLeft');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScroll().x;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollY = function() {
  //return this.getScroll('scrollTop', 'scrollTop');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScroll().y;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxX = function() {
  // return this.getScroll('scrollLeftMax', 'scrollWidth');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return goog.style.getSize(dh.getDocumentScrollElement()).width;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxY = function() {
  //return this.getScroll('scrollTopMax', 'scrollHeight');
  var dh = new goog.dom.DomHelper(this.documentElement);
  return goog.style.getSize(dh.getDocumentScrollElement()).height;
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
