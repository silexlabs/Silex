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

goog.provide('silex.view.PropertiesTool');

goog.require('goog.cssom');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabPane');
goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.ColorButton');
goog.require('goog.editor.Field');

goog.require('goog.array');
goog.require('goog.object');

//////////////////////////////////////////////////////////////////
// PropertiesTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertiesTool class
 * @constructor
 */
silex.view.PropertiesTool = function(element, cbk){
	this.element = element;
	this.pageCheckboxes = [];
	this.context = silex.model.Component.CONTEXT_NORMAL;
	
	silex.Helper.loadTemplateFile('templates/propertiestool.html', element, function(){
		this.buildTabs();
		this.buildStylePane();
		this.buildPropertiesPane();
		if (cbk) cbk();
	}, this);
}
/**
 * tabs titles
 */
silex.view.PropertiesTool.TAB_TITLE_NORMAL='Normal';
silex.view.PropertiesTool.TAB_TITLE_HOVER='Hover';
silex.view.PropertiesTool.TAB_TITLE_PRESSED='Pressed';
/**
 * current component
 */
silex.view.PropertiesTool.prototype.component;
/**
 * current context (normal, hover, pressed)
 */
silex.view.PropertiesTool.prototype.context;
/**
 * current pages list
 */
silex.view.PropertiesTool.prototype.pages;
/**
 * checkboxes instanciated for each page
 */
silex.view.PropertiesTool.prototype.pageCheckboxes;
/**
 * text field used to type an external link
 */
silex.view.PropertiesTool.prototype.linkInputTextField;
/**
 * color picker for background color
 */
silex.view.PropertiesTool.prototype.bgColorPicker;
/**
 * color picker for background color
 */
silex.view.PropertiesTool.prototype.hsvPalette;
/**
 * check box for background color transparency
 */
silex.view.PropertiesTool.prototype.transparentBgCheckbox;
/**
 * callback set by the controller
 */
silex.view.PropertiesTool.prototype.onStatus;
/**
 * controls for background image
 */
//silex.view.PropertiesTool.prototype.bgSelectBgImage;
//silex.view.PropertiesTool.prototype.bgClearBgImage;

/**
 * build tabs for the different contexts (normal, pressed, hover)
 */
silex.view.PropertiesTool.prototype.buildTabs = function(){
	var tabContainer = goog.dom.getElementByClass('tab-container', this.element);

	// tab pane 
	var tabPage = goog.dom.getElementByClass('tab-page', this.element);
	var tabPane = new goog.ui.TabPane(tabContainer);
	tabPane.addPage(new goog.ui.TabPane.TabPage(tabPage, silex.view.PropertiesTool.TAB_TITLE_NORMAL));
	tabPane.addPage(new goog.ui.TabPane.TabPage(tabPage, silex.view.PropertiesTool.TAB_TITLE_HOVER));
	tabPane.addPage(new goog.ui.TabPane.TabPage(tabPage, silex.view.PropertiesTool.TAB_TITLE_PRESSED));

	tabPane.setSelectedIndex(1); // workaround bug "first pane id display none"
	tabPane.setSelectedIndex(0);
	goog.events.listen(tabPane, goog.ui.TabPane.Events.CHANGE, function() { 
		switch(tabPane.getSelectedPage().getTitle()){
			case silex.view.PropertiesTool.TAB_TITLE_NORMAL:
				this.context = silex.model.Component.CONTEXT_NORMAL;
				break;
			case silex.view.PropertiesTool.TAB_TITLE_HOVER:
				this.context = silex.model.Component.CONTEXT_HOVER;
				break;
			case silex.view.PropertiesTool.TAB_TITLE_PRESSED:
				this.context = silex.model.Component.CONTEXT_PRESSED;
				break;
		}
		// notify the controler
		if (this.onStatus){
			this.onStatus({
				type: 'contextChanged',
				context: this.context
			});
		}
		this.redraw();
	}, false, this);
}
/**
 * build the UI
 */
silex.view.PropertiesTool.prototype.buildPropertiesPane = function(){
}
/**
 * build the UI
 */
