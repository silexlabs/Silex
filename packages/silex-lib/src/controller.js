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

goog.provide('silex.Controller');

/**
 * the Silex controller class
 * @constructor
 */
silex.Controller = function(
	workspace, 
	menu, 
	stage, 
	pageTool, 
	propertiesTool, 
	textEditor, 
	fileExplorer, 
	file, 
	selection){

	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;

	// store reference to the model
	this.file = file;
	this.selection = selection;

	// init selection
	this.selection.setComponent(this.file.getStageComponent());

	// attach events to the view and model
	this.menu.onStatus = goog.bind(this.menuCallback, this);
	this.stage.onStatus = goog.bind(this.stageCallback, this);
	this.pageTool.onStatus = goog.bind(this.pageToolCallback, this);
	this.propertiesTool.onStatus = goog.bind(this.propertiesToolCallback, this);
	this.textEditor.onStatus = goog.bind(this.textEditorCallback, this);
}
/**
 * reference to the workspace component (view)
 */
silex.Controller.prototype.workspace;
/**
 * reference to the menu from the view
 * this.menu.menu is the actual closure component 
 */
silex.Controller.prototype.menu;
/**
 * reference to the stage component (view)
 */
silex.Controller.prototype.stage;
/**
 * reference to the page tool component (view)
 */
silex.Controller.prototype.pageTool;
/**
 * reference to the properties tool component (view)
 */
silex.Controller.prototype.propertiesTool;
/**
 * reference to the TextEditor component (view)
 */
silex.Controller.prototype.textEditor;
/**
 * reference to the FileExplorer component (view)
 */
silex.Controller.prototype.fileExplorer;
/**
 * reference to the model
 */
silex.Controller.prototype.file;
/**
 * reference to the model
 */
silex.Controller.prototype.selection;

////////////////////////////////////////////////////////////////
// Callback for the view events
////////////////////////////////////////////////////////////////
/**
 * menu event handler
 */
silex.Controller.prototype.menuCallback = function(event){
	console.log('menuCallback');
	console.log(event);
	switch(event.type){
		case 'title.changed':
			var name = window.prompt('What is the name of your website?', this.menu.getWebsiteName());
			if (name) this.file.setTitle(name);
			break;
		case 'file.new':
			this.file.newFile();
			break;
		case 'file.saveas':
			this.file.saveAs();
			break;

		case 'file.save':
			if (this.file.getUrl()==null){
				this.file.saveAs();
			}
			else{
				this.file.save();
			}
			break;
		case 'file.open':
			this.file.open(goog.bind(function () {
				this.selection.setComponent(this.file.getStageComponent());
			}, this));
			break;
		case 'file.close':
			this.file.close(goog.bind(function () {
				this.selection.setComponent(null);
			}, this));
			break;
		case 'view.file':
			this.file.view()
			break;
		case 'tools.debug.activate':
			goog.log.info(this.theLogger, goog.debug.deepExpose(event));
goog.debug.LogManager.getLoggers
setLevel(level)
			break;
		case 'tools.debug.deactivate':
			goog.log.fine(this.theLogger, goog.debug.expose(event), 'test debug', 'test debug 2');
goog.debug.LogManager.getLoggers
setLevel(level)
debugWindow.setEnabled(true);
			break;
		case 'tools.debug.open':
			// Create the debug window.
			this.theLogger = goog.log.getLogger('demo');
			var debugWindow = new goog.debug.FancyWindow('main');
			debugWindow.setEnabled(true);
			debugWindow.init();
			break;
		case 'tools.debug.close':
			debugWindow.setEnabled(false);
			break;
		case 'view.open.fileExplorer':
			this.fileExplorer.openDialog();
			this.workspace.invalidate();
			break;
		case 'insert.page':
			this.file.createPage(goog.bind(function (page) {
				this.selection.setPage(page);
				page.open();
			}, this));
			break;
		case 'insert.text':
			var component = this.file.getStageComponent().addText();
			this.selection.setComponent(component);
			break;
		case 'insert.image':
			this.fileExplorer.openDialog(
			goog.bind(function (blob) {
				var component = this.file.getStageComponent().addImage(blob.url);
				this.selection.setComponent(component);
			}, this),
			['image/*', 'text/plain']);
			this.workspace.invalidate();
			break;
		case 'insert.container':
			var component = this.file.getStageComponent().addContainer();
			this.selection.setComponent(component);
			break;
		case 'edit.delete.selection':
			// delete component
			this.file.getStageComponent().remove(this.selection.getComponent());
			// select stage 
			this.selection.setComponent(this.file.getStageComponent());
			break;
		case 'edit.delete.page':
			console.log(this.selection.getPage());
			this.selection.getPage().remove();
			break;
		case 'edit.rename.page':
			this.selection.getPage().rename();
			this.selection.getPage().open();
			break;
		// Help menu
		case 'help.about':
			window.open("http://www.silexlabs.org/silex/");
			break;
		case 'help.aboutSilexLabs':
			window.open("http://www.silexlabs.org/silexlabs/");
			break;
		case 'help.forums':
			window.open("http://www.silexlabs.org/groups/silex/hierarchy");
			break;
		case 'help.newsLetter':
			window.open("http://feedburner.google.com/fb/a/mailverify?uri=SilexLabsBlogEn");
			break;
		case 'help.googlPlus':
			window.open("https://plus.google.com/communities/107373636457908189681");
			break;
		case 'help.twitter':
			window.open("http://twitter.com/silexlabs");
			break;
		case 'help.facebook':
			window.open("http://www.facebook.com/silexlabs");
			break;
		case 'help.forkMe':
			window.open("https://bitbucket.org/lexoyo/silex");
			break;
	}
}
/**
 * stage event handler
 */
