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

goog.provide('silex.service.SilexTasks');

/**
 * the Silex SilexTasks singleton
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 */
silex.service.SilexTasks = function(){
}
/**
 * singleton implementation
 */
silex.service.SilexTasks.instance;
/**
 * singleton implementation
 */
silex.service.SilexTasks.getInstance = function(){
	if (!silex.service.SilexTasks.instance)
		silex.service.SilexTasks.instance = new silex.service.SilexTasks();
	return silex.service.SilexTasks.instance;
}
/**
 * publish a website to a given folder
 */
silex.service.SilexTasks.prototype.publish = function(path, html, css, files, cbk, opt_errCbk){
	console.log('publish service');

	var url = '/silex/tasks/publish';
	goog.net.XhrIo.send(url, function(e){
		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();
		if (xhr.isSuccess()){
			if (cbk) cbk(rawHtml);
		}
		else{
			var message = xhr.getLastError();
			console.error(message, xhr, xhr.isSuccess(), xhr.getStatus(), xhr.headers.toString());
			if (opt_errCbk){
				opt_errCbk(message);
			}
		}
	}, 'post', [{
		path: path
		, html: html
		, css: css
		, files: files
	}]);
}