silex.view.PropertiesTool.prototype.buildStylePane = function(){
	// **
	// background

	// BG color
	var hsvPaletteElement = goog.dom.getElementByClass('color-bg-palette', this.element);
	this.hsvPalette = new goog.ui.HsvaPalette(null, null, null, 'goog-hsva-palette-sm');

	this.hsvPalette.render(hsvPaletteElement);
	goog.events.listen(this.hsvPalette, goog.ui.Component.EventType.ACTION, 
	function (e) {
		// update style
		var color = silex.Helper.hexToRgba(this.hsvPalette.getColorRgbaHex());
		var style = this.component.getStyle();
		if (style==null) style = {};
		style.backgroundColor = color;
		// notify the controller
		this.styleChanged(style);
	}, false, this);

	this.bgColorPicker = new goog.ui.ColorButton();
	this.bgColorPicker.setTooltip('Click to select color');
	this.bgColorPicker.render(goog.dom.getElementByClass('color-bg-button'));
	
	this.setColorPaletteVisibility(false);
	goog.events.listen(this.bgColorPicker, goog.ui.Component.EventType.ACTION, function() { 
		// show the palette
		if (this.getColorPaletteVisibility() == false){
			var style = this.component.getStyle();
			this.hsvPalette.setColorRgbaHex(silex.Helper.rgbaToHex(style.backgroundColor));
			this.setColorPaletteVisibility(true);
		}
		else{
			this.setColorPaletteVisibility(false);
		}
	}, false, this);
	this.transparentBgCheckbox = new goog.ui.Checkbox();
	this.transparentBgCheckbox.decorate(goog.dom.getElementByClass('enable-color-bg-button'), this.element);
	goog.events.listen(this.transparentBgCheckbox, goog.ui.Component.EventType.CHANGE, function() {
		var style = this.component.getStyle();
		if (style==null) style = {};
		// update style
		if (this.transparentBgCheckbox.getChecked()==false){
			var color = silex.Helper.hexToRgba(this.hsvPalette.getColorRgbaHex());
			if (color==null) {
				//color='#FFFFFF';
				color = 'rgba(255, 255, 0, 1)'
			}
			style.backgroundColor = color;
		}
		else{
			style.backgroundColor = 'transparent';
		}
		// apply to the element and store it in the context attribute
		this.styleChanged(style)
	}, false, this);
/*
	// BG image
	var buttonElement = goog.dom.getElementByClass('bg-image-button');
	this.bgSelectBgImage = new goog.ui.CustomButton();
	this.bgSelectBgImage.decorate(buttonElement);
	this.bgSelectBgImage.setTooltip('Click to select a file');
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		this.onSelectImage(function(url){
			// update style
			var backgroundImage = url;
			this.getElement().style.backgroundImage = 'url(' + backgroundImage + ')';
			// apply to the element and store it in the context attribute
			this.styleChanged()
		});
	}, false, this);
	var buttonElement = goog.dom.getElementByClass('clear-bg-image-button');
	this.bgClearBgImage = new goog.ui.CustomButton();
	this.bgClearBgImage.setTooltip('Click to select a file');
	this.bgClearBgImage.decorate(buttonElement);
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		// update style
		this.getElement().style.backgroundImage = 'none';
		// apply to the element and store it in the context attribute
		this.styleChanged()
	}, false, this);
*/
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.PropertiesTool.prototype.getColorPaletteVisibility = function(){
	return this.hsvPalette.getElement().style.visibility != 'hidden';
}
/** 
 * color palette visibility
 * do not set display to none, because the setColor then leave the color palette UI unchanged
 */
silex.view.PropertiesTool.prototype.setColorPaletteVisibility = function(isVisible){
	if (isVisible){
		if (!this.getColorPaletteVisibility()){
			this.hsvPalette.getElement().style.visibility = null;
			this.hsvPalette.getElement().style.position = null;
		}
	}
	else{
		if (this.getColorPaletteVisibility()){
			this.hsvPalette.getElement().style.visibility = 'hidden';
			this.hsvPalette.getElement().style.position = 'absolute';
		}
	}
}

/**
 * notify the controller that the style changed
 */
silex.view.PropertiesTool.prototype.styleChanged = function(style){
	if(this.onStatus) this.onStatus({
		type: 'styleChanged',
		style: style,
		context: this.context
	});
	// refresh ui
	this.redraw();
}
/**
 * get the style of the element being edited for the given context
 * returns a style object for the data-style-* value
 *
silex.view.PropertiesTool.prototype.computeStyle = function(element, opt_context){
	if(opt_context==null) opt_context = this.context;
	if (opt_context==null) return null;

	var styleStr = element.getAttribute('data-style-'+opt_context);
	if (styleStr == null){
		styleStr = '';
	}
	var style = goog.style.parseStyleAttribute(styleStr);

	// take position and size into account
	if (opt_context!=silex.model.Component.CONTEXT_NORMAL){
		var normalStyle = this.computeStyle(silex.model.Component.CONTEXT_NORMAL);
		style.top = normalStyle.top;
		style.left = normalStyle.left;
		style.width = normalStyle.width;
		style.height = normalStyle.height;
		style.position = normalStyle.position;
	}
	return style;
}
/**
 * apply the style in data-style-* to the element
 * sets the element.style value with the value found in data-style-*
 *
silex.view.PropertiesTool.prototype.applyStyle = function(element){
	//element.setAttribute('style', element.getAttribute('data-style-'+this.context));
	//goog.style.applyStyle(element, this.computeStyle(this.context));
//	element.style = this.computeStyle(this.context);
	var style = this.computeStyle(element, this.context);
	goog.object.forEach(style, function(val, index, obj) {
		if (val)
			element.style[index] = val;
	});
}
/**
 * save the current style properties of the element being edited 
 * the current style attribute will be stored in data-style-*
 * and the normal style will be updated with the size and position properties
 *
silex.view.PropertiesTool.prototype.saveStyle = function(element, opt_context){
	var element = this.getElement();

	// default value for style is the style of the element being edited
	if (!opt_context){
		opt_context = this.context;
	}
	if (!style){
		style = goog.style.parseStyleAttribute(element.getAttribute('style'));
	}
	// save the position and size in the normal context
	if (opt_context!=silex.model.Component.CONTEXT_NORMAL){
		var normalStyle = this.computeStyle(silex.model.Component.CONTEXT_NORMAL);
		normalStyle.top = style.top;
		normalStyle.left = style.left;
		normalStyle.width = style.width;
		normalStyle.height = style.height;
		normalStyle.position = style.position;
		this.saveStyle(normalStyle, silex.model.Component.CONTEXT_NORMAL)

		// do not save position and size in the other contexts
		style.top = null;
		style.left = null;
		style.width = null;
		style.height = null;
		style.position = null;
	}
	// build a string out of the style object
	var styleStr = '';
	goog.object.forEach(style, function(val, index, obj) {
		if (val)
			styleStr += goog.string.toSelectorCase(index) + ': ' + val + '; ';
	});
	// store the string in the context attr
	element.setAttribute('data-style-'+opt_context, styleStr);
}
/**
 * display the style of the element being edited 
 */
silex.view.PropertiesTool.prototype.setComponent = function(component){
	this.component = component;
	//this.setColorPaletteVisibility(false);
	this.redraw();
}
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	// store data
	this.pages = data;
	// reset page checkboxes
	goog.array.forEach(this.pageCheckboxes, function(item) {
		item.checkbox.dispose();
	});
	// ** 
	// init page template
	var linkContainer = goog.dom.getElementByClass('link-container', this.element);
	var templateHtml = goog.dom.getElementByClass('link-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(linkContainer, templateHtml, {pages:this.pages});
	// ** 
	// link, select page or enter custom link
	// handle the dropdown list from the template
	var linkDropdown = goog.dom.getElementByClass('link-combo-box', this.element);
	linkDropdown.onchange = goog.bind(function (e) {
		console.warn(linkDropdown.value);
		if (linkDropdown.value=='none'){
			this.component.removeLink();
		}
		else if (linkDropdown.value=='custom'){
			// keep previous link value
			var prevVal = this.linkInputTextField.getCleanContents();
			// reset if it was an internal link
			if (prevVal.indexOf('#')==0) prevVal = '';
			if (prevVal=='') prevVal = 'http://silex.io';
			// store in the href attr
			this.component.setLink(prevVal);
		}
		else {
			this.component.setLink('#'+linkDropdown.value);
		}
		// notify the controler
		if (this.onStatus){
			this.onStatus({
				type: 'propertiesChanged',
				context: this.context
			});
		}
		this.redraw();
	}, this);
	// create a text field for custom link
	var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);
	this.linkInputTextField = new goog.editor.Field(linkInputElement);
	// make editable
	this.linkInputTextField.makeEditable();
	// hide by default
	var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element); // get the new input which may be an iframe
	linkInputElement.style.display = 'none';
	var that = this;
	// Watch for field changes, to display below.
	goog.events.listen(this.linkInputTextField, goog.editor.Field.EventType.DELAYEDCHANGE, function(){
		// update the href attribute
		this.component.setLink(this.linkInputTextField.getCleanContents());
		// notify the controler
		if (this.onStatus){
			this.onStatus({
				type: 'propertiesChanged',
				context: this.context
			});
		}
	}, false, this);
	// ** 
	// page selector
	// ** 
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
 * the selection has changed
 *
