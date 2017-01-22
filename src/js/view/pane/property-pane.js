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
 * @fileoverview Property pane, displayed in the property tool box
 *
 */


goog.provide('silex.view.pane.PropertyPane');
goog.require('goog.array');
goog.require('goog.object');
goog.require('silex.utils.Dom');
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
silex.view.pane.PropertyPane = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // init the component
  this.buildUi();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.PropertyPane, silex.view.pane.PaneBase);


/**
 * callback to call to let the user edit the image url
 */
silex.view.pane.PropertyPane.prototype.selectImage = null;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.leftInput = null;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.topInput = null;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.widthInput = null;


/**
 * UI for position and size
 */
silex.view.pane.PropertyPane.prototype.heightInput = null;


/**
 * UI for alt and title
 * only used for images
 */
silex.view.pane.PropertyPane.prototype.altInput = null;


/**
 * UI for alt and title
 */
silex.view.pane.PropertyPane.prototype.titleInput = null;


/**
 * store the last selection
 * @type {Array.<Element>}
 */
silex.view.pane.PropertyPane.prototype.selectedElements = null;


/**
 * build the UI
 */
silex.view.pane.PropertyPane.prototype.buildUi = function() {

  // position and size
  this.leftInput = goog.dom.getElementByClass('left-input');
  this.leftInput.setAttribute('data-style-name', 'left');
  goog.events.listen(this.leftInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.widthInput = goog.dom.getElementByClass('width-input');
  this.widthInput.setAttribute('data-style-name', 'width');
  goog.events.listen(this.widthInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.topInput = goog.dom.getElementByClass('top-input');
  this.topInput.setAttribute('data-style-name', 'top');
  goog.events.listen(this.topInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);
  this.heightInput = goog.dom.getElementByClass('height-input');
  this.heightInput.setAttribute('data-style-name', 'minHeight');
  goog.events.listen(this.heightInput,
      goog.events.EventType.INPUT,
      this.onPositionChanged,
      false,
      this);

  this.altInput = goog.dom.getElementByClass('alt-input');
  goog.events.listen(this.altInput,
      goog.events.EventType.INPUT,
      this.onAltChanged,
      false,
      this);
  this.titleInput = goog.dom.getElementByClass('title-input');
  goog.events.listen(this.titleInput,
      goog.events.EventType.INPUT,
      this.onTitleChanged,
      false,
      this);
};


/**
 * position or size changed
 * callback for number inputs
 */
silex.view.pane.PropertyPane.prototype.onPositionChanged =
    function(e) {
  // get the selected element
  var input = e.target;
  // the name of the property to change
  var name = input.getAttribute('data-style-name');
  // do nothing if the value is not a number (numeric stepers's value set to '')
  if (input.value !== '') {
    // get the value
    var value = parseFloat(input.value);
    // handle minimum size of elements on stage
    switch (name) {
      case 'width': value = Math.max(value, silex.model.Element.MIN_WIDTH);
      case 'minHeight': value = Math.max(value, silex.model.Element.MIN_HEIGHT);
    }
    // get the old value
    var oldValue = parseFloat(input.getAttribute('data-prev-value') || 0);
    // keep track of the new value for next time
    input.setAttribute('data-prev-value', value);
    // compute the offset
    var offset = value - oldValue;
    // apply the change to all elements
    goog.array.forEach(this.selectedElements, function(element) {
      if (goog.isNumber(oldValue)) {
        // compute the new value relatively to the old value,
        // in order to match the group movement
        var elementStyle = this.model.element.getStyle(element, name);
        var styleValue = 0;
        if (elementStyle && elementStyle !== '') {
          styleValue = parseFloat(elementStyle);
        }
        var newValue = styleValue + offset;
        // apply the change to the current element
        this.styleChanged(name,
            newValue + 'px',
            [element]);
      }
      else {
        this.styleChanged(name, value + 'px');
      }
    }, this);
  }
};


/**
 * alt changed
 * callback for inputs
 */
silex.view.pane.PropertyPane.prototype.onAltChanged =
    function(e) {
  // get the selected element
  var input = e.target;

  // apply the change to all elements
  if (input.value !== '') {
    this.propertyChanged('alt', input.value, null, true);
  }
  else {
    this.propertyChanged('alt', null, null, true);
  }
};


/**
 * title changed
 * callback for inputs
 */
silex.view.pane.PropertyPane.prototype.onTitleChanged =
    function(e) {
  // get the selected element
  var input = e.target;

  // apply the change to all elements
  if (input.value !== '') {
    this.propertyChanged('title', input.value);
  }
  else {
    this.propertyChanged('title');
  }
};


/**
 * redraw the properties
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.PropertyPane.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;

  // call super
  goog.base(this, 'redraw', selectedElements, pageNames, currentPageName);

  // not available for stage element
  var elementsNoStage = [];
  goog.array.forEach(selectedElements, function(element) {
    if (this.model.body.getBodyElement() !== element) {
      elementsNoStage.push(element);
    }
  }, this);
  if (elementsNoStage.length > 0) {
    // not stage element only
    this.leftInput.removeAttribute('disabled');
    this.topInput.removeAttribute('disabled');
    this.widthInput.removeAttribute('disabled');
    this.heightInput.removeAttribute('disabled');
    this.altInput.removeAttribute('disabled');
    this.titleInput.removeAttribute('disabled');

    // remember selection
    this.selectedElements = selectedElements;

    var bb = this.model.property.getBoundingBox(selectedElements);
    // display position and size
    this.topInput.value = bb.top || '0';
    this.leftInput.value = bb.left || '0';
    this.widthInput.value = bb.width || '0';
    this.heightInput.value = bb.height || '0';

    // special case of the background / main container only selected element
    if (selectedElements.length === 1) {
      if (
        goog.dom.classlist.contains(selectedElements[0], 'background') ||
        this.model.element.isSection(selectedElements[0]) ||
        this.model.element.isSectionContent(selectedElements[0]) ||
        this.isMobileMode()
      ) {
        this.topInput.value = '';
        this.leftInput.value = '';
      }
      if (this.model.element.isSection(selectedElements[0])) {
        this.widthInput.value = '';
      }
    }

    // alt, only for images
    var elementsType = this.getCommonProperty(selectedElements, function(element) {
      return element.getAttribute(silex.model.Element.TYPE_ATTR);
    });
    if (elementsType === silex.model.Element.TYPE_IMAGE) {
      this.altInput.removeAttribute('disabled');
      var alt = this.getCommonProperty(selectedElements, function(element) {
        var content = goog.dom.getElementByClass(silex.model.Element.ELEMENT_CONTENT_CLASS_NAME, element);
        if (content) {
          return content.getAttribute('alt');
        }
        return null;
      });
      if (alt) {
        this.altInput.value = alt;
      }
      else {
        this.altInput.value = '';
      }
    }
    else {
      this.altInput.value = '';
      this.altInput.setAttribute('disabled', true);
    }
    // title
    var title = this.getCommonProperty(selectedElements, function(element) {
      return element.getAttribute('title');
    });
    if (title) {
      this.titleInput.value = title;
    }
    else {
      this.titleInput.value = '';
    }
  }
  else {
    // stage element only
    this.leftInput.setAttribute('disabled', true);
    this.leftInput.value = '';
    this.topInput.setAttribute('disabled', true);
    this.topInput.value = '';
    this.widthInput.setAttribute('disabled', true);
    this.widthInput.value = '';
    this.heightInput.setAttribute('disabled', true);
    this.heightInput.value = '';
    this.altInput.setAttribute('disabled', true);
    this.altInput.value = '';
    this.titleInput.setAttribute('disabled', true);
    this.titleInput.value = '';
  }
  // keep track of old position and size
  this.topInput.setAttribute('data-prev-value', this.topInput.value);
  this.leftInput.setAttribute('data-prev-value', this.leftInput.value);
  this.widthInput.setAttribute('data-prev-value', this.widthInput.value);
  this.heightInput.setAttribute('data-prev-value', this.heightInput.value);

  this.iAmRedrawing = false;
};


/**
 * helper for other views,
 * because views (view.workspace.get/setMobileEditor) is not accessible from other views
 * FIXME: find another way to expose isMobileEditor to views
 */
silex.view.pane.PropertyPane.prototype.isMobileMode = function() {
  return goog.dom.classlist.contains(document.body, 'mobile-mode');
};

