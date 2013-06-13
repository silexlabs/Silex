var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.controller.Main');

/**
 * the Silex controller class
 * @constructor
 */
silex.controller.Main = function(workspace, menu, stage, pageTool, propertiesTool){
	console.log('controller initView '+menu+', '+stage);
	var that = this;
	
	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	
	// cerate the model
	this.file = new silex.model.File();
	this.selection = new silex.model.Selection();

	// attach events to the view and model
	this.menu.onMenuEvent = function(e){that.menuEvent(e);};
	this.pageTool.onPageToolEvent = function(e){that.pageToolEvent(e);};
	this.propertiesTool.onPropertiesToolEvent = function(e){that.propertiesToolEvent(e);};
	this.stage.onStageEvent = function(e){that.stageEvent(e);};
	this.selection.onChanged = function (eventName){that.selectionEvent(eventName)};
}
/**
 * creation template URL constant
 */
silex.controller.Main.CREATION_TEMPLATE = 'html/creation-template.html';
/**
 * reference to the workspace component (view)
 */
silex.controller.Main.prototype.workspace;
/**
 * reference to the menu from the view
 * this.menu.menu is the actual closure component 
 */
silex.controller.Main.prototype.menu;
/**
 * reference to the stage component (view)
 */
silex.controller.Main.prototype.stage;
/**
 * reference to the page tool component (view)
 */
silex.controller.Main.prototype.pageTool;
/**
 * reference to the properties tool component (view)
 */
silex.controller.Main.prototype.propertiesTool;
/**
 * reference to the model
 */
silex.controller.Main.prototype.file;
/**
 * reference to the model
 */
silex.controller.Main.prototype.selection;
/**
 * selection event handler
 */
silex.controller.Main.prototype.selectionEvent = function(eventName){
	console.log('selection event '+eventName);
	switch (eventName){
		case 'file':
			if (this.selection.getSelectedFile()==null){
				if (this.file.bodyTag==""){
					this.fileClosed();
				}
				else{
					// case of the new site
					this.fileLoaded();
				}
			}
			else{
				this.fileLoaded();
			}
			break;
		case 'page':
			var page = this.selection.getSelectedPage();
			if (page){
				this.stage.openPage(this.selection.getSelectedPage());
			}
			break;
		case 'elements':
			this.propertiesTool.setElements(this.selection.getSelectedElements());
			break;
	}
}
/**
 * page tool event handler
 */
silex.controller.Main.prototype.pageToolEvent = function(e){
	console.log('page tool event '+this.pageTool.getSelectedItems()[0]+' - '+e.type);
	switch(e.type){
		case 'selectionChanged':
			this.selection.setSelectedPage(this.pageTool.getSelectedItems()[0]);
			break;
		case 'removePage':
			this.removePage(e.name);
			break;
		case 'ready':
			console.log('ready => redraw');
			this.workspace.redraw();
			break;
	}
}
/**
 * properties tool event handler
 */
silex.controller.Main.prototype.propertiesToolEvent = function(e){
	switch(e.type){
		case 'ready':
			console.log('ready => redraw');
			this.workspace.redraw();
			break;
	}
}
/**
 * properties tool event handler
 */
silex.controller.Main.prototype.stageEvent = function(e){
	switch(e.type){
		case 'ready':
			console.log('ready => redraw');
			this.workspace.redraw();
			break;
		case 'select':
			console.log('select ');
			if (e.element){
				this.selection.setSelectedElements([e.element]);
			}
			else{
				this.selection.setSelectedElements([]);
			}
			break;
	}
}
/**
 * menu events
 */
silex.controller.Main.prototype.menuEvent = function(e){
	var that = this;
	if (e && e.target){
		console.log('menu event '+e.target.getCaption() + ' - '+e.target.getId());
		switch(e.target.getId()){
			case 'file.new':
				this.openFile(silex.controller.Main.CREATION_TEMPLATE, function(){
					that.selection.setSelectedFile(null);
				});
				break;
			case 'file.save':
				if (this.selection.getSelectedFile()!=null){
					that.file.save(this.stage.getBody());
				}
				else{
					var url = window.prompt('What is the file name? (todo: open dropbox file browser)');
					that.file.saveAs(this.stage.getBody(), url);
				}
				break;
			case 'file.open':
				var url = window.prompt('What is the file name? (todo: open dropbox file browser)');
				this.openFile(url, function(){
					that.selection.setSelectedFile(url);
				});
				break;
			case 'file.close':
				this.closeFile();
				break;
			case 'view.file':
				window.open(this.selection.file);
				break;
			case 'insert.page':
				this.insertPage();
				break;
			case 'insert.text':
				var element = this.stage.addElement(silex.view.Stage.ELEMENT_SUBTYPE_TEXT);
				this.selection.setSelectedElements([element]);
				break;
			case 'insert.image':
				break;
			case 'insert.container':
				var element = this.stage.addElement(silex.view.Stage.ELEMENT_TYPE_CONTAINER);
				this.selection.setSelectedElements([element]);
				break;
			case 'edit.delete':
				var element = this.selection.getSelectedElements()[0];
				this.stage.removeElement(element);
				break;
		}
	}
	else{
		console.log('ready => redraw');
		this.workspace.redraw();
	}
}
/**
 * open a file
 */
silex.controller.Main.prototype.openFile = function(url, cbk){
	var that = this;
	this.file.load(url, function(){
		if (cbk) cbk();
		that.selection.setSelectedPage(null);
		that.selection.setSelectedElements([]);
	});
}
/**
 * close a file
 */
silex.controller.Main.prototype.closeFile = function(){
	this.file.close();
	this.selection.setSelectedFile(null);
	this.selection.setSelectedPage(null);
	this.selection.setSelectedElements([]);
}
/**
 * insert a new page
 */
silex.controller.Main.prototype.insertPage = function(){
	// create the new page in the view
	var pageName = window.prompt('What name for your new page?');
	this.stage.createPage(pageName);
	// update tools
	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	// update model to open this page
	this.selection.setSelectedPage(pageName);
}
/**
 * remove a page
 */
silex.controller.Main.prototype.removePage = function(pageName){
	var confirm = window.confirm('I am about to delete the page, are you sure about that?');
	if (confirm){
		// delete the page from the view
		this.stage.removePage(pageName);
		// update tools
		var pages = this.stage.getPages();
		this.pageTool.setDataProvider(pages);
		this.propertiesTool.setPages(pages);
		// update model to open this page
		this.selection.setSelectedPage(this.stage.getPages()[0]);
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileLoaded = function(){
	console.log('fileLoaded');
	this.stage.setContent(this.file.bodyTag, this.file.headTag);

	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	if (pages.length > 0){
		this.stage.openPage(pages[0]);
		this.pageTool.setSelectedIndexes([0]);
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileClosed = function(){
	this.stage.cleanup();
}