silex.Controller.prototype.stageCallback = function(event){
	console.log('stageCallback '+this.selection.getContext());
	console.log(event);
	switch(event.type){
		case 'select':
			// reset context for the old selection
			var oldSelectedComp = this.selection.getComponent();
			if (oldSelectedComp) oldSelectedComp.setContext(silex.model.Component.CONTEXT_NORMAL);
			// select the new element
			if (event.element){
				// update the 
				this.selection.setComponent(
					new silex.model.Component(
						event.element, 
						this.selection.getContext()
				));
				// update context for the selection
				this.selection.getComponent().setContext(this.selection.getContext());
			}
			else{
				// select stage 
				this.selection.setComponent(this.file.getStageComponent());
			}
			break;
		case 'change':
			console.log(this.selection.getComponent().element);
			console.log(this.selection.getComponent().getBoundingBox());
			// size or position of the element has changed
			this.selection.getComponent().setBoundingBox(
				this.selection.getComponent().getBoundingBox()
			);
			console.log(this.selection.getComponent().element);
			console.log(this.selection.getComponent().getBoundingBox());
			break;
	}
}
/**
 * pageTool event handler
 */
silex.Controller.prototype.pageToolCallback = function(event){
	console.log('pageToolCallback');
	console.log(event);
	switch(event.type){
	case 'changed':
		this.selection.setPage(event.page);
		if (event.page){
			event.page.open();
		}
		break;
	case 'delete':
		// delete the page from the model
		event.page.remove();
		break;
	case 'rename':
		// delete the page from the model
		event.page.rename();
		break;
	}
}
/**
 * propertiesTool event handler
 */
silex.Controller.prototype.propertiesToolCallback = function(event){
	console.log('propertiesToolCallback');
	console.log(event);
	switch(event.type){
		case 'openTextEditor':
			this.textEditor.openEditor(this.selection.getComponent().getHtml());
			break;
		case 'contextChanged':
			// style of the element has changed
			this.selection.setContext(event.context);
			this.selection.getComponent().setContext(event.context);
			break;
		case 'styleChanged':
			// style of the element has changed
			this.selection.getComponent().setStyle(event.style, event.context);
			break;
		case 'propertiesChanged':
			break;
	}
}
/**
 * textEditor event handler
 */
silex.Controller.prototype.textEditorCallback = function(event){
	console.log('textEditorCallback');
	console.log(event);
	switch(event.type){
	case 'changed':
		this.selection.getComponent().setHtml(event.content);
		break;
	}
}
