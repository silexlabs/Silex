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
 * @fileoverview Property pane, displayed in the property tool box
 *
 */


goog.require('silex.view.pane.PaneBase');
goog.provide('silex.view.pane.PropertyPane');

goog.require('silex.utils.Dom');

goog.require('goog.array');
goog.require('goog.object');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.PropertyPane = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  this.buildUi();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.PropertyPane, silex.view.pane.PaneBase);

/**
 * callback to call to let the user edit the image url
 */
silex.view.pane.PropertyPane.prototype.selectImage;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.leftInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.topInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.widthInput;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.heightInput;


/**
 * UI for position and size
 *
silex.view.pane.PropertyPane.prototype.rightInput;


/**
 * UI for position and size
 *
silex.view.pane.PropertyPane.prototype.bottomInput;


/**
 * UI for position and size
 *
silex.view.pane.PropertyPane.prototype.zIndexInput;


/**
 * build the UI
 */
silex.view.pane.PropertyPane.prototype.buildUi = function() {

  // position and size
  this.leftInput = goog.dom.getElementByClass('left-input');
  this.leftInput.setAttribute('data-style-name', 'left');
  this.leftInput.setAttribute('data-style-unit', 'px');
  goog.events.listen(this.leftInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.widthInput = goog.dom.getElementByClass('width-input');
  this.widthInput.setAttribute('data-style-name', 'width');
  this.widthInput.setAttribute('data-style-unit', 'px');
  goog.events.listen(this.widthInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.topInput = goog.dom.getElementByClass('top-input');
  this.topInput.setAttribute('data-style-name', 'top');
  this.topInput.setAttribute('data-style-unit', 'px');
  goog.events.listen(this.topInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.heightInput = goog.dom.getElementByClass('height-input');
  this.heightInput.setAttribute('data-style-name', 'height');
  this.heightInput.setAttribute('data-style-unit', 'px');
  goog.events.listen(this.heightInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
};


/**
 * position or size changed
 * callback for number inputs
 */
silex.view.pane.PropertyPane.prototype.onPositionChanged =
    function(e) {
  // get the selected element
  var element = this.getSelection()[0];
  var input = e.target;
  if (input.value && input.value!=''){
    this.styleChanged(input.getAttribute('data-style-name'),
      input.value + input.getAttribute('data-style-unit'));
  }
  else{
    this.styleChanged(input.getAttribute('data-style-name'));
  }
};


/**
 * redraw the properties
 */
silex.view.pane.PropertyPane.prototype.redraw = function() {
  if (this.iAmSettingValue) return;
  // call super
  goog.base(this, 'redraw');

  // get the selected elements
  var elements = this.getSelection();
  var bb = silex.utils.Dom.getBoundingBox(elements);

  // display position and size
  this.topInput.value = bb.top;
  this.leftInput.value = bb.left;
  this.widthInput.value = bb.width;
  this.heightInput.value = bb.height;
};
