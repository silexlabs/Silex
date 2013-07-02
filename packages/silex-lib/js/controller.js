var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.Controller');

/**
 * the Silex controller class
 * @constructor
 */
silex.Controller = function(workspace, menu, stage, pageTool, propertiesTool, ckEditor){
	console.log('controller initView '+menu+', '+stage);
	var that = this;
	
	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.ckEditor = ckEditor;
	
	// cerate the model
	this.file = new silex.model.File();
	this.selection = new silex.model.Selection();

	// attach events to the view and model
	this.menu.onMenuEvent = function(e){that.menuEvent(e);};
	this.pageTool.onPageToolEvent = function(e){that.pageToolEvent(e);};
	this.propertiesTool.onPropertiesToolEvent = function(e){that.propertiesToolEvent(e);};
	this.propertiesTool.onSelectImage = function(cbk){that.onChooseFileRequest(cbk);};
	this.ckEditor.onCKEditorEvent = function(e){that.ckEditorEvent(e);};
	this.stage.onStageEvent = function(e){that.stageEvent(e);};
	this.selection.onChanged = function (eventName){that.selectionEvent(eventName)};
}
/**
 * creation template URL constant
 */
silex.Controller.CREATION_TEMPLATE = 'html/creation-template.html';
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
 * reference to the CKEditor component (view)
 */
silex.Controller.prototype.ckEditor;
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
 * CKEditor event handler
 */
silex.Controller.prototype.ckEditorEvent = function(e){
	console.log('CKEditor event '+e.type);
	switch(e.type){
		case 'changed':
			var element = this.getElement();
			var pElements = goog.dom.getElementsByTagNameAndClass('p', null, element);
			if (pElements && pElements.length > 0){
				pElements[0].innerHTML = this.ckEditor.getData();
			}
			else{
				throw('Could not find the mandatory p element in the text field');
			}
			break;
	}
}
/**
 * page tool event handler
 */
silex.Controller.prototype.pageToolEvent = function(e){
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
silex.Controller.prototype.onChooseFileRequest = function(cbk){
	var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 'assets/test.png');
	if(url){
		cbk(url);
	}
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.propertiesToolEvent = function(e){
	console.log('propertiesToolEvent '+e.type);
	switch(e.type){
		case 'ready':
			this.workspace.redraw();
			break;
		case 'openTextEditor':
			this.editText();
			break;
		case 'changedState':
			console.log('changedState '+e.state);
			break;
		case 'styleChanged':
			console.log('styleChanged '+e.state);
			var element = this.getElement();
			goog.style.setStyle(element, e.style);
			this.saveSelectionStyle();
			break;
	}
}
/**
 * store style in data-style-*
 */
silex.Controller.prototype.saveSelectionStyle = function(){
	var element = this.getElement();
	var state = this.propertiesTool.state;
	element.setAttribute('data-style-'+state, element.getAttribute('style'));
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.stageEvent = function(e){
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
		case 'change':
			// size or position of the element has changed
			console.log('change ');
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
				var elements = this.stage.headElement.getElementsByTagName('title');
				if (elements && elements.length > 0){
					elements[0].innerHTML = name;
				}
			}
		}
		else{
			console.log('menu event '+e.target.getCaption() + ' - '+e.target.getId());
			switch(e.target.getId()){
				case 'file.new':
					this.openFile(silex.Controller.CREATION_TEMPLATE, function(){
						that.selection.setSelectedFile(null);
					});
					break;
				case 'file.save':
					if (this.selection.getSelectedFile()!=null){
						that.file.save(this.stage.getBody(), this.stage.getHead(), this.stage.getBodyStyle());
					}
					else{
						var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 'html/test1.html');
						if(url){
							that.file.saveAs(this.stage.getBody(), this.stage.getHead(), url);
						}
					}
					break;
				case 'file.open':
					var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 'html/test1.html');
					if(url){
						this.openFile(url, function(){
							that.selection.setSelectedFile(url);
						});
					}
					break;
				case 'file.close':
					this.closeFile();
					break;
				case 'view.file':
					window.open(this.selection.file);
					break;
				case 'view.open.textEditor':
					this.editText();
					break;
				case 'insert.page':
					this.insertPage();
					break;
				case 'insert.text':
					var element = this.stage.addElement(silex.view.Stage.ELEMENT_SUBTYPE_TEXT);
					this.selection.setSelectedElements([element]);
					break;
				case 'insert.image':
					var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 'assets/test.png');
					if(url){
						var element = this.stage.addElement(silex.view.Stage.ELEMENT_TYPE_IMAGE, url);
						this.selection.setSelectedElements([element]);
					}
					break;
				case 'insert.container':
					var element = this.stage.addElement(silex.view.Stage.ELEMENT_TYPE_CONTAINER);
					this.selection.setSelectedElements([element]);
					break;
				case 'edit.delete.selection':
					var element = this.selection.getSelectedElements()[0];
					this.stage.removeElement(element);
					break;
				case 'edit.delete.page':
					this.removePage(this.selection.getSelectedPage());
					break;
			}
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
	var pageName = window.prompt('What name for your new page?', 'html/test.html');
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
	var pElements = goog.dom.getElementsByTagNameAndClass('p', null, element);
	if (pElements && pElements.length > 0){
		this.ckEditor.openEditor(pElements[0].innerHTML);
	}
	else{
		throw('Could not find the mandatory p element in the text field');
	}
	this.workspace.redraw();
}
/**
 * model event
 */
silex.Controller.prototype.fileLoaded = function(){
	console.log('fileLoaded');
	this.stage.setContent(this.file.bodyTag, this.file.headTag, this.file.bodyStyle);

	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	if (pages.length > 0){
		this.stage.openPage(pages[0]);
		this.pageTool.setSelectedIndexes([0]);
	}

	// update website title
	var elements = this.stage.headElement.getElementsByTagName('title');
	if (elements && elements.length > 0){
		this.menu.setWebsiteName(elements[0].innerHTML);
	}
}
/**
 * model event
 */
silex.Controller.prototype.fileClosed = function(){
	this.stage.cleanup();
}
