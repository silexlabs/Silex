goog.provide('silex.view.PropertiesTool');

goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.TabPane');
//goog.require('goog.ui.HsvaPalette');
goog.require('goog.ui.ColorMenuButton');


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
	silex.TemplateHelper.loadTemplateFile('js/view/templates/propertiestool.html', element, function(){
		console.log('template loaded');
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onPropertiesToolEvent){
			that.onPropertiesToolEvent({
				type: 'ready',
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
 * color picker for background color
 */
silex.view.PropertiesTool.prototype.bgColorPicker;
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
		console.log('changed tab');
		console.log(tabPane.getSelectedPage().getTitle());
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
			that.setStyle();
			// notify the controler
			that.onPropertiesToolEvent({
				type: 'changedState',
				state: that.state,
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
		// get the style of the element being edited
		var style = that.getStyle();
		// update style
		var color = that.bgColorPicker.getSelectedColor();
		style.backgroundColor = color;
		// apply to the element and store it in the state attribute
		that.applyStyle(style)
	});
	this.transparentBgCheckbox = new goog.ui.Checkbox();
	this.transparentBgCheckbox.decorate(goog.dom.getElementByClass('enable-color-bg-button'));
	goog.events.listen(this.transparentBgCheckbox, goog.ui.Component.EventType.CHANGE, function() {
		// get the style of the element being edited
		var style = that.getStyle();
		// update style
		if (that.transparentBgCheckbox.getChecked()==false){
			var color = that.bgColorPicker.getSelectedColor();
			if (color==null) {
				color='#FFFFFF';
			}
			style.backgroundColor = color;
		}
		else{
			style.backgroundColor = 'transparent';
		}
		// apply to the element and store it in the state attribute
		that.applyStyle(style)
	});
/*
	// BG image
	var buttonElement = goog.dom.getElementByClass('bg-image-button');
	this.bgSelectBgImage = new goog.ui.CustomButton();
	this.bgSelectBgImage.decorate(buttonElement);
	this.bgSelectBgImage.setTooltip('Click to select a file');
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		that.onSelectImage(function(url){
			// get the style of the element being edited
			var style = that.getStyle();
			// update style
			var backgroundImage = url;
			style.backgroundImage = 'url(' + backgroundImage + ')';
			// apply to the element and store it in the state attribute
			that.applyStyle(style)
		});
	});
	var buttonElement = goog.dom.getElementByClass('clear-bg-image-button');
	this.bgClearBgImage = new goog.ui.CustomButton();
	this.bgClearBgImage.setTooltip('Click to select a file');
	this.bgClearBgImage.decorate(buttonElement);
	goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
		// get the style of the element being edited
		var style = that.getStyle();
		// update style
		style.backgroundImage = 'none';
		// apply to the element and store it in the state attribute
		that.applyStyle(style)
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
 * select the style of the element being edited
 */
silex.view.PropertiesTool.prototype.getStyle = function(state){
	if(state==null) state = this.state;
	if (state==null) return null;

	var element = this.getElement();
	console.log(element);
	var styleStr = element.getAttribute('data-style-'+state);
	if (styleStr == null){
		styleStr = '';
	}
	var style = goog.style.parseStyleAttribute(styleStr);
	console.log('getStyle '+state+' - '+styleStr+' - '+style);
	return style;
}
/**
 * display the style in data-style-*
 */
silex.view.PropertiesTool.prototype.setStyle = function(state){
	if(state==null) state = this.state;
	var element = this.getElement();
	//element.setAttribute('style', element.getAttribute('data-style-'+state));
	goog.style.setStyle(element, this.getStyle(state));
}
/**
 * apply the current style properties to the element being edited 
 */
silex.view.PropertiesTool.prototype.applyStyle = function(style){
	console.log('applyStyle ');

	// default value for style is the style of the element being edited
	if (!style){
		style = this.getStyle();
	}
	// dispatch event
	if (this.onPropertiesToolEvent){
		this.onPropertiesToolEvent({
			type: 'styleChanged',
			style: style,
			state: this.state,
		});
	}
	// refresh UI
	this.displayStyle()
}
/**
 * display the style of the element being edited 
 */
silex.view.PropertiesTool.prototype.displayStyle = function(){
	// select the element being edited
	var element = this.getElement();
//	var style = this.getStyle();

	// **
	// BG color
	//var color = style.backgroundColor;
	var color = goog.style.getStyle(element, 'background-color');
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
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	console.log('setPages '+data);
	// store data
	this.pages = data;
	// reset selection
	this.setElements([]);
	// reset page checkboxes
	goog.array.forEach(this.pageCheckboxes, function(item) {
		item.checkbox.dispose();
	});
	// init page template
	var pagesContainer = goog.dom.getElementByClass('pages-container', this.element);
	var templateHtml = goog.dom.getElementByClass('pages-selector-template', this.element).innerHTML;
	silex.TemplateHelper.resolveTemplate(pagesContainer, templateHtml, {pages:this.pages});
	// create page checkboxes
	this.pageCheckboxes = [];
	var that = this;
	var mainContainer = goog.dom.getElementByClass('pages-container', this.element);
	var items = goog.dom.getElementsByClass('page-container', mainContainer);
	var idx = 0;
	goog.array.forEach(items, function(item) {
		console.log('found one container '+item.className);
		var checkboxElement = goog.dom.getElementByClass('page-check', item);
		var labelElement = goog.dom.getElementByClass('page-label', item);
		var checkbox = new goog.ui.Checkbox();
		var pageName = that.pages[idx++];
		checkbox.render(checkboxElement);
		checkbox.setLabel (labelElement);
		that.pageCheckboxes.push({
			checkbox: checkbox,
			page: pageName,
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
	if (this.elements){
		// restore the normal state
		this.setStyle(silex.view.PropertiesTool.STATE_NORMAL);
	}
	this.elements = elements;
	this.setStyle();
	this.displayStyle();
	this.redraw();
}
/**
 * redraw the properties
 */
silex.view.PropertiesTool.prototype.redraw = function(){
	console.log('redraw '+this.pages);

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
		console.log('checkbox found '+item.checkbox.isEnabled()+' - '+item.checkbox.isChecked());
	});

	// refresh properties
	var editionContainer = goog.dom.getElementByClass('edition-container', this.element);
	if (element.getAttribute){
		var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
		silex.TemplateHelper.resolveTemplate(editionContainer, templateHtml, {
			textEditor: (element.getAttribute('data-silex-sub-type')==silex.view.Stage.ELEMENT_SUBTYPE_TEXT),
		});

		// text editor
		var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
		if (buttonElement){
			var button = new goog.ui.CustomButton();
			button.decorate(buttonElement);
			goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
				if (that.onPropertiesToolEvent){
					that.onPropertiesToolEvent({
						type: 'openTextEditor',
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
