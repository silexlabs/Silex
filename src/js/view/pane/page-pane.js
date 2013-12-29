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
 * Controls the element visibility on the pages,
 *   and also the element "link to page" property
 *
 */


goog.require('silex.view.pane.PaneBase');
goog.provide('silex.view.pane.PagePane');

goog.require('goog.array');
goog.require('goog.cssom');
goog.require('goog.editor.Field');
goog.require('goog.ui.LabelInput');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.HsvaPalette');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {element} element   container to render the UI
 * @param  {element} bodyElement  HTML element which holds the body section of the opened file
 * @param  {element} headElement  HTML element which holds the head section of the opened file
 */
silex.view.pane.PagePane = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);

  this.buildUi();
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.pane.PagePane, silex.view.pane.PaneBase);


/**
 * dropdown list to select a link
 */
silex.view.pane.PagePane.prototype.linkDropdown;


/**
 * text field used to type an external link
 */
silex.view.pane.PagePane.prototype.linkInputTextField;


/**
 * build the UI
 */
silex.view.pane.PagePane.prototype.buildUi = function() {
  // link, select page or enter custom link
  // handle the dropdown list from the template
  this.linkDropdown = goog.dom.getElementByClass('link-combo-box',
      this.element);
  this.linkDropdown.onchange = goog.bind(this.onLinkChanged, this);

  // create a text field for custom link
  var linkInputElement = goog.dom.getElementByClass('link-input-text',
      this.element);
  this.linkInputTextField = new goog.ui.LabelInput();
  this.linkInputTextField.decorate(linkInputElement);

  // hide by default
  goog.style.setStyle(linkInputElement, 'display', 'none');

  // Watch for field changes, to display below.
  goog.events.listen(linkInputElement,
      goog.ui.Component.EventType.CHANGE,
      this.onLinkTextChanged,
      false,
      this);
  goog.events.listen(linkInputElement,
      goog.events.EventType.KEYDOWN,
      this.onLinkTextChanged,
      false,
      this);

};

/**
 * display the propertis of the component being edited
 * @param   {silex.model.component} component   the component to edit
 */
silex.view.pane.PagePane.prototype.setComponent =
    function(component) {
  this.component = component;
  this.redraw();
};


/**
 * refresh with new pages
 * @param   {array} pages   the new list of pages
 */
silex.view.pane.PagePane.prototype.setPages = function(pages) {
  // store the pages
  this.pages = pages;

  // reset page checkboxes
  if (this.pageCheckboxes) {
    goog.array.forEach(this.pageCheckboxes, function(item) {
      item.checkbox.dispose();
    });
  }

  // link selector
  var linkContainer = goog.dom.getElementByClass('link-combo-box',
      this.element);
  var templateHtml = goog.dom.getElementByClass('link-template',
      this.element).innerHTML;
  silex.Helper.resolveTemplate(linkContainer,
      templateHtml,
      {pages: this.pages});

  // render page/visibility template
  // init page template
  var pagesContainer = goog.dom.getElementByClass('pages-container',
      this.element);
  var templateHtml = goog.dom.getElementByClass('pages-selector-template',
      this.element).innerHTML;
  silex.Helper.resolveTemplate(pagesContainer,
      templateHtml,
      {pages: this.pages});
  // create page checkboxes
  this.pageCheckboxes = [];
  var mainContainer = goog.dom.getElementByClass('pages-container',
      this.element);
  var items = goog.dom.getElementsByClass('page-container', mainContainer);
  var idx = 0;
  goog.array.forEach(items, function(item) {
    var checkboxElement = goog.dom.getElementByClass('page-check', item);
    var labelElement = goog.dom.getElementByClass('page-label', item);
    var checkbox = new goog.ui.Checkbox();
    var page = this.pages[idx++];
    checkbox.render(checkboxElement);
    checkbox.setLabel(labelElement);
    this.pageCheckboxes.push({
      checkbox: checkbox,
      page: page
    });
    goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE,
        function(e) {
          this.checkPage(page, checkbox);
        }, false, this);
  }, this);
  // show on all pages button
  var showAllBtn = goog.dom.getElementByClass('show-on-all-pages-btn',
      this.element);
  goog.events.listen(showAllBtn, goog.events.EventType.CLICK, function(e) {
    this.unCheckAll();
  }, false, this);

  // refresh display
  this.redraw();
};


