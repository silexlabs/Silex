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
	htmlEditor,
	textEditor,
	fileExplorer){

	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.htmlEditor = htmlEditor;
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
silex.model.File.prototype.htmlEditor;
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
 * current file blob
 */
silex.model.File.prototype.blob;
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
silex.model.File.prototype.newFile = function (cbk, opt_errCbk){
	this.openFromUrl(silex.model.File.CREATION_TEMPLATE, cbk, opt_errCbk);
}
/**
 * load an arbitrary url as a silex html file
 * will not be able to save
 */
silex.model.File.prototype.openFromUrl = function (url, cbk, opt_errCbk){
	silex.service.CloudStorage.getInstance().loadLocal(url,
	goog.bind(function(rawHtml){
		this.setUrl(url);
		this.setHtml(rawHtml);
		this.setBlob(null); // will not be able to save
		if (cbk) cbk();
	}, this), opt_errCbk);
}
/**
 * save a file with a new name
 */
silex.model.File.prototype.saveAs = function(cbk, opt_errCbk){
	// choose a new name
	this.fileExplorer.saveAsDialog(
	goog.bind(function (blob) {

		// save the data
		this.setUrl(blob.url);
		this.setBlob(blob);
		this.save(cbk, opt_errCbk);
	}, this),
	{'mimetype':'text/html'}, opt_errCbk);
	this.workspace.invalidate();
}
/**
 * write content to the file
 */
silex.model.File.prototype.save = function(cbk, opt_errCbk){
	var blob = this.getBlob();
	this.setBodyTag(this.getStageComponent().getHtml(blob.url));
	this.setHeadTag(this.stage.getHead());
	this.setBodyStyle(this.stage.getBodyStyle());
	silex.service.CloudStorage.getInstance().save(blob, this.getHtml(), function () {
		if (cbk) cbk();
	}, opt_errCbk);
}

/**
 * load a new file
 */
silex.model.File.prototype.open = function(cbk, opt_errCbk){
	// let the user choose the file
	this.fileExplorer.openDialog(
	goog.bind(function (blob) {
		silex.service.CloudStorage.getInstance().load(blob,
		goog.bind(function(rawHtml){
			// update model
			this.close();
			this.setUrl(blob.url);
			this.setBlob(blob);
			this.setHtml(rawHtml);
		}, this), opt_errCbk);
	}, this),
	['text/html', 'text/plain'], opt_errCbk);
	this.workspace.invalidate();
}
/**
 * reset data, close file
 */
silex.model.File.prototype.close = function(){
	this.url = null;
	this.blob = null;
	this.headTag = '';
	this.bodyTag = '';
	this.setHtml('');
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
	return new silex.model.Component(this.stage.bodyElement);
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
 * get the blob of the file
 */
silex.model.File.prototype.getBlob = function(){
	return this.blob;
}
/**
 * store blob of this file
 */
silex.model.File.prototype.setBlob = function(blob){
	this.blob = blob;
	// update tools
	if (blob)
		this.propertiesTool.setBaseUrl(blob.url);
	else
		this.propertiesTool.setBaseUrl(null);
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

	// reset the previous page model
	var pages = silex.model.Page.getPages();
	while(pages.length>0) {
		var page = pages[0];
		page.detach();
	}
	// use lower case to find head and body tags
	var lowerCaseHtml = rawHtml.toLowerCase();
	// split head and body tags
	var headOpenIdx = lowerCaseHtml.indexOf("<head>");
	if (headOpenIdx === -1) headOpenIdx = lowerCaseHtml.indexOf("<head ");
	var headCloseIdx = lowerCaseHtml.indexOf("</head>");
	var bodyOpenIdx = lowerCaseHtml.indexOf("<body>");
	if (bodyOpenIdx === -1) bodyOpenIdx = lowerCaseHtml.indexOf("<body ");
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

	// handle pages of the loaded html
	var pagesNames = this.stage.getPagesNamesFromDom();

	// update model
	goog.array.forEach(pagesNames, function(pageName) {
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
		// no, because it is allready attached to the stage: page.attach();
		silex.model.Page.addPage(page);
	}, this);

	// update tools
	var pages = silex.model.Page.getPages();
	this.pageTool.setPages(pages);
	this.propertiesTool.setPages(pages);

	// open default page
	this.pageTool.setSelectedIndex(0);

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
	// handle background url of the body style
	var style = silex.Helper.stringToStyle(this.getBodyStyle());
/*
	if (style.backgroundImage){
		var url = style.backgroundImage.substring(style.backgroundImage.indexOf('(')+1, style.backgroundImage.indexOf(')'));
		// also remove '' if needed
		var quoteIdx = url.indexOf("'");
		if (quoteIdx>=0){
			url = url.substring(quoteIdx+1, url.lastIndexOf("'"));
		}
		// absolute to relative
		url = silex.Helper.getRelativePath(url, this.propertiesTool.getBaseUrl());
		// put back the url('...')
		url = 'url(\'' + url + '\')';
		// set the body style
		style.backgroundImage = url;
	}
*/	// convert back to string
	var styleStr = silex.Helper.styleToString(style);

	var html = '';
	html += '<html>';
	html += '<head>'+this.headTag+'</head>';
	html += '<body style="'+styleStr+'">'+this.bodyTag+'</body>';
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
	if (!this.getBlob()){
		alertify.confirm('The publication has to be saved first. Save the publication now?', goog.bind(function(accept){
			if (accept){
				this.saveAs(goog.bind(function () {
					window.open(this.getUrl());
				}, this));
			}
		}, this));
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


