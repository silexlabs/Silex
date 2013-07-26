var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.model.File');

//////////////////////////////////////////////////////////////////
// File class
//////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
silex.model.File = function(){
}
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
/**
 * load data
 *
silex.model.File.prototype.load = function(url, cbk){
	this.url = url;
	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// reset
		that.close();

		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();

		that.setHtml(rawHtml);

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
 * store new data in memory
 * @param	body 	an HtmlDom element containing a new version of the body tag
 */
silex.model.File.prototype.setBodyTag = function(body){
	this.bodyTag = body;
}
/**
 * store new data in memory
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setHeadTag = function(head){
	this.headTag = head;
}
/**
 * store url of this file
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.setUrl = function(url){
	this.url = url;
}
/**
 * get the url of the file
 * @param	head 	an HtmlDom element containing a new version of the head tag
 */
silex.model.File.prototype.getUrl = function(){
	return this.url;
}
/**
 * store new data in memory
 * @param	bodyStyle 	a string containing the style attribute to set on the body tag
 */
silex.model.File.prototype.setBodyStyle = function(bodyStyle){
	if (bodyStyle==null) bodyStyle='';
	this.bodyStyle = bodyStyle;
}
/**
 * build the html content
 * Parse the raw html and set the bodyTag and headTag objects
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
