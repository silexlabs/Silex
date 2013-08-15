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

goog.provide('silex.view.propertiesTool.PropertyEditor');

goog.require('goog.cssom');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabBar');
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
silex.view.propertiesTool.PropertyEditor = function(element, propertyChanged, editText){
	this.element = element;
	this.propertyChanged = propertyChanged;
	this.editText = editText;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.PropertyEditor.prototype.element;
/**
 * component to be edited
 */
silex.view.propertiesTool.PropertyEditor.prototype.component;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.PropertyEditor.prototype.propertyChanged;
/**
 * callback to call to let the user edit the text content of the component
 */
silex.view.propertiesTool.PropertyEditor.prototype.editText;
/**
 * dropdown list to select a link
 */
silex.view.propertiesTool.PropertyEditor.prototype.linkDropdown;
/**
 * text field used to type an external link
 */
silex.view.propertiesTool.PropertyEditor.prototype.linkInputTextField;
/**
 * build the UI
 */
silex.view.propertiesTool.PropertyEditor.prototype.buildUi = function(){
	// link, select page or enter custom link
	// handle the dropdown list from the template
	this.linkDropdown = goog.dom.getElementByClass('link-combo-box', this.element);
	this.linkDropdown.onchange = goog.bind(this.onLinkChanged, this);

	// create a text field for custom link
	var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);
	this.linkInputTextField = new goog.editor.Field(linkInputElement);
	// make editable
	this.linkInputTextField.makeEditable();
	// hide by default
	var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element); // get the new input which may be an iframe
	goog.style.setStyle(linkInputElement, 'display', 'none');
	// Watch for field changes, to display below.
	goog.events.listen(this.linkInputTextField, goog.editor.Field.EventType.DELAYEDCHANGE, this.onLinkTextChanged, false, this);
}
/**
 * display the propertis of the component being edited 
 */
silex.view.propertiesTool.PropertyEditor.prototype.setComponent = function(component){
	this.component = component;
	this.redraw();
}
/**
 * refresh with new data
 */
