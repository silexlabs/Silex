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
	htmlEditor, 
	textEditor, 
	fileExplorer, 
	file, 
	selection){

	// logger
	//this.logger = new silex.Logger('silex.Controller', true);

	// tracker
	this.tracker = new silex.service.Tracker();
	this.tracker.trackAction('event/controller-start', 'start', 2);

	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.htmlEditor = htmlEditor;
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
	this.htmlEditor.onStatus = goog.bind(this.htmlEditorCallback, this);
	this.textEditor.onStatus = goog.bind(this.textEditorCallback, this);

	function closeEditorWarning(){
		return 'Are you sure?'
	}
	window.onbeforeunload = closeEditorWarning;

}
/**
 * tracker
 * @see 	silex.service.Tracker
 */
silex.Controller.prototype.tracker;
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
 * reference to the HTMLEditor component (view)
 */
silex.Controller.prototype.htmlEditor;
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
	this.tracker.trackAction('user-action/menu/'+event.type, null, 4);
	switch(event.type){
		case 'title.changed':
			var name = window.prompt('What is the name of your website?', this.menu.getWebsiteName());
			if (name) this.file.setTitle(name);
			break;
		case 'file.new':
			this.file.newFile();
			break;
		case 'file.saveas':
			this.file.saveAs(null, 
				goog.bind(function (error) {
					this.tracker.trackAction('error/menu/'+event.type, JSON.stringify(error), 0);
				}, this));
			break;

		case 'file.save':
			if (this.file.getBlob()==null){
				this.file.saveAs(null,
				goog.bind(function (error) {
					this.tracker.trackAction('error/menu/'+event.type, JSON.stringify(error), 0);
				}, this));
			}
			else{
				this.file.save(null, 
					goog.bind(function (error) {
					this.tracker.trackAction('error/menu/'+event.type, JSON.stringify(error), 0);
				}, this));
			}
			break;
		case 'file.open':
			this.file.open(goog.bind(function () {
				this.selection.setComponent(this.file.getStageComponent());
			}, this), 
			goog.bind(function (error) {
				this.tracker.trackAction('error/menu/'+event.type, JSON.stringify(error), 0);
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
		case 'tools.advanced.activate':
			if (!goog.dom.classes.has(document.body, 'advanced-mode-on')){
				goog.dom.classes.add(document.body, 'advanced-mode-on');
				goog.dom.classes.remove(document.body, 'advanced-mode-off');
			}
			else{
				goog.dom.classes.remove(document.body, 'advanced-mode-on');
				goog.dom.classes.add(document.body, 'advanced-mode-off');
			}
			break;
		case 'tools.debug.activate':
			if (this.logger.getLevel() != silex.Logger.ALL){
				this.logger.setLevel(silex.Logger.ALL);
			}
			else{
				this.logger.setLevel(silex.Logger.OFF);
			}
			break;
		case 'view.open.fileExplorer':
			this.fileExplorer.openDialog();
			this.workspace.invalidate();
			break;
		case 'view.open.textEditor':
			this.editComponent();
			break;
		case 'insert.page':
			this.createPage();
			break;
		case 'insert.text':
			var component = this.file.getStageComponent().addText();
			// only visible on the current page
			this.selection.getPage().addComponent(component);
			// select the component
			this.selection.setComponent(component);
			break;
		case 'insert.html':
			var component = this.file.getStageComponent().addHtml();
			// only visible on the current page
			this.selection.getPage().addComponent(component);
			// select the component
			this.selection.setComponent(component);
			break;
		case 'insert.image':
			this.fileExplorer.openDialog(
			goog.bind(function (blob) {
					var component = this.file.getStageComponent().addImage(blob.url);
					// only visible on the current page
					this.selection.getPage().addComponent(component);
					// select the component
					this.selection.setComponent(component);
				}, this),
				['image/*', 'text/plain'],
				goog.bind(function (error) {
					this.tracker.trackAction('error/menu/'+event.type, JSON.stringify(error), 0);
				}, this)
			);
			this.workspace.invalidate();
			break;
		case 'insert.container':
			var component = this.file.getStageComponent().addContainer();
			// only visible on the current page
			this.selection.getPage().addComponent(component);
			// select the component
			this.selection.setComponent(component);
			break;
		case 'edit.delete.selection':
			// delete component
			this.file.getStageComponent().remove(this.selection.getComponent());
			// select stage 
			this.selection.setComponent(this.file.getStageComponent());
			break;
		case 'edit.delete.page':
			this.removePage(this.selection.getPage());
			break;
		case 'edit.rename.page':
			this.renamePage(this.selection.getPage());
			break;
		// Help menu
		case 'help.about':
			window.open("http://www.silexlabs.org/silex/");
			break;
		case 'help.aboutSilexLabs':
			window.open("http://www.silexlabs.org/silexlabs/");
			break;
		case 'help.forums':
			window.open("http://graphicdesign.stackexchange.com/questions/tagged/silex");
			break;
		case 'help.newsLetter':
			window.open("http://eepurl.com/F48q5");
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
			window.open("https://github.com/silexlabs/Silex");
			break;
	}
}
/**
 * stage event handler
 */
silex.Controller.prototype.stageCallback = function(event){
	this.tracker.trackAction('user-action/stage/'+event.type, null, 4);
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
			// size or position of the element has changed
			this.selection.getComponent().setBoundingBox(
				this.selection.getComponent().getBoundingBox()
			);
			this.propertiesTool.redraw();
			break;
		case 'edit':
			// size or position of the element has changed
			this.editComponent();
			break;
	}
}
/**
 * pageTool event handler
 */
silex.Controller.prototype.pageToolCallback = function(event){
	this.tracker.trackAction('user-action/page-tool/'+event.type, null, 4);
	switch(event.type){
	case 'changed':
		this.selection.setPage(event.page);
		if (event.page){
			event.page.open();
		}
		break;
	case 'delete':
		// delete the page from the model
		this.removePage(event.page);
		break;
	case 'rename':
		// delete the page from the model
		this.renamePage(event.page);
		break;
	}
}
/**
 * rename a page
 */
silex.Controller.prototype.renamePage = function(page){
	var name = this.getUserInputPageName(page.name);
	if(name){
		page.rename(name);
	}
	this.selection.getPage().open();
}
/**
 * remvoe a given page
 */
silex.Controller.prototype.removePage = function(page){
	if (window.confirm('I am about to delete the page "'+page.name+'", are you sure?')){
		// update model
		page.detach();
	}
}
/**
 * input a page name
 */
silex.Controller.prototype.getUserInputPageName = function(defaultName){
	var pageName = window.prompt('Enter a name for your page!', defaultName);
	if (pageName && pageName.length>0){
		// cleanup the page name
		pageName = pageName.replace(/\ /g,'-')
			.replace(/\./g,'-')
			.replace(/'/g,'-')
			.replace(/"/g,'-')
			.toLowerCase();
		// check if a page with this name exists
		var pages = silex.model.Page.getPages();
		var exists = null;
		goog.array.forEach(pages, function(page) {
			if (page.name == pageName)
				exists = page;
		}, this);
		if (exists){
			exists.open();
		}
		else{
			return pageName;
		}
	}
	return null;
}
/**
 * create a page
 */
silex.Controller.prototype.createPage = function(){
	var pageName = this.getUserInputPageName('My new page name');
	if(pageName){
		// create the page model
		var page = new silex.model.Page(
			pageName, 
			this.workspace,
			this.menu,
			this.stage,
			this.pageTool,
			this.propertiesTool,
			this.textEditor,
			this.fileExplorer
		);
		page.attach();
		this.selection.setPage(page);
		page.open();
	}
}

/**
 * propertiesTool event handler
 */
silex.Controller.prototype.propertiesToolCallback = function(event){
	this.tracker.trackAction('user-action/properties-tool/'+event.type, null, 4);
	switch(event.type){
		case 'editHTML':
			this.editComponent();
			break;
		case 'editText':
			this.editComponent();
			break;
		case 'selectBgImage':
			this.fileExplorer.openDialog(
			goog.bind(function (blob) {
				this.propertiesTool.setBgImage(blob.url);
			}, this),
			['image/*', 'text/plain'],
			goog.bind(function (error) {
				this.tracker.trackAction('error/properties-tool/'+event.type, JSON.stringify(error), 0);
			}, this)
			);
			this.workspace.invalidate();
			break;
		case 'selectImage':
			this.editComponent();
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
 * htmlEditor event handler
 */
silex.Controller.prototype.htmlEditorCallback = function(event){
	switch(event.type){
	case 'changed':
		this.selection.getComponent().setHtml(event.content);
		break;
	}
}
/**
 * textEditor event handler
 */
silex.Controller.prototype.textEditorCallback = function(event){
	switch(event.type){
	case 'changed':
		this.selection.getComponent().setHtml(event.content);
		break;
	}
}
/**
 * edit a component
 * take its type into account
 */
silex.Controller.prototype.editComponent = function(){
	var component = this.selection.getComponent();
	switch(component.type){
	case silex.model.Component.SUBTYPE_TEXT:
		this.textEditor.openEditor(component.getHtml());
		break;
	case silex.model.Component.SUBTYPE_HTML:
		this.htmlEditor.openEditor(component.getHtml());
		break;
	case silex.model.Component.SUBTYPE_IMAGE:
		this.fileExplorer.openDialog(
		goog.bind(function (blob) {
			this.propertiesTool.setImage(blob.url);
		}, this),
		['image/*', 'text/plain'],
			goog.bind(function (error) {
				this.tracker.trackAction('error/edit-component/'+event.type, JSON.stringify(error), 0);
			}, this)
		);
		this.workspace.invalidate();
		break;
	}
}
