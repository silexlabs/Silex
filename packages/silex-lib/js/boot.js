goog.require('goog.dom');
goog.require('goog.events');

window.onload = function() {
	console.log('onload');

	var menuElement = goog.dom.getElementByClass('silex-menu');
	var menu = new silex.view.Menu(menuElement);

	var stageElement = goog.dom.getElementByClass('silex-stage');
	var stage = new silex.view.Stage(stageElement);

	var pageToolElement = goog.dom.getElementByClass('silex-pagetool');
	var pageTool = new silex.view.PageTool(pageToolElement);

	var propertiesToolElement = goog.dom.getElementByClass('silex-propertiestool');
	var propertiesTool = new silex.view.PropertiesTool(propertiesToolElement);

	var ckEditorElement = goog.dom.getElementByClass('silex-ckeditor');
	var ckEditor = new silex.view.CKEditor(ckEditorElement);

	console.log('xxx');
	console.log(ckEditor);

	var workspaceElement = goog.dom.getElementByClass('silex-workspace');
	var workspace = new silex.view.Workspace(workspaceElement, menu, stage, pageTool, propertiesTool, ckEditor);

	var controller = new silex.controller.Main(workspace, menu, stage, pageTool, propertiesTool, ckEditor);
	
	stage.onReady = function(){	
		var url = silex.controller.Main.CREATION_TEMPLATE;
		var url = 'html/test1.html';
		controller.openFile(url, function(){
			controller.selection.setSelectedFile(url);
return;
			setTimeout(function() { 
				var element = goog.dom.getElementsByClass('editable-style')[5];
				console.log(element);
				controller.selection.setSelectedElements([element]);
				controller.editText();
				workspace.redraw();
			}, 1000);
		});
	}
}
