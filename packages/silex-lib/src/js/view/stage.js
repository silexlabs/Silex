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


  /**
   * invalidation mechanism
   * @type {InvalidationManager}
   */
  this.invalidationManagerScroll = new InvalidationManager(100);


  /**
   * invalidation mechanism
   * @type {InvalidationManager}
   */
  this.invalidationManagerFocus = new InvalidationManager(500);

  /**
   * @type {!HTMLIFrameElement}
   */
  this.iframeElement = /** @type {!HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));
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
 * number of pixels to scroll at each animation frame
 * the bigger the faster I will scroll to the target
 * @type {number}
 */
silex.view.Stage.SCROLL_STEPS = 100;


/**
 * the Window of the iframe which contains the website
 */
silex.view.Stage.prototype.contentWindow = null;


/**
 * the document of the iframe which contains the website
 */
silex.view.Stage.prototype.contentDocument = null;


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
silex.view.Stage.prototype.pendingMM = 0;


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

  // listen on the element containing the stage too
  // because in mobile editor, it is visible
  // and should let the user reset selection
  goog.events.listen(this.element,
      'mousedown',
      this.onMouseDownOverStageBg,
      false,
      this);

  // keyboard
  let keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, 'key', goog.bind(this.handleKey, this));
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and move the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseMoveOverUi = function(event) {
  var pos = goog.style.getRelativePosition(event, this.iframeElement);
  this.onMouseMove(/** @type {Element} */ (event.target), pos.x, pos.y, event.shiftKey);
  event.preventDefault();
};


/**
 * Forward mouse release from the tool boxes to the stage
 * Because user can drag something and release the mouse over the tool boxes
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseUpOverUi = function(event) {

  if (this.bodyElement !== null) {
    // if out of stage, release from drag of the plugin
    // simulate the mouse up on the iframe body
    var pos = goog.style.getRelativePosition(event, this.iframeElement);
    var newEvObj = document.createEvent('MouseEvent');
    newEvObj.initEvent('mouseup', true, true);
    newEvObj.clientX = pos.x;
    newEvObj.clientY = pos.y;
    this.iAmClicking = true;
    this.bodyElement.dispatchEvent(newEvObj);
    this.iAmClicking = false;
  }
};


/**
 * Reset selection and focus
 * Because user can clickon the stage bg in mobile mode
 * to empty selection
 * @param {Event} event
 */
