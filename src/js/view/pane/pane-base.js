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
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.pane.PaneBase');

/**
 * base class for all UI panes of the view.pane package
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.PaneBase = function (element, bodyElement, headElement) {
  // call super
  silex.view.ViewBase.call(this, element, headElement, bodyElement);

};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.PaneBase, silex.view.ViewBase);


/**
 * base url for relative/absolute urls
 */
silex.view.pane.PaneBase.prototype.baseUrl;


/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane
 */
silex.view.pane.PaneBase.prototype.selectBgImage = function() {
  if (this.onStatus) this.onStatus('selectBgImage');
};


/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane
 */
silex.view.pane.PaneBase.prototype.selectImage = function() {
  if (this.onStatus) this.onStatus('selectImage');
};


/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyPane
 */
silex.view.pane.PaneBase.prototype.editHTML = function() {
  if (this.onStatus) this.onStatus('editHTML');
};


/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyPane
 */
silex.view.pane.PaneBase.prototype.editText = function() {
  if (this.onStatus) this.onStatus('editText');
};


/**
 * notify the controller that the style changed
 */
silex.view.pane.PaneBase.prototype.styleChanged = function(styleName, styleValue) {
  // notify the controller
  if (this.onStatus) this.onStatus('styleChanged', styleName, styleValue);
  // redraw to reflect changes
  this.redraw();
};


/**
 * notify the controller that the component properties changed
 */
silex.view.pane.PaneBase.prototype.propertyChanged = function() {
  if (this.onStatus) this.onStatus('propertyChanged');
};


/**
 * refresh the displayed data
 */
silex.view.pane.PaneBase.prototype.redraw = function() {

};


/**
 * base url for abs/rel conversions
 */
silex.view.pane.PaneBase.prototype.getBaseUrl = function() {
  return this.baseUrl;
};


/**
 * base url for abs/rel conversions
 */
silex.view.pane.PaneBase.prototype.setBaseUrl = function(url) {
  this.baseUrl = url;
  this.redraw();
};

