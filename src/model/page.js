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
/**
 * retrieve the index of a given page in an array of pages
 * static method
 */
silex.model.Page.getPageIndex = function (pageName, pages) {
	var res = -1;
	var idx = 0;
	goog.array.forEach(pages, function(page2) {
		if(pageName == page2.name){
			res=idx;
		}
		idx++;
	});
	return res;
}
/**
 * open the given page of the site 
 */
silex.model.Page.prototype.open = function(){
    $(this.stage.bodyElement).pageable({currentPage:this.name});
    this.pageTool.setSelectedItem(this, false);
}
/**
 * remove a page
 * @see 	silex.model.Page
 */
silex.model.Page.prototype.remove = function(){

	if (window.confirm('I am about to delete the page, are you sure?')){
		var that = this;
		// remove the DOM element
		$('meta[name="page"]', this.stage.headElement).each(
			function () {
				if (this.getAttribute('content')==that.name){
					$(this).remove();
			}
		});
		// get the new list of pages
		var pages = silex.model.Page.getPages(
			this.workspace,
			this.menu,
			this.stage,
			this.pageTool,
			this.propertiesTool,
			this.textEditor,
			this.fileExplorer
		);
		// remove the links to this page
		$('*[data-silex-href="#'+this.name+'"]').each(
			function () {
				this.removeAttribute('data-silex-href');
			}
		);
		// check elements which were only visible on this page
		// and make them visible everywhere
		$('.'+this.name).each(
			function () {
				var pagesOfElement = silex.model.Page.getPagesForElement(pages, this);
				if (pagesOfElement.length <= 0) 
					$(this).removeClass(silex.model.Page.PAGE_CLASS);
			}
		);
		// update tools
		this.pageTool.setPages(pages);
		this.propertiesTool.setPages(pages);
	}
}
/**
 * rename a page
 * @see 	silex.model.Page
 */
silex.model.Page.prototype.rename = function(opt_name){
	if(!opt_name){
		opt_name = window.prompt('What name for your page?', this.name);
	}
	if(opt_name){
		var that = this;
		// update the DOM element
		$('meta[name="page"]', this.stage.headElement).each(
			function () {
				if (this.getAttribute('content') == that.name){
					this.setAttribute('content', opt_name);
			}
		});
		// update the links to this page
		$('*[data-silex-href="#'+this.name+'"]').each(
			function () {
				this.setAttribute('data-silex-href', '#'+opt_name);
			}
		);
		// update the visibility of the compoents
		$('.'+this.name).each(
			function () {
				$(this).removeClass(that.name);
				$(this).addClass(opt_name);
			}
		);
		// update tools
		var pages = silex.model.Page.getPages(
			this.workspace,
			this.menu,
			this.stage,
			this.pageTool,
			this.propertiesTool,
			this.textEditor,
			this.fileExplorer
		);
		this.pageTool.setPages(pages);
		this.propertiesTool.setPages(pages);
	}
}
/**
 * get the pages in which the element is visible
 */
silex.model.Page.getPagesForElement = function(pages, element){
	var res = [];
	goog.array.forEach(pages, function(page) {
		if(goog.dom.classes.has(element, page.name)){
			res.push(page);
		}
	}, this);
	return res;
}
/**
 * get all the pages
 * static method
 * @see 	silex.model.Page
 */
silex.model.Page.getPages = function(
		workspace,
		menu,
		stage,
		pageTool,
		propertiesTool,
		textEditor,
		fileExplorer
	){
	// retrieve all page names from the head section
	var pageNames = [];
	$('meta[name="page"]', stage.headElement).each(function() {
		pageNames.push(this.getAttribute('content'));
	});
	// build an array of pages
	var pages = [];
	goog.array.forEach(pageNames, function(pageName) {
		var page = new silex.model.Page(
			pageName, 
			workspace,
			menu,
			stage,
			pageTool,
			propertiesTool,
			textEditor,
			fileExplorer
		);
		pages.push(page);
	});
	// return the page instances
	return pages;
}