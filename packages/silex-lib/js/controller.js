var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.controller.Main');

/**
 * the Silex controller class
 */
silex.controller.Main = function(){
	this.file = silex.model.File.getInstance();
	this.selection = silex.model.Selection.getInstance();
}
/**
 * singleton pattern
 */
silex.controller.Main._instance = null;
/**
 * singleton pattern
 */
silex.controller.Main.getInstance = function(){
	if (silex.controller.Main._instance === null){
		silex.controller.Main._instance = new silex.controller.Main();
	}
	return silex.controller.Main._instance;
}
/**
 * reference to the menu from the view
 * this.menu.menu is the actual closure component 
 */
silex.controller.Main.prototype.menu;
/**
 * reference to the page tool component (view)
 */
silex.controller.Main.prototype.pageTool;
/**
 * reference to the stage component (view)
 */
silex.controller.Main.prototype.stage;
/**
 * reference to the model
 */
silex.controller.Main.prototype.file;
/**
 * reference to the model
 */
silex.controller.Main.prototype.selection;
/**
 * attach events
 */
silex.controller.Main.prototype.initView = function(menu, pageTool, stage){
	console.log('controller initView '+menu+', '+stage);
	this.menu = menu;
	this.pageTool = pageTool;
	this.stage = stage;
	var that = this;
	this.menu.onMenuEvent = function(e){that.menuEvent(e);};
	this.pageTool.onPageToolEvent = function(e){that.pageToolEvent(e);};
}
/**
 * attach events
 */
silex.controller.Main.prototype.attachEvents = function(){
	console.log('controller attachEvents ');
	var that = this;
	this.selection.onChanged = function (eventName){that.selectionEvent(eventName)};
}
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
			this.stage.openPage(this.selection.getSelectedPage());

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
	}
}
/**
 * menu events
 */
silex.controller.Main.prototype.menuEvent = function(e){
	console.log('menu event '+e.target.getCaption() + ' - '+e.target.getId());
	switch(e.target.getId()){
		case 'file.new':
			var that = this;
			this.file.load(null, function(){
				that.selection.setSelectedFile(null);
			});
			break;
		case 'file.save':
			this.file.save(this.stage.getBody());
			break;
		case 'file.open':
			break;
		case 'file.close':
			this.file.close();
			this.selection.setSelectedFile(null);
			break;
		case 'view.file':
			window.open(this.selection.file);
			break;
		case 'insert.page':
			this.insertPage();
			break;
	}
}
/**
 * insert a new page
 */
silex.controller.Main.prototype.insertPage = function(){
	var pageName = window.prompt('What name for your new page?');
	this.stage.createPage(pageName);
	this.pageTool.setDataProvider(this.stage.getPages());
	this.selection.page = pageName;
}
/**
 * remove a page
 */
silex.controller.Main.prototype.removePage = function(pageName){
	var confirm = window.confirm('I am about to delete the page, are you sure about that?');
	if (confirm){
		this.stage.removePage(pageName);
		this.pageTool.setDataProvider(this.stage.getPages());
		this.selection.page = this.stage.getPages()[0];
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileLoaded = function(){
	console.log('fileLoaded');
	this.stage.setContent(this.file.bodyTag, this.file.headTag);

	var dp = this.stage.getPages();
	this.pageTool.setDataProvider(dp);
	if (dp.length > 0){
		this.stage.openPage(dp[0]);
		this.pageTool.setSelectedIndexes([0]);
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileClosed = function(){
	this.stage.cleanup();
}
