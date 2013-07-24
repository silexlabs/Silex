goog.provide('silex.view.PropertiesTool');

goog.require('goog.cssom');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabPane');
//goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.ColorMenuButton');
goog.require('goog.editor.Field');

goog.require('goog.array');
goog.require('goog.object');


var silex = silex || {}; 
silex.view = silex.view || {}; 


//////////////////////////////////////////////////////////////////
// PropertiesTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertiesTool class
 * @constructor
 */
silex.view.PropertiesTool = function(element, cbk){
	this.element = element;
	this.pages = [];
	this.pageCheckboxes = [];
	this.state = silex.view.PropertiesTool.STATE_NORMAL;
	
	var that = this;
	silex.Helper.loadTemplateFile('templates/propertiestool.html', element, function(){
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onPropertiesToolEvent){
			that.onPropertiesToolEvent({
				type: 'ready'
			});
		}
		that.buildTabs();
		that.buildStylePane();
		that.displayStyle();
		that.redraw();
	});
}
/**
 * tabs titles
 */
silex.view.PropertiesTool.TAB_TITLE_NORMAL='Normal';
silex.view.PropertiesTool.TAB_TITLE_HOVER='Hover';
silex.view.PropertiesTool.TAB_TITLE_PRESSED='Pressed';
/**
 * states of an element
 */
silex.view.PropertiesTool.STATE_NORMAL='normal';
silex.view.PropertiesTool.STATE_HOVER='hover';
silex.view.PropertiesTool.STATE_PRESSED='pressed';
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.PropertiesTool.prototype.onReady;
/**
 * callback for the events, set by the controller
 */
silex.view.PageTool.prototype.onPropertiesToolEvent;
/**
 * callback for the events, set by the controller
 * the controller is expected to open the file browser
 * takes a callback as param
 */
silex.view.PageTool.prototype.onSelectImage;
/**
 * pages 
 */
silex.view.PropertiesTool.prototype.pages;
/**
 * selected elements on the stage
 */
silex.view.PropertiesTool.prototype.elements;
/**
 * current state (normal, hover, pressed)
 */
silex.view.PropertiesTool.prototype.state;
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
 * check box for background color transparency
 */
silex.view.PropertiesTool.prototype.transparentBgCheckbox;
/**
 * controls for background image
 */
//silex.view.PropertiesTool.prototype.bgSelectBgImage;
//silex.view.PropertiesTool.prototype.bgClearBgImage;