silex.view.PropertiesTool.prototype.setElements = function(elements){
	if (this.elements){
		// restore the normal context
		this.applyStyle(silex.model.Component.CONTEXT_NORMAL);
	}
	this.elements = elements;
	this.applyStyle();
	this.displayStyle();
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.PropertiesTool.prototype.redraw = function(){

	if (this.component){
		// **
		// style
		// **
		// BG color
		var style = this.component.getStyle();
		if (style){
			var color = style.backgroundColor;
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
			//this.bgColorPicker.setContent(color);
			// **
			// BG image
		/*
			if (style.backgroundImage!=null && style.backgroundImage!='none' && style.backgroundImage!=''){
				this.bgClearBgImage.setEnabled(true);
			}
			else{
				this.bgClearBgImage.setEnabled(false);
			}
		*/
		}
		// **
		// properties
		// **

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
		var linkDropdown = goog.dom.getElementByClass('link-combo-box', this.element);
		if (linkDropdown){
			// default selection 
			var hrefAttr = this.component.getLink();
			if (hrefAttr==null){
				linkDropdown.value='none';
			}
			else{
				if (hrefAttr.indexOf('#')==0 && silex.model.Page.getPageIndex(hrefAttr.substr(1), this.pages)>=0){
					// case of an internal link
					// select a page
					linkDropdown.value = hrefAttr.substr(1);
				}
				else{
					// in case it is a custom link
					this.linkInputTextField.setHtml(false, hrefAttr);
					linkDropdown.value='custom';
				}
			}
			// visibility of the text edit 
			var linkInputElement = goog.dom.getElementByClass('link-input-text', this.element);
			if(linkDropdown.value=='custom'){
				linkInputElement.style.display = 'inherit';
			}
			else{
				linkInputElement.style.display = 'none';
			}
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
				goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
					if (this.onStatus){
						this.onStatus({
							type: 'openTextEditor'
						});
					}
				}, false, this);
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
silex.view.PropertiesTool.prototype.selectPage = function(page, checkbox){
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
	// notify the controler
	if (this.onStatus){
		this.onStatus({
			type: 'propertiesChanged',
			context: this.context
		});
	}
	// refresh ui
	this.redraw();
}
/**
 * count the number of pages in which the element is visible
 */
silex.view.PropertiesTool.prototype.getNumberOfPages = function(element){
	var res = 0;
	goog.array.forEach(this.pages, function(page) {
		if(goog.dom.classes.has(element, page.name)){
			res++;
		}
	}, this);
	return res;
}
