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

goog.provide('silex.view.propertiesTool.BgEditor');

goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabBar');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.ColorButton');

goog.require('goog.array');
goog.require('goog.object');

/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 */
silex.view.propertiesTool.BgEditor = function(element, styleChanged, selectImage){
	this.element = element;
	this.styleChanged = styleChanged;
	this.selectImage = selectImage;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.BgEditor.prototype.element;
/**
 * style to be edited
 */
silex.view.propertiesTool.BgEditor.prototype.style;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.BgEditor.prototype.styleChanged;
/**
 * callback to call to let the user choose a background image
 */
silex.view.propertiesTool.BgEditor.prototype.selectImage;
/**
 * color picker for background color
 */
silex.view.propertiesTool.BgEditor.prototype.bgColorPicker;
/**
 * color picker for background color
 */
silex.view.propertiesTool.BgEditor.prototype.hsvPalette;
/**
 * check box for background color transparency
 */
silex.view.propertiesTool.BgEditor.prototype.transparentBgCheckbox;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgEditor.prototype.bgSelectBgImage;
silex.view.propertiesTool.BgEditor.prototype.bgClearBgImage;
/**
 * build the UI
 */
silex.view.propertiesTool.BgEditor.prototype.buildUi = function(){
	// BG color
	var hsvPaletteElement = goog.dom.getElementByClass('color-bg-palette', this.element);
	this.hsvPalette = new goog.ui.HsvaPalette(null, null, null, 'goog-hsva-palette-sm');
	this.hsvPalette.render(hsvPaletteElement);

	// User has selected a color
	goog.events.listen(this.hsvPalette, goog.ui.Component.EventType.ACTION, this.onColorChanged, false, this);

	// init button which shows/hides the palete
	this.bgColorPicker = new goog.ui.ColorButton();
	this.bgColorPicker.setTooltip('Click to select color');
	this.bgColorPicker.render(goog.dom.getElementByClass('color-bg-button'));
	goog.events.listen(this.bgColorPicker, goog.ui.Component.EventType.ACTION, this.onBgColorButton, false, this);
	
	// init palette
	this.hsvPalette.setColorRgbaHex('#FFFFFFFF');
	this.setColorPaletteVisibility(false);

	// init the button to choose if there is a color or not
	this.transparentBgCheckbox = new goog.ui.Checkbox();
	this.transparentBgCheckbox.decorate(goog.dom.getElementByClass('enable-color-bg-button'), this.element);
	goog.events.listen(this.transparentBgCheckbox, goog.ui.Component.EventType.CHANGE, this.onTransparentChanged, false, this);

	// add bg image
	var buttonElement = goog.dom.getElementByClass('bg-image-button');
	this.bgSelectBgImage = new goog.ui.CustomButton();
	this.bgSelectBgImage.decorate(buttonElement);
	this.bgSelectBgImage.setTooltip('Click to select a file');
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, this.onSelectImageButton, false, this);

	// remove bg image
	var buttonElement = goog.dom.getElementByClass('clear-bg-image-button');
	this.bgClearBgImage = new goog.ui.CustomButton();
	this.bgClearBgImage.setTooltip('Click to select a file');
	this.bgClearBgImage.decorate(buttonElement);
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, this.onClearImageButton, false, this);
}
/**
 * display the style of the element being edited 
 */
silex.view.propertiesTool.BgEditor.prototype.setStyle = function(style){
	this.style = style;
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.BgEditor.prototype.redraw = function(){
		// BG color
	var color = this.style.backgroundColor;
	if (color == undefined || color == 'transparent' || color == ''){
		this.transparentBgCheckbox.setChecked(true);
		this.bgColorPicker.setEnabled(false);
		this.setColorPaletteVisibility(false)
	}
	else{
		var hex = silex.Helper.rgbaToHex(color);

		this.transparentBgCheckbox.setChecked(false);
		this.bgColorPicker.setEnabled(true);
		this.bgColorPicker.setValue(hex.substring(0,7));
		this.hsvPalette.setColorRgbaHex(hex);
	}
	// BG image
	if (this.style.backgroundImage!=null && this.style.backgroundImage!='none' && this.style.backgroundImage!=''){
		this.bgClearBgImage.setEnabled(true);
	}
	else{
		this.bgClearBgImage.setEnabled(false);
	}
}
/** 
 * User has selected a color
 */
silex.view.propertiesTool.BgEditor.prototype.onColorChanged = function(event){
	// update style
	var color = silex.Helper.hexToRgba(this.hsvPalette.getColorRgbaHex());
	if (this.style==null) this.style = {};
	this.style.backgroundColor = color;
	// notify the toolbox
	this.styleChanged(this.style);
}
/** 
 * User has clicked on the color button
 * open or close the palete
 */
silex.view.propertiesTool.BgEditor.prototype.onBgColorButton = function(event){
	// show the palette
	if (this.getColorPaletteVisibility() == false){
		this.hsvPalette.setColorRgbaHex(silex.Helper.rgbaToHex(this.style.backgroundColor));
		this.setColorPaletteVisibility(true);
	}
	else{
		this.setColorPaletteVisibility(false);
	}
}
/** 
 * User has clicked the transparent checkbox
 */
silex.view.propertiesTool.BgEditor.prototype.onTransparentChanged = function(event){
	// update style
	if (this.transparentBgCheckbox.getChecked()==false){
		var color = silex.Helper.hexToRgba(this.hsvPalette.getColorRgbaHex());
		if (color==null) {
			//color='#FFFFFF';
			color = 'rgba(255, 255, 255, 1)'
		}
		this.style.backgroundColor = color;
	}
	else{
		this.style.backgroundColor = 'transparent';
	}
	// notify the toolbox
	this.styleChanged(this.style)
}
/** 
 * User has clicked the select image button
 */
silex.view.propertiesTool.BgEditor.prototype.onSelectImageButton = function(event){
	this.selectImage();
}
/** 
 * User has selected an image
 */
silex.view.propertiesTool.BgEditor.prototype.setBgImage = function(url){
	// update style
	var backgroundImage = url;
	goog.style.setStyle(this.getElement(), 'backgroundImage', 'url(' + backgroundImage + ')');
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style);
}
/** 
 * User has clicked the clear image button
 */
silex.view.propertiesTool.BgEditor.prototype.onClearImageButton = function(event){
	// update style
	this.style.backgroundImage = none;
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style)
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BgEditor.prototype.getColorPaletteVisibility = function(){
	return goog.style.getStyle(this.hsvPalette.getElement(), 'visibility') != 'hidden';
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BgEditor.prototype.setColorPaletteVisibility = function(isVisible){
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
