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
 * @param  {silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.PropertyTool = function(element, controller) {
  // store references
  this.element = element;
  this.controller = controller;
  var btn = this.element.querySelector('.switch-apollo-mode button');
  goog.events.listen(btn, goog.events.EventType.CLICK, function() {
    this.controller.propertyToolController.toggleAdvanced();
  }, false, this);

};


/**
 * the element into which the tool is rendered
 * @type {Element}
 */
silex.view.PropertyTool.prototype.element = null;


/**
 * the Controller object
 * @type {silex.types.Controller}
 */
silex.view.PropertyTool.prototype.controller = null;


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
silex.view.PropertyTool.prototype.buildUi = function() {
  // background
  this.bgPane = new silex.view.pane.BgPane(
      goog.dom.getElementByClass('background-editor', this.element),
      this.controller);

  // border
  this.borderPane = new silex.view.pane.BorderPane(
      goog.dom.getElementByClass('border-editor', this.element),
      this.controller);

  // property
  this.propertyPane = new silex.view.pane.PropertyPane(
      goog.dom.getElementByClass('property-editor', this.element),
      this.controller);

  // page
  this.pagePane = new silex.view.pane.PagePane(
      goog.dom.getElementByClass('page-editor', this.element),
      this.controller);

  // general styles
  this.generalStylePane = new silex.view.pane.GeneralStylePane(
      goog.dom.getElementByClass('general-editor', this.element),
      this.controller);

  // silex styles
  this.stylePane = new silex.view.pane.StylePane(
      goog.dom.getElementByClass('style-editor', this.element),
      this.controller);

};


/**
 * redraw all panes
* @param   {Array.<HTMLElement>} selectedElements the elements currently selected
* @param   {Document} document  the document to use
* @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
* @param   {string}  currentPageName   the name of the current page
 */
silex.view.PropertyTool.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
  // refresh panes
  this.borderPane.redraw(selectedElements, document, pageNames, currentPageName);
  this.propertyPane.redraw(selectedElements, document, pageNames, currentPageName);
  this.pagePane.redraw(selectedElements, document, pageNames, currentPageName);
  this.generalStylePane.redraw(selectedElements, document, pageNames, currentPageName);
  this.stylePane.redraw(selectedElements, document, pageNames, currentPageName);
  this.bgPane.redraw(selectedElements, document, pageNames, currentPageName);
};
