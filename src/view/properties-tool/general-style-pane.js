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

goog.provide('silex.view.propertiesTool.GeneralStylePane');

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
silex.view.propertiesTool.GeneralStylePane = function(element, styleChanged){
	this.element = element;
	this.styleChanged = styleChanged;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.GeneralStylePane.prototype.element;
/**
 * style to be edited
 */
silex.view.propertiesTool.GeneralStylePane.prototype.style;
/**
 * avoid loops on redraw
 */
silex.view.propertiesTool.GeneralStylePane.prototype.isRedraw;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.GeneralStylePane.prototype.styleChanged;
/**
 * opacity input
 */
silex.view.propertiesTool.GeneralStylePane.prototype.opacityInput;
/**
 * build the UI
 */
silex.view.propertiesTool.GeneralStylePane.prototype.buildUi = function(){
	// opacity
	this.opacityInput = goog.dom.getElementByClass('opacity-input');
	goog.events.listen(this.opacityInput, 'change', this.onInputChanged, false, this);
}
/**
 * display the style of the element being edited
 */
silex.view.propertiesTool.GeneralStylePane.prototype.setStyle = function(style){
	this.style = style;
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.GeneralStylePane.prototype.redraw = function(){
	if (this.style && !this.isRedraw){
		this.isRedraw = true;

		if (this.style.opacity){
			this.opacityInput.value = this.style.opacity;
		}
		else{
			this.opacityInput.value = '';
		}
		this.isRedraw = false;
	}
}
/**
 * User has selected a color
 */
silex.view.propertiesTool.GeneralStylePane.prototype.onInputChanged = function(event){
	if (this.style && !this.isRedraw){
	 	if(this.opacityInput.value && this.opacityInput.value!=''){
			this.style.opacity = this.opacityInput.value;
		}
		else{
			this.style.opacity = 'none';
		}
		// notify the toolbox
		this.styleChanged(this.style);
		// redraw to reflect changes
		this.redraw();
	}
}
