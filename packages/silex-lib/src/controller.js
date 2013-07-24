var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.Controller');

goog.require('silex.model.File');
goog.require('silex.model.Selection');


/**
 * the Silex controller class
 * @constructor
 */
silex.Controller = function(workspace, menu, stage, pageTool, propertiesTool, textEditor, fileExplorer){
	var that = this;
	
	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;
	
	// cerate the model
	this.file = new silex.model.File();
	this.selection = new silex.model.Selection();

	// attach events to the view and model
	this.menu.onMenuEvent = function(e){that.menuEvent(e);};
	this.pageTool.onPageToolEvent = function(e){that.pageToolEvent(e);};
	this.propertiesTool.onPropertiesToolEvent = function(e){that.propertiesToolEvent(e);};
	this.propertiesTool.onSelectImage = function(cbk){that.onChooseFileRequest(cbk);};
	this.textEditor.onTextEditorEvent = function(e){that.textEditorEvent(e);};
	//this.fileExplorer.onFileExplorerEvent = function(e){that.fileExplorerEvent(e);};
	this.stage.onStageEvent = function(e){that.stageEvent(e);};
	this.selection.onChanged = function (eventName){that.selectionEvent(eventName)};
}
/**
 * creation template URL constant
 */
silex.Controller.CREATION_TEMPLATE = 'creation-template.html';
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
/**
 * select the element being edited
 */
silex.Controller.prototype.getElement = function(){
	var element;
	var selectedElements = this.selection.getSelectedElements();
	if (selectedElements && selectedElements.length>0){
		element = selectedElements[0];
	}
	else{
		// site background
		element = this.stage.bodyElement;
	}
	return element;
}
/**
 * selection event handler
 */
