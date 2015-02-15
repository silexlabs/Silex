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
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller
 *                      structure which holds the controller classes
 */
silex.view.Stage = function(element, model, controller) {
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
 * current selection
 * @type {Array.<Element>}
 */
silex.view.Stage.prototype.selectedElements = null;


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

  // keyboard
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, 'key', goog.bind(this.handleKey, this));
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and move the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseMoveOverUi = function(event) {
  var pos =  goog.style.getRelativePosition(event, this.element);
  this.onMouseMove(/** @type {Element} */ (event.target), pos.x, pos.y, event.shiftKey);
  event.preventDefault();
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
  var newEvObj = document.createEvent('MouseEvent');
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
      var bb = silex.utils.Dom.getBoundingBox(containers, this.documentElement);
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
    this.onMouseMove(/** @type {Element} */ (event.target), x, y, event.shiftKey);
    event.preventDefault();
  }, false, this);

  // detect mouse down
  goog.events.listen(this.bodyElement, 'mousedown', function(e) {
    this.lastClickWasResize = goog.dom.classlist.contains(
        e.target,
        'ui-resizable-handle');
    this.resizeDirection = this.getResizeDirection(e.target);
    var x = e.clientX;
    var y = e.clientY;
    // get the first parent node which is editable (silex-editable css class)
    var editableElement = goog.dom.getAncestorByClass(
        e.target,
        silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
    this.handleMouseDown(editableElement, x, y, e.shiftKey);
    // necessary in firefox to prevent default image drag
    e.preventDefault();
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
  // reset focus out of the text inputs,
  // this also prevents a bug when the page is loaded and the user presses a key,
  // the body is replaced by the keys chars
  this.resetFocus();
  // remember selection
  this.selectedElements = selectedElements;
  this.bodyElementSizeToContent();
  this.currentPageName = currentPageName;
};


/**
 * handle key strikes, look for arrow keys to move selection
 * @param {Event} event
 */
silex.view.Stage.prototype.handleKey = function(event) {
  // not in text inputs
  if (event.target.tagName.toUpperCase() !== 'INPUT' &&
      event.target.tagName.toUpperCase() !== 'TEXTAREA') {
    // compute the number of pixels to move
    var amount = 1;
    if(event.shiftKey === true) {
      amount *= 2;
    }
    if(event.altKey === true) {
      amount *= 5;
    }
    // compute the direction
    var offsetX = 0;
    var offsetY = 0;
    switch (event.keyCode) {
      case goog.events.KeyCodes.LEFT:
        offsetX = -amount;
      break;
      case goog.events.KeyCodes.RIGHT:
        offsetX = amount;
      break;
      case goog.events.KeyCodes.UP:
        offsetY = -amount;
      break;
      case goog.events.KeyCodes.DOWN:
        offsetY = amount;
      break;
    }
    // if there is something to move
    if (offsetX !== 0 || offsetY !== 0) {
      // apply the offset
      this.followElementPosition(this.selectedElements, offsetX, offsetY);
      // notify the controller
      this.propertyChanged();
      // prevent default behavior for this key
      event.preventDefault();
    }
  }
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
  // if it is not a click on the UI
  if (this.iAmClicking !== true) {
    this.resetFocus();
  }
  // handle the mouse up
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
    // style the body
    goog.dom.classlist.remove(this.bodyElement, silex.model.Body.DRAGGING_CLASS_NAME);
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
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 * @param   {boolean} shiftKey true if shift is down
 */
silex.view.Stage.prototype.onMouseMove = function(target, x, y, shiftKey) {
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
    // update states
    if (!this.isDragging && !this.isResizing) {
      // notify controller that a change is about to take place
      this.controller.stageController.beforeChange();
      if (this.lastClickWasResize) {
        this.isResizing = true;
      }
      else {
        this.isDragging = true;
        // dragging style
        goog.dom.classlist.add(this.bodyElement, silex.model.Body.DRAGGING_CLASS_NAME);
      }
    }
    else {
      // keep the body size while dragging or resizing
      this.bodyElementSizeToContent();
    }

    // update multiple selection according the the dragged element
    this.multipleDragged(x, y, shiftKey);

    // update scroll when mouse is near the border
    this.updateScroll(x, y);
  }
};


/**
 * add a css class to the drop zone
 * and remove from non dropzones
 */
silex.view.Stage.prototype.markAsDropZone = function(opt_element){
  var els = goog.dom.getElementsByClass(silex.model.Body.DROP_CANDIDATE_CLASS_NAME, this.bodyElement.parentNode);
  goog.array.forEach(els, function(e){goog.dom.classlist.remove(/** @type {Element} */ (e), silex.model.Body.DROP_CANDIDATE_CLASS_NAME)});
  if(opt_element){
    goog.dom.classlist.add(/** @type {Element} */ (opt_element), silex.model.Body.DROP_CANDIDATE_CLASS_NAME);
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
    if (goog.dom.classlist.contains(element, 'container-element')
      && !goog.dom.classlist.contains(element, silex.model.Body.PREVENT_DROPPABLE_CLASS_NAME)
      && !goog.dom.classlist.contains(element, 'silex-selected')
      && this.getVisibility(element)
      ){
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
  var parent = /** @type {Element|null} */ (element);
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
 * @param   {boolean} shiftKey state of the shift key
 */
silex.view.Stage.prototype.multipleDragged = function(x, y, shiftKey) {
  var scrollX = this.getScrollX();
  var scrollY = this.getScrollY();

  // follow the mouse (this means that the element dragged by the editable plugin
  // is handled here, which overrides the behavior of the plugin
  // (this is because we take the body scroll into account, and the parent's scroll too)
  var followers = this.selectedElements;
  // drag or resize
  if (this.isDragging || this.resizeDirection === null) {
    // handle shift key to move on one axis or preserve ratio
    if(shiftKey === true) {
      if(Math.abs((this.initialPos.x + this.initialScroll.x) - (x + scrollX)) < Math.abs((this.initialPos.y + this.initialScroll.y) - (y + scrollY))) {
        x = this.initialPos.x + this.initialScroll.x - scrollX;
      }
      else {
        y = this.initialPos.y + this.initialScroll.y - scrollY;
      }
    }
    var offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
    var offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
    this.followElementPosition(followers, offsetX, offsetY);
  }
  else if (this.isResizing) {
    // handle shift key to move on one axis or preserve ratio
    if(shiftKey === true
      && (this.resizeDirection === 'sw'
          || this.resizeDirection === 'se'
          || this.resizeDirection === 'nw'
          || this.resizeDirection === 'ne'
    )) {
      var width = x - this.initialPos.x;
      if (this.resizeDirection === 'ne' || this.resizeDirection === 'sw') {
        width = -width;
      }
      y = (this.initialPos.y) + (width * this.initialRatio);
    }
    var offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
    var offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
    this.followElementSize(followers, this.resizeDirection, offsetX, offsetY);
  }

  // update the latest position and scroll
  this.lastPosX = x;
  this.lastPosY = y;
  this.lastScrollLeft = scrollX;
  this.lastScrollTop = scrollY;
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
    // or if it is the stage
    // or if it has been marked as not draggable
    if (follower.tagName.toUpperCase() !== 'BODY'
      && !goog.dom.getAncestorByClass(follower.parentNode, silex.model.Element.SELECTED_CLASS_NAME)
      && !goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME)) {
          var pos = goog.style.getPosition(follower);
          this.controller.stageController.styleChanged('top', (pos.y + offsetY) + 'px', [follower]);
          this.controller.stageController.styleChanged('left', (pos.x + offsetX) + 'px', [follower]);
        }
  }, this);
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
    // do not resize the stage or the un-resizeable elements
    if (follower.tagName.toUpperCase() !== 'BODY'
      && !goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME)) {
      var pos = goog.style.getPosition(follower);
      var offsetPosX = pos.x;
      var offsetPosY = pos.y;
      // depending on the handle which is dragged,
      // only width and/or height should be set
      switch(resizeDirection) {
      case 's':
        offsetX = 0;
        break;
      case 'n':
        offsetPosY += offsetY;
        offsetY = -offsetY;
        offsetX = 0;
        break;
      case 'w':
        offsetPosX += offsetX;
        offsetX = -offsetX;
        offsetY = 0;
        break;
      case 'e':
        offsetY = 0;
        break;
      case 'se':
        break;
      case 'sw':
        offsetPosX += offsetX;
        offsetX = -offsetX;
        break;
      case 'ne':
        offsetPosY += offsetY;
        offsetY = -offsetY;
        break;
      case 'nw':
        offsetPosX += offsetX;
        offsetPosY += offsetY;
        offsetY = -offsetY;
        offsetX = -offsetX;
        break;
      }
      // handle .background element which is forced centered
      if(goog.dom.classlist.contains(follower, 'background')) {
        offsetX *= 2;
      }
      // compute new size
      var size = goog.style.getSize(follower);
      var borderBox = goog.style.getBorderBox(follower);
      var newSizeW = size.width + offsetX - borderBox.left - borderBox.right;
      var newSizeH = size.height + offsetY - borderBox.top - borderBox.bottom;
      // handle min size
      if (newSizeW < silex.model.Element.MIN_WIDTH) {
        if (resizeDirection === 'w' || resizeDirection === 'sw' || resizeDirection === 'nw') {
          offsetPosX -= silex.model.Element.MIN_WIDTH - newSizeW;
        }
        newSizeW = silex.model.Element.MIN_WIDTH;
      }
      if (newSizeH < silex.model.Element.MIN_HEIGHT) {
        if (resizeDirection === 'n' || resizeDirection === 'ne' || resizeDirection === 'nw') {
          offsetPosY -= silex.model.Element.MIN_HEIGHT - newSizeH;
        }
        newSizeH = silex.model.Element.MIN_HEIGHT;
      }
      // set position in case we are resizing up or left
      this.controller.stageController.styleChanged('top', offsetPosY + 'px', [follower]);
      this.controller.stageController.styleChanged('left', offsetPosX + 'px', [follower]);
      // apply the new size
      this.controller.stageController.styleChanged('width', newSizeW + 'px', [follower]);
      this.controller.stageController.styleChanged('height', newSizeH + 'px', [follower]);
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
  var initialSize = goog.style.getSize(element);
  this.initialRatio = initialSize.height / initialSize.width;
  this.initialPos = {x: x, y: y};
  this.initialScroll = {x: this.getScrollX(), y: this.getScrollY()};
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
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScrollElement().scrollLeft = value;
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollY = function(value) {
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScrollElement().scrollTop = value;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollX = function() {
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScroll().x;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollY = function() {
  var dh = new goog.dom.DomHelper(this.documentElement);
  return dh.getDocumentScroll().y;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxX = function() {
  var dh = new goog.dom.DomHelper(this.documentElement);
  return goog.style.getSize(dh.getDocumentScrollElement()).width;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxY = function() {
  var dh = new goog.dom.DomHelper(this.documentElement);
  return goog.style.getSize(dh.getDocumentScrollElement()).height;
};


/**
 * notify the controller that the properties of the selection have changed
 */
silex.view.Stage.prototype.propertyChanged = function() {
  // update property tool box
  this.controller.stageController.change();
};
