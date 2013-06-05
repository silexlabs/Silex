var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.controller.Main');

/**
 * the Silex controller class
 */
silex.controller.Main = function(){
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
 * reference to the file model
 */
silex.controller.Main.prototype.file;
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
}
/**
 * attach events
 */
silex.controller.Main.prototype.initModel = function(file){
	console.log('controller initModel '+file);
	this.file = file;
	var that = this;
	this.file.onLoad = function(){that.fileLoaded();};
	this.file.onClose = function(){that.fileClosed();};
}
/**
 * menu events
 */
silex.controller.Main.prototype.menuEvent = function(e){
	console.log('menu event '+e.target.getCaption() + ' - '+e.target.getId());
	switch(e.target.getId()){
		case 'file.new':
			this.file.load(null);
			break;
		case 'file.save':
			this.file.save(this.stage.getCleanContent());
			break;
		case 'file.open':
			break;
		case 'file.close':
			this.file.close();
			break;
	}
}
/**
 * model event
 */
silex.controller.Main.prototype.fileLoaded = function(e){
	console.log('fileLoaded');
	var htmlData = this.file.bodyTag;
	this.stage.setContent(htmlData);
}
/**
 * model event
 */
silex.controller.Main.prototype.fileClosed = function(e){
	this.stage.cleanup();
}
