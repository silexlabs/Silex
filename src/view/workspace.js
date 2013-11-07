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

goog.provide('silex.view.Workspace');

goog.require('goog.dom.ViewportSizeMonitor');

//////////////////////////////////////////////////////////////////
// Workspace class
//////////////////////////////////////////////////////////////////
/**
 * the Silex workspace class
 * @constructor
 */
silex.view.Workspace = function(element, menu, stage, pageTool, propertiesTool, htmlEditor, textEditor, fileExplorer, publishSettings){
	this.element = element;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.htmlEditor = htmlEditor;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;
	this.publishSettings = publishSettings;

	this.viewport = new goog.dom.ViewportSizeMonitor();

	goog.events.listen(this.viewport, goog.events.EventType.RESIZE, function(e){
		this.invalidate();
	}, false, this);
	this.isDirty = false;
	this.invalidate();
}
/**
 * closure goog.dom.ViewportSizeMonitor object
 */
silex.view.Workspace.prototype.viewport;
/**
 * reference to the silex.view.Menu class
 */
silex.view.Workspace.prototype.menu;
/**
 * reference to the silex.view.Stage class
 */
silex.view.Workspace.prototype.stage;
/**
 * reference to the silex.view.PageTool class
 */
silex.view.Workspace.prototype.pageTool;
/**
 * reference to the silex.view.PropertiesTool class
 */
silex.view.Workspace.prototype.propertiesTool;
/**
 * reference to the silex.view.HTMLEditor class
 */
silex.view.Workspace.prototype.htmlEditor;
/**
 * reference to the silex.view.TextEditor class
 */
silex.view.Workspace.prototype.textEditor;
/**
 * reference to the silex.view.FileExplorer class
 */
silex.view.Workspace.prototype.fileExplorer;
/**
 * reference to the silex.view.PublishSettings class
 */
silex.view.Workspace.prototype.publishSettings;
/**
 * element of the dom to which the component is rendered
 */
silex.view.Workspace.prototype.element;
/**
 * invalidation mechanism
 */
silex.view.Workspace.prototype.isDirty;
/**
 * set as dirty
 * invalidation mechanism
 */
silex.view.Workspace.prototype.invalidate = function(){
	if (this.isDirty === false){
		this.isDirty = true;
		this.redraw();
	}
}
/**
 * redraw the workspace, positions and sizes of the tool boxes
 * invalidation mechanism
 */
silex.view.Workspace.prototype.redraw = function(){
	if (this.isDirty === false){
		console.warn('Do not call redraw directly, use invalidate() instead');
	}
	var that = this;
	setTimeout(function() {
		that.doRedraw();
	}, 400);
}
silex.view.Workspace.prototype.doRedraw = function(){
	this.isDirty = false;

	var viewportSize = this.viewport.getSize();
	var pageToolSize = goog.style.getSize(this.pageTool.element);
	var propertiesToolSize = goog.style.getSize(this.propertiesTool.element);
	var menuSize = goog.style.getSize(this.menu.element);

	// stage
	var stageWidth = viewportSize.width - pageToolSize.width - propertiesToolSize.width;
	goog.style.setWidth(this.stage.element, stageWidth);

	// menu offset
	var toolsHeight = viewportSize.height - menuSize.height;
	goog.style.setHeight(this.pageTool.element, toolsHeight);
	goog.style.setHeight(this.propertiesTool.element, toolsHeight);
	goog.style.setHeight(this.stage.element, toolsHeight);

	goog.style.setPosition(this.pageTool.element, null, menuSize.height);

	// htmlEditor
	if (this.htmlEditor.element){
		var htmlEditorSize = goog.style.getSize(this.htmlEditor.element);
		var posX = (viewportSize.width - htmlEditorSize.width)/2;
		var posY = (viewportSize.height - htmlEditorSize.height)/2;
		goog.style.setPosition(this.htmlEditor.element, posX, posY);
	}
	// texteditor
	if (this.textEditor.element){
		var textEditorSize = goog.style.getSize(this.textEditor.element);
		var posX = (viewportSize.width - textEditorSize.width)/2;
		var posY = (viewportSize.height - textEditorSize.height)/2;
		goog.style.setPosition(this.textEditor.element, posX, posY);
	}
	// fileExplorer
	if (this.fileExplorer.element){
		var fileExplorerSize = goog.style.getSize(this.fileExplorer.element);
		var posX = (viewportSize.width - fileExplorerSize.width)/2;
		var posY = (viewportSize.height - fileExplorerSize.height)/2;
		goog.style.setPosition(this.fileExplorer.element, posX, posY);
	}
	// publishSettings
	if (this.publishSettings.element){
		var publishSettingsSize = goog.style.getSize(this.publishSettings.element);
		var posX = (viewportSize.width - publishSettingsSize.width)/2;
		var posY = (viewportSize.height - publishSettingsSize.height)/2;
		goog.style.setPosition(this.publishSettings.element, posX, posY);
	}
	// no more loading
	if (goog.dom.classes.has(document.body, 'loading-pending')){
		goog.dom.classes.remove(document.body, 'loading-pending')
	}
}
