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

goog.provide('silex.view.propertiesTool.BorderPane');

goog.require('goog.cssom');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.ColorButton');
goog.require('goog.editor.Field');

goog.require('goog.array');
goog.require('goog.object');

/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 */
silex.view.propertiesTool.BorderPane = function(element, onChanged){
	this.element = element;
	this.onChanged = onChanged;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.BorderPane.prototype.element;
/**
 * style to be edited
 */
silex.view.propertiesTool.BorderPane.prototype.style;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.BorderPane.prototype.onChanged;
/**
 * input element
 */
silex.view.propertiesTool.BorderPane.prototype.borderWidthInput;
/**
 * input element
 */
silex.view.propertiesTool.BorderPane.prototype.borderStyleComboBox;
/**
 * input element
 */
silex.view.propertiesTool.BorderPane.prototype.borderPlacementCheckBoxes;
/**
 * input element
 */
silex.view.propertiesTool.BorderPane.prototype.cornerRadiusInput;
/**
 * input element
 */
silex.view.propertiesTool.BorderPane.prototype.cornerPlacementCheckBoxes;
/**
 * color picker for border color
 */
silex.view.propertiesTool.BorderPane.prototype.borderColorPicker;
/**
 * color picker for border color
 */
silex.view.propertiesTool.BorderPane.prototype.hsvPalette;
/**
 * button to disable border
 */
silex.view.propertiesTool.BorderPane.prototype.noBorderButton;
/**
 * avoid loops on redraw
 */
silex.view.propertiesTool.BorderPane.prototype.isRedraw;
/**
 * build the UI
 */
silex.view.propertiesTool.BorderPane.prototype.buildUi = function(){
	// border width
	this.borderWidthInput = goog.dom.getElementByClass('border-width-input', this.element);
	goog.events.listen(this.borderWidthInput, 'change', this.onBorderChanged, false, this);
	// border style
	this.borderStyleComboBox = goog.ui.decorate(goog.dom.getElementByClass('border-type-combo-box', this.element));
	goog.events.listen(this.borderStyleComboBox, goog.ui.Component.EventType.CHANGE, this.onBorderChanged, false, this);

	// border color
	var hsvPaletteElement = goog.dom.getElementByClass('border-color-palette', this.element);
	this.hsvPalette = new goog.ui.HsvaPalette(null, null, null, 'goog-hsva-palette-sm');
	this.hsvPalette.render(hsvPaletteElement);
	goog.events.listen(this.hsvPalette, goog.ui.Component.EventType.ACTION, this.onBorderChanged, false, this);
	// init button which shows/hides the palete
	this.bgColorPicker = new goog.ui.ColorButton();
	this.bgColorPicker.setTooltip('Click to select color');
	this.bgColorPicker.render(goog.dom.getElementByClass('border-color-button', this.element));
	goog.events.listen(this.bgColorPicker, goog.ui.Component.EventType.ACTION, this.toggleColorPaletteVisibility, false, this);
	// init palette
	this.hsvPalette.setColorRgbaHex('#000000FF');
	this.setColorPaletteVisibility(false);
	// init the button to choose if there is a color or not
	this.noBorderButton = goog.dom.getElementByClass('enable-border-color-button', this.element);
	goog.events.listen(this.noBorderButton, goog.events.EventType.CLICK, this.onResetBorder, false, this);

	// border placement
	this.borderPlacementCheckBoxes = [];
	var decorateNodes = goog.dom.getElementsByTagNameAndClass('span', null, goog.dom.getElementByClass('border-placement-container', this.element));
	var idx;
	var len = decorateNodes.length;
	for (idx=0; idx<len; idx++) {
		var checkBox = goog.ui.decorate(decorateNodes[idx]);
		this.borderPlacementCheckBoxes.push(checkBox);
		goog.events.listen(checkBox, goog.ui.Component.EventType.CHANGE, this.onBorderChanged, false, this);
	}
	// corner radius
	this.cornerRadiusInput = goog.dom.getElementByClass('corner-radius-input', this.element);
	goog.events.listen(this.cornerRadiusInput, 'change', this.onBorderChanged, false, this);
	// corner placement
	this.cornerPlacementCheckBoxes = [];
	var decorateNodes = goog.dom.getElementsByTagNameAndClass('span', null, goog.dom.getElementByClass('corner-placement-container', this.element));
	var idx;
	var len = decorateNodes.length;
	for (idx=0; idx<len; idx++) {
		var checkBox = goog.ui.decorate(decorateNodes[idx]);
		this.cornerPlacementCheckBoxes.push(checkBox);
		goog.events.listen(checkBox, goog.ui.Component.EventType.CHANGE, this.onBorderChanged, false, this);
	}
}
/**
 * display the propertis of the component being edited
 */
silex.view.propertiesTool.BorderPane.prototype.setStyle = function(style){
	this.style = style;
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.BorderPane.prototype.redraw = function(){
	if (this.style && !this.isRedraw){
		this.isRedraw = true;
		// border width
		if (this.style.borderWidth){
			var values = this.style.borderWidth.split(' ');
			var val = values[0];
			this.borderWidthInput.value = val.substr(0, val.indexOf('px'));
			// border placement
			var idx;
			var len = this.borderPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.borderPlacementCheckBoxes[idx];
				if (values.length>idx && values[idx]!=='0')
					checkBox.setChecked(true);
				else
					checkBox.setChecked(false);
			}
			// border color
			var color = this.style.borderColor;
			if (color === undefined || color === 'transparent' || color === ''){
				this.bgColorPicker.setEnabled(false);
				this.setColorPaletteVisibility(false);
			}
			else{
				var hex = silex.Helper.rgbaToHex(color);
				this.bgColorPicker.setEnabled(true);
				this.bgColorPicker.setValue(hex.substring(0,7));
				this.hsvPalette.setColorRgbaHex(hex);
			}
		}
		else{
			this.borderWidthInput.value = '';
			// border placement
			var idx;
			var len = this.borderPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.borderPlacementCheckBoxes[idx];
				checkBox.setChecked(true);
			}
		}
		// border style
		if (this.style.borderStyle){
			this.borderStyleComboBox.setValue(this.style.borderStyle);
		}
		else{
			this.borderStyleComboBox.setSelectedIndex(0);
		}
		// border radius
		if (this.style.borderRadius){
			var values = this.style.borderRadius.split(' ');
			var val = values[0];
			this.cornerRadiusInput.value = val.substr(0, val.indexOf('px'));
			// corner placement
			var idx;
			var len = this.cornerPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.cornerPlacementCheckBoxes[idx];
				if (values.length>idx && values[idx]!=='0')
					checkBox.setChecked(true);
				else
					checkBox.setChecked(false);
			}
		}
		else{
			this.cornerRadiusInput.value = '';
			// corner placement
			var idx;
			var len = this.cornerPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.cornerPlacementCheckBoxes[idx];
				checkBox.setChecked(true);
			}
		}
		this.isRedraw = false;
	}
}
/**
 * property changed
 * callback for number inputs
 */
