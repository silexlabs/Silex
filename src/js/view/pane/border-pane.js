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
 * Controls the borders params
 *
 */


goog.provide('silex.view.pane.BorderPane');
goog.require('goog.array');
goog.require('goog.cssom');
goog.require('goog.object');
goog.require('silex.view.pane.PaneBase');



/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 * @extends {silex.view.pane.PaneBase}
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller structure which holds
 *                                  the controller instances
 */
silex.view.pane.BorderPane = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // init the component
  this.buildUi();
  this.initEvents();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.BorderPane, silex.view.pane.PaneBase);


/**
 * input element
 */
silex.view.pane.BorderPane.prototype.borderWidthInput = null;


/**
 * input element
 */
silex.view.pane.BorderPane.prototype.borderStyleComboBox = null;


/**
 * input element
 * @type {Array.<HTMLInputElement>}
 */
silex.view.pane.BorderPane.prototype.borderPlacementCheckBoxes = null;


/**
 * input element
 */
silex.view.pane.BorderPane.prototype.borderRadiusInput = null;


/**
 * input element
 * @type {Array.<HTMLInputElement>}
 */
silex.view.pane.BorderPane.prototype.cornerPlacementCheckBoxes = null;


/**
 * color picker for border color
 */
silex.view.pane.BorderPane.prototype.colorPicker = null;


/**
 * build the UI
 */
silex.view.pane.BorderPane.prototype.buildUi = function() {
  // border width
  this.borderWidthInput = goog.dom.getElementByClass(
      'border-width-input',
      this.element);

  // border style
  this.borderStyleComboBox = this.element.querySelector('.border-type-combo-box');

  // border color
  this.colorPicker = new ColorPicker(this.element.querySelector('.color-edit-container'), value => this.onBorderColorChanged());

  // border placement
  this.borderPlacementCheckBoxes = [
    '.border-placement-container .top',
    '.border-placement-container .right',
    '.border-placement-container .bottom',
    '.border-placement-container .left',
  ].map(selector => this.initCheckBox(selector, e => this.onBorderWidthChanged()));

  // corner radius
  this.borderRadiusInput = goog.dom.getElementByClass(
      'corner-radius-input',
      this.element);

  // corner placement
  this.cornerPlacementCheckBoxes = [
    '.border-radius-container .top-left',
    '.border-radius-container .top-right',
    '.border-radius-container .bottom-right',
    '.border-radius-container .bottom-left',
  ].map(selector => this.initCheckBox(selector, e => this.onBorderCornerChanged()));

};


/**
 * attach events
 * called by the constructor
 */
silex.view.pane.BorderPane.prototype.initEvents = function() {
  goog.events.listen(this.borderWidthInput,
      goog.events.EventType.INPUT,
      this.onBorderWidthChanged,
      false,
      this);
  goog.events.listen(this.borderStyleComboBox,
      goog.ui.Component.EventType.CHANGE,
      this.onBorderStyleChanged,
      false,
      this);
  goog.events.listen(this.borderRadiusInput,
      goog.events.EventType.INPUT,
      this.onBorderCornerChanged,
      false,
      this);
};


/**
 * create and return checkboxes
 * query the HTML nodes
 * attach change event
 */
silex.view.pane.BorderPane.prototype.initCheckBox = function(cssSelector, onChanged) {
  var checkbox = this.element.querySelector(cssSelector);
  goog.events.listen(checkbox,
                     goog.ui.Component.EventType.CHANGE,
                     onChanged,
                     false,
                     this);
  return checkbox;
};


/**
 * redraw the properties
 */
