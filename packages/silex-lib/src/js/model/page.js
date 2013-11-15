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

goog.provide('silex.model.Page');

/**
 * @constructor
 */
silex.model.Page = function(
	name,
	workspace,
	menu,
	stage,
	pageTool,
	propertiesTool,
	textEditor,
	fileExplorer){


	this.name = name;

	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;
}
/**
 * Constant
 * Class name used to mark elements which are visible only on certain pages
 */
silex.model.Page.PAGE_CLASS = 'silex-page';
/**
 * static array of pages
 */
silex.model.Page.pages = [];
/**
 * element of the view, to be updated by this model
 */
silex.model.Page.prototype.workspace;
/**
 * element of the view, to be updated by this model
 */
silex.model.Page.prototype.menu;
/**
 * element of the view, to be updated by this model
 */
silex.model.Page.prototype.stage;
/**
 * element of the view, to be updated by this model
 */
silex.model.Page.prototype.pageTool;
/**
 * element of the view, to be updated by this model
 */
silex.model.Page.prototype.propertiesTool;
/**
 * the page name
 */
silex.model.Page.prototype.name;
////////////////////////////////////////////////
// static methods
////////////////////////////////////////////////
/**
 * get all the pages
 * static method
 * @see 	silex.model.Page
 */
silex.model.Page.getPages = function(){
	// return the page instances
	return silex.model.Page.pages;
}
/**
 * add a page to the model
 * static method
 */
silex.model.Page.addPage = function(page){
	silex.model.Page.pages.push(page);
}
/**
 * remobe a page from the model
 * static method
 */
silex.model.Page.removePage = function(page){
	var idx = silex.model.Page.getPageIndex(page);
	silex.model.Page.pages.splice(idx, 1);
}
/**
 * retrieve the index of a given page in an array of pages
 * static method
 */
silex.model.Page.getPageByName = function (pageName) {
	var res = null;
	var pages = silex.model.Page.getPages();
	goog.array.forEach(pages, function(page) {
		if(page.name === pageName){
			res = page;
			return;
		}
	});
	return res;
}
/**
 * retrieve the index of a given page in an array of pages
 * static method
 */
silex.model.Page.getPageIndex = function (page) {
	var res = -1;
	var idx = 0;
	var pages = silex.model.Page.getPages();
	goog.array.forEach(pages, function(page2) {
		if(page.name === page2.name){
			res = idx;
			return;
		}
		idx++;
	});
	return res;
}
/**
 * get the pages in which the element is visible
 * static method
 */
silex.model.Page.getPagesForElement = function(element){
	var res = [];
	var pages = silex.model.Page.getPages();
	goog.array.forEach(pages, function(page) {
		if(goog.dom.classes.has(element, page.name)){
			res.push(page);
		}
	});
	return res;
}
////////////////////////////////////////////////
// instance methods
////////////////////////////////////////////////
/**
 * open the given page of the site
 */
silex.model.Page.prototype.open = function(){
    this.stage.openPage(this);
    this.pageTool.setSelectedItem(this, false);
}
/**
 * add the page to the silex.model.Page.pages array
 * update the tools and the view
 */
silex.model.Page.prototype.attach = function(){
	// update the model
	silex.model.Page.addPage(this);

	// update the stage
	this.stage.addPage(this);

	// update tools
	var pages = silex.model.Page.getPages();
	this.pageTool.setPages(pages);
	this.propertiesTool.setPages(pages);
}
/**
 * remove the page from the silex.model.Page.pages array
 * update the tools and the view
 */
silex.model.Page.prototype.detach = function(){
	// update the model
	silex.model.Page.removePage(this);

	// update the stage
	this.stage.removePage(this);

	// update tools
	var pages = silex.model.Page.getPages();
	this.pageTool.setPages(pages);
	this.propertiesTool.setPages(pages);
}
/**
 * rename a page
 * @see 	silex.model.Page
 */
silex.model.Page.prototype.rename = function(name){
	// update stage
	this.stage.renamePage(this, name);
	// store the new  name (do not do it before this.stage.renamePage)
	this.name = name;
	// update tools
	var pages = silex.model.Page.getPages();
	this.pageTool.setPages(pages);
	this.propertiesTool.setPages(pages);
}
/**
 * add the component to the page
 * it means the component's element will have the page name in its css classes
 * and also the silex-page class
 */
silex.model.Page.prototype.addComponent = function(component){
	if (!goog.dom.classes.has(component.element, this.name))
		goog.dom.classes.add(component.element, this.name)
	if (!goog.dom.classes.has(component.element, silex.model.Page.PAGE_CLASS))
		goog.dom.classes.add(component.element, silex.model.Page.PAGE_CLASS)
}
/**
 * remove the component from the page
 * it means the component's element will not have the page name in its css classes
 * and also remove the silex-page class if the component in not in any other page
 */
silex.model.Page.prototype.removeComponent = function(component){
	if (goog.dom.classes.has(component.element, this.name))
		goog.dom.classes.remove(component.element, this.name)

	if (silex.model.Page.getPagesForElement(component.element).length===0){
		if (goog.dom.classes.has(component.element, silex.model.Page.PAGE_CLASS))
			goog.dom.classes.remove(component.element, silex.model.Page.PAGE_CLASS)
	}
}
