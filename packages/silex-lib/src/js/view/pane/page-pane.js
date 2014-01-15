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

goog.require('silex.utils.PageablePlugin');

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
 * {array} of checkboxes used to add/remove the element from pages
 */
silex.view.pane.PagePane.prototype.pageCheckboxes;


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
      goog.events.EventType.INPUT,
      this.onLinkTextChanged,
      false,
      this);
};


/**
 * refresh with new pages
 * @param   {array} pages   the new list of pages
 */
silex.view.pane.PagePane.prototype.setPages = function(pages) {
  // store the pages
  this.pages = pages;

  // build an array of obects with name and displayName properties
  var pageData = pages.map(goog.bind(function (pageName) {
    return {
      name: pageName,
      displayName: silex.utils.PageablePlugin.getDisplayName(pageName),
      linkName: '#!' + pageName
    };
  }, this));

  // reset page checkboxes
  if (this.pageCheckboxes) {
    goog.array.forEach(this.pageCheckboxes, function(item) {
      item.checkbox.dispose();
    });
  }

  // link selector
  var pageDataWithDefaultOptions = ([
    {
      name: 'none',
      displayName: 'None',
      linkName: 'none'
    },
    {
      name: 'custom',
      displayName: 'External link',
      linkName: 'custom'
    }
  ]).concat(pageData);
  var linkContainer = goog.dom.getElementByClass('link-combo-box',
      this.element);
  var templateHtml = goog.dom.getElementByClass('link-template',
      this.element).innerHTML;
  linkContainer.innerHTML = silex.utils.Dom.renderList(
      templateHtml,
      pageDataWithDefaultOptions);

  // render page/visibility template
  // init page template
  var pagesContainer = goog.dom.getElementByClass('pages-container',
      this.element);
  var templateHtml = goog.dom.getElementByClass('pages-selector-template',
      this.element).innerHTML;
  pagesContainer.innerHTML = silex.utils.Dom.renderList(
      templateHtml,
      pageData);
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
    var name = this.pages[idx++];
    checkbox.render(checkboxElement);
    checkbox.setLabel(labelElement);
    this.pageCheckboxes.push({
      checkbox: checkbox,
      pageName: name
    });
    goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE,
        function(e) {
          this.checkPage(name, checkbox);
        }, false, this);
  }, this);
};


/**
 * the user changed the link drop down
 */
silex.view.pane.PagePane.prototype.onLinkChanged = function() {
  if (this.linkDropdown.value === 'none') {
    this.onStatus('removeLink');
  }
  else if (this.linkDropdown.value === 'custom') {
    this.linkInputTextField.setValue('');
    var linkInputElement = goog.dom.getElementByClass('link-input-text',
        this.element);
    goog.style.setStyle(linkInputElement, 'display', 'inherit');
  }
  else {
    this.onStatus('addLink', this.linkDropdown.value);
  }
};


/**
 * the user changed the link text field
 */
silex.view.pane.PagePane.prototype.onLinkTextChanged = function() {
  this.iAmSettingValue = true;
  try{
    this.onStatus('addLink', this.linkInputTextField.getValue());
  }
  catch(err){
    // error which will not keep this.iAmSettingValue to true
    console.log('an error occured while editing the value', err);
  }
  this.iAmSettingValue = false;
};


/**
 * redraw the properties
 */
silex.view.pane.PagePane.prototype.redraw = function() {
  if (this.iAmSettingValue) return;
  // call super
  goog.base(this, 'redraw');

  // update page list
  this.setPages(silex.utils.PageablePlugin.getPages(this.bodyElement));

  // get the selected element
  var element = this.getSelection()[0];

  if (element){
    // refresh page checkboxes
    goog.array.forEach(this.pageCheckboxes, function(item) {
      // there is a selection
      item.checkbox.setEnabled(true);
      item.checkbox.setChecked(silex.utils.PageablePlugin.isInPage(element, item.pageName));
    }, this);

    // refresh the link inputs
    // get the link of the element
    var elementLink = silex.utils.PageablePlugin.getLink(element);
    // default selection
    if (!elementLink || elementLink === '') {
      this.linkDropdown.value = 'none';
      this.linkInputTextField.setValue('');
    }
    else {
      if (elementLink.indexOf('#!') === 0) {
        // case of an internal link
        // select a page
        this.linkDropdown.value = elementLink;
      }
      else {
        // in case it is a custom link
        this.linkInputTextField.setValue(elementLink);
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
silex.view.pane.PagePane.prototype.checkPage = function(pageName, checkbox) {
  // notify the toolbox
  if (checkbox.isChecked()) {
    this.onStatus('addToPage', pageName);
  }
  else {
    this.onStatus('removeFromPage', pageName);
  }
};


/**
 * callback for checkboxes click event
 *
silex.view.pane.PagePane.prototype.unCheckAll = function() {
  goog.array.forEach(this.pages, function(pageName) {
    page.removeComponent(this.component);
  }, this);
  // notify the toolbox
  this.pageChanged();
  // refresh ui
  this.redraw();
};
/* */
