var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.model.File');

silex.model.File = function(){
	
}
/**
 * the Silex File class
 */
silex.model.File = function(){
}
/**
 * singleton pattern
 */
silex.model.File._instance = null;
/**
 * singleton pattern
 */
silex.model.File.getInstance = function(){
	if (silex.model.File._instance === null){
		silex.model.File._instance = new silex.model.File();
	}
	return silex.model.File._instance;
}
/**
 * creation template URL
 */
silex.model.File.CREATION_TEMPLATE = 'html/creation-template.html';
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
silex.model.File.prototype.onClose;
/**
 * callback for the event, has to be set by the controller
 */
silex.model.File.prototype.onLoad;
/**
 * callback for the event, has to be set by the controller
 */
silex.model.File.prototype.onError;
/**
 * load data
 */
silex.model.File.prototype.load = function(url){
	this.url = url;
	if (url === null){
		url = silex.model.File.CREATION_TEMPLATE;
	}
	console.log('load file '+url);

	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// reset
		that.close();

		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();
		console.log('request success '+rawHtml);

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
		if (that.onLoad) that.onLoad();
		console.log('file is loaded, call '+that.onLoad);
	});
}
/**
 * reset data, close file
 */
silex.model.File.prototype.close = function(){
	this.url = null;
	this.headTag = '';
	this.bodyTag = '';
	if (this.onClose) this.onClose();
}
/**
 * reset data, close file
 */
silex.model.File.prototype.save = function(html){
	console.log('save file '+this.url+' - '+html);
}


