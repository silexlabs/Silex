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
 * Controls the background params
 *
 */


goog.provide('silex.view.pane.BgPane');
goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.ui.ColorButton');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.TabBar');
goog.require('silex.utils.Style');
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
silex.view.pane.BgPane = function(element, model, controller) {
  // call super
  goog.base(this, element, model, controller);
  // init the component
  this.buildUi();
};

// inherit from silex.view.PaneBase
goog.inherits(silex.view.pane.BgPane, silex.view.pane.PaneBase);


/**
 * build the UI
 */
silex.view.pane.BgPane.prototype.buildUi = function() {
  // BG color
  this.buildBgColor();

  // init palette
  this.buildPalette();

  // init bg image
  this.buildBgImage();

  // bg image properties
  this.buildBgImageProperties();
};


/**
 * build the UI
 */
silex.view.pane.BgPane.prototype.buildPalette = function() {
  var hsvPaletteElement = goog.dom.getElementByClass(
      'color-bg-palette',
      this.element);

  this.hsvPalette = new goog.ui.HsvaPalette(undefined,
                                            undefined,
                                            undefined,
                                            'goog-hsva-palette-sm');

  // render the element
  this.hsvPalette.render(hsvPaletteElement);

  // init palette
  this.hsvPalette.setColorRgbaHex('#FFFFFFFF');
  this.setColorPaletteVisibility(this.hsvPalette, false);

  // User has selected a color
  goog.events.listen(this.hsvPalette,
                     goog.ui.Component.EventType.ACTION,
                     this.onColorChanged,
                     false,
                     this);
};


/**
 * build the UI
 */
silex.view.pane.BgPane.prototype.buildBgColor = function() {
  // BG color
  // init button which shows/hides the palete
  this.bgColorPicker = new goog.ui.ColorButton('');
  this.bgColorPicker.setTooltip('Click to select color');
  this.bgColorPicker.render(goog.dom.getElementByClass(
      'color-bg-button',
      this.element));

  // init the button to choose if there is a color or not
  this.transparentBgCheckbox = this.element.querySelector('.enable-color-bg-button');

  // the user opens/closes the palete
  goog.events.listen(this.bgColorPicker,
                     goog.ui.Component.EventType.ACTION,
                     this.onBgColorButton,
                     false,
                     this);

  // user set transparent bg
  goog.events.listen(this.transparentBgCheckbox,
                     goog.ui.Component.EventType.CHANGE,
                     this.onTransparentChanged,
                     false,
                     this);
};


/**
 * build the UI
 */
silex.view.pane.BgPane.prototype.buildBgImage = function() {
  // add bg image button
  this.bgSelectBgImage = this.element.querySelector('.bg-image-button')

  // remove bg image button
  this.bgClearBgImage = this.element.querySelector('.clear-bg-image-button')

  // event user wants to update the bg image
  goog.events.listen(this.bgSelectBgImage,
      goog.events.EventType.CLICK,
      this.onSelectImageButton,
      false,
      this);

  // event user wants to remove the bg image
  goog.events.listen(this.bgClearBgImage,
      goog.events.EventType.CLICK,
      this.onClearImageButton,
      false,
      this);
};


/**
 * build the UI
 */
silex.view.pane.BgPane.prototype.buildBgImageProperties = function() {
  // bg image properties
  this.attachmentComboBox = this.initComboBox('.bg-attachment-combo-box',
      goog.bind(function(event) {
        this.styleChanged(
            'backgroundAttachment',
            event.target.value);
      }, this));
  this.vPositionComboBox = this.initComboBox('.bg-position-v-combo-box',
      goog.bind(function(event) {
        var hPosition = this.hPositionComboBox.value;
        var vPosition = this.vPositionComboBox.value;
        this.styleChanged(
            'backgroundPosition',
            vPosition + ' ' + hPosition);
      }, this));
  this.hPositionComboBox = this.initComboBox('.bg-position-h-combo-box',
      goog.bind(function(event) {
        var hPosition = this.hPositionComboBox.value;
        var vPosition = this.vPositionComboBox.value;
        this.styleChanged(
            'backgroundPosition',
            vPosition + ' ' + hPosition);
      }, this));
  this.repeatComboBox = this.initComboBox('.bg-repeat-combo-box',
      goog.bind(function(event) {
        this.styleChanged(
            'backgroundRepeat',
            event.target.value);
      }, this));
  this.sizeComboBox = this.initComboBox('.bg-size-combo-box',
      goog.bind(function(event) {
        this.styleChanged(
            'backgroundSize',
            event.target.value);
      }, this));
};


