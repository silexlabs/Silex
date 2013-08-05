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

goog.provide('silex.boot');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('silex.Helper');
goog.require('silex.Controller');

goog.require('silex.service.CloudStorage');

goog.require('silex.model.Selection');
goog.require('silex.model.File');
goog.require('silex.model.Page');
goog.require('silex.model.Component');

goog.require('silex.view.Menu');
goog.require('silex.view.Stage');
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertiesTool');
goog.require('silex.view.TextEditor');
goog.require('silex.view.FileExplorer');
goog.require('silex.view.Workspace');

silex.boot = function() {
	console.log('--start boot--');

	// create all views and attach them to the dom
	// it is a sequence, because views loads templates one after another
	var menuElement = goog.dom.getElementByClass('silex-menu');
	var menu = new silex.view.Menu(menuElement,
	function () {
		console.log('Menu created');
		var stageElement = goog.dom.getElementByClass('silex-stage');
		var stage = new silex.view.Stage(stageElement,
	function () {
		console.log('Stage created');
		var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
		var pageTool = new silex.view.PageTool(pageToolElement,
	function () {
		console.log('PageTool created');
		var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
		var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement,
	function () {
		console.log('PropertiesTool created');
		var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
		var textEditor = new silex.view.TextEditor(textEditorElement,
	function () {
		console.log('TextEditor created');
		var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
		var fileExplorer = new silex.view.FileExplorer(fileExplorerElement,
	function () {
		console.log('FileExplorer '+fileExplorer.element);
		console.log('FileExplorer created');
		// create the workspace which place all components in the page
		var workspaceElement = goog.dom.getElementByClass('silex-workspace');
		var workspace = new silex.view.Workspace(
			workspaceElement, 
			menu, 
			stage, 
			pageTool, 
			propertiesTool, 
			textEditor, 
			fileExplorer);
		console.log('Workspace created');

		// create the main model element, the file
		// which creates pages and elements when a file will be loaded later
		// the model updates the views
		var file = new silex.model.File(
			workspace, 
			menu, 
			stage, 
			pageTool, 
			propertiesTool, 
			textEditor, 
			fileExplorer);
		console.log('File created');

		var selection = new silex.model.Selection(
			workspace, 
			menu, 
			stage, 
			pageTool, 
			propertiesTool, 
			textEditor, 
			fileExplorer);
		console.log('Selection created');

		// the controller listens to the view components 
		// and updates the model
		var controller = new silex.Controller(
			workspace, 
			menu, 
			stage, 
			pageTool, 
			propertiesTool, 
			textEditor, 
			fileExplorer,
			file,
			selection);
		console.log('Controller created');

		// now create an empty file to let the user start using Silex
		file.newFile(function () {
			controller.menuCallback({type:'insert.text'});
			controller.menuCallback({type:'insert.image'});
		});
		console.log('--end boot--');
	});
	});
	});
	});
	});
	});

/*	
	stage.onReady = function(){	
		return;
		var url = silex.Controller.CREATION_TEMPLATE;
		//var url = 'html/test1.html';
		silex.service.CloudStorage.getInstance().load(url, function(rawHtml){
			controller.file.setHtml(rawHtml);
			controller.selection.setFile(null);
			workspace.invalidate();
/*
			setTimeout(function() { 
				var element = goog.dom.getElementsByClass('editable-style')[5];
				console.log(element);
				controller.selection.setElement([element]);
				controller.editText();
				workspace.invalidate();
			}, 1000);
		});
	}
*/
}

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.boot', silex.boot);