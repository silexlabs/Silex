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
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.leftInput;
/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.rightInput;
/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.topInput;
/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.bottomInput;
/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.widthInput;
/**
 * UI for position and size
 */
silex.view.propertiesTool.PropertyPane.prototype.heightInput;
/**
 * build the UI
 */
silex.view.propertiesTool.PropertyPane.prototype.buildUi = function(){
	// lock / unlock
	var lockBtn = goog.dom.getElementByClass('lock-btn');
	var unlockBtn = goog.dom.getElementByClass('unlock-btn');
	goog.events.listen(lockBtn, goog.events.EventType.CLICK, this.lock, false, this);
	goog.events.listen(unlockBtn, goog.events.EventType.CLICK, this.unlock, false, this);

	// position and size
	this.leftInput = goog.dom.getElementByClass('left-input');
	goog.events.listen(this.leftInput, 'change', this.onPositionChanged, false, this);
	this.widthInput = goog.dom.getElementByClass('width-input');
	goog.events.listen(this.widthInput, 'change', this.onPositionChanged, false, this);
	this.bottomInput = goog.dom.getElementByClass('bottom-input');
	goog.events.listen(this.bottomInput, 'change', this.onPositionChanged, false, this);
	this.topInput = goog.dom.getElementByClass('top-input');
	goog.events.listen(this.topInput, 'change', this.onPositionChanged, false, this);
	this.heightInput = goog.dom.getElementByClass('height-input');
	goog.events.listen(this.heightInput, 'change', this.onPositionChanged, false, this);
	this.rightInput = goog.dom.getElementByClass('right-input');
	goog.events.listen(this.rightInput, 'change', this.onPositionChanged, false, this);
}
/**
 * callback for the lock/unlock button
 */
silex.view.propertiesTool.PropertyPane.prototype.lock = function(event){
	this.component.setEditable(false);
}
/**
 * callback for the lock/unlock button
 */
silex.view.propertiesTool.PropertyPane.prototype.unlock = function(event){
	this.component.setEditable(true);
}
/**
 * position or size changed
 * callback for number inputs
 */
silex.view.propertiesTool.PropertyPane.prototype.onPositionChanged = function(event){
	if (this.component && !this.isRedraw && goog.dom.classes.has(this.component.element, 'editable-style')){
		var bbox = {};
		if (this.leftInput.value && this.leftInput.value!='')
			bbox.left = this.leftInput.value + 'px';
		if (this.widthInput.value && this.widthInput.value!='')
			bbox.width = this.widthInput.value + 'px';
		if (this.bottomInput.value && this.bottomInput.value!='')
			bbox.bottom = this.bottomInput.value + 'px';
		if (this.topInput.value && this.topInput.value!='')
			bbox.top = this.topInput.value + 'px';
		if (this.heightInput.value && this.heightInput.value!='')
			bbox.height = this.heightInput.value + 'px';
		if (this.rightInput.value && this.rightInput.value!='')
			bbox.right = this.rightInput.value + 'px';

		this.component.setBoundingBox(bbox);
	}
	this.redraw();
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
				}
			}

			// position and size
			if (goog.dom.classes.has(this.component.element, 'editable-style')){
				var bbox = this.component.getBoundingBox();
				console.log('redraw', bbox)
				if (bbox.left != null) this.leftInput.value = bbox.left.substr(0, bbox.left.indexOf('px'));
				else this.leftInput.value = '';
				if (bbox.width != null) this.widthInput.value = bbox.width.substr(0, bbox.width.indexOf('px'));
				else this.widthInput.value = '';
				if (bbox.bottom != null) this.bottomInput.value = bbox.bottom.substr(0, bbox.bottom.indexOf('px'));
				else this.bottomInput.value = '';
				if (bbox.top != null) this.topInput.value = bbox.top.substr(0, bbox.top.indexOf('px'));
				else this.topInput.value = '';
				if (bbox.height != null) this.heightInput.value = bbox.height.substr(0, bbox.height.indexOf('px'));
				else this.heightInput.value = '';
				if (bbox.right != null) this.rightInput.value = bbox.right.substr(0, bbox.right.indexOf('px'));
				else this.rightInput.value = '';
			}
			else{
				// case of the stage
				this.leftInput.value = '';
				this.widthInput.value = '';
				this.bottomInput.value = '';
				this.topInput.value = '';
				this.heightInput.value = '';
				this.rightInput.value = '';
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