silex.view.pane.BorderPane.prototype.redraw =
  function(selectedElements, pageNames, currentPageName) {
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;
  // call super
  goog.base(
      this,
      'redraw',
      selectedElements,
      pageNames,
      currentPageName);

  // border width, this builds a string like "0px 1px 2px 3px"
  // FIXME: should not build a string which is then split in redrawBorderWidth
  var borderWidth = this.getCommonProperty(
    selectedElements,
    goog.bind(function(element) {
      var w = this.model.element.getStyle(element, 'borderWidth');
      if (w && w != '') return w;
      else return null;
    }, this));


  // display width or reset borders if width is null
  if (borderWidth) {
    this.redrawBorderWidth(borderWidth);
    this.redrawBorderColor(selectedElements);
  }
  else {
    this.resetBorder();
  }
  // border style
  var borderStyle = this.getCommonProperty(
    selectedElements,
    goog.bind(function(element) {
      var style;
      style = this.model.element.getStyle(element, 'borderStyle');
      if (style) return style;
      return null;
    }, this)
  );
  if (borderStyle) {
    this.borderStyleComboBox.value = borderStyle;
  }
  else {
    this.borderStyleComboBox.selectedIndex = 0;
  }
  // border radius
  var borderRadiusStr = this.getCommonProperty(selectedElements, (element) => this.model.element.getStyle(element, 'borderRadius'));
  if (borderRadiusStr) {
    this.redrawBorderRadius(borderRadiusStr);
  }
  else {
    this.resetBorderRadius();
  }
  this.iAmRedrawing = false;
};


/**
 * redraw border color UI
 */
silex.view.pane.BorderPane.prototype.redrawBorderColor = function(selectedElements) {
  if(selectedElements.length > 0) {
    this.colorPicker.setDisabled(false);
    var color = this.getCommonProperty(
      selectedElements,
      goog.bind(function(element) {
        var w = this.model.element.getStyle(element, 'borderColor');
        return w || 'rgba(0,0,0,1)';
      }, this));
    // indeterminate state
    this.colorPicker.setIndeterminate(color == null);
    // display color
    if(color != null) {
      this.colorPicker.setColor(color);
    }
  }
  else {
    this.colorPicker.setDisabled(true);
  }
};


/**
 * redraw border radius UI
 */
silex.view.pane.BorderPane.prototype.redrawBorderRadius =
    function(borderWidth) {
  var values = borderWidth.split(' ');
  // get corner radius value, get the first non-zero value
  var val = values[0];
  if (goog.isDef(values[1]) && val === '0' || val === '0px') {
    val = values[1];
  }
  if (goog.isDef(values[2]) && val === '0' || val === '0px') {
    val = values[2];
  }
  if (goog.isDef(values[3]) && val === '0' || val === '0px') {
    val = values[3];
  }
  // remove unit when needed
  if (goog.isDef(val) && val !== '0' && val !== '0px') {
    this.borderRadiusInput.value = val.substr(0, val.indexOf('px'));
    // corner placement
    var idx;
    var len = this.cornerPlacementCheckBoxes.length;
    for (idx = 0; idx < len; idx++) {
      var checkBox = this.cornerPlacementCheckBoxes[idx];
      if (values[idx] !== '0' && values[idx] !== '0px') {
        checkBox.checked = true;
      }
      else {
        checkBox.checked = false;
      }
    }
  }
  else {
    this.resetBorderRadius();
  }
};


/**
 * redraw border width UI
 */
silex.view.pane.BorderPane.prototype.redrawBorderWidth = function(borderWidth) {
  // top, right, bottom, left
  var values = borderWidth.split(' ');
  // get the first non-zero value
  var val = values[0];
  if (goog.isDef(values[1]) && val === '0' || val === '0px') {
    val = values[1];
  }
  if (goog.isDef(values[2]) && val === '0' || val === '0px') {
    val = values[2];
  }
  if (goog.isDef(values[3]) && val === '0' || val === '0px') {
    val = values[3];
  }
  // if there is a non-zero value
  if (val !== '0' && val !== '0px') {
    this.borderWidthInput.value = val.substr(0, val.indexOf('px'));
    // border placement
    var len = this.borderPlacementCheckBoxes.length;
    for (var idx = 0; idx < len; idx++) {
      var checkBox = this.borderPlacementCheckBoxes[idx];
      if (values.length > idx && values[idx] !== '0' && values[idx] !== '0px') {
        checkBox.checked = true;
      }
      else {
        checkBox.checked = false;
      }
    }
  }
  else {
    this.resetBorder();
  }
};


