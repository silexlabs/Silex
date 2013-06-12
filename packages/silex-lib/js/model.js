var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.model.File');
goog.provide('silex.model.Selection');

//////////////////////////////////////////////////////////////////
// File class
//////////////////////////////////////////////////////////////////

/**
 * constructor
 */
silex.model.File = function(){
}
/**
 * current file url
 * if the current file is a new file, it has no url
 */
silex.model.File.prototype.url;
/**
 * current file head content
 */
silex.model.File.prototype.headTag;
/**
 * current file body content
 */
silex.model.File.prototype.bodyTag;
/**
 * callback for the event, has to be set by the controller
 */
silex.model.File.prototype.onError;
/**
 * load data
 */
silex.model.File.prototype.load = function(url, cbk){
	this.url = url;

	console.log('load file '+url);

	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// reset
		that.close();

		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();
		console.log('request success ');

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
			that.headTag = rawHtml.substring(closingTagIdx + 1, headCloseIdx);
		}
		if (bodyOpenIdx > -1 && bodyCloseIdx > -1){
			// look for the first ">" after "<body"
			var closingTagIdx = lowerCaseHtml.indexOf(">", bodyOpenIdx);
			// extract the body section
			that.bodyTag = rawHtml.substring(closingTagIdx + 1, bodyCloseIdx);
		}
		if (cbk) cbk();
	});
}
/**
 * reset data, close file
 */
silex.model.File.prototype.close = function(){
	this.url = null;
	this.headTag = '';
	this.bodyTag = '';
}
/**
 * reset data, close file
 */
silex.model.File.prototype.save = function(html){
	console.log('save file '+this.url+' - '+html);
}

//////////////////////////////////////////////////////////////////
// Selection class
//////////////////////////////////////////////////////////////////

/**
 * constructor
 */
silex.model.Selection = function(){
	this.listeners = [];
	this.file = "";
	this.page = "";
	this.element = null;
}
/** 
 * opened file
 */
silex.model.Selection.prototype.file;
/** 
 * selected page
 */
silex.model.Selection.prototype.page;
/** 
 * selected element
 */
silex.model.Selection.prototype.element;
/** 
 * listeners
 */
silex.model.Selection.prototype.listeners;
/** 
 * change event callback, set by the controller
 */
silex.model.Selection.prototype.onChanged;
/** 
 * page selection
 */
silex.model.Selection.prototype.getSelectedPage = function(){
	return this.page;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedPage = function(name, notify){
	this.page = name;
	if (notify!==false && this.onChanged) this.onChanged("page");
}
/** 
 * file selection
 */
silex.model.Selection.prototype.getSelectedFile = function(){
	return this.file;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedFile = function(name, notify){
	this.file = name;
	if (notify!==false && this.onChanged) this.onChanged("file");
}
/** 
 * element selection
 */
silex.model.Selection.prototype.getSelectedElement = function(){
	return this.element;
}
/**
 * change selection, with notification or not
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.model.Selection.prototype.setSelectedElement = function(element, notify){
	this.element = element;
	if (notify!==false && this.onChanged) this.onChanged("element");
}

