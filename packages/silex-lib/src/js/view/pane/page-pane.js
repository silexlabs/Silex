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


goog.provide('silex.view.pane.PagePane');
goog.require('goog.array');
goog.require('goog.cssom');
goog.require('goog.editor.Field');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.LabelInput');
goog.require('silex.view.pane.PaneBase');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extend silex.view.PaneBase
 * @param {Element} element   container to render the UI
 * @param  {silex.types.View} view  view class which holds the other views
 * @param  {silex.types.Controller} controller  structure which holds the controller instances
 */
silex.view.pane.PagePane = function(element, view, controller) {
  // call super
  goog.base(this, element, view, controller);

  this.buildUi();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.PagePane, silex.view.pane.PaneBase);


/**
 * dropdown list to select a link
 */
silex.view.pane.PagePane.prototype.linkDropdown = null;


/**
 * text field used to type an external link
 */
silex.view.pane.PagePane.prototype.linkInputTextField = null;


/**
 * {Array} of checkboxes used to add/remove the element from pages
 */
silex.view.pane.PagePane.prototype.pageCheckboxes = null;


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
 * @param   {Array} pages   the new list of pages
 */
silex.view.pane.PagePane.prototype.setPages = function(pages, document) {
  // store the pages
  this.pages = pages;

  // build an array of obects with name and displayName properties
  var pageData = pages.map(goog.bind(function(pageName) {
    return {
      name: pageName,
      displayName: document.getElementById(pageName).innerHTML,
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
      displayName: '-',
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
  var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);
  if (this.linkDropdown.value === 'none') {
    this.controller.propertyToolController.removeLink(this.selectedElements);
    goog.style.setStyle(linkInputElement, 'display', 'none');
  }
  else if (this.linkDropdown.value === 'custom') {
    this.linkInputTextField.setValue('');
    goog.style.setStyle(linkInputElement, 'display', 'inherit');
  }
  else {
    this.controller.propertyToolController.addLink(this.selectedElements, this.linkDropdown.value);
  }
};


/**
 * the user changed the link text field
 */
silex.view.pane.PagePane.prototype.onLinkTextChanged = function() {
  this.iAmSettingValue = true;
  try {
    this.controller.propertyToolController.addLink(this.selectedElements, this.linkInputTextField.getValue());
  }
  catch (err) {
    // error which will not keep this.iAmSettingValue to true
    console.error('an error occured while editing the value', err);
  }
  this.iAmSettingValue = false;
};


/**
 * redraw the properties
 * @param   {Array<element>} selectedElements the elements currently selected
 * @param   {HTMLDocument} document  the document to use
 * @param   {Array<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.PagePane.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
  if (this.iAmSettingValue) return;
  this.iAmRedrawing = true;
  // call super
  goog.base(this, 'redraw', selectedElements, document, pageNames, currentPageName);

  // remember selection
  this.selectedElements = selectedElements;
  // visibility of the text edit
  var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);

  // update page list
  this.setPages(pageNames, document);

  // not available for stage element
  var elementsNoStage = [];
  goog.array.forEach(selectedElements, function(element) {
    if (document.body != element) {
      elementsNoStage.push(element);
    }
  }, this);
  // special case of the background / main container only selected element
  var bgOnly = false;
  if (selectedElements.length === 1 && goog.dom.classes.has(selectedElements[0], 'background')) {
    bgOnly = true;
  }
  if (elementsNoStage.length > 0 && bgOnly === false) {
    // not stage element only
    this.linkDropdown.removeAttribute('disabled');
    // refresh page checkboxes
    goog.array.forEach(this.pageCheckboxes, function(item) {
      // there is a selection
      item.checkbox.setEnabled(true);
      // compute common pages
      var isInPage = this.getCommonProperty(selectedElements, function(element) {
        return goog.dom.classes.has(element, item.pageName);
      });
      // set visibility
      if (goog.isNull(isInPage)) {
        // multiple elements selected with different values
        item.checkbox.setChecked(goog.ui.Checkbox.State.UNDETERMINED);
      }
      else {
        item.checkbox.setChecked(isInPage);
      }
    }, this);

    // refresh the link inputs
    // get the link of the element
    var elementLink = this.getCommonProperty(selectedElements, function(element) {
      return element.getAttribute(silex.model.Element.LINK_ATTR);
    });
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
    if (this.linkDropdown.value === 'custom') {
      goog.style.setStyle(linkInputElement, 'display', 'inherit');
    }
    else {
      goog.style.setStyle(linkInputElement, 'display', 'none');
    }
  }
  else {
    // stage element only
    goog.array.forEach(this.pageCheckboxes, function(item) {
      item.checkbox.setEnabled(false);
      item.checkbox.setChecked(goog.ui.Checkbox.State.UNDETERMINED);
    }, this);
    this.linkDropdown.value = 'none';
    this.linkDropdown.setAttribute('disabled', true);
    goog.style.setStyle(linkInputElement, 'display', 'none');

  }
  this.iAmRedrawing = false;
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
    this.controller.propertyToolController.addToPage(this.selectedElements, pageName);
  }
  else {
    this.controller.propertyToolController.removeFromPage(this.selectedElements, pageName);
  }
};
