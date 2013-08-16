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
	this.element = element;
	this.context = silex.model.Component.CONTEXT_NORMAL;
	
	silex.Helper.loadTemplateFile('templates/propertiestool.html', element, function(){
		this.buildTabs();
		this.buildStylePane();
		this.buildPropertyPane();
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
 * @see 	silex.view.propertiesTool.BgEditor
 */
silex.view.PropertiesTool.prototype.bgEditor;
/**
 * property editor
 * @see 	silex.view.propertiesTool.PropertyEditor
 */
silex.view.PropertiesTool.prototype.propertyEditor;
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
		this.bgEditor.setStyle();
	}, false, this);
}
/**
 * build the UI
 */
silex.view.PropertiesTool.prototype.buildStylePane = function(){
	// background
	this.bgEditor = new silex.view.propertiesTool.BgEditor(
		goog.dom.getElementByClass('background-editor', this.element), 
		goog.bind(this.styleChanged, this),
		goog.bind(this.selectBgImage, this)
	);
}
/**
 * build the UI
 */
silex.view.PropertiesTool.prototype.buildPropertyPane = function(){
	this.propertyEditor = new silex.view.propertiesTool.PropertyEditor(
		goog.dom.getElementByClass('property-editor', this.element), 
		goog.bind(this.propertyChanged, this),
		goog.bind(this.editText, this)
	);
}
/**
 * notify the controller that the user needs to select a bg image
 * this is called by BgEditor 
 */
silex.view.PropertiesTool.prototype.selectBgImage = function(){
	if(this.onStatus) this.onStatus({
		type: 'selectBgImage'
	});
}
/**
 * notify the controller that the user needs to edit the html content of the component
 * this is called by PropertyEditor
 */
silex.view.PropertiesTool.prototype.editText = function(){
	if(this.onStatus) this.onStatus({
		type: 'editText'
	});
}
/**
 * let the controller set a bg image
 */
silex.view.PropertiesTool.prototype.setBgImage = function(url){
	this.bgEditor.setBgImage(url);
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
 * display the style of the element being edited 
 */
silex.view.PropertiesTool.prototype.setComponent = function(component){
	this.component = component;
	this.propertyEditor.setComponent(component);

	var style = this.component.getStyle();
	this.bgEditor.setStyle(style);
}
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	this.propertyEditor.setPages(data);
}
