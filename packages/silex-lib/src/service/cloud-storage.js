var silex = silex || {}; 
silex.model = silex.model || {}; 

goog.provide('silex.service.CloudStorage');

/**
 * the Silex CloudStorage singleton
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load and save data to and from the cloud storage services
 */
silex.service.CloudStorage = function(){
	this.filePicker = filepicker;
	this.filePicker.setKey("Au2K2SaKHSGiaXXrGExQUz");
}
/**
 * reference to the filepicker instance
 */
silex.service.CloudStorage.prototype.filePicker;
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
silex.service.CloudStorage.prototype.save = function(url, rawData, cbk){
	// save the actual data
	filepicker.write(
	url, 
	rawData, 
	{}, 
	function(InkBlob){
		console.log(InkBlob);
		if (cbk) cbk();
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * load data
 */
silex.service.CloudStorage.prototype.load = function(url, cbk){
	var that = this;
	goog.net.XhrIo.send(url, function(e){
		// success of the request
		var xhr = e.target;
		var rawHtml = xhr.getResponse();
		if (cbk) cbk(rawHtml);
	});
}