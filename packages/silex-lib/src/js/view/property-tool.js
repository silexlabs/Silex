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

goog.require('silex.view.StyleEditor');



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
 * class name targeted by the style editor at start
 * @const
 * @type {string}
 */
silex.view.PropertyTool.GLOBAL_STYLE_CLASS_NAME = 'text-element';

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
 * utility function to create a style in the style combo box or duplicate one
 * @param {?Object=} opt_data
 * @param {?function(?string=)=} opt_cbk
 */
silex.view.PropertyTool.prototype.createStyle = function(opt_data, opt_cbk) {
  silex.utils.Notification.prompt('Enter a name for your style!', 'My Style',
    (accept, name) => {
      if(accept && name && name !== '') {
        const option = document.createElement('option');
        option.value = name.replace(/ /g, '-').toLowerCase();
        option.innerHTML = name;
        this.cssClassStyleComboElement.appendChild(option);
        this.cssClassStyleComboElement.value = option.value;
        this.model.component.initStyle(option.value, opt_data);
        this.model.component.editStyle(option.value, this.stateStyleComboElement.value);
        silex.utils.Notification.alert(`I have created your new style, please add ${ option.value } to <a href="${ silex.Config.WIKI_SILEX_CUSTOM_CSS_CLASS }" target="_blank">your elements' css class name, click here for help</a>.`, () => {
          if(opt_cbk) opt_cbk(name);
        });
      }
      else {
        if(opt_cbk) opt_cbk();
      }
    }
  );
}


/**
 * utility function to delete a style in the style
 */
silex.view.PropertyTool.prototype.deleteStyle = function(name) {
  const option = this.cssClassStyleComboElement.querySelector('option[value="' + name + '"]');
  if(option && option.value !== silex.view.PropertyTool.GLOBAL_STYLE_CLASS_NAME) {
    this.model.component.removeStyle(option.value);
    this.cssClassStyleComboElement.removeChild(option);
  }
}


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

  // component editor and style editor
  this.componentEditorElement = this.element.querySelector('.prodotype-component-editor');
  this.styleEditorElement = this.element.querySelector('.prodotype-style-editor .prodotype-container');
  this.model.component.init(this.componentEditorElement, this.styleEditorElement);
  this.cssClassStyleComboElement = this.element.querySelector('.class-name-style-combo-box');
  this.stateStyleComboElement = this.element.querySelector('.state-style-combo-box');
  this.stateStyleComboElement.onchange = this.cssClassStyleComboElement.onchange = e => {
    this.model.component.editStyle(this.cssClassStyleComboElement.value, this.stateStyleComboElement.value);
  };
  this.element.querySelector('.add-style').onclick = e => {
    this.createStyle();
  }
  this.element.querySelector('.remove-style').onclick = e => {
    this.deleteStyle(this.cssClassStyleComboElement.value);
  };
  this.element.querySelector('.reset-style').onclick = e => {
    this.model.component.initStyle(this.cssClassStyleComboElement.value);
  }
  this.element.querySelector('.duplicate-style').onclick = e => {
    this.createStyle(this.model.property.getProdotypeData(this.cssClassStyleComboElement.value, Component.STYLE_TYPE));
  }
  this.element.querySelector('.edit-style').onclick = e => {
    const value = this.cssClassStyleComboElement.value;
    // create the new style
    this.createStyle(this.model.property.getProdotypeData(value, Component.STYLE_TYPE), name => {
      // delete the old one
      this.deleteStyle(value);
    });
  }

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
    const currentSelection = this.cssClassStyleComboElement.value;
    let currentSelectionFound = false;
    this.cssClassStyleComboElement.innerHTML = '';
    [{displayName: 'All', templateName: 'text', name: silex.view.PropertyTool.GLOBAL_STYLE_CLASS_NAME}]
    .concat(this.model.component.getProdotypeComponents(Component.STYLE_TYPE).filter(obj => obj.name !== silex.view.PropertyTool.GLOBAL_STYLE_CLASS_NAME))
    .map(obj => {
      const option = document.createElement('option');
      option.value = obj.name;
      option.innerHTML = obj.displayName;
      if(currentSelection === option.value) currentSelectionFound = true;
      return option;
    })
    .forEach(option => this.cssClassStyleComboElement.appendChild(option));
    if(currentSelectionFound) this.cssClassStyleComboElement.value = currentSelection;
    this.model.component.editStyle(this.cssClassStyleComboElement.value, this.stateStyleComboElement.value);

    // refresh panes
    this.borderPane.redraw(selectedElements, pageNames, currentPageName);
    this.propertyPane.redraw(selectedElements, pageNames, currentPageName);
    this.pagePane.redraw(selectedElements, pageNames, currentPageName);
    this.generalStylePane.redraw(selectedElements, pageNames, currentPageName);
    this.stylePane.redraw(selectedElements, pageNames, currentPageName);
    this.bgPane.redraw(selectedElements, pageNames, currentPageName);
    if(selectedElements.length === 1) {
      this.model.component.editComponent(selectedElements[0]);
    }
    else {
      this.model.component.resetSelection();
    }
  });
};