/**
 * reset UI
 */
silex.view.pane.BorderPane.prototype.resetBorderRadius = function() {
  this.borderRadiusInput.value = '';
  // corner placement
  var idx;
  var len = this.cornerPlacementCheckBoxes.length;
  for (idx = 0; idx < len; idx++) {
    var checkBox = this.cornerPlacementCheckBoxes[idx];
    checkBox.checked = true;
  }
};


/**
 * reset UI
 */
silex.view.pane.BorderPane.prototype.resetBorder = function() {
  this.borderWidthInput.value = '';
  // border placement
  var idx;
  var len = this.borderPlacementCheckBoxes.length;
  for (idx = 0; idx < len; idx++) {
    var checkBox = this.borderPlacementCheckBoxes[idx];
    checkBox.checked = true;
  }
  // border color
  this.colorPicker.setColor('');
  this.colorPicker.setDisabled(true);
};


/**
 * property changed
 * callback for number inputs
 */
silex.view.pane.BorderPane.prototype.onBorderWidthChanged = function() {
  if (this.borderWidthInput.value &&
      this.borderWidthInput.value !== '' &&
      this.borderWidthInput.value !== '0') {
    // border color
    this.colorPicker.setDisabled(false);
    if(this.colorPicker.getColor() == null || this.colorPicker.getColor() === '') {
      this.colorPicker.setColor('rgba(0,0,0,1)');
    }
    // border placement
    var borderWidthStr = '';
    var idx;
    var len = this.borderPlacementCheckBoxes.length;
    for (idx = 0; idx < len; idx++) {
      var checkBox = this.borderPlacementCheckBoxes[idx];
      if (checkBox.checked) {
        borderWidthStr += this.borderWidthInput.value + 'px ';
      }
      else {
        borderWidthStr += '0 ';
      }
    }
    // reset indeterminate state (because all selected elements will be changed the same value)
    this.colorPicker.setIndeterminate(false);
    // border width
    this.styleChanged('borderWidth', borderWidthStr);
    // border style
    this.onBorderStyleChanged();
  }
  else {
    this.styleChanged('borderWidth', '');
    this.styleChanged('borderStyle', '');
    this.colorPicker.setDisabled(true);
  }
};


/**
 * property changed
 * callback for number inputs
 * border style
 */
silex.view.pane.BorderPane.prototype.onBorderStyleChanged = function() {
  // prevent changing border when redraw is setting the value
  if (this.iAmRedrawing) {
    return;
  }

  this.styleChanged(
      'borderStyle',
      this.borderStyleComboBox.value);
};


/**
 * property changed
 * callback for number inputs
 */
silex.view.pane.BorderPane.prototype.onBorderColorChanged = function() {
  this.styleChanged('borderColor', this.colorPicker.getColor());
};


/**
 * property changed
 * callback for number inputs
 */
silex.view.pane.BorderPane.prototype.onBorderCornerChanged = function() {
  // corner radius
  if (goog.isDef(this.borderRadiusInput.value) &&
      this.borderRadiusInput.value !== '') {
    // corner placement
    var borderWidthStr = '';
    var idx;
    var len = this.cornerPlacementCheckBoxes.length;
    for (idx = 0; idx < len; idx++) {
      var checkBox = this.cornerPlacementCheckBoxes[idx];
      if (checkBox.checked) {
        borderWidthStr += this.borderRadiusInput.value + 'px ';
      }
      else {
        borderWidthStr += '0 ';
      }
    }
    this.styleChanged('borderRadius', borderWidthStr);
  }
  else {
    this.styleChanged('borderRadius', '');
  }
};
