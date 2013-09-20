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

goog.provide('silex.service.CloudStorage');

/**
 * the Silex CloudStorage singleton
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 */
silex.service.CloudStorage = function(){
	this.filePicker = cloudExplorer;
}
/**
 * reference to the filepicker instance
 */
silex.service.CloudStorage.prototype.filePicker;
/**
 * constant
 */
//silex.service.CloudStorage.BACK_END_URL = "../unifile/v1.0/services/list/";
/**
 * singleton implementation
 */
silex.service.CloudStorage.instance;
/**
 * singleton implementation
 */
silex.service.CloudStorage.getInstance = function(){
	if (silex.service.CloudStorage.instance == null)
		silex.service.CloudStorage.instance = new silex.service.CloudStorage();
	return silex.service.CloudStorage.instance;
}
/**
 * save a file
 */
silex.service.CloudStorage.prototype.save = function(blob, rawData, cbk){
	// cloud explorer expects relative path
	var relBlob = {
		url : silex.Helper.getRelativePath(blob.url, silex.Helper.BaseUrl)
	}

	// save the actual data
	this.filePicker.write(
	relBlob, 
	rawData, 
	function(blob){
		// workaround: cloud explorer issue https://github.com/silexlabs/cloud-explorer/issues/2
		new goog.async.Delay(function () {
			if (cbk) cbk();
		}, 10, this).start();
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * load data
 */
silex.service.CloudStorage.prototype.load = function(blob, cbk){

	// cloud explorer expects relative path
	var relBlob = {
		url : silex.Helper.getRelativePath(blob.url, silex.Helper.BaseUrl)
	}
	this.filePicker.read(
	relBlob, 
	function(data){
		// workaround: cloud explorer issue https://github.com/silexlabs/cloud-explorer/issues/2
		new goog.async.Delay(function () {
			if (cbk) cbk(data);
		}, 10, this).start();
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * load data
 */
silex.service.CloudStorage.prototype.loadLocal = function(url, cbk){
	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();
		// workaround: cloud explorer issue https://github.com/silexlabs/cloud-explorer/issues/2
		new goog.async.Delay(function () {
			if (cbk) cbk(rawHtml);
		}, 10, this).start();
	});
}