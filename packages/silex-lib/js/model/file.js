var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.model.File');

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
 * callback for the event, has to be set by the controller
 */
silex.model.File.prototype.onError;
/**
 * load data
 */
silex.model.File.prototype.load = function(url, cbk){
	this.url = url;
	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// reset
		that.close();

		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();

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
		// extract body style
		var bodyTag = rawHtml.substring(bodyOpenIdx, bodyCloseIdx + 1);
		var styleStart = bodyTag.indexOf('"');
		var styleEnd = bodyTag.indexOf('"', styleStart+1);
		that.bodyStyle = bodyTag.substring(styleStart+1, styleEnd);

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
silex.model.File.prototype.save = function(body, head, bodyStyle){
	if (bodyStyle==null) bodyStyle='';

	// build the html content
	var html = '';
	html += '<html>';
	html += '<head>'+head+'</head>';
	html += '<body style="'+bodyStyle+'">'+body+'</body>';
	html += '</html>';

	alert(html);
}