silex.view.propertiesTool.BorderPane.prototype.onBorderChanged = function(event){
	if (this.style && !this.isRedraw){
		if (this.borderWidthInput.value && this.borderWidthInput.value !== ''){
			// border placement
			var borderWidthStr = '';
			var idx;
			var len = this.borderPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.borderPlacementCheckBoxes[idx];
				if (checkBox.getChecked()){
					borderWidthStr += this.borderWidthInput.value + 'px ';
				}
				else{
					borderWidthStr += '0 ';
				}
			}
			// border width
			this.style.borderWidth = borderWidthStr;
			// border style
			this.style.borderStyle = this.borderStyleComboBox.getSelectedItem().getValue();
			// border color
			var hex = this.hsvPalette.getColorRgbaHex();
			var color = silex.Helper.hexToRgba(hex);
			this.style.borderColor = color;
			this.bgColorPicker.setValue(hex.substring(0,7));
		}
		else{
			this.style.borderWidth = 'none';
			this.style.borderStyle = 'none';
		}
		// corner radius
		if (this.cornerRadiusInput.value && this.cornerRadiusInput.value !== ''){
			// corner placement
			var borderWidthStr = '';
			var idx;
			var len = this.cornerPlacementCheckBoxes.length;
			for (idx=0; idx<len; idx++) {
				var checkBox = this.cornerPlacementCheckBoxes[idx];
				if (checkBox.getChecked()){
					borderWidthStr += this.cornerRadiusInput.value + 'px ';
				}
				else{
					borderWidthStr += '0 ';
				}
			}
			this.style.borderRadius = borderWidthStr;
		}
		else{
			this.style.borderRadius = 'none';
		}
		this.onChanged(this.style);
	}
}
/**
 * reset borders
 */
silex.view.propertiesTool.BorderPane.prototype.onResetBorder = function(event){
	this.borderWidthInput.value = '';
	this.onBorderChanged(event);
}
/**
 * color palette visibility
 */
silex.view.propertiesTool.BorderPane.prototype.toggleColorPaletteVisibility = function(){
	this.setColorPaletteVisibility(!this.getColorPaletteVisibility());
}
/**
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BorderPane.prototype.getColorPaletteVisibility = function(){
	return goog.style.getStyle(this.hsvPalette.getElement(), 'visibility') !== 'hidden';
}
/**
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BorderPane.prototype.setColorPaletteVisibility = function(isVisible){
	if (isVisible){
		if (!this.getColorPaletteVisibility()){
			goog.style.setStyle(this.hsvPalette.getElement(), 'visibility', null);
			goog.style.setStyle(this.hsvPalette.getElement(), 'position', null);
		}
	}
	else{
		if (this.getColorPaletteVisibility()){
			goog.style.setStyle(this.hsvPalette.getElement(), 'visibility', 'hidden');
			goog.style.setStyle(this.hsvPalette.getElement(), 'position', 'absolute');
		}
	}
}