silex.view.propertiesTool.PropertyEditor.prototype.setPages = function(data){
	// store page data
	this.pages = data;

	// reset page checkboxes
	if (this.pageCheckboxes){
		goog.array.forEach(this.pageCheckboxes, function(item) {
			item.checkbox.dispose();
		});
	}

	// render page/visibility template
	var linkContainer = goog.dom.getElementByClass('link-combo-box', this.element);
	console.log(this.element);
	console.log(linkContainer);
	console.log(goog.dom.getElementByClass('link-template', this.element));
	var templateHtml = goog.dom.getElementByClass('link-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(linkContainer, templateHtml, {pages:this.pages});

	// page selector
	// init page template
	var pagesContainer = goog.dom.getElementByClass('pages-container', this.element);
	var templateHtml = goog.dom.getElementByClass('pages-selector-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(pagesContainer, templateHtml, {pages:this.pages});
	// create page checkboxes
	this.pageCheckboxes = [];
	var mainContainer = goog.dom.getElementByClass('pages-container', this.element);
	var items = goog.dom.getElementsByClass('page-container', mainContainer);
	var idx = 0;
	goog.array.forEach(items, function(item) {
		var checkboxElement = goog.dom.getElementByClass('page-check', item);
		var labelElement = goog.dom.getElementByClass('page-label', item);
		var checkbox = new goog.ui.Checkbox();
		var page = this.pages[idx++];
		checkbox.render(checkboxElement);
		checkbox.setLabel (labelElement);
		this.pageCheckboxes.push({
			checkbox: checkbox,
			page: page
		});
		goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE, function(e){
			this.selectPage(page, checkbox);
		}, false, this);
	}, this);
	// refresh display
	this.redraw();
}
/**
 * the user changed the link drop down
 */
silex.view.propertiesTool.PropertyEditor.prototype.onLinkChanged = function(event){
	if (this.linkDropdown.value=='none'){
		this.component.removeLink();
	}
	else if (this.linkDropdown.value=='custom'){
		// keep previous link value
		var prevVal = this.linkInputTextField.getCleanContents();
		// reset if it was an internal link
		if (prevVal.indexOf('#')==0) prevVal = '';
		if (prevVal=='') prevVal = 'http://silex.io';
		// store in the href attr
		this.component.setLink(prevVal);
	}
	else {
		this.component.setLink('#'+this.linkDropdown.value);
	}
	this.propertyChanged();
	this.redraw();
}
/**
 * the user changed the link text field
 */
silex.view.propertiesTool.PropertyEditor.prototype.onLinkTextChanged = function(event){
	// update the href attribute
	this.component.setLink(this.linkInputTextField.getCleanContents());
	// notify the controler
	this.propertyChanged();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.PropertyEditor.prototype.redraw = function(){
	if (this.component && this.pageCheckboxes){
		// refresh page checkboxes
		goog.array.forEach(this.pageCheckboxes, function(item) {
			if (this.component){
				// there is a selection
				var pageName = item.page.name;
				item.checkbox.setEnabled(true);
				item.checkbox.setChecked(goog.dom.classes.has(this.component.element, pageName));
			}
			else{
				// no selected element
				item.checkbox.setChecked(false);
				item.checkbox.setEnabled(false);
			}
		}, this);

		// refresh the link inputs
		// default selection 
		var hrefAttr = this.component.getLink();
		if (hrefAttr==null){
			this.linkDropdown.value='none';
		}
		else{
			if (hrefAttr.indexOf('#')==0 && silex.model.Page.getPageIndex(hrefAttr.substr(1), this.pages)>=0){
				// case of an internal link
				// select a page
				this.linkDropdown.value = hrefAttr.substr(1);
			}
			else{
				// in case it is a custom link
				this.linkInputTextField.setHtml(false, hrefAttr);
				this.linkDropdown.value='custom';
			}
		}
		// visibility of the text edit 
		var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);
		if(this.linkDropdown.value=='custom'){
			goog.style.setStyle(linkInputElement, 'display', 'inherit');
		}
		else{
			goog.style.setStyle(linkInputElement, 'display', 'none');
		}

		// refresh properties
		var editionContainer = goog.dom.getElementByClass('edition-container', this.element);
		if (this.component){
			var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
			silex.Helper.resolveTemplate(editionContainer, templateHtml, {
				textEditor: (this.component.type==silex.model.Component.ELEMENT_SUBTYPE_TEXT)
			});

			// text editor
			var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
			if (buttonElement){
				var button = new goog.ui.CustomButton();
				button.decorate(buttonElement);
				goog.events.listen(buttonElement, goog.events.EventType.CLICK, this.editText(), false);
			}
		}
		else{
			if (editionContainer){
				editionContainer.innerHTML = '';
			}
		}
	}
}
/**
 * callback for checkboxes click event
 */
silex.view.propertiesTool.PropertyEditor.prototype.selectPage = function(page, checkbox){
	// apply the page selection
	if (checkbox.isChecked()){
		goog.dom.classes.add(this.component.element, page.name)
		goog.dom.classes.add(this.component.element, silex.model.Page.PAGE_CLASS)
	}
	else{
		goog.dom.classes.remove(this.component.element, page.name)
		if (this.getNumberOfPages(this.component.element)==0){
			goog.dom.classes.remove(this.component.element, silex.model.Page.PAGE_CLASS)
		}
	}
	// notify the toolbox
	this.propertyChanged();
	// refresh ui
	this.redraw();
}
/**
 * count the number of pages in which the element is visible
 */
silex.view.propertiesTool.PropertyEditor.prototype.getNumberOfPages = function(element){
	var res = 0;
	goog.array.forEach(this.pages, function(page) {
		if(goog.dom.classes.has(element, page.name)){
			res++;
		}
	}, this);
	return res;
}
