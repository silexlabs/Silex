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
goog.require('goog.ui.TabBar');
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
	// logger
	this.logger = new silex.Logger('silex.view.PropertiesTool', true);

	this.element = element;
	this.context = silex.model.Component.CONTEXT_NORMAL;
	
	silex.Helper.loadTemplateFile('templates/propertiestool.html', element, function(){
		this.buildTabs();
		this.buildPanes();
		if (cbk) cbk();
	}, this);
}
/**
 * logger for debugging
 * @see 	silex.Logger
 */
silex.model.Component.prototype.logger;
/**
 * tabs titles
 */
silex.view.PropertiesTool.TAB_TITLE_NORMAL='Normal';
silex.view.PropertiesTool.TAB_TITLE_HOVER='Hover';
silex.view.PropertiesTool.TAB_TITLE_PRESSED='Pressed';
/**
 * element of the dom to which the component is rendered
 */
silex.view.PropertiesTool.prototype.element;
/**
 * current component
 */
silex.view.PropertiesTool.prototype.component;
/**
 * current context (normal, hover, pressed)
 */
silex.view.PropertiesTool.prototype.context;
/**
 * bg editor
 * @see 	silex.view.propertiesTool.BgPane
 */
silex.view.PropertiesTool.prototype.bgPane;
/**
 * property editor
 * @see 	silex.view.propertiesTool.PropertyPane
 */
silex.view.PropertiesTool.prototype.propertyPane;
/**
 * editor
 * @see 	silex.view.propertiesTool.BorderPane
 */
silex.view.PropertiesTool.prototype.borderPane;
/**
 * property editor
 * @see 	silex.view.propertiesTool.PagePane
 */
silex.view.PropertiesTool.prototype.pagePane;
/**
 * callback set by the controller
 */
silex.view.PropertiesTool.prototype.onStatus;
/**
 * build tabs for the different contexts (normal, pressed, hover)
 */
silex.view.PropertiesTool.prototype.buildTabs = function(){
	var tabContainer = goog.dom.getElementByClass('tab-bar-container', this.element);
	var tabBar = new goog.ui.TabBar();
	tabBar.decorate(tabContainer);
	goog.events.listen(tabBar, goog.ui.Component.EventType.ACTION, function(event) { 
		switch(tabBar.getSelectedTab().getCaption()){
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
		// update display
		var style = this.component.getStyle();
		this.bgPane.setStyle();
	}, false, this);
}
/**
 * build the UI
 */
silex.view.PropertiesTool.prototype.buildPanes = function(){
	this.logger.info('buildPane', 
		goog.dom.getElementByClass('background-editor', this.element), 
		goog.dom.getElementByClass('page-editor', this.element), 
		goog.dom.getElementByClass('property-editor', this.element)
	);
	// background
	this.bgPane = new silex.view.propertiesTool.BgPane(
		goog.dom.getElementByClass('background-editor', this.element), 
		goog.bind(this.styleChanged, this),
		goog.bind(this.selectBgImage, this)
	);
	// border
	this.borderPane = new silex.view.propertiesTool.BorderPane(
		goog.dom.getElementByClass('border-editor', this.element), 
		goog.bind(this.styleChanged, this)
	);
	// property
	this.propertyPane = new silex.view.propertiesTool.PropertyPane(
		goog.dom.getElementByClass('property-editor', this.element), 
		goog.bind(this.propertyChanged, this),
		goog.bind(this.editText, this),
		goog.bind(this.selectImage, this)
	);
	// page
	this.pagePane = new silex.view.propertiesTool.PagePane(
		goog.dom.getElementByClass('page-editor', this.element), 
		goog.bind(this.propertyChanged, this)
	);
}
/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane 
 */
silex.view.PropertiesTool.prototype.selectBgImage = function(){
	if(this.onStatus) this.onStatus({
		type: 'selectBgImage'
	});
}
/**
 * let the controller set a bg image
 */
silex.view.PropertiesTool.prototype.setBgImage = function(url){
	this.bgPane.setBgImage(url);
}
/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgPane 
 */
silex.view.PropertiesTool.prototype.selectImage = function(){
	if(this.onStatus) this.onStatus({
		type: 'selectImage'
	});
}
/**
 * let the controller set a bg image
 */
silex.view.PropertiesTool.prototype.setImage = function(url){
	this.propertyPane.setImage(url);
}
/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyPane
 */
silex.view.PropertiesTool.prototype.editText = function(){
	if(this.onStatus) this.onStatus({
		type: 'editText'
	});
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
}
/**
 * notify the controller that the component properties changed
 */
silex.view.PropertiesTool.prototype.propertyChanged = function(){
	// notify the controler
	if (this.onStatus){
		this.onStatus({
			type: 'propertiesChanged',
			context: this.context
		});
	}
}
/**
 * set component
 */
silex.view.PropertiesTool.prototype.setComponent = function(component){
	this.logger.fine('setComponent', component);
	this.component = component;
	this.propertyPane.setComponent(component);
	this.pagePane.setComponent(component);

	var style = this.component.getStyle();
	this.borderPane.setStyle(style);
	this.bgPane.setStyle(style);
}
/**
 * force redraw
 */
silex.view.PropertiesTool.prototype.redraw = function(){
	this.logger.fine('redraw');

	this.borderPane.redraw();
	this.propertyPane.redraw();
	this.pagePane.redraw();
	this.bgPane.redraw();
}
/**
 * display the style of the element being edited 
 */
silex.view.PropertiesTool.prototype.setBaseUrl = function(url){
	this.propertyPane.setBaseUrl(url);
}
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	this.pagePane.setPages(data);
}
