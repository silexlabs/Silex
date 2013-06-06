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
	this.selection.onChanged = function (eventName){
		if (eventName == 'file'){
			if (that.selection.getSelectedFile()==null){
				that.fileClosed();
			}
			else{
				that.fileLoaded();
			}
		}
	};
}
/**
 * page tool event
 */
silex.controller.Main.prototype.pageToolEvent = function(e){
	console.log('page tool event '+this.pageTool.getSelectedItems()[0]+' - '+e.type);
}
/**
 * menu events
 */
silex.controller.Main.prototype.menuEvent = function(e){
	console.log('menu event '+e.target.getCaption() + ' - '+e.target.getId());
	switch(e.target.getId()){
		case 'file.new':
			this.file.load(null, function(){
				this.selection.setSelectedFile(url);
			});
			break;
		case 'file.save':
			this.file.save(this.stage.getCleanContent());
			break;
		case 'file.open':
			break;
		case 'file.close':
			this.file.close();
			this.selection.setSelectedFile(null);
			break;
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileLoaded = function(){
	console.log('fileLoaded');
	var htmlData = this.file.bodyTag;
	this.stage.setContent(htmlData);
	this.pageTool.setDataProvider(this.stage.getPages());
}
/**
 * model event
 */
silex.controller.Main.prototype.fileClosed = function(){
	this.stage.cleanup();
}
