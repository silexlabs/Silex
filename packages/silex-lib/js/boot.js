goog.require('goog.dom');
goog.require('goog.events');

window.onload = function() {
	console.log('onload');

	var menuElement = goog.dom.getElementByClass('silex-menu');
	var menu = new silex.view.Menu(menuElement, function(){
		console.log('menu ready');
	});
	var stageElement = goog.dom.getElementByClass('silex-stage');
	var stage = new silex.view.Stage(stageElement, function(){
		console.log('stage ready');
	});

	var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
	var pageTool = new silex.view.PageTool(pageToolElement, function(){
		console.log('pageTool ready');
	});

	var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
	var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement, function(){
		console.log('propertiesTool ready');
	});

	var workspaceElement = goog.dom.getElementByClass('silex-workspace');
	var workspace = new silex.view.Workspace(workspaceElement, menu, stage, pageTool, propertiesTool);

	var controller = new silex.controller.Main(workspace, menu, stage, pageTool, propertiesTool);
	
	stage.onReady = function(){	
		//var url = null;
		var url = 'html/test1.html';
		controller.openFile(url, function(){
			controller.selection.setSelectedFile(url);
		});
	}
}
