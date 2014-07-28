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


goog.provide('silex.view.PropertyTool');

goog.require('goog.array');
goog.require('goog.cssom');
goog.require('goog.editor.Field');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabBar');
goog.require('silex.view.pane.BgPane');
goog.require('silex.view.pane.BorderPane');
goog.require('silex.view.pane.GeneralStylePane');
goog.require('silex.view.pane.PagePane');
goog.require('silex.view.pane.PropertyPane');
goog.require('silex.view.pane.StylePane');



//////////////////////////////////////////////////////////////////
// PropertyTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertyTool class handles the panes actually displaying the properties
 * @constructor
 *
 * @param {Element} element   container to render the UI
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.PropertyTool = function(element, view , controller) {
  // store references
  this.element = element;
  this.view = view;
  this.controller = controller;

  // build the UI
  this.buildPanes();
};


/**
 * base url for relative/absolute urls
 */
silex.view.PropertyTool.prototype.baseUrl = null;


/**
 * bg editor
 * @see     silex.view.pane.BgPane
 */
silex.view.PropertyTool.prototype.bgPane = null;


/**
 * property editor
 * @see     silex.view.pane.PropertyPane
 */
silex.view.PropertyTool.prototype.propertyPane = null;


/**
 * editor
 * @see     silex.view.pane.BorderPane
 */
silex.view.PropertyTool.prototype.borderPane = null;


/**
 * property editor
 * @see     silex.view.pane.PagePane
 */
silex.view.PropertyTool.prototype.pagePane = null;


/**
 * property editor
 * @see     silex.view.pane.GeneralStylePane
 */
silex.view.PropertyTool.prototype.generalStylePane = null;


/**
 * property editor
 * @see     silex.view.pane.StylePane
 */
silex.view.PropertyTool.prototype.stylePane = null;


/**
 * build the UI
 */
silex.view.PropertyTool.prototype.buildPanes = function() {
  // background
  this.bgPane = new silex.view.pane.BgPane(
      goog.dom.getElementByClass('background-editor', this.element),
      this.view, this.controller);

  // border
  this.borderPane = new silex.view.pane.BorderPane(
      goog.dom.getElementByClass('border-editor', this.element),
      this.view, this.controller);

  // property
  this.propertyPane = new silex.view.pane.PropertyPane(
      goog.dom.getElementByClass('property-editor', this.element),
      this.view, this.controller);

  // page
  this.pagePane = new silex.view.pane.PagePane(
      goog.dom.getElementByClass('page-editor', this.element),
      this.view, this.controller);

  // general styles
  this.generalStylePane = new silex.view.pane.GeneralStylePane(
      goog.dom.getElementByClass('general-editor', this.element),
      this.view, this.controller);

  // silex styles
  this.stylePane = new silex.view.pane.StylePane(
      goog.dom.getElementByClass('style-editor', this.element),
      this.view, this.controller);

};


/**
 * redraw all panes
* @param   {Array<element>} selectedElements the elements currently selected
* @param   {HTMLDocument} document  the document to use
* @param   {Array<string>} pageNames   the names of the pages which appear in the current HTML file
* @param   {string}  currentPageName   the name of the current page
 */
silex.view.PropertyTool.prototype.redraw = function(selectedElements, document, pageNames, currentPage) {
  // refresh panes
  this.borderPane.redraw(selectedElements, document, pageNames, currentPage);
  this.propertyPane.redraw(selectedElements, document, pageNames, currentPage);
  this.pagePane.redraw(selectedElements, document, pageNames, currentPage);
  this.generalStylePane.redraw(selectedElements, document, pageNames, currentPage);
  this.stylePane.redraw(selectedElements, document, pageNames, currentPage);
  this.bgPane.redraw(selectedElements, document, pageNames, currentPage);
};
