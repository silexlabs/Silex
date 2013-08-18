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

goog.provide('silex.view.propertiesTool.BgPane');

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
silex.view.propertiesTool.BgPane = function(element, styleChanged, selectImage){
	this.element = element;
	this.styleChanged = styleChanged;
	this.selectImage = selectImage;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.BgPane.prototype.element;
/**
 * style to be edited
 */
silex.view.propertiesTool.BgPane.prototype.style;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.BgPane.prototype.styleChanged;
/**
 * callback to call to let the user choose a background image
 */
silex.view.propertiesTool.BgPane.prototype.selectImage;
/**
 * color picker for background color
 */
silex.view.propertiesTool.BgPane.prototype.bgColorPicker;
/**
 * color picker for background color
 */
silex.view.propertiesTool.BgPane.prototype.hsvPalette;
/**
 * check box for background color transparency
 */
silex.view.propertiesTool.BgPane.prototype.transparentBgCheckbox;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.bgSelectBgImage;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.bgClearBgImage;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.attachementComboBox;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.vPositionComboBox;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.hPositionComboBox;
/**
 * controls for background image
 */
silex.view.propertiesTool.BgPane.prototype.repeatComboBox;
/**
 * build the UI
 */
silex.view.propertiesTool.BgPane.prototype.buildUi = function(){
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

	// bg image properties
    this.attachementComboBox = goog.ui.decorate(goog.dom.getElementByClass('bg-attachement-combo-box'));
    this.vPositionComboBox = goog.ui.decorate(goog.dom.getElementByClass('bg-position-v-combo-box'));
    this.hPositionComboBox = goog.ui.decorate(goog.dom.getElementByClass('bg-position-h-combo-box'));
    this.repeatComboBox = goog.ui.decorate(goog.dom.getElementByClass('bg-repeat-combo-box'));
	goog.events.listen(this.attachementComboBox, goog.ui.Component.EventType.CHANGE, function (event) {
		this.setBgImageAttachement(event.target.getSelectedItem().getId());
	}, false, this);
	goog.events.listen(this.vPositionComboBox, goog.ui.Component.EventType.CHANGE, function (event) {
		var hPosition = this.hPositionComboBox.getSelectedItem().getId();
		var vPosition = this.vPositionComboBox.getSelectedItem().getId();
		this.setBgImagePosition(vPosition+' '+hPosition);
	}, false, this);
	goog.events.listen(this.hPositionComboBox, goog.ui.Component.EventType.CHANGE, function (event) {
		var hPosition = this.hPositionComboBox.getSelectedItem().getId();
		var vPosition = this.vPositionComboBox.getSelectedItem().getId();
		this.setBgImagePosition(vPosition+' '+hPosition);
	}, false, this);
	goog.events.listen(this.repeatComboBox, goog.ui.Component.EventType.CHANGE, function (event) {
		this.setBgImageRepeat(event.target.getSelectedItem().getId());
	}, false, this);
}
/**
 * display the style of the element being edited 
 */
silex.view.propertiesTool.BgPane.prototype.setStyle = function(style){
	this.style = style;
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.BgPane.prototype.redraw = function(){
	if(this.isRedraw == false){
		this.isRedraw = true;

		if (this.style == null)
			this.style = {};

		// BG color
		var color = this.style.backgroundColor;
		if (color == undefined || color == 'transparent' || color == ''){
			this.transparentBgCheckbox.setChecked(true);
			this.bgColorPicker.setEnabled(false);
			this.setColorPaletteVisibility(false);
		}
		else{
			var hex = silex.Helper.rgbaToHex(color);

			this.transparentBgCheckbox.setChecked(false);
			this.bgColorPicker.setEnabled(true);
			this.bgColorPicker.setValue(hex.substring(0,7));
			this.hsvPalette.setColorRgbaHex(hex);
		}
		// BG image
		console.log(this.style);
		if (this.style.backgroundImage!=null && this.style.backgroundImage!='none' && this.style.backgroundImage!=''){
			this.bgClearBgImage.setEnabled(true);
		}
		else{
			this.bgClearBgImage.setEnabled(false);
		}
		// workaround "backgroundImage not set"
		this.bgClearBgImage.setEnabled(true);
		if (this.style.backgroundAttachement != null){
			switch(this.style.backgroundAttachement){
				case 'scroll':
					this.attachementComboBox.setSelectedIndex(0);
					break;
				case 'fixed':
					this.attachementComboBox.setSelectedIndex(1);
					break;
				case 'local':
					this.attachementComboBox.setSelectedIndex(2);
					break;
			}
		}
		else{
			this.attachementComboBox.setSelectedIndex(0);
		}
		if (this.style.backgroundPosition != null){
			var posArr = this.style.backgroundPosition.split(' ');
			var vPosition = posArr[0];
			var hPosition = posArr[1];
			console.log(vPosition, hPosition);
			switch(vPosition){
				case 'top':
					this.vPositionComboBox.setSelectedIndex(0);
					break;
				case 'center':
					this.vPositionComboBox.setSelectedIndex(1);
					break;
				case 'bottom':
					this.vPositionComboBox.setSelectedIndex(2);
					break;
			}
			switch(hPosition){
				case 'left':
					this.hPositionComboBox.setSelectedIndex(0);
					break;
				case 'center':
					this.hPositionComboBox.setSelectedIndex(1);
					break;
				case 'right':
					this.hPositionComboBox.setSelectedIndex(2);
					break;
			}
		}
		else{
			this.vPositionComboBox.setSelectedIndex(0);
			this.hPositionComboBox.setSelectedIndex(0);
		}
		if (this.style.backgroundRepeat != null){
			switch(this.style.backgroundRepeat){
				case 'repeat':
					this.repeatComboBox.setSelectedIndex(0);
					break;
				case 'repeat-x':
					this.repeatComboBox.setSelectedIndex(1);
					break;
				case 'repeat-y':
					this.repeatComboBox.setSelectedIndex(2);
					break;
				case 'no-repeat':
					this.repeatComboBox.setSelectedIndex(3);
					break;
				case 'inherit':
					this.repeatComboBox.setSelectedIndex(4);
					break;
			}
		}
		else{
			this.repeatComboBox.setSelectedIndex(0);
		}
	}
	this.isRedraw = false;
}
/** 
 * User has selected a color
 */
silex.view.propertiesTool.BgPane.prototype.onColorChanged = function(event){
	console.log('onColorChanged');
	// update style
	var color = silex.Helper.hexToRgba(this.hsvPalette.getColorRgbaHex());
	if (this.style==null) this.style = {};
	this.style.backgroundColor = color;
	// notify the toolbox
	this.styleChanged(this.style);
	// redraw to reflect changes
	this.redraw();
}
/** 
 * User has clicked on the color button
 * open or close the palete
 */
silex.view.propertiesTool.BgPane.prototype.onBgColorButton = function(event){
	console.log('onBgColorButton');
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
silex.view.propertiesTool.BgPane.prototype.onTransparentChanged = function(event){
	console.log('onTransparentChanged');
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
	// redraw to reflect changes
	this.redraw();
}
/** 
 * User has clicked the select image button
 */
silex.view.propertiesTool.BgPane.prototype.onSelectImageButton = function(event){
	console.log('onSelectImageButton');
	this.selectImage();
}
/** 
 * User has selected an image 
 * called by controller
 */
silex.view.propertiesTool.BgPane.prototype.setBgImage = function(url){
	console.log('setBgImage', url, this.style)
	// update style
	var backgroundImage = url;
	this.style.backgroundImage = 'url(\'' + backgroundImage + '\')';
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style);
	// redraw to reflect changes
	this.redraw();
}
/** 
 * Property changed callback
 */
silex.view.propertiesTool.BgPane.prototype.setBgImageAttachement = function(value){
	console.log('setBgImageAttachement', value, this.style)
	// update style
	this.style.backgroundAttachement = value;
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style);
	// redraw to reflect changes
	this.redraw();
}
/** 
 * Property changed callback
 */
silex.view.propertiesTool.BgPane.prototype.setBgImagePosition = function(value){
	console.log('setBgImagePosition', value, this.style)
	// update style
	this.style.backgroundPosition = value;
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style);
	// redraw to reflect changes
	this.redraw();
}
/** 
 * Property changed callback
 */
silex.view.propertiesTool.BgPane.prototype.setBgImageRepeat = function(value){
	console.log('setBgImageRepeat', value, this.style)
	// update style
	this.style.backgroundRepeat = value;
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style);
	// redraw to reflect changes
	this.redraw();
}
/** 
 * User has clicked the clear image button
 */
silex.view.propertiesTool.BgPane.prototype.onClearImageButton = function(event){
	console.log('onClearImageButton');
	// update style
	this.style.backgroundImage = 'none';
	// apply to the element and store it in the context attribute
	this.styleChanged(this.style)
	// redraw to reflect changes
	this.redraw();
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BgPane.prototype.getColorPaletteVisibility = function(){
	return goog.style.getStyle(this.hsvPalette.getElement(), 'visibility') != 'hidden';
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.propertiesTool.BgPane.prototype.setColorPaletteVisibility = function(isVisible){
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
