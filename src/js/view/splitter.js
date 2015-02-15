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
 * @fileoverview
 * splitter to resize the UI
 *
 */


goog.provide('silex.view.Splitter');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.Splitter = function(element, model, controller) {
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
   * width of the splitter, as defined in the CSS
   * @static
   * @type {number}
   */
  silex.view.Splitter.WIDTH = 5;
  /**
   * @type {Array.<Element>}
   */
  this.onTheLeft = [];
  /**
   * @type {Array.<Element>}
   */
  this.onTheRight = [];
  /**
   * true when the mouse is down
   * @type {boolean}
   */
  this.isDown = false;
  /**
   * @type {HTMLIFrameElement}
   */
  this.iframeElement = /** @type {HTMLIFrameElement} */ (goog.dom.getElementByClass(silex.view.Stage.STAGE_CLASS_NAME));

  // mouse down event
  goog.events.listen(this.element, 'mousedown', this.onMouseDown, false, this);

  // store the window viewport for later use
  this.viewport = new goog.dom.ViewportSizeMonitor();

  // handle window resize event
  goog.events.listen(this.viewport, goog.events.EventType.RESIZE, this.redraw, false, this);
};


/**
 * add a component to split
 * @param {Element} element
 */
silex.view.Splitter.prototype.addLeft = function(element) {
  this.onTheLeft.push(element);
  this.redraw();
};


/**
 * add a component to split
 * @param {Element} element
 */
silex.view.Splitter.prototype.addRight = function(element) {
  this.onTheRight.push(element);
  this.redraw();
};


/**
 * remove a component to split
 * @param {Element} element
 */
silex.view.Splitter.prototype.remove = function(element) {
  goog.array.remove(this.onTheRight, element);
  element.style.left = '';
  element.style.right = '';
  this.redraw();
};


/**
 * redraw the components
 */
silex.view.Splitter.prototype.redraw = function() {
  var pos = goog.style.getClientPosition(this.element);
  var parentSize =  goog.style.getContentBoxSize(/** @type {Element} */ (this.element.parentNode));
  // apply the position to the elements
  goog.array.forEach(this.onTheLeft, function(element) {
    element.style.right = (parentSize.width - pos.x) + 'px';
  }, this);
  goog.array.forEach(this.onTheRight, function(element) {
    element.style.left = silex.view.Splitter.WIDTH + pos.x + 'px';
  }, this);
};


/**
 * handle mouse event
 * @param {Event} e
 */
silex.view.Splitter.prototype.onMouseDown = function(e) {
  e.preventDefault();
  this.isDown = true;

  // listen mouse events
  var contentWindow = goog.dom.getFrameContentWindow(this.iframeElement);
  goog.events.listen(contentWindow,
      'mousemove',
      this.onMouseMoveFrame,
      false,
      this);
  goog.events.listen(contentWindow,
      'mouseup',
      this.onMouseUp,
      true,
      this);
  goog.events.listen(document.body,
      'mouseup',
      this.onMouseUp,
      false,
      this);
  goog.events.listen(document.body,
      'mousemove',
      this.onMouseMove,
      false,
      this);
};


/**
 * handle mouse event
 * @param {Event} e
 */
silex.view.Splitter.prototype.onMouseUp = function(e) {
  e.preventDefault();
  this.isDown = false;

  // stop listening
  var contentWindow = goog.dom.getFrameContentWindow(this.iframeElement);
  goog.events.unlisten(contentWindow,
      'mousemove',
      this.onMouseMoveFrame,
      false,
      this);
  goog.events.unlisten(contentWindow,
      'mouseup',
      this.onMouseUp,
      true,
      this);
  goog.events.unlisten(document.body,
      'mouseup',
      this.onMouseUp,
      false,
      this);
  goog.events.unlisten(document.body,
      'mousemove',
      this.onMouseMove,
      false,
      this);
};


/**
 * handle mouse event of the iframe
 * @param {Event} e
 */
silex.view.Splitter.prototype.onMouseMoveFrame = function(e) {
  if(this.isDown) {
    var parentSize =  goog.style.getContentBoxSize(/** @type {Element} */ (this.element.parentNode));
    var pos = goog.style.getClientPosition(e);
    var posIFrame = goog.style.getClientPosition(this.iframeElement);
    this.element.style.right = (parentSize.width - pos.x - posIFrame.x)  + 'px';
    this.redraw();
  }
};


/**
 * handle mouse event
 * @param {Event} e
 */
silex.view.Splitter.prototype.onMouseMove = function(e) {
  if(this.isDown) {
    var parentSize =  goog.style.getContentBoxSize(/** @type {Element} */ (this.element.parentNode));
    var pos = goog.style.getClientPosition(e);
    this.element.style.right = (parentSize.width - pos.x) + 'px';
    this.redraw();
  }
};