/**
 * build tabs for the different states (normal, pressed, hover)
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
	var that = this;
	goog.events.listen(tabPane, goog.ui.TabPane.Events.CHANGE, function() { 
		switch(tabPane.getSelectedPage().getTitle()){
			case silex.view.PropertiesTool.TAB_TITLE_NORMAL:
				that.state = silex.view.PropertiesTool.STATE_NORMAL;
				break;
			case silex.view.PropertiesTool.TAB_TITLE_HOVER:
				that.state = silex.view.PropertiesTool.STATE_HOVER;
				break;
			case silex.view.PropertiesTool.TAB_TITLE_PRESSED:
				that.state = silex.view.PropertiesTool.STATE_PRESSED;
				break;
		}
		if (that.onPropertiesToolEvent){
			// display the corresponding state
			that.applyStyle();
			// notify the controler
			that.onPropertiesToolEvent({
				type: 'changedState',
				state: that.state
			});
		}
		that.displayStyle();
	});
}

silex.view.PropertiesTool.prototype.buildStylePane = function(){
	var that = this;

	// **
	// background

	// BG color
	this.bgColorPicker = new goog.ui.ColorMenuButton();
	this.bgColorPicker.setTooltip('Click to select color');
	this.bgColorPicker.render(goog.dom.getElementByClass('color-bg-button'));
	goog.events.listen(this.bgColorPicker, goog.ui.Component.EventType.ACTION, function() { 
		// update style
		var color = that.bgColorPicker.getSelectedColor();
		that.getElement().style.backgroundColor = color;
		// apply to the element and store it in the state attribute
		that.styleChanged()
	});
	this.transparentBgCheckbox = new goog.ui.Checkbox();
	this.transparentBgCheckbox.decorate(goog.dom.getElementByClass('enable-color-bg-button'));
	goog.events.listen(this.transparentBgCheckbox, goog.ui.Component.EventType.CHANGE, function() {
		console.log('check '+that.transparentBgCheckbox.getChecked());
		// update style
		if (that.transparentBgCheckbox.getChecked()==false){
			var color = that.bgColorPicker.getSelectedColor();
			if (color==null) {
				color='#FFFFFF';
			}
			that.getElement().style.backgroundColor = color;
		}
		else{
			that.getElement().style.backgroundColor = 'transparent';
		}
		// apply to the element and store it in the state attribute
		that.styleChanged()
	});
/*
	// BG image
	var buttonElement = goog.dom.getElementByClass('bg-image-button');
	this.bgSelectBgImage = new goog.ui.CustomButton();
	this.bgSelectBgImage.decorate(buttonElement);
	this.bgSelectBgImage.setTooltip('Click to select a file');
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		that.onSelectImage(function(url){
			// update style
			var backgroundImage = url;
			that.getElement().style.backgroundImage = 'url(' + backgroundImage + ')';
			// apply to the element and store it in the state attribute
			that.styleChanged()
		});
	});
	var buttonElement = goog.dom.getElementByClass('clear-bg-image-button');
	this.bgClearBgImage = new goog.ui.CustomButton();
	this.bgClearBgImage.setTooltip('Click to select a file');
	this.bgClearBgImage.decorate(buttonElement);
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		// update style
		that.getElement().style.backgroundImage = 'none';
		// apply to the element and store it in the state attribute
		that.styleChanged()
	});
*/
}
/**
 * select the element being edited
 */
silex.view.PropertiesTool.prototype.getElement = function(){
	var element;
	if (this.elements && this.elements.length>0){
		element = this.elements[0];
	}
	else{
		// site background
		element = goog.dom.getElementByClass('silex-stage-body');
	}
	return element;
}
/**
 * get the style of the element being edited for the given state
 * returns a style object for the data-style-* value
 */
silex.view.PropertiesTool.prototype.getStyle = function(state){
	if(state==null) state = this.state;
	if (state==null) return null;

	var element = this.getElement();
	var styleStr = element.getAttribute('data-style-'+state);
	if (styleStr == null){
		styleStr = '';
	}
	var style = goog.style.parseStyleAttribute(styleStr);

	// take position and size into account
	if (state!=silex.view.PropertiesTool.STATE_NORMAL){
		var normalStyle = this.getStyle(silex.view.PropertiesTool.STATE_NORMAL);
		style.top = normalStyle.top;
		style.left = normalStyle.left;
		style.width = normalStyle.width;
		style.height = normalStyle.height;
		style.position = normalStyle.position;
	}
	return style;
}
/**
 * display the style in data-style-*
 * sets the element.style value with the value found in data-style-*
 */
silex.view.PropertiesTool.prototype.applyStyle = function(state){
	if(state==null) state = this.state;
	var element = this.getElement();
	//element.setAttribute('style', element.getAttribute('data-style-'+state));
	//goog.style.applyStyle(element, this.getStyle(state));
//	element.style = this.getStyle(state);
	var style = this.getStyle(state);
	goog.object.forEach(style, function(val, index, obj) {
		if (val)
			element.style[index] = val;
	});
}
/**
 * save the current style properties of the element being edited 
 * the current style attribute will be stored in data-style-*
 * and the normal style will be updated with the size and position properties
 */
