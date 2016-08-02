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
goog.require('goog.editor.Field');
goog.require('goog.object');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.HsvPalette');
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
 */
silex.view.pane.BorderPane.prototype.borderPlacementCheckBoxes = null;


/**
 * input element
 */
silex.view.pane.BorderPane.prototype.borderRadiusInput = null;


/**
 * input element
 */
silex.view.pane.BorderPane.prototype.cornerPlacementCheckBoxes = null;


/**
 * color picker for border color
 */
silex.view.pane.BorderPane.prototype.borderColorPicker = null;


/**
 * color picker for border color
 */
silex.view.pane.BorderPane.prototype.hsvPalette = null;


/**
 * build the UI
 */
silex.view.pane.BorderPane.prototype.buildUi = function() {
  // border width
  this.borderWidthInput = goog.dom.getElementByClass(
      'border-width-input',
      this.element);

  // border style
  this.borderStyleComboBox = goog.ui.decorate(
      goog.dom.getElementByClass(
        'border-type-combo-box',
        this.element));

  // border color
  var hsvPaletteElement = goog.dom.getElementByClass(
      'border-color-palette',
      this.element);
  this.hsvPalette = new goog.ui.HsvPalette(
      undefined,
      undefined,
      'goog-hsv-palette-sm');
  this.hsvPalette.render(hsvPaletteElement);

  // init button which shows/hides the palete
  this.colorPicker = new goog.ui.ColorButton('');
  this.colorPicker.setTooltip('Click to select color');
  this.colorPicker.render(
      goog.dom.getElementByClass('border-color-button',
      this.element));

  // init palette
  this.hsvPalette.setColor('#000000');
  this.setColorPaletteVisibility(this.hsvPalette, false);

  // border placement
  this.borderPlacementCheckBoxes = this.createCheckBoxes(
      [
        '.border-placement-container .top',
        '.border-placement-container .right',
        '.border-placement-container .bottom',
        '.border-placement-container .left',
      ],
      this.onBorderWidthChanged);

  // corner radius
  this.borderRadiusInput = goog.dom.getElementByClass(
      'corner-radius-input',
      this.element);

  // corner placement
  this.cornerPlacementCheckBoxes = this.createCheckBoxes(
      [
        '.border-radius-container .top-left',
        '.border-radius-container .top-right',
        '.border-radius-container .bottom-right',
        '.border-radius-container .bottom-left',
      ],
      this.onBorderCornerChanged);
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
  goog.events.listen(this.hsvPalette,
      goog.ui.Component.EventType.ACTION,
      this.onBorderColorChanged,
      false,
      this);
  goog.events.listen(this.colorPicker,
      goog.ui.Component.EventType.ACTION,
      this.toggleColorPaletteVisibility,
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
 * decorate the HTML nodes
 * attach change event
 */
silex.view.pane.BorderPane.prototype.createCheckBoxes =
  function(cssSelectors, onChanged) {
  var checkBoxes = [];
  var idx;
  var len = cssSelectors.length;
  for (idx = 0; idx < len; idx++) {
    var decorateNode = this.element.querySelector(cssSelectors[idx]);
    var checkBox = goog.ui.decorate(decorateNode);
    checkBoxes.push(checkBox);
    goog.events.listen(checkBox,
                       goog.ui.Component.EventType.CHANGE,
                       onChanged,
                       false,
                       this);
  }
  return checkBoxes;
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

  // border color
  var borderColor = this.getCommonProperty(
    selectedElements,
    goog.bind(function(element) {
      var w = this.model.element.getStyle(element, 'borderColor');
      if (w && w !== '') return w;
      return null;
    }, this)
  );
  this.redrawBorderColor(borderColor);

  // display width or reset borders if width is null
  if (borderWidth) {
    this.redrawBorderWidth(borderWidth);
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
    this.borderStyleComboBox.setValue(borderStyle);
  }
  else {
    this.borderStyleComboBox.setSelectedIndex(0);
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
        checkBox.setChecked(true);
      }
      else {
        checkBox.setChecked(false);
      }
    }
  }
  else {
    this.resetBorderRadius();
  }
};


/**
 * redraw border color UI
 */
silex.view.pane.BorderPane.prototype.redrawBorderColor =
    function(borderColorStr) {
  if (borderColorStr === 'transparent' || borderColorStr === '') {
    this.setColorPaletteVisibility(this.hsvPalette, false);
  }
  else if (goog.isNull(borderColorStr)) {
    // display a "no color" in the button
    this.colorPicker.setValue('#000000');
  }
  else {
    // handle all colors, including the named colors
    var borderColor = goog.color.parse(borderColorStr);

    this.colorPicker.setValue(borderColor.hex);
    this.hsvPalette.setColor(borderColor.hex);
  }
};


/**
 * redraw border width UI
 */
silex.view.pane.BorderPane.prototype.redrawBorderWidth = function(borderWidth) {
  this.colorPicker.setEnabled(true);
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
        checkBox.setChecked(true);
      }
      else {
        checkBox.setChecked(false);
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
    checkBox.setChecked(true);
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
    checkBox.setChecked(true);
  }
  // border color
  this.colorPicker.setValue('#000000');
  this.hsvPalette.setColor('#000000');
  this.setColorPaletteVisibility(this.hsvPalette, false);
  this.colorPicker.setEnabled(false);
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
    this.colorPicker.setEnabled(true);
    // border placement
    var borderWidthStr = '';
    var idx;
    var len = this.borderPlacementCheckBoxes.length;
    for (idx = 0; idx < len; idx++) {
      var checkBox = this.borderPlacementCheckBoxes[idx];
      if (checkBox.getChecked()) {
        borderWidthStr += this.borderWidthInput.value + 'px ';
      }
      else {
        borderWidthStr += '0 ';
      }
    }
    // border width
    this.styleChanged('borderWidth', borderWidthStr);
    // border style
    this.onBorderStyleChanged();
  }
  else {
    this.styleChanged('borderWidth', '');
    this.styleChanged('borderStyle', '');
    this.colorPicker.setEnabled(false);
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
      this.borderStyleComboBox.getSelectedItem().getValue());
};


/**
 * property changed
 * callback for number inputs
 */
silex.view.pane.BorderPane.prototype.onBorderColorChanged = function() {
  var hex = this.hsvPalette.getColor();
  this.styleChanged('borderColor', hex);
  this.colorPicker.setValue(hex);
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
      if (checkBox.getChecked()) {
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


/**
 * reset borders
 *
silex.view.pane.BorderPane.prototype.onResetBorder = function() {
  this.borderWidthInput.value = '';
  this.onBorderWidthChanged();
};
/* */


/**
 * color palette visibility
 */
silex.view.pane.BorderPane.prototype.toggleColorPaletteVisibility = function() {
  this.setColorPaletteVisibility(this.hsvPalette, !this.getColorPaletteVisibility(this.hsvPalette));
};
