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

goog.provide('silex.model.Selection');

//////////////////////////////////////////////////////////////////
// Selection class
//////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
silex.model.Selection = function(
	workspace, 
	menu, 
	stage, 
	pageTool, 
	propertiesTool, 
	textEditor, 
	fileExplorer){

	// store the view
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;

	this.file = null;
	this.page = null;
	this.component = null;
	this.context = silex.model.Component.CONTEXT_NORMAL;
}
/** 
 * selected file
 */
silex.model.Selection.prototype.file;
/** 
 * selected page
 */
silex.model.Selection.prototype.page;
/** 
 * selected component
 */
silex.model.Selection.prototype.component;
/** 
 * selected context
 */
silex.model.Selection.prototype.context;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.workspace;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.menu;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.stage;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.pageTool;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.propertiesTool;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.textEditor;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.fileExplorer;
/** 
 * page selection
 */
silex.model.Selection.prototype.getPage = function(){
	return this.page;
}
/**
 * change selection
 */
silex.model.Selection.prototype.setPage = function(page){
	this.page = page;
}
/** 
 * file selection
 */
silex.model.Selection.prototype.getFile = function(){
	return this.file;
}
/**
 * change selection
 */
silex.model.Selection.prototype.setFile = function(name){
	this.file = name;
}
/** 
 * component selection
 */
silex.model.Selection.prototype.getComponent = function(){
	return this.component;
}
/**
 * change selection
 */
silex.model.Selection.prototype.setComponent = function(component){
	this.component = component;
	// update tools
	this.propertiesTool.setComponent(component);
}
/** 
 * component selection
 */
silex.model.Selection.prototype.getContext = function(){
	return this.context;
}
/**
 * change selection
 */
silex.model.Selection.prototype.setContext = function(context){
	this.context = context;
}