silex.view.PropertiesTool.prototype.saveStyle = function(style, state){
	var element = this.getElement();

	// default value for style is the style of the element being edited
	if (!state){
		state = this.state;
	}
	if (!style){
		style = goog.style.parseStyleAttribute(element.getAttribute('style'));
	}
	// save the position and size in the normal state
	if (state!=silex.view.PropertiesTool.STATE_NORMAL){
		var normalStyle = this.getStyle(silex.view.PropertiesTool.STATE_NORMAL);
		normalStyle.top = style.top;
		normalStyle.left = style.left;
		normalStyle.width = style.width;
		normalStyle.height = style.height;
		normalStyle.position = style.position;
		this.saveStyle(normalStyle, silex.view.PropertiesTool.STATE_NORMAL)

		// do not save position and size in the other states
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
	// store the string in the state attr
	element.setAttribute('data-style-'+state, styleStr);

	// non, this call is made by the controller : this.styleChanged();
}
/**
 * apply the current style properties to the element being edited 
 */
silex.view.PropertiesTool.prototype.styleChanged = function(){

	// default value for style is the style of the element being edited
	style = this.getStyle();

	// dispatch event
	if (this.onPropertiesToolEvent){
		this.onPropertiesToolEvent({
			type: 'styleChanged',
			style: style,
			state: this.state
		});
	}
	// refresh UI
	this.displayStyle()
}
/**
 * display the style of the element being edited 
 */
silex.view.PropertiesTool.prototype.displayStyle = function(){
	console.log("displayStyle ");

	// select the element being edited
	var element = this.getElement();
//	var style = this.getStyle();

	// **
	// BG color
	//var color = style.backgroundColor;
	if (element){
		var color = goog.style.getStyle(element, 'background-color');
		console.log(this.transparentBgCheckbox.getChecked());
		console.log(color);
		if (color == undefined || color == 'transparent' || color == ''){
			this.transparentBgCheckbox.setChecked(true);
			this.bgColorPicker.setEnabled(false);
		}
		else{
			this.transparentBgCheckbox.setChecked(false);
			this.bgColorPicker.setEnabled(true);
			this.bgColorPicker.setSelectedColor(color);
		}
		//this.bgColorPicker.setContent(color);
		// **
		// BG image
	/*
		console.log('BG image : '+style.backgroundImage);
		if (style.backgroundImage!=null && style.backgroundImage!='none' && style.backgroundImage!=''){
			this.bgClearBgImage.setEnabled(true);
		}
		else{
			this.bgClearBgImage.setEnabled(false);
		}
	*/
	}
}
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	// store data
	this.pages = data;
	// reset selection
	this.setElements([]);
	// reset page checkboxes
	goog.array.forEach(this.pageCheckboxes, function(item) {
		item.checkbox.dispose();
	});
	// ** 
	// link, select page or enter custom link
	// ** 
	// init page template
	var linkContainer = goog.dom.getElementByClass('link-container', this.element);
	var templateHtml = goog.dom.getElementByClass('link-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(linkContainer, templateHtml, {pages:this.pages});
	// handle the dropdown list from the template
	var linkDropdown = goog.dom.getElementByClass('link-combo-box', this.element);
	linkDropdown.onchange = function (e) {
		var element = that.getElement();
		if (linkDropdown.value=='none'){
			element.removeAttribute('data-silex-href');
		}
		else if (linkDropdown.value=='custom'){
			// keep previous link value
			var prevVal = that.linkInputTextField.getCleanContents();
			// reset if it was an internal link
			if (prevVal.indexOf('#')==0) prevVal = '';
			// store in the href attr
			element.setAttribute('data-silex-href', prevVal);
		}
		else {
			element.setAttribute('data-silex-href', '#'+linkDropdown.value);
		}
		that.redraw();
	}

	// create a text field
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
		var element = that.getElement();
		// update the href attribute
		element.setAttribute('data-silex-href', that.linkInputTextField.getCleanContents());
	});

	// ** 
	// visibility, select page
	// ** 
	// init page template
	var pagesContainer = goog.dom.getElementByClass('pages-container', this.element);
	var templateHtml = goog.dom.getElementByClass('pages-selector-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(pagesContainer, templateHtml, {pages:this.pages});
	// create page checkboxes
	this.pageCheckboxes = [];
	var that = this;
	var mainContainer = goog.dom.getElementByClass('pages-container', this.element);
	var items = goog.dom.getElementsByClass('page-container', mainContainer);
	var idx = 0;
	goog.array.forEach(items, function(item) {
		var checkboxElement = goog.dom.getElementByClass('page-check', item);
		var labelElement = goog.dom.getElementByClass('page-label', item);
		var checkbox = new goog.ui.Checkbox();
		var pageName = that.pages[idx++];
		checkbox.render(checkboxElement);
		checkbox.setLabel (labelElement);
		that.pageCheckboxes.push({
			checkbox: checkbox,
			page: pageName
		});
		goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE, function(e){
			that.selectPage(pageName, checkbox);
		});
	});
	// refresh display
	this.redraw();
}
/**
 * the selection has changed
 */
