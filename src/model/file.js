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

goog.provide('silex.model.File');

//////////////////////////////////////////////////////////////////
// File class
//////////////////////////////////////////////////////////////////
/**
 * @constructor
 */
silex.model.File = function(
	workspace, 
	menu, 
	stage, 
	pageTool, 
	propertiesTool, 
	textEditor, 
	fileExplorer){

	// store the view
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;
}
/**
 * creation template URL constant
 */
silex.model.File.CREATION_TEMPLATE = 'creation-template.html';
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.workspace;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.menu;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.stage;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.pageTool;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.propertiesTool;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.textEditor;
/**
 * element of the view, to be updated by this model
 */
silex.model.File.prototype.fileExplorer;
/**
 * current file url
 * if the current file is a new file, it has no url
 */
silex.model.File.prototype.url;
/**
 * current file head content (string)
 */
silex.model.File.prototype.headTag;
/**
 * current file body content (string)
 */
silex.model.File.prototype.bodyTag;
/**
 * current file body style (string)
 */
silex.model.File.prototype.bodyStyle;
////////////////////////////////////////////////
// File management methods
////////////////////////////////////////////////
/**
 * load an empty new file
 */
silex.model.File.prototype.newFile = function (cbk) {
	silex.service.CloudStorage.getInstance().load(silex.model.File.CREATION_TEMPLATE, 
	goog.bind(function(rawHtml){
		this.setHtml(rawHtml);
		this.setUrl(null);
		if (cbk) cbk();
	}, this));
}
/**
 * save a file with a new name
 */
silex.model.File.prototype.saveAs = function(cbk){
	// choose a new name
	this.fileExplorer.saveAsDialog(
	goog.bind(function (url) {
		// save the data
		console.log('selection of a new file success');
		this.setUrl(url);
		this.save(cbk);
	}, this),
	['text/html', 'text/plain']);
}
/**
 * write content to the file
 */
silex.model.File.prototype.save = function(cbk){
	var url = this.getUrl();
	this.setBodyTag(this.getStageComponent().getHtml(url));
	this.setHeadTag(this.stage.getHead());
	this.setBodyStyle(this.stage.getBodyStyle());
	silex.service.CloudStorage.getInstance().save(url, this.getHtml(), function () {
		console.log('file saved');
		if (cbk) cbk();
	});
}

/**
 * load a new file
 */
silex.model.File.prototype.open = function(cbk){
	// let the user choose the file
	this.fileExplorer.openDialog(
	goog.bind(function (url) {
		silex.service.CloudStorage.getInstance().load(url, 
		goog.bind(function(rawHtml){
			console.log('loaded ');
			console.log(rawHtml);

			// update model
			this.close();
			this.setUrl(url);
			this.setHtml(rawHtml);
		}, this));
	}, this), 
	['text/html', 'text/plain']);
}
/**
 * reset data, close file
 */
silex.model.File.prototype.close = function(){
	this.url = null;
	this.headTag = '';
	this.bodyTag = '';
	//
	this.stage.setBody('');
	this.stage.setHead('');
	this.stage.setBodyStyle('');
	this.workspace.invalidate();
}
////////////////////////////////////////////////
// DOM related methods
////////////////////////////////////////////////
/**
 * get the HtmlDom element containing the body tag
 */
silex.model.File.prototype.getStageComponent = function(){
	return new silex.model.Component(
		this.stage.bodyElement, 
		silex.model.Component.ELEMENT_TYPE_CONTAINER
	);
}
/**
 * get the HtmlDom element containing the body tag
 */
silex.model.File.prototype.getBodyTag = function(){
	return this.bodyTag;
}
/**
 * store new data in memory
 * @param	body 	an HtmlDom element containing a new version of the body tag
 */
silex.model.File.prototype.setBodyTag = function(body){
	this.bodyTag = body;
}
/**
 * get the HtmlDom element containing the head tag
 */
silex.model.File.prototype.getHeadTag = function(){
	return this.headTag;
}
/**
 * store new data in memory
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setHeadTag = function(head){
	this.headTag = head;
}
/**
 * get the url of the file
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.getUrl = function(){
	return this.url;
}
/**
 * store url of this file
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setUrl = function(url){
	this.url = url;
}
/**
 * get the string containing the style attribute of the body tag
 */
silex.model.File.prototype.getBodyStyle = function(){
	return this.bodyStyle;
}
/**
 * store new data in memory
 * @param	bodyStyle 	a string containing the style attribute to set on the body tag
 */
silex.model.File.prototype.setBodyStyle = function(bodyStyle){
	this.bodyStyle = bodyStyle;
}
/**
 * build the html content
 * Parse the raw html and set the bodyTag and headTag strings
 */
