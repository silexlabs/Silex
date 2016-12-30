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
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.LabelInput');
goog.require('silex.view.pane.PaneBase');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extends {silex.view.pane.PaneBase}
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.pane.PagePane = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // init the component
  this.buildUi();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.PagePane, silex.view.pane.PaneBase);


/**
 * dropdown list to select a link
 */
silex.view.pane.PagePane.prototype.linkDropdown = null;


/**
 * check box "view on mobile"
 * @type {goog.ui.Checkbox}
 */
silex.view.pane.PagePane.prototype.viewOnMobileCheckbox = null;


/**
 * check box "view on all pages"
 * @type {goog.ui.Checkbox}
 */
silex.view.pane.PagePane.prototype.viewOnAllPagesCheckbox = null;


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

  // View on mobile checkbox
  var viewOnMobileElement = goog.dom.getElementByClass('view-on-mobile', this.element);
  var checkboxElement = goog.dom.getElementByClass('view-on-mobile-check', viewOnMobileElement);
  var labelElement = goog.dom.getElementByClass('view-on-mobile-label', viewOnMobileElement);
  this.viewOnMobileCheckbox = new goog.ui.Checkbox();
  this.viewOnMobileCheckbox.render(checkboxElement);
  this.viewOnMobileCheckbox.setLabel(labelElement);
  goog.events.listen(this.viewOnMobileCheckbox, goog.ui.Component.EventType.CHANGE,
      function(event) {
        goog.array.forEach(this.selectedElements, function(element) {
          if(this.viewOnMobileCheckbox.isChecked()) {
            element.classList.remove('hide-on-mobile');
          }
          else {
            element.classList.add('hide-on-mobile');
          }
        }, this);
      }, false, this);

  // View on all pages
  var viewOnAllPagesElement = goog.dom.getElementByClass('view-on-allpages', this.element);
  checkboxElement = goog.dom.getElementByClass('view-on-allpages-check', viewOnAllPagesElement);
  labelElement = goog.dom.getElementByClass('view-on-allpages-label', viewOnAllPagesElement);
  this.viewOnAllPagesCheckbox = new goog.ui.Checkbox();
  this.viewOnAllPagesCheckbox.render(checkboxElement);
  this.viewOnAllPagesCheckbox.setLabel(labelElement);
  goog.events.listen(this.viewOnAllPagesCheckbox, goog.ui.Component.EventType.CHANGE,
    function(event) {
      if(this.viewOnAllPagesCheckbox.isChecked()) {
        this.checkAllPages();
      }
      this.removeFromAllPages();
    }, false, this);
};


/**
 * refresh with new pages
 * @param   {Array} pages   the new list of pages
 */
silex.view.pane.PagePane.prototype.setPages = function(pages) {
  // store the pages
  this.pages = pages;

  // build an array of obects with name and displayName properties
  var pageData = pages.map(goog.bind(function(pageName) {
    return {
      'name': pageName,
      'displayName': this.model.file.getContentDocument().getElementById(pageName).innerHTML,
      'linkName': '#!' + pageName
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
      'name': 'none',
      'displayName': '-',
      'linkName': 'none'
    },
    {
      'name': 'custom',
      'displayName': 'External link',
      'linkName': 'custom'
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
  templateHtml = goog.dom.getElementByClass('pages-selector-template',
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
        function(event) {
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
  this.controller.propertyToolController.addLink(this.selectedElements, this.linkInputTextField.getValue());
  this.iAmSettingValue = false;
};


/**
 * redraw the properties
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.PagePane.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;
  // call super
  goog.base(this, 'redraw', selectedElements, pageNames, currentPageName);

  // remember selection
  this.selectedElements = selectedElements;
  // visibility of the text edit
  var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);

  // update page list
  this.setPages(pageNames);

  // View on mobile checkbox
  this.viewOnMobileCheckbox.setEnabled(this.model.head.getEnableMobile());

  // not available for stage element
  var elementsNoStage = [];
  goog.array.forEach(selectedElements, function(element) {
    if (this.model.body.getBodyElement() !== element) {
      elementsNoStage.push(element);
    }
    else {
      this.viewOnMobileCheckbox.setEnabled(false);
    }
  }, this);
  // update the "view on mobile" checkbox
  var isVisibleOnMobile = this.getCommonProperty(selectedElements, function(element) {
    return !element.classList.contains('hide-on-mobile');
  });
  if(!goog.isNull(isVisibleOnMobile)) {
    this.viewOnMobileCheckbox.setChecked(isVisibleOnMobile);
  }
  else {
    this.viewOnMobileCheckbox.setChecked(goog.ui.Checkbox.State.UNDETERMINED);
  }
  // special case of the background / main container only selected element
  var bgOnly = false;
  if (selectedElements.length === 1 && goog.dom.classlist.contains(selectedElements[0], 'background')) {
    bgOnly = true;
  }
  if (elementsNoStage.length > 0 && bgOnly === false) {
    // not stage element only
    this.linkDropdown.removeAttribute('disabled');
    // refresh page checkboxes
    let isInNoPage = true;
    goog.array.forEach(this.pageCheckboxes, function(item) {
      // there is a selection
      item.checkbox.setEnabled(true);
      // compute common pages
      var isInPage = this.getCommonProperty(selectedElements, element => {
        return this.model.page.isInPage(element, item.pageName);
      });
      // set visibility
      isInNoPage = isInNoPage && isInPage === false;
      if (goog.isNull(isInPage)) {
        // multiple elements selected with different values
        item.checkbox.setChecked(goog.ui.Checkbox.State.UNDETERMINED);
      }
      else {
        item.checkbox.setChecked(isInPage);
      }
    }, this);
    this.viewOnAllPagesCheckbox.setEnabled(true);
    if(isInNoPage) {
      this.viewOnAllPagesCheckbox.setChecked(true);
      // this.checkAllPages();
    }
    else {
      this.viewOnAllPagesCheckbox.setChecked(false);
    }
    // refresh the link inputs
    // get the link of the element
    var elementLink = /** @type {string} */ (this.getCommonProperty(selectedElements, function(element) {
      return element.getAttribute(silex.model.Element.LINK_ATTR);
    }));
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
    this.viewOnAllPagesCheckbox.setEnabled(false);
    this.viewOnAllPagesCheckbox.setChecked(true);
  }
  this.iAmRedrawing = false;
};


/**
 * callback for checkboxes click event
 * changes the visibility of the current component for the given page
 * @param   {string} pageName   the page for wich the visibility changes
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

silex.view.pane.PagePane.prototype.checkAllPages = function() {
  this.pageCheckboxes.forEach(item => {
    item.checkbox.setChecked(true);
  });
  this.viewOnAllPagesCheckbox.setChecked(true);
};


silex.view.pane.PagePane.prototype.removeFromAllPages = function() {
  this.pageCheckboxes.forEach(item => {
    this.controller.propertyToolController.removeFromPage(this.selectedElements, item.pageName);
  });
};
