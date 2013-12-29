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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */


goog.require('silex.view.pane.PaneBase');
goog.provide('silex.view.pane.GeneralStylePane');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.TabBar');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.BorderPane = function(element, headElement, bodyElement) {
  // call super
  goog.base(this, element, headElement, bodyElement);

  this.buildUi();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.BgPane, silex.view.pane.PaneBase);


/**
 * opacity input
 */
silex.view.pane.GeneralStylePane.prototype.opacityInput;


/**
 * build the UI
 */
silex.view.pane.GeneralStylePane.prototype.buildUi = function() {
  // opacity
  this.opacityInput = goog.dom.getElementByClass('opacity-input');
  goog.events.listen(this.opacityInput, 'change', this.onInputChanged, false, this);
};


/**
 * redraw the properties
 */
silex.view.pane.GeneralStylePane.prototype.redraw = function() {
  // call super
  goog.base(this, 'redraw');

  // get the selected element
  var element = this.getSelection()[0];

  if (element){

    if (element.style.opacity) {
      this.opacityInput.value = element.style.opacity;
    }
    else {
      this.opacityInput.value = '';
    }
  }
};


/**
 * User has selected a color
 */
silex.view.pane.GeneralStylePane.prototype.onInputChanged = function(event) {
  if (this.opacityInput.value && this.opacityInput.value !== '') {
    this.styleChanged('opacity', this.opacityInput.value);
  }
  else {
    this.styleChanged('opacity');
  }
};