silex.view.Stage.prototype.onMouseDownOverStageBg = function(event) {
  if (this.bodyElement !== null) {
    this.controller.stageController.selectNone();
  }
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
 * @param {Window} contentWindow the window instance of the iframe which contains the site
 */
silex.view.Stage.prototype.initEvents = function(contentWindow) {
  this.bodyElement = contentWindow.document.body;
  this.contentDocument = contentWindow.document;
  this.contentWindow = contentWindow;

  // listen on body instead of element because user can release
  // on the tool boxes
  goog.events.listen(this.bodyElement, 'mouseup', function(event) {
    let x = event.clientX;
    let y = event.clientY;
    this.handleMouseUp(event.target, x, y, event.shiftKey);
  }, false, this);

  // move in the iframe
  goog.events.listen(this.bodyElement, 'mousemove', function(event) {
    let x = event.clientX;
    let y = event.clientY;
    this.onMouseMove(/** @type {Element} */ (event.target), x, y, event.shiftKey);
    event.preventDefault();
  }, false, this);

  // detect mouse down
  goog.events.listen(this.bodyElement, 'mousedown', function(event) {
    this.lastClickWasResize = goog.dom.classlist.contains(
        event.target,
        'ui-resizable-handle');
    this.resizeDirection = this.getResizeDirection(event.target);
    let x = event.clientX;
    let y = event.clientY;
    // get the first parent node which is editable (silex-editable css class)
    let editableElement = goog.dom.getAncestorByClass(
        event.target,
        silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
    try {
      // in firefox, this is needed to keep recieving events while dragging outside the iframe
      // in chrome this will throw an error
      editableElement.setCapture();
    }
    catch(e) {}
    // handle the mouse event
    this.handleMouseDown(editableElement, x, y, event.shiftKey);
    // necessary in firefox to prevent default image drag
    event.preventDefault();
  }, false, this);

  // detect double click
  goog.events.listen(
    this.bodyElement,
    goog.events.EventType.DBLCLICK,
    function(event) {
      this.controller.editMenuController.editElement();
    }, false, this);
};


/**
 * redraw the properties
 * @param   {Array.<HTMLElement>} selectedElements the selected elements
 * @param   {Array.<string>} pageNames   the names of the pages
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Stage.prototype.redraw =
    function(selectedElements, pageNames, currentPageName) {
  // reset focus out of the text inputs,
  // this also prevents a bug when the page is loaded and the user presses a key,
  // the body is replaced by the keys chars
  this.resetFocus();
  // remember selection
  this.selectedElements = selectedElements;
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
    // mobile mode or selection contains only sections elements
    if(this.isMobileMode() ||
      (this.selectedElements && this.selectedElements.reduce((prev, cur) => prev &&
        (this.model.element.isSection(cur) ||
          this.model.element.isSectionContent(cur)), true))) {
      // move the elements in the dom
      let tookAction = true;
      switch (event.keyCode) {
        case goog.events.KeyCodes.LEFT:
          this.controller.editMenuController.moveToTop();
        break;
        case goog.events.KeyCodes.RIGHT:
          this.controller.editMenuController.moveToBottom();
        break;
        case goog.events.KeyCodes.UP:
          this.controller.editMenuController.moveUp()
        break;
        case goog.events.KeyCodes.DOWN:
          this.controller.editMenuController.moveDown()
        break;
        case goog.events.KeyCodes.ESC:
          this.controller.stageController.selectNone();
        break;
        default:
          tookAction = false;
      }
      // scroll to the moving element
      if(tookAction) {
        this.setScrollTarget(this.selectedElements[0]);
      }
    }
    else {
      // compute the number of pixels to move
      let amount = 10;
      if (event.shiftKey === true) {
        amount = 1;
      }
      if (event.altKey === true) {
        // this is the bring forward/backward shortcut
        return;
      }
      // compute the direction
      let offsetX = 0;
      let offsetY = 0;
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
        case goog.events.KeyCodes.ESC:
          this.controller.stageController.selectNone();
        break;
      }
      // if there is something to move
      if (offsetX !== 0 || offsetY !== 0) {
        // mark as undoable
        this.controller.stageController.markAsUndoable();
        // apply the offset
        this.moveElements(this.selectedElements, offsetX, offsetY);
        // prevent default behavior for this key
        event.preventDefault();
      }
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
  // if click down was not on the UI, do nothing
  // this can happen when the user selects text in the property tool box and releases outside the tool box
  if (!this.isDown) {
    return;
  }
  // give focus to the stage
  this.resetFocus();
  // update state
  this.isDown = false;
  // handle the mouse up
  if (this.isDragging) {
    // reset dropzone marker
    this.markAsDropZone(null);
    // new container
    let dropZone = this.getDropZone(x, y, true) || {'element': this.bodyElement, 'zIndex': 0};
    // move all selected elements to the new container
    this.selectedElements
    .filter(element => element !== this.bodyElement)
    .forEach(element => {
      if (!goog.dom.getAncestorByClass(element.parentNode, silex.model.Element.SELECTED_CLASS_NAME) &&
         !goog.dom.classlist.contains(element, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME)) {
        this.controller.stageController.newContainer(dropZone.element, element);
      }
      this.cleanupElement(element);
    });
    // change z order
    //this.bringSelectionForward();
  }
  // handle selection
  if (this.isDragging || this.isResizing) {
    // update property tool box
    this.propertyChanged();
    // keep flags up to date
    this.isDragging = false;
    this.isResizing = false;
    // remove dragging style
    const dragged = this.bodyElement.querySelectorAll('.' + silex.model.Body.DRAGGING_CLASS_NAME);
    for (let idx = 0, el = null; el = dragged[idx]; ++idx) {
      el.classList.remove(silex.model.Body.DRAGGING_CLASS_NAME);
    }
  }
  // if not dragging, and on stage, then change selection
  else if (this.iAmClicking !== true) {
    // get the first parent node which is editable (silex-editable css class)
    let editableElement = goog.dom.getAncestorByClass(
        target,
        silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;

    // single or multiple selection
    if (shiftKey === true) {
      // if the element is selected, then unselect it
      if (this.lastSelected !== editableElement) {
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
      let hasChanged = (this.selectedElements.length === 1 &&
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
  this.invalidationManagerFocus.callWhenReady(() => {
    this.focusInput.focus();
    this.focusInput.blur();
  });
};


/**
 * bring the selection forward
 */
silex.view.Stage.prototype.bringSelectionForward = function() {
  goog.array.forEach(this.selectedElements, function(element) {
    let container = element.parentNode;
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
    // update property tool box
    this.propertyChanged();
    // case of a drag directly after mouse down (select + drag)
    if (this.lastSelected === null) {
      let editableElement = goog.dom.getAncestorByClass(
          target, silex.model.Body.EDITABLE_CLASS_NAME) || this.bodyElement;
      this.lastSelected = editableElement;
    }
    // update states
    if (!this.isDragging && !this.isResizing) {
      if(Math.abs(this.initialPos.x - x) + Math.abs(this.initialPos.y - y) < 5) {
        // do nothing while the user has not dragged more than 5 pixels
        return;
      }
      // notify controller that a change is about to take place
      // marker for undo/redo
      this.controller.stageController.markAsUndoable();
      // store the state for later use
      if (this.lastClickWasResize) {
        this.isResizing = true;
      }
      else {
        // switch to dragging state
        this.isDragging = true;
        this.selectedElements
        .filter(element => element !== this.bodyElement && !element.classList.contains(silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME))
        .forEach(element => {
          // move to the body so that it is above everything
          // move back to the same x, y position
          // var elementPos = element.getBoundingClientRect();
          var elementPos = goog.style.getPageOffset(element);
          // apply new position
          element.style.left = elementPos.x + 'px';
          element.style.top = elementPos.y + 'px';
          // attache to body
          this.bodyElement.appendChild(element);
          // dragging style
          element.classList.add(silex.model.Body.DRAGGING_CLASS_NAME);
        });
      }
    }

    // do MouseMove is a function which will be called while the user holds the mouse button down
    // even if the mouse do not move
    // this is useful when holding an element near the border of the stage, to keep scrolling
    var pendingMM = ++this.pendingMM;
    function doMM(me) {
      if(me.pendingMM === pendingMM && (me.isDragging || me.isResizing)) {
        // update multiple selection according the the dragged element
        me.multipleDragged(x, y, shiftKey);

        // update scroll when mouse is near the border
        me.updateScroll(x, y);

        // update body size with the front-end.js API
        me.contentWindow['resizeBody']();

        // loop while the mouse has not moved
        requestAnimationFrame(() => doMM(me));
      }
    }
    doMM(this);
  }
};


/**
 * add a css class to the drop zone
 * and remove from non dropzones
 * @param {?Element=} opt_element to be marked
 */
silex.view.Stage.prototype.markAsDropZone = function(opt_element) {
  let els = goog.dom.getElementsByClass(silex.model.Body.DROP_CANDIDATE_CLASS_NAME, /** @type {Element|null} */ (this.bodyElement.parentNode));
  goog.array.forEach(els, (event) => goog.dom.classlist.remove(/** @type {Element} */ (event), silex.model.Body.DROP_CANDIDATE_CLASS_NAME));
  if (opt_element) {
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
 * @param {?boolean=} opt_preventSelected   will not considere the selected elements and their content as a potential drop zone,
 *                                          which is useful to prevent drop into the element being dragged
 *                                          default is false
 * @param {?Element=} opt_container   element into which to seach for the dropzone, by default the body
 * @return {{element: ?Element, zIndex: number}}  if not null this is the drop zone under the mouse cursor
 *                                              zIndex being the highest z-index encountered while browsing children
 * TODO: use `pointer-events: none;` to get the dropzone with mouse events, or  `Document.elementsFromPoint()`
 */
silex.view.Stage.prototype.getDropZone = function(x, y, opt_preventSelected, opt_container) {
  // default value
  let container = opt_container || this.bodyElement;
  let children = goog.dom.getChildren(container);
  let topMost = null;
  let zTopMost = 0;
  // find the best drop zone
  for (let idx = 0; idx < children.length; idx++) {
    let element = children[idx];
    if (goog.dom.classlist.contains(element, 'container-element') &&
      !goog.dom.classlist.contains(element, silex.model.Body.PREVENT_DROPPABLE_CLASS_NAME) &&
      !(opt_preventSelected === true && goog.dom.classlist.contains(element, 'silex-selected')) &&
      this.getVisibility(element)
      ) {
        let bb = goog.style.getBounds(element);
        let scrollX = this.getScrollX();
        let scrollY = this.getScrollY();
        if (bb.left < x + scrollX && bb.left + bb.width > x + scrollX &&
            bb.top < y + scrollY && bb.top + bb.height > y + scrollY) {
              let candidate = this.getDropZone(x, y, opt_preventSelected, element);
              // if zIndex is 0 then there is no value to css zIndex, considere the DOM order
              if (candidate.element) {
                let zIndex = goog.style.getComputedZIndex(element);
                if (zIndex === 'auto') {
                  zIndex = 0;
                }
                if (zIndex >= zTopMost) {
                  topMost = candidate;
                  zTopMost = zIndex;
                  // keep track of the highest z-index in for the given result
                  if (zIndex > candidate.zIndex) {
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
silex.view.Stage.prototype.getVisibility = function(element) {
  /** @type {?Element} */
  let parent = /** @type {?Element} */ (element);
  while (parent &&
         (!goog.dom.classlist.contains(/** @type {Element} */ (parent), silex.model.Page.PAGED_CLASS_NAME) ||
          goog.dom.classlist.contains(/** @type {Element} */ (parent), this.currentPageName)) &&
         !(this.isMobileMode() && goog.dom.classlist.contains(/** @type {Element} */ (parent), 'hide-on-mobile'))
   ) {
    parent = /** @type {?Element} */ (parent.parentNode);
  }
  return parent === null;
};


/**
 * @return {{width, height}} the size of the stage
 */
silex.view.Stage.prototype.getStageSize = function() {
  return goog.style.getSize(this.element)
}


/**
 * Handle the case where mouse is near a border of the stage
 * and an element is being dragged
 * Then scroll accordingly
 * @param   {number} x position of the mouse, relatively to the screen
 * @param   {number} y position of the mouse, relatively to the screen
 */
silex.view.Stage.prototype.updateScroll = function(x, y) {
  this.invalidationManagerScroll.callWhenReady(() => {
    let iframeSize = this.getStageSize();
    let scrollX = this.getScrollX();
    let scrollY = this.getScrollY();
    if (x < 100) {
      this.setScrollX(scrollX - 100);
    }
    else if (x > iframeSize.width - 100) {
      this.setScrollX(scrollX + 100);
    }
    if (y < 100) {
      this.setScrollY(scrollY - 100);
    }
    else if (y > iframeSize.height - 100) {
      this.setScrollY(scrollY + 100);
    }
  });
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
  let scrollX = this.getScrollX();
  let scrollY = this.getScrollY();

  // follow the mouse (this means that the element dragged by the editable plugin
  // is handled here, which overrides the behavior of the plugin
  // (this is because we take the body scroll into account, and the parent's scroll too)
  let followers = this.selectedElements;
  // drag or resize
  if (this.isDragging || this.resizeDirection === null) {
    // det the drop zone under the cursor
    let dropZone = this.getDropZone(x, y, true) || {'element': this.bodyElement, 'zIndex': 0};
    // handle the css class applyed to the dropzone
    this.markAsDropZone(dropZone.element);

    // handle shift key to move on one axis or preserve ratio
    if (shiftKey === true) {
      if (Math.abs((this.initialPos.x + this.initialScroll.x) - (x + scrollX)) < Math.abs((this.initialPos.y + this.initialScroll.y) - (y + scrollY))) {
        x = this.initialPos.x + this.initialScroll.x - scrollX;
      }
      else {
        y = this.initialPos.y + this.initialScroll.y - scrollY;
      }
    }
    let offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
    let offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
    this.followElementPosition(followers, offsetX, offsetY);
  }
  else if (this.isResizing) {
    // handle shift key to move on one axis or preserve ratio
    if (shiftKey === true &&
      (this.resizeDirection === 'sw' ||
          this.resizeDirection === 'se' ||
          this.resizeDirection === 'nw' ||
          this.resizeDirection === 'ne'
    )) {
      let width = x - this.initialPos.x;
      if (this.resizeDirection === 'ne' || this.resizeDirection === 'sw') {
        width = -width;
      }
      y = (this.initialPos.y) + (width * this.initialRatio);
    }
    let offsetX = x - this.lastPosX + (scrollX - this.lastScrollLeft);
    let offsetY = y - this.lastPosY + (scrollY - this.lastScrollTop);
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
    if (follower.tagName.toUpperCase() !== 'BODY' &&
      !this.isMobileMode() &&
      !goog.dom.getAncestorByClass(follower.parentNode, silex.model.Element.SELECTED_CLASS_NAME) &&
      !goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME)) {
        // do not do this anymore because the element is moved to the body during drag so its position is wrong:
        // update the toolboxes to display the position during drag
        // let pos = goog.style.getPosition(follower);
        // let finalY = Math.round(pos.y + offsetY);
        // let finalX = Math.round(pos.x + offsetX);
        // this.controller.stageController.styleChanged('top', finalY + 'px', [follower], false);
        // this.controller.stageController.styleChanged('left', finalX + 'px', [follower], false);
        // move the element
        let pos = goog.style.getPosition(follower);
        let left = parseInt(follower.style.left, 10) || pos.x;
        let top = parseInt(follower.style.top, 10) || pos.y;
        follower.style.left = (left + offsetX) + 'px';
        follower.style.top = (top + offsetY) + 'px';
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
    if (follower.tagName.toUpperCase() !== 'BODY' &&
      !goog.dom.classlist.contains(follower, silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME)) {
      var pos = goog.style.getPosition(follower);
      var offsetPosX = pos.x;
      var offsetPosY = pos.y;
      var offsetSizeX = offsetX;
      var offsetSizeY = offsetY;
      // depending on the handle which is dragged,
      // only width and/or height should be set
      switch (resizeDirection) {
      case 's':
        offsetSizeX = 0;
        break;
      case 'n':
        offsetPosY += offsetSizeY;
        offsetSizeY = -offsetSizeY;
        offsetSizeX = 0;
        break;
      case 'w':
        offsetPosX += offsetSizeX;
        offsetSizeX = -offsetSizeX;
        offsetSizeY = 0;
        break;
      case 'e':
        offsetSizeY = 0;
        break;
      case 'se':
        break;
      case 'sw':
        offsetPosX += offsetSizeX;
        offsetSizeX = -offsetSizeX;
        break;
      case 'ne':
        offsetPosY += offsetSizeY;
        offsetSizeY = -offsetSizeY;
        break;
      case 'nw':
        offsetPosX += offsetSizeX;
        offsetPosY += offsetSizeY;
        offsetSizeY = -offsetSizeY;
        offsetSizeX = -offsetSizeX;
        break;
      }
      const size = goog.style.getSize(follower);
      const borderBox = goog.style.getBorderBox(follower);
      const style = this.contentWindow.getComputedStyle(follower);
      const paddingBox = {
        left: parseInt(style.paddingLeft, 10),
        right: parseInt(style.paddingRight, 10),
        top: parseInt(style.paddingTop, 10),
        bottom: parseInt(style.paddingBottom, 10),
      };
      // handle section content elements which are forced centered
      // (only when the background is smaller than the body)
      // TODO in a while: remove support of .background since it is now a section
      if((follower.classList.contains(silex.view.Stage.BACKGROUND_CLASS_NAME) ||
        this.model.element.isSectionContent(follower)) &&
        size.width < this.bodyElement.offsetWidth - 50) {
        offsetSizeX *= 2;
      }
      // compute new size
      var newSizeW = size.width + offsetSizeX - borderBox.left - paddingBox.left - borderBox.right - paddingBox.right;
      var newSizeH = size.height + offsetSizeY - borderBox.top - paddingBox.top - borderBox.bottom - paddingBox.bottom;
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
      this.controller.stageController.styleChanged('top', Math.round(offsetPosY) + 'px', [follower], false);
      this.controller.stageController.styleChanged('left', Math.round(offsetPosX) + 'px', [follower], false);
      // apply the new size
      this.controller.stageController.styleChanged('width', Math.round(newSizeW) + 'px', [follower], false);
      this.controller.stageController.styleChanged(this.model.element.getHeightStyleName(follower), Math.round(newSizeH) + 'px', [follower], false);
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
  let initialSize = goog.style.getSize(element);
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
 * @return {?string}
 */
silex.view.Stage.prototype.getResizeDirection = function(target) {
  if (goog.dom.classlist.contains(target, 'ui-resizable-s')) {
    return 's';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-n')) {
    return 'n';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-e')) {
    return 'e';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-w')) {
    return 'w';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-se')) {
    return 'se';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-sw')) {
    return 'sw';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-ne')) {
    return 'ne';
  } else if (goog.dom.classlist.contains(target, 'ui-resizable-nw')) {
    return 'nw';
  }
  // Target is not a resize handle
  return null;
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollX = function(value) {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  dh.getDocumentScrollElement().scrollLeft = value;
};


/**
 * get the scroll property, working around cross browser issues
 * @param {number} value to be set
 */
silex.view.Stage.prototype.setScrollY = function(value) {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  dh.getDocumentScrollElement().scrollTop = value;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollX = function() {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  return dh.getDocumentScroll().x;
};


/**
 * get the scroll property, working around cross browser issues
 * FIXME: no need for getScrollX and getScrollY, should be getScroll which returns coords
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollY = function() {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  return dh.getDocumentScroll().y;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxX = function() {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  return goog.style.getSize(dh.getDocumentScrollElement()).width;
};


/**
 * get the scroll property, working around cross browser issues
 * @return {number} the value
 */
silex.view.Stage.prototype.getScrollMaxY = function() {
  let dh = new goog.dom.DomHelper(this.contentDocument);
  return goog.style.getSize(dh.getDocumentScrollElement()).height;
};


/**
 * notify the controller that the properties of the selection have changed
 */
silex.view.Stage.prototype.propertyChanged = function() {
  // update property tool box
  this.controller.stageController.updateView();
};


/**
 * reset 1 element properties since they are stored in the CSS by the model
 */
silex.view.Stage.prototype.cleanupElement = function(element) {
  element.style.top = '';
  element.style.left = '';
};


/**
 * Move the selected elements in the DOM
 * This is a convenience method which does as if the elements where dragged
 */
silex.view.Stage.prototype.moveElements = function(elements, offsetX, offsetY) {
  // just like when mouse moves
  this.followElementPosition(elements, offsetX, offsetY);
  // notify the controller
  this.propertyChanged();
  // reset elements properties since they are stored in the CSS by the model
  elements.forEach((element) => {
    this.controller.stageController.styleChanged('top', element.style.top, [element], false);
    this.controller.stageController.styleChanged('left', element.style.left, [element], false);
    this.cleanupElement(element);
  });
};


/**
 * helper for other views,
 * because views (view.workspace.get/setMobileEditor) is not accessible from other views
 * FIXME: find another way to expose isMobileEditor to views
 */
silex.view.Stage.prototype.isMobileMode = function() {
  return goog.dom.classlist.contains(document.body, 'mobile-mode');
};


/**
 * @param  {Element}  element in the DOM to wich I am scrolling
 */
silex.view.Stage.prototype.setScrollTarget = function(element) {
  if(element !== this.bodyElement) {
    const previousTarget = this.scrollTarget;
    this.scrollTarget = element;
    if(!previousTarget) {
      // start scrolling
      // not right away because the element will not be attached to the dom yet
      requestAnimationFrame(() => this.startScrolling());
    }
  }
};


/**
 * scroll until the scroll target is reached
 */
silex.view.Stage.prototype.startScrolling = function() {
  if(this.scrollTarget) {
    // det the next scroll step
    const prevScroll = this.getScrollY();
    const bb = goog.style.getBounds(this.scrollTarget);
    const iframeSize = this.getStageSize();
    const scrollCentered = bb.top - Math.round(iframeSize.height/2);
    // const nextStep = Math.round((bb.top - prevScroll) / silex.view.Stage.SCROLL_STEPS);
    let nextStep;
    if(Math.abs(scrollCentered - prevScroll) < silex.view.Stage.SCROLL_STEPS) {
      nextStep = scrollCentered;
    }
    else if(scrollCentered > prevScroll) {
      nextStep = prevScroll + silex.view.Stage.SCROLL_STEPS;
    }
    else {
      nextStep = prevScroll - silex.view.Stage.SCROLL_STEPS;
    }
    this.setScrollY(nextStep);
    // check if the scrolling target is reached
    const newScroll = this.getScrollY();
    if(newScroll === prevScroll || newScroll === scrollCentered) {
      this.scrollTarget = null;
    }
    else {
      requestAnimationFrame(() => this.startScrolling());
    }
  }
};
