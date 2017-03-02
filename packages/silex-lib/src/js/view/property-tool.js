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
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.PropertyTool = function(element, model, controller) {
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
  this.invalidationManager = new InvalidationManager(500);

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
silex.view.PropertyTool.prototype.buildUi = function() {
  // background
  this.bgPane = new silex.view.pane.BgPane(
      goog.dom.getElementByClass('background-editor', this.element),
      this.model, this.controller);

  // border
  this.borderPane = new silex.view.pane.BorderPane(
      goog.dom.getElementByClass('border-editor', this.element),
      this.model, this.controller);

  // property
  this.propertyPane = new silex.view.pane.PropertyPane(
      goog.dom.getElementByClass('property-editor', this.element),
      this.model, this.controller);

  // page
  this.pagePane = new silex.view.pane.PagePane(
      goog.dom.getElementByClass('page-editor', this.element),
      this.model, this.controller);

  // general styles
  this.generalStylePane = new silex.view.pane.GeneralStylePane(
      goog.dom.getElementByClass('general-editor', this.element),
      this.model, this.controller);

  // silex styles
  this.stylePane = new silex.view.pane.StylePane(
      goog.dom.getElementByClass('style-editor', this.element),
      this.model, this.controller);

  // component editor
  this.model.component.initComponents(this.element.querySelector('.component-editor'));
  this.componentEditorElement = this.element.querySelector('.component-editor');

  // expandables
  const expandables = this.element.querySelectorAll('.expandable legend');
  for(let idx=0; idx<expandables.length; idx++) {
    const el = expandables[idx];
    el.onclick = e => {
      el.parentNode.classList.toggle('expanded');
      const caret = el.querySelector('.fa-inverse');
      if(caret) {
        caret.classList.toggle('fa-caret-right');
        caret.classList.toggle('fa-caret-down');
      }
    }
  }

  // tabs
  const designTab = this.element.querySelector('.design');
  const paramsTab = this.element.querySelector('.params');
  designTab.addEventListener('click', () => {
    this.selectTab(designTab);
    this.element.classList.remove('params-tab');
    this.element.classList.add('design-tab');
  });
  paramsTab.addEventListener('click', () => {
    this.selectTab(paramsTab);
    this.element.classList.remove('design-tab');
    this.element.classList.add('params-tab');
  });
};


silex.view.PropertyTool.prototype.selectTab = function(tab) {
  const onTabs = this.element.querySelectorAll('.tab');
  for(let idx=0; idx<onTabs.length; idx++) {
    onTabs[idx].classList.remove('on');
  }
  tab.classList.add('on');
};


/**
 * redraw all panes
* @param   {Array.<HTMLElement>} selectedElements the elements currently selected
* @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
* @param   {string}  currentPageName   the name of the current page
 */
silex.view.PropertyTool.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  this.invalidationManager.callWhenReady(() => {
    // refresh panes
    this.borderPane.redraw(selectedElements, pageNames, currentPageName);
    this.propertyPane.redraw(selectedElements, pageNames, currentPageName);
    this.pagePane.redraw(selectedElements, pageNames, currentPageName);
    this.generalStylePane.redraw(selectedElements, pageNames, currentPageName);
    this.stylePane.redraw(selectedElements, pageNames, currentPageName);
    this.bgPane.redraw(selectedElements, pageNames, currentPageName);
    if(selectedElements.length === 1 && this.model.property.getComponentData(selectedElements[0])) {
      this.model.component.edit(selectedElements[0]);
      this.componentEditorElement.classList.remove('hide-panel');
    }
    else {
      this.model.component.resetSelection();
      this.componentEditorElement.classList.add('hide-panel');
    }
  });
};