silex.Controller.prototype.selectionEvent = function(eventName){
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
 * TextEditor event handler
 */
silex.Controller.prototype.textEditorEvent = function(e){
	switch(e.type){
		case 'changed':
			var element = this.getElement();
			element.innerHTML = this.textEditor.getData();
			break;
		case 'closed':
			var element = this.getElement();
			this.stage.makeEditable(true, element);
			break;
	}
}
/**
 * FileExplorer event handler
 *
silex.Controller.prototype.fileExplorerEvent = function(e){
	switch(e.type){
		case 'ready':
			break;
	}
}
/**
 * page tool event handler
 */
silex.Controller.prototype.pageToolEvent = function(e){
	switch(e.type){
		case 'selectionChanged':
			this.selection.setSelectedPage(this.pageTool.getSelectedItems()[0]);
			break;
		case 'removePage':
			this.removePage(e.name);
			break;
		case 'ready':
			this.workspace.redraw();
			break;
	}
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.onChooseFileRequest = function(cbk){
	//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', window.location.href+'assets/test.png');
	this.fileExplorer.browse(function (result) {
		cbk(result.url);
	});
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.propertiesToolEvent = function(e){
	switch(e.type){
		case 'ready':
			this.workspace.redraw();
			break;
		case 'openTextEditor':
			this.editText();
			break;
		case 'changedState':
			break;
		case 'styleChanged':
			this.saveSelectionStyle();
			break;
	}
}
/**
 * store style in data-style-*
 */
silex.Controller.prototype.saveSelectionStyle = function(){
	this.propertiesTool.saveStyle();
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.stageEvent = function(e){
	switch(e.type){
		case 'ready':
			this.workspace.redraw();
			break;
		case 'select':
			if (e.element){
				this.selection.setSelectedElements([e.element]);
			}
			else{
				this.selection.setSelectedElements([]);
			}
			break;
		case 'change':
			// size or position of the element has changed
			this.saveSelectionStyle();
			break;
	}
}
/**
 * menu events
 */
silex.Controller.prototype.menuEvent = function(e){
	var that = this;
	if (e && e.target){
		if (goog.dom.classes.has(e.target,'website-name')){
			var name = window.prompt('What is the name of your website?', this.menu.getWebsiteName());
			if(name){
				this.menu.setWebsiteName(name);
				// update website title
				this.stage.setTitle(name);
			}
		}
		else{
			switch(e.target.getId()){
				case 'file.new':
					this.openFile(silex.Controller.CREATION_TEMPLATE, function(){
						that.selection.setSelectedFile(null);
					});
					break;
				case 'file.saveas':
					this.fileExplorer.saveHtmlAs(
					this.file,
					function () {
						that.file.save(that.stage.getBody(that.file.url), 
							that.stage.getHead(), that.stage.getBodyStyle());
					},
					function () {
						console.log('save success');
						that.selection.setSelectedFile(that.file.url, false);
					});
				case 'file.save':
					if (this.selection.getSelectedFile()==null){
						//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 
						//	window.location.href+'html/test1.html');

						this.fileExplorer.saveHtmlAs(
						this.file,
						function () {
							that.file.save(that.stage.getBody(that.file.url), 
								that.stage.getHead(), that.stage.getBodyStyle());
						},
						function () {
							console.log('save success');
							that.selection.setSelectedFile(that.file.url, false);
						});
					}
					else{
						this.file.save(this.stage.getBody(this.selection.getSelectedFile()), 
							this.stage.getHead(), this.stage.getBodyStyle());
						this.fileExplorer.saveHtml(this.file);
					}
					break;
				case 'file.open':
					this.fileExplorer.browseHtml(this.file, function (result) {
						//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 
						//window.location.href+'html/test1.html');
						that.openFile(result.url, function(){
							that.selection.setSelectedFile(result.url);
						});
					});
					break;
				case 'file.close':
					this.closeFile();
					break;
				case 'view.file':
					window.open(this.selection.file);
					break;
				case 'view.open.fileExplorer':
					this.fileExplorer.browseHtml(this.file);
					break;
				case 'insert.page':
					this.insertPage();
					break;
				case 'insert.text':
					this.stage.addElement(silex.view.Stage.ELEMENT_SUBTYPE_TEXT, function (element) {
						console.log('loaded'+element);
						that.selection.setSelectedElements([element]);
					});
					break;
				case 'insert.image':
					this.onChooseFileRequest(function (url) {
						if(url){
							that.stage.addElement(silex.view.Stage.ELEMENT_SUBTYPE_IMAGE, function (element) {
								console.log('loaded'+element);
								that.selection.setSelectedElements([element]);
							}, url);
						}
					})
					break;
				case 'insert.container':
					this.stage.addElement(silex.view.Stage.ELEMENT_TYPE_CONTAINER, function (element) {
						console.log('loaded'+element);
						that.selection.setSelectedElements([element]);
					});
					break;
				case 'edit.delete.selection':
					var element = this.selection.getSelectedElements()[0];
					this.stage.removeElement(element);
					break;
				case 'edit.delete.page':
					this.removePage(this.selection.getSelectedPage());
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
	}
	else{
		this.workspace.redraw();
	}
}
/**
 * open a file
 */
silex.Controller.prototype.openFile = function(url, cbk){
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
silex.Controller.prototype.closeFile = function(){
	this.file.close();
	this.selection.setSelectedFile(null);
	this.selection.setSelectedPage(null);
	this.selection.setSelectedElements([]);
}
/**
 * insert a new page
 */
silex.Controller.prototype.insertPage = function(){
	// create the new page in the view
	var pageName = window.prompt('What name for your new page?', '');
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
silex.Controller.prototype.removePage = function(pageName){
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
 * Edit text content
 */
silex.Controller.prototype.editText = function(){
	var element = this.getElement();
	this.stage.makeEditable(false, element);
	this.textEditor.openEditor(element.innerHTML);
	this.workspace.redraw();
}
/**
 * model event
 */
silex.Controller.prototype.fileLoaded = function(){
	this.stage.setContent(this.file.bodyTag, this.file.headTag, this.file.bodyStyle, this.selection.getSelectedFile());

	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	if (pages.length > 0){
		this.stage.openPage(pages[0]);
		this.pageTool.setSelectedIndexes([0]);
	}

	// update website title
	var title = this.stage.getTitle();
	if (title){
		this.menu.setWebsiteName(title);
	}
}
/**
 * model event
 */
silex.Controller.prototype.fileClosed = function(){
	this.stage.cleanup();
}
