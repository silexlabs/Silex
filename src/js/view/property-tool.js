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
goog.require('goog.object');
goog.require('goog.ui.TabBar');
goog.require('silex.view.pane.BgPane');
goog.require('silex.view.pane.BorderPane');
goog.require('silex.view.pane.GeneralStylePane');
goog.require('silex.view.pane.PagePane');
goog.require('silex.view.pane.PropertyPane');
goog.require('silex.view.pane.StylePane');
goog.require('silex.view.pane.StyleEditorPane');


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
 * style editor
 * @see     silex.view.pane.StyleEditorPane
 */
silex.view.PropertyTool.prototype.styleEditorPane = null;


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

  // Style editor
  const styleEditorMenu = this.element.querySelector('.prodotype-style-editor .prodotype-style-editor-menu');
  this.styleEditorPane = new StyleEditorPane(
      styleEditorMenu,
      this.model, this.controller);

  // init component editor and style editor
  const styleEditorElement = this.element.querySelector('.prodotype-style-editor .prodotype-container');
  this.componentEditorElement = this.element.querySelector('.prodotype-component-editor');
  this.model.component.init(this.componentEditorElement, styleEditorElement);

  // expandables
  const expandables = this.element.querySelectorAll('.expandable legend');
  for(let idx=0; idx<expandables.length; idx++) {
    const el = expandables[idx];
    const lsKey = 'silex-expand-property-' + idx;
    const isExpand = window.localStorage.getItem(lsKey) === 'true';
    if(isExpand) this.togglePanel(el);
    el.onclick = e => {
      this.togglePanel(el);
      window.localStorage.setItem(lsKey, el.parentNode.classList.contains('expanded').toString());
    };
  }

  // tabs
  const designTab = this.element.querySelector('.design');
  const paramsTab = this.element.querySelector('.params');
  const styleTab = this.element.querySelector('.style');
  designTab.addEventListener('click', () => this.openDesignTab());
  paramsTab.addEventListener('click', () => this.openParamsTab());
  styleTab.addEventListener('click', () => this.openStyleTab());
};


/**
 * toggle a property panel
 */
silex.view.PropertyTool.prototype.togglePanel = function(el) {
  el.parentNode.classList.toggle('expanded');
  const caret = el.querySelector('.fa-inverse');
  if(caret) {
    caret.classList.toggle('fa-caret-right');
    caret.classList.toggle('fa-caret-down');
  }
};


/**
 * open the "design" tab
 */
silex.view.PropertyTool.prototype.openDesignTab = function() {
  const designTab = this.element.querySelector('.design');
  this.selectTab(designTab);
  this.element.classList.remove('params-tab');
  this.element.classList.remove('style-tab');
  this.element.classList.add('design-tab');
};


/**
 * open the "params" tab
 */
silex.view.PropertyTool.prototype.openParamsTab = function() {
  const paramsTab = this.element.querySelector('.params');
  this.selectTab(paramsTab);
  this.element.classList.remove('design-tab');
  this.element.classList.remove('style-tab');
  this.element.classList.add('params-tab');
};


/**
 * open the "style" tab
 */
silex.view.PropertyTool.prototype.openStyleTab = function() {
  const styleTab = this.element.querySelector('.style');
  this.selectTab(styleTab);
  this.element.classList.remove('design-tab');
  this.element.classList.remove('params-tab');
  this.element.classList.add('style-tab');
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
    this.styleEditorPane.redraw(selectedElements, pageNames, currentPageName);
    if(selectedElements.length === 1) {
      this.model.component.editComponent(selectedElements[0]);
    }
    else {
      this.model.component.resetSelection(Component.COMPONENT_TYPE);
    }
  });
};