silex.model.File.prototype.setHtml = function(rawHtml){
	// use lower case to find head and body tags
	var lowerCaseHtml = rawHtml.toLowerCase();
	// split head and body tags 
	var headOpenIdx = lowerCaseHtml.indexOf("<head>");
	if (headOpenIdx == -1) headOpenIdx = lowerCaseHtml.indexOf("<head ");
	var headCloseIdx = lowerCaseHtml.indexOf("</head>");
	var bodyOpenIdx = lowerCaseHtml.indexOf("<body>");
	if (bodyOpenIdx == -1) bodyOpenIdx = lowerCaseHtml.indexOf("<body ");
	var bodyCloseIdx = lowerCaseHtml.indexOf("</body>");

	if (headOpenIdx > -1 && headCloseIdx > -1){
		// look for the first ">" after "<head"
		var closingTagIdx = lowerCaseHtml.indexOf(">", headOpenIdx);
		// extract the head section
		this.headTag = rawHtml.substring(closingTagIdx + 1, headCloseIdx);
	}
	if (bodyOpenIdx > -1 && bodyCloseIdx > -1){
		// look for the first ">" after "<body"
		var closingTagIdx = lowerCaseHtml.indexOf(">", bodyOpenIdx);
		// extract the body section
		this.bodyTag = rawHtml.substring(closingTagIdx + 1, bodyCloseIdx);
	}
	// extract body style
	var bodyTag = rawHtml.substring(bodyOpenIdx, bodyCloseIdx + 1);
	var styleStart = bodyTag.indexOf('"');
	var styleEnd = bodyTag.indexOf('"', styleStart+1);
	this.bodyStyle = bodyTag.substring(styleStart+1, styleEnd);

	// update view
	this.getStageComponent().setHtml(this.bodyTag, this.getUrl());
	this.stage.setHead(this.headTag);
	this.stage.setBodyStyle(this.bodyStyle);

	// update UIs
	var pages = this.getPages();
	this.pageTool.setPages(pages);
	this.propertiesTool.setPages(pages);
	if (pages.length > 0){
		this.pageTool.setSelectedIndex(0);
	}

	// update website title
	var title = this.getTitle();
	if (title){
		this.menu.setWebsiteName(title);
	}
}
/**
 * build a string of the raw html content
 * use the bodyTag and headTag objects
 */
silex.model.File.prototype.getHtml = function(){
	var html = '';
	html += '<html>';
	html += '<head>'+this.headTag+'</head>';
	html += '<body style="'+this.bodyStyle+'">'+this.bodyTag+'</body>';
	html += '</html>';

	return html;
}
////////////////////////////////////////////////
// Website related methods
////////////////////////////////////////////////
/**
 * view this file in a new window
 */
silex.model.File.prototype.view = function(){
	if (this.getUrl()==null){
		if (window.confirm('The publication has to be saved first. Save the publication now?')){
			this.save(goog.bind(function () {
				window.open(this.getUrl());
			}, this));
		}
	}
	else{
		window.open(this.getUrl());
	}
}
/**
 * website title
 */
silex.model.File.prototype.getTitle = function(){
	var elements = this.stage.headElement.getElementsByTagName('title');
	if (elements && elements.length > 0){
		return elements[0].innerHTML;
	}
	else{
		return null;
	}
}
/**
 * website title
 */
silex.model.File.prototype.setTitle = function(name){
	// update website title
	var elements = this.stage.headElement.getElementsByTagName('title');
	if (elements && elements.length > 0){
		elements[0].innerHTML = name;
	}
	// new website title
	else{
		var child = goog.dom.createElement('title');
		child.innerHTML = name;
		this.stage.headElement.appendChild(child)
	}
	// update menu
	this.menu.setWebsiteName(name);
}
/**
 * factory to create a page
 * @see 	silex.model.Page
 */
silex.model.File.prototype.createPage = function(){
	// create the page instance
	var pageName = window.prompt('What name for your new page?', 'New page name');
	var page = new silex.model.Page(
		pageName, 
		this.stage.bodyElement
	);

	// create the DOM element
	var meta = goog.dom.createElement('meta');
	meta.name = 'page';
	meta.content = pageName;
	goog.dom.appendChild(this.stage.headElement, meta);

	// update tools
	var pages = this.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);

	// return the page instance
	return page;
}
/**
 * remove a page
 * @see 	silex.model.Page
 */
silex.model.File.prototype.deletePage = function(page){
	// remove the DOM element
	$('meta[name="page"]', this.stage.headElement).each(
		function () {
			if (this.getAttribute('content')==page.name){
				$(this).remove();
		}
	});
	// remove the links to this page
	$('[data-silex-href="#'+page.name+'"]', this.bodyTag).each(
		function () {
			this.removeAttribute('data-silex-href');
		}
	);
	// update tools
	var pages = this.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);

	// return the page instance
	return page;
}
/**
 * get all the pages
 * @see 	silex.model.Page
 */
silex.model.File.prototype.getPages = function(){
	// retrieve all page names from the head section
	var pageNames = [];
	$('meta[name="page"]', this.stage.headElement).each(function() {
		pageNames.push(this.getAttribute('content'));
	});
	// build an array of pages
	var pages = [];
	goog.array.forEach(pageNames, function(pageName) {
		var page = new silex.model.Page(
			pageName, 
			this.stage.bodyElement
		);
		pages.push(page);
	}, this);
	// return the page instances
	return pages;
}
