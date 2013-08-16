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

goog.provide('silex.view.propertiesTool.PropertyPane');

goog.require('goog.array');
goog.require('goog.object');

/**
 * on of Silex Editors class
 * let user edit style of components
 * @constructor
 */
silex.view.propertiesTool.PropertyPane = function(element, propertyChanged, editText, selectImage){
	this.element = element;
	this.propertyChanged = propertyChanged;
	this.editText = editText;
	this.selectImage = selectImage;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.PropertyPane.prototype.element;
/**
 * component to be edited
 */
silex.view.propertiesTool.PropertyPane.prototype.component;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.PropertyPane.prototype.propertyChanged;
/**
 * callback to call to let the user edit the text content of the component
 */
silex.view.propertiesTool.PropertyPane.prototype.editText;
/**
 * callback to call to let the user edit the image url
 */
silex.view.propertiesTool.PropertyPane.prototype.selectImage;
/**
 * base url for relative/absolute urls
 */
silex.view.propertiesTool.PropertyPane.prototype.baseUrl;
/**
 * avoid loops on redraw
 */
silex.view.propertiesTool.PropertyPane.prototype.isRedraw;
/**
 * build the UI
 */
silex.view.propertiesTool.PropertyPane.prototype.buildUi = function(){
}
/**
 * display the propertis of the component being edited 
 */
silex.view.propertiesTool.PropertyPane.prototype.setComponent = function(component){
	this.component = component;
	this.redraw();
}
/**
 * display the style of the element being edited 
 */
silex.view.propertiesTool.PropertyPane.prototype.setBaseUrl = function(url){
	this.baseUrl = url;
	this.redraw();
}
/**
 * change current component image
 */
silex.view.propertiesTool.PropertyPane.prototype.setImage = function(url){
	if (this.baseUrl)
		this.component.setImageSrc(silex.Helper.getAbsolutePath(url, this.baseUrl));
	else
		this.component.setImageSrc(url);
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.PropertyPane.prototype.redraw = function(){
	if (this.component && !this.isRedraw){
		this.isRedraw = true;
		// refresh properties
		var imageUrl = null;
		if (this.component.type==silex.model.Component.SUBTYPE_IMAGE){
			if (this.baseUrl)
				imageUrl = silex.Helper.getRelativePath(this.component.getImageSrc(), this.baseUrl);
			else
				imageUrl = this.component.getImageSrc();
		}

		var editionContainer = goog.dom.getElementByClass('edition-container', this.element);
		if (this.component){
			var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
			silex.Helper.resolveTemplate(editionContainer, templateHtml, {
				textEditor: (this.component.type==silex.model.Component.SUBTYPE_TEXT),
				imageUrl: imageUrl
			});

			// text editor
			var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
			if (buttonElement){
				var button = new goog.ui.CustomButton();
				button.decorate(buttonElement);
				goog.events.listen(buttonElement, goog.events.EventType.CLICK, this.editText, false);
			}
			if (this.component.type == silex.model.Component.SUBTYPE_IMAGE){
				// browse for image button
				var buttonElement = goog.dom.getElementByClass('image-url-button', editionContainer);
				if (buttonElement){
					var button = new goog.ui.CustomButton();
					button.decorate(buttonElement);
					goog.events.listen(buttonElement, goog.events.EventType.CLICK, this.selectImage, false);
				}
				// edit image url text field
				var inputElement = goog.dom.getElementByClass('image-url-input', editionContainer);
				if (inputElement){
					goog.events.listen(inputElement, 'change', function (event) {
						console.log(this);
						if (this.component && !this.isRedraw){
							if (this.component.type==silex.model.Component.SUBTYPE_IMAGE)
								this.setImage(inputElement.value);
						}
					}, false, this);

					// create a text field object
/*					var textField = new goog.editor.Field(inputElement);
					// make editable
					textField.makeEditable();
					// set URL
					textField.setHtml(false, imageUrl);
					goog.events.listen(textField, goog.editor.Field.EventType.DELAYEDCHANGE, function (event) {
						console.log(this);
						if (this.component && !this.isRedraw){
							if (this.component.type==silex.model.Component.SUBTYPE_IMAGE)
								this.setImage(textField.getCleanContents());
						}
					}, false, this);
*/
				}
			}
		}
		else{
			if (editionContainer){
				editionContainer.innerHTML = '';
			}
		}
		this.isRedraw = false;
	}
}