silex.view.PropertiesTool.prototype.setElements = function(elements){
	console.log('setElements '+elements);
	if (this.elements){
		// restore the normal state
		this.applyStyle(silex.view.PropertiesTool.STATE_NORMAL);
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

	// select the element being edited
	var element = this.getElement();

	// refresh page checkboxes
	var idx = 0;
	var that = this;
	goog.array.forEach(this.pageCheckboxes, function(item) {
		if (that.elements!=null && that.elements.length>0){
			// there is a selection
			var element = that.elements[0];
			var pageName = that.pages[idx];
			item.checkbox.setEnabled(true);
			item.checkbox.setChecked(goog.dom.classes.has(element, pageName));
			idx++;
		}
		else{
			// no selected element
			item.checkbox.setChecked(false);
			item.checkbox.setEnabled(false);
		}
	});

	// refresh the link inputs
	var linkDropdown = goog.dom.getElementByClass('link-combo-box', this.element);
	if (linkDropdown){
		// default selection 
		var hrefAttr = element.getAttribute('data-silex-href');
		if (hrefAttr==null){
			linkDropdown.value='none';
		}
		else{
			if (hrefAttr.indexOf('#')==0 && goog.array.contains(this.pages, hrefAttr.substr(1))){
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
	if (element && element.getAttribute){
		var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
		silex.Helper.resolveTemplate(editionContainer, templateHtml, {
			textEditor: (element.getAttribute('data-silex-sub-type')==silex.view.Stage.ELEMENT_SUBTYPE_TEXT)
		});

		// text editor
		var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
		if (buttonElement){
			var button = new goog.ui.CustomButton();
			button.decorate(buttonElement);
			goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
				if (that.onPropertiesToolEvent){
					that.onPropertiesToolEvent({
						type: 'openTextEditor'
					});
				}
			});
		}
	}
	else{
		if (editionContainer){
			editionContainer.innerHTML = '';
		}
	}

}
/**
 * callback for checkboxes click event
 */
silex.view.PropertiesTool.prototype.selectPage = function(pageName, checkbox){
	// select the element being edited
	var element = this.getElement();
	// apply the page selection
	if (checkbox.isChecked()){
		goog.dom.classes.add(element, pageName)
		goog.dom.classes.add(element, 'silex-page')
	}
	else{
		goog.dom.classes.remove(element, pageName)
		if (this.getNumberOfPages(element)==0){
			goog.dom.classes.remove(element, 'silex-page')
		}
	}
	this.redraw();
}
/**
 * count the number of pages in which the element is visible
 */
silex.view.PropertiesTool.prototype.getNumberOfPages = function(element){
	var res = 0;
	goog.array.forEach(this.pages, function(page) {
		if(goog.dom.classes.has(element, page)){
			res++;
		}
	});
	return res;
}