/**
 * the user changed the link drop down
 */
silex.view.pane.PagePane.prototype.onLinkChanged = function() {
  if (this.linkDropdown.value === 'none') {
    this.component.removeLink();
    this.redraw();
  }
  else if (this.linkDropdown.value === 'custom') {
    this.linkInputTextField.setValue('');
    var linkInputElement = goog.dom.getElementByClass('link-input-text',
        this.element);
    goog.style.setStyle(linkInputElement, 'display', 'inherit');
  }
  else {
    this.component.setLink('#' + this.linkDropdown.value);
    this.redraw();
  }
  this.pageChanged();
};


/**
 * the user changed the link text field
 */
silex.view.pane.PagePane.prototype.onLinkTextChanged =
    function() {
      console.log('xxx');
  // update the href attribute
  this.component.setLink(this.linkInputTextField.getValue());
  // notify the controler
  this.pageChanged();
};


/**
 * redraw the properties
 */
silex.view.pane.PagePane.prototype.redraw = function() {
  // call super
  goog.base(this, 'redraw');

  // get the selected element
  var element = this.getSelection()[0];

  if (element){
    // refresh page checkboxes
    goog.array.forEach(this.pageCheckboxes, function(item) {
      if (this.component) {
        // there is a selection
        var pageName = item.page.name;
        item.checkbox.setEnabled(true);
        item.checkbox.setChecked(goog.dom.classes.has(this.component.element,
            pageName));
      }
      else {
        // no selected element
        item.checkbox.setChecked(false);
        item.checkbox.setEnabled(false);
      }
    }, this);

    // refresh the link inputs
    // default selection
    var hrefAttr = this.component.getLink();
    if (!hrefAttr) {
      this.linkDropdown.value = 'none';
      this.linkInputTextField.setValue('');
    }
    else {
      if (hrefAttr.indexOf('#') === 0 &&
          silex.model.Page.getPageByName(hrefAttr.substr(1))) {
        // case of an internal link
        // select a page
        this.linkDropdown.value = hrefAttr.substr(1);
      }
      else {
        // in case it is a custom link
        this.linkInputTextField.setValue(hrefAttr);
        this.linkDropdown.value = 'custom';
      }
    }
    // visibility of the text edit
    var linkInputElement = goog.dom.getElementByClass('link-input-text',
        this.element);
    if (this.linkDropdown.value === 'custom') {
      goog.style.setStyle(linkInputElement, 'display', 'inherit');
    }
    else {
      goog.style.setStyle(linkInputElement, 'display', 'none');
    }
    this.isRedraw = false;
  }
};


/**
 * callback for checkboxes click event
 * changes the visibility of the current component for the given page
 * @param   {silex.model.page} page   the page for wich the visibility changes
 * @param   {goog.ui.Checkbox} checkbox   the checkbox clicked
 */
silex.view.pane.PagePane.prototype.checkPage = function(page, checkbox) {
  // apply the page selection
  if (checkbox.isChecked()) {
    page.addComponent(this.component);
  }
  else {
    page.removeComponent(this.component);
  }
  // notify the toolbox
  this.pageChanged();
  // refresh ui
  this.redraw();
};


/**
 * callback for checkboxes click event
 */
silex.view.pane.PagePane.prototype.unCheckAll = function() {
  goog.array.forEach(this.pages, function(page) {
    page.removeComponent(this.component);
  }, this);
  // notify the toolbox
  this.pageChanged();
  // refresh ui
  this.redraw();
};
