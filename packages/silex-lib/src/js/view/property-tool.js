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
 * @fileoverview This class handles the property panes,
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.PropertyTool');

goog.require('silex.view.pane.BgPane');
goog.require('silex.view.pane.BorderPane');
goog.require('silex.view.pane.PropertyPane');
goog.require('silex.view.pane.PagePane');
goog.require('silex.view.pane.GeneralStylePane');
goog.require('silex.view.pane.StylePane');

goog.require('goog.array');
goog.require('goog.cssom');
goog.require('goog.editor.Field');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabBar');



//////////////////////////////////////////////////////////////////
// PropertyTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertyTool class handles the panes actually displaying the properties
 * @constructor
 * @extend silex.view.ViewBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.PropertyTool = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  this.buildPanes();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.PropertyTool, silex.view.ViewBase);


/**
 * base url for relative/absolute urls
 */
silex.view.PropertyTool.prototype.baseUrl;


/**
 * bg editor
 * @see     silex.view.pane.BgPane
 */
silex.view.PropertyTool.prototype.bgPane;


/**
 * property editor
 * @see     silex.view.pane.PropertyPane
 */
silex.view.PropertyTool.prototype.propertyPane;


/**
 * editor
 * @see     silex.view.pane.BorderPane
 */
silex.view.PropertyTool.prototype.borderPane;


/**
 * property editor
 * @see     silex.view.pane.PagePane
 */
silex.view.PropertyTool.prototype.pagePane;


/**
 * property editor
 * @see     silex.view.pane.GeneralStylePane
 */
silex.view.PropertyTool.prototype.generalStylePane;


/**
 * property editor
 * @see     silex.view.pane.StylePane
 */
silex.view.PropertyTool.prototype.stylePane;



/**
 * build the UI
 */
silex.view.PropertyTool.prototype.buildPanes = function() {
  // create a binded callback for allpanes
  var onStatusCbk = goog.bind(function (type, opt_styleName, opt_styleValue)
    {
      this.onStatus(type, opt_styleName, opt_styleValue);
    }, this
  );

  // background
  this.bgPane = new silex.view.pane.BgPane(
      goog.dom.getElementByClass('background-editor', this.element),
      this.bodyElement, this.headElement);

  this.bgPane.onStatus = onStatusCbk;

  // border
  this.borderPane = new silex.view.pane.BorderPane(
      goog.dom.getElementByClass('border-editor', this.element),
      this.bodyElement, this.headElement);

  this.borderPane.onStatus = onStatusCbk;

  // property
  this.propertyPane = new silex.view.pane.PropertyPane(
      goog.dom.getElementByClass('property-editor', this.element),
      this.bodyElement, this.headElement);

  this.propertyPane.onStatus = onStatusCbk;

  // page
  this.pagePane = new silex.view.pane.PagePane(
      goog.dom.getElementByClass('page-editor', this.element),
      this.bodyElement, this.headElement);

  this.pagePane.onStatus = onStatusCbk;

  // general styles
  this.generalStylePane = new silex.view.pane.GeneralStylePane(
      goog.dom.getElementByClass('general-editor', this.element),
      this.bodyElement, this.headElement);

  this.generalStylePane.onStatus = onStatusCbk;

  // silex styles
  this.stylePane = new silex.view.pane.StylePane(
      goog.dom.getElementByClass('style-editor', this.element),
      this.bodyElement, this.headElement);

  this.stylePane.onStatus = onStatusCbk;

};


/**
 * redraw all panes
 */
silex.view.PropertyTool.prototype.redraw = function() {
  this.borderPane.redraw();
  this.propertyPane.redraw();
  this.pagePane.redraw();
  this.generalStylePane.redraw();
  this.stylePane.redraw();
  this.bgPane.redraw();
};


/**
 * base url for abs/rel conversions
 */
silex.view.PropertyTool.prototype.getBaseUrl = function() {
  return this.baseUrl;
};


/**
 * base url for abs/rel conversions
 */
silex.view.PropertyTool.prototype.setBaseUrl = function(url) {
  // store the new base url
  this.baseUrl = url;

  // update base url, which will redraw all panes
  this.borderPane.setBaseUrl(url);
  this.propertyPane.setBaseUrl(url);
  this.pagePane.setBaseUrl(url);
  this.generalStylePane.setBaseUrl(url);
  this.stylePane.setBaseUrl(url);
  this.bgPane.setBaseUrl(url);
};


