goog.provide('silex.boot');

goog.require('goog.dom');
goog.require('goog.events');

goog.require('silex.Helper');
goog.require('silex.Controller');

goog.require('silex.view.Menu');
goog.require('silex.view.Stage');
goog.require('silex.view.PageTool');
goog.require('silex.view.PropertiesTool');
goog.require('silex.view.TextEditor');
goog.require('silex.view.FileExplorer');
goog.require('silex.view.Workspace');

silex.boot = function() {
	console.log('onload');

	var menuElement = goog.dom.getElementByClass('silex-menu');
	var menu = new silex.view.Menu(menuElement);

	var stageElement = goog.dom.getElementByClass('silex-stage');
	var stage = new silex.view.Stage(stageElement);

	var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
	var pageTool = new silex.view.PageTool(pageToolElement);

	var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
	var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement);

	var textEditorElement = goog.dom.getElementByClass('silex-texteditor');
	var textEditor = new silex.view.TextEditor(textEditorElement);

	var fileExplorerElement = goog.dom.getElementByClass('silex-fileexplorer');
	var fileExplorer = new silex.view.FileExplorer(fileExplorerElement);

	var workspaceElement = goog.dom.getElementByClass('silex-workspace');
	var workspace = new silex.view.Workspace(workspaceElement, menu, stage, pageTool, propertiesTool, textEditor, fileExplorer);

	var controller = new silex.Controller(workspace, menu, stage, pageTool, propertiesTool, textEditor, fileExplorer);
	
	stage.onReady = function(){	
		var url = silex.Controller.CREATION_TEMPLATE;
		//var url = 'html/test1.html';
		controller.openFile(url, function(){
			controller.selection.setSelectedFile(null);
/*
			setTimeout(function() { 
				var element = goog.dom.getElementsByClass('editable-style')[5];
				console.log(element);
				controller.selection.setSelectedElements([element]);
				controller.editText();
				workspace.redraw();
			}, 1000);
*/
		});
	}
}

// Ensures the symbol will be visible after compiler renaming.
goog.exportSymbol('silex.boot', silex.boot);