/**
 * redraw the properties
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.pane.BgPane.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
  if (this.iAmSettingValue) {
    return;
  }
  this.iAmRedrawing = true;
  // call super
  goog.base(this, 'redraw', selectedElements, pageNames, currentPageName);

  // remember selection
  this.selectedElements = selectedElements;
  this.pageNames = pageNames;
  this.currentPageName = currentPageName;

  // BG color
  var color = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundColor');
  }, this));
  if (color === null || color === 'transparent' || color === '') {
    this.transparentBgCheckbox.checked = true;
    this.bgColorPicker.setEnabled(false);
    this.setColorPaletteVisibility(this.hsvPalette, false);
  }
  else {
    // handle all colors, including the named colors
    color = silex.utils.Style.rgbaToHex(color);

    this.transparentBgCheckbox.checked = false;
    this.bgColorPicker.setEnabled(true);
    this.hsvPalette.setColorRgbaHex(color);
    this.bgColorPicker.setValue(this.hsvPalette.getColor());
  }
  // BG image
  var enableBgComponents = goog.bind(function(enable) {
    if(enable) this.bgClearBgImage.classList.remove('disabled');
    else this.bgClearBgImage.classList.add('disabled');
    this.attachmentComboBox.disabled = !enable;
    this.vPositionComboBox.disabled = !enable;
    this.hPositionComboBox.disabled = !enable;
    this.repeatComboBox.disabled = !enable;
    this.sizeComboBox.disabled = !enable;
  }, this);
  var bgImage = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundImage');
  }, this));
  if (bgImage !== null &&
      bgImage !== 'none' &&
      bgImage !== '') {
    enableBgComponents(true);
  }
  else {
    enableBgComponents(false);
  }
  // bg image attachment
  var bgImageAttachment = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundAttachment');
  }, this));
  if (bgImageAttachment) {
    this.attachmentComboBox.value = bgImageAttachment;
  }
  else {
    this.attachmentComboBox.selectedIndex = 0;
  }
  // bg image position
  var bgImagePosition = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundPosition');
  }, this));
  if (bgImagePosition) {
    // convert 50% in cennter
    var posArr = bgImagePosition.split(' ');
    var hPosition = posArr[0] || 'left';
    var vPosition = posArr[1] || 'top';

    // convert 0% by left, 50% by center, 100% by right
    hPosition = hPosition
    .replace('100%', 'right')
    .replace('50%', 'center')
    .replace('0%', 'left');

    // convert 0% by top, 50% by center, 100% by bottom
    vPosition = vPosition
    .replace('100%', 'bottom')
    .replace('50%', 'center')
    .replace('0%', 'top');
    // update the drop down lists to display the bg image position
    this.vPositionComboBox.value = vPosition;
    this.hPositionComboBox.value = hPosition;
  }
  else {
    this.vPositionComboBox.selectedIndex = 0;
    this.hPositionComboBox.selectedIndex = 0;
  }
  // bg image repeat
  var bgImageRepeat = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundRepeat');
  }, this));
  if (bgImageRepeat) {
    this.repeatComboBox.value = bgImageRepeat;
  }
  else {
    this.repeatComboBox.selectedIndex = 0;
  }
  // bg image size
  var bgImageSize = this.getCommonProperty(selectedElements, goog.bind(function(element) {
    return this.model.element.getStyle(element, 'backgroundSize');
  }, this));
  if (bgImageSize) {
    this.sizeComboBox.value = bgImageSize;
  }
  else {
    this.sizeComboBox.selectedIndex = 0;
  }
  this.iAmRedrawing = false;
};


/**
 * User has selected a color
 */
silex.view.pane.BgPane.prototype.onColorChanged = function() {
  if (this.iAmRedrawing) {
    return;
  }
  var color = silex.utils.Style.hexToRgba(this.hsvPalette.getColorRgbaHex());
  // update the button
  this.bgColorPicker.setValue(this.hsvPalette.getColor());

  // notify the toolbox
  this.styleChanged('backgroundColor', color);
};


/**
 * User has clicked on the color button
 * open or close the palete
 */
silex.view.pane.BgPane.prototype.onBgColorButton = function() {
  var element = this.selectedElements[0];
  // show the palette
  if (this.getColorPaletteVisibility(this.hsvPalette) === false) {
    var color = this.model.element.getStyle(element, 'backgroundColor') || 'rgba(255, 255, 255, 1)';
    this.hsvPalette.setColorRgbaHex(
      silex.utils.Style.rgbaToHex(color)
    );
    this.setColorPaletteVisibility(this.hsvPalette, true);
  }
  else {
    this.setColorPaletteVisibility(this.hsvPalette, false);
  }
};


/**
 * Create a combo box
 */
silex.view.pane.BgPane.prototype.initComboBox = function(selector, onChange) {
  // create the combo box
  var comboBox = this.element.querySelector(selector);

  // attach event
  goog.events.listen(comboBox, goog.ui.Component.EventType.CHANGE,
      goog.bind(function(event) {
        if (onChange && !this.iAmRedrawing) {
          onChange(event);
        }
      }, this));
  // return the google closure object
  return comboBox;
};


/**
 * User has clicked the transparent checkbox
 */
silex.view.pane.BgPane.prototype.onTransparentChanged = function() {
  if (this.iAmRedrawing) {
    return;
  }
  var color = 'transparent';
  if (this.transparentBgCheckbox.checked === false) {
    color = silex.utils.Style.hexToRgba(this.hsvPalette.getColorRgbaHex());
    if (!color) {
      color = 'rgba(255, 255, 255, 1)';
    }
  }
  // notify the toolbox
  this.styleChanged('backgroundColor', color);
  // redraw myself (styleChange prevent myself to redraw)
  this.redraw(this.selectedElements, this.pageNames, this.currentPageName);
};


/**
 * User has clicked the select image button
 */
silex.view.pane.BgPane.prototype.onSelectImageButton = function() {
  this.controller.propertyToolController.browseBgImage();
};


/**
 * User has clicked the clear image button
 */
silex.view.pane.BgPane.prototype.onClearImageButton = function() {
  this.styleChanged('backgroundImage', '');
};
