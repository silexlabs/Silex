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

goog.provide('silex.view.propertiesTool.PagePane');

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
silex.view.propertiesTool.PagePane = function(element, pageChanged){
	this.element = element;
	this.pageCheckboxes = [];
	this.pageChanged = pageChanged;
	this.buildUi();
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.propertiesTool.PagePane.prototype.element;
/**
 * component to be edited
 */
silex.view.propertiesTool.PagePane.prototype.component;
/**
 * callback to notify the tool box
 */
silex.view.propertiesTool.PagePane.prototype.pageChanged;
/**
 * avoid loops on redraw
 */
silex.view.propertiesTool.PagePane.prototype.isRedraw;
/**
 * dropdown list to select a link
 */
silex.view.propertiesTool.PagePane.prototype.linkDropdown;
/**
 * text field used to type an external link
 */
silex.view.propertiesTool.PagePane.prototype.linkInputTextField;
/**
 * build the UI
 */
silex.view.propertiesTool.PagePane.prototype.buildUi = function(){
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
silex.view.propertiesTool.PagePane.prototype.setComponent = function(component){
	this.component = component;
	this.redraw();
}
/**
 * refresh with new data
 */
silex.view.propertiesTool.PagePane.prototype.setPages = function(data){
	// store page data
	this.pages = data;

	// reset page checkboxes
	if (this.pageCheckboxes){
		goog.array.forEach(this.pageCheckboxes, function(item) {
			item.checkbox.dispose();
		});
	}

	// link selector
	var linkContainer = goog.dom.getElementByClass('link-combo-box', this.element);
	var templateHtml = goog.dom.getElementByClass('link-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(linkContainer, templateHtml, {pages:this.pages});

	// render page/visibility template
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
			this.checkPage(page, checkbox);
		}, false, this);
	}, this);
	// show on all pages button
	var showAllBtn = goog.dom.getElementByClass('show-on-all-pages-btn', this.element);
	goog.events.listen(showAllBtn, goog.events.EventType.CLICK, function(e){
		this.unCheckAll();
	}, false, this);

	// refresh display
	this.redraw();
}
/**
 * the user changed the link drop down
 */
silex.view.propertiesTool.PagePane.prototype.onLinkChanged = function(event){
	if (this.linkDropdown.value==='none'){
		this.component.removeLink();
	}
	else if (this.linkDropdown.value==='custom'){
		// keep previous link value
		var prevVal = this.linkInputTextField.getCleanContents();
		// reset if it was an internal link
		if (prevVal.indexOf('#')===0) prevVal = '';
		if (prevVal==='') prevVal = 'http://silex.io';
		// store in the href attr
		this.component.setLink(prevVal);
	}
	else {
		this.component.setLink('#'+this.linkDropdown.value);
	}
	this.pageChanged();
	this.redraw();
}
/**
 * the user changed the link text field
 */
silex.view.propertiesTool.PagePane.prototype.onLinkTextChanged = function(event){
	// update the href attribute
	this.component.setLink(this.linkInputTextField.getCleanContents());
	// notify the controler
	this.pageChanged();
}
/**
 * redraw the properties
 */
silex.view.propertiesTool.PagePane.prototype.redraw = function(){
	if (this.component && this.pageCheckboxes && !this.isRedraw){
		this.isRedraw = true;
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
		if (!hrefAttr){
			this.linkDropdown.value='none';
		}
		else{
			if (hrefAttr.indexOf('#')===0 && silex.model.Page.getPageByName(hrefAttr.substr(1))){
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
		if(this.linkDropdown.value==='custom'){
			goog.style.setStyle(linkInputElement, 'display', 'inherit');
		}
		else{
			goog.style.setStyle(linkInputElement, 'display', 'none');
		}
		this.isRedraw = false;
	}
}
/**
 * callback for checkboxes click event
 */
silex.view.propertiesTool.PagePane.prototype.checkPage = function(page, checkbox){
	// apply the page selection
	if (checkbox.isChecked()){
		page.addComponent(this.component);
	}
	else{
		page.removeComponent(this.component);
	}
	// notify the toolbox
	this.pageChanged();
	// refresh ui
	this.redraw();
}
/**
 * callback for checkboxes click event
 */
silex.view.propertiesTool.PagePane.prototype.unCheckAll = function(){
	goog.array.forEach(this.pages, function(page) {
		page.removeComponent(this.component);
	}, this);
	// notify the toolbox
	this.pageChanged();
	// refresh ui
	this.redraw();
}
