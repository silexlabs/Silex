goog.provide('silex.view.FileExplorer');

var silex = silex || {}; 
silex.view = silex.view || {}; 

//////////////////////////////////////////////////////////////////
// FileExplorer class
//////////////////////////////////////////////////////////////////
/**
 * the Silex FileExplorer class
 * @constructor
 * based on http://www.inkfilepicker.com/
 * load the template and make it a FileExplorer
 * this is only the UI part, to let user choose a file in the cloud
 * @see silex.service.CloudStorage 	for the service/network part
 */
silex.view.FileExplorer = function(element, cbk){
	this.element = element;

	var that = this;
	silex.Helper.loadTemplateFile('templates/fileexplorer.html', element, function(){
		that.init();
		if (cbk) cbk();
//		if(that.onReady) that.onReady();
//		if (that.onFileExplorerEvent) that.onFileExplorerEvent({type:'ready'});
	});
}
/**
 * Contant for file picker config
 */
silex.view.FileExplorer.CONTAINER_TYPE = 'modal';
/**
 * Contant for file picker config
 */
silex.view.FileExplorer.SERVICES = ["DROPBOX", "GOOGLE_DRIVE", "EVERNOTE", "FTP"];
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 *
silex.view.FileExplorer.prototype.onReady;
/**
 * reference to the filepicker instance
 */
silex.view.FileExplorer.prototype.filePicker;
/**
 * reference to the attached element
 */
silex.view.FileExplorer.prototype.element;
/**
 * callback for FileExplorer events, set by the controller
 *
silex.view.FileExplorer.prototype.onFileExplorerEvent;
/**
 * init file explorer
 */
silex.view.FileExplorer.prototype.init = function(){
	this.filePicker = silex.service.CloudStorage.getInstance().filePicker;
}
/**
 * pick a file
 * @param opt_mimetypes 	optional array of accepted mimetypes, e.g. ['text/html', 'text/plain']
 */
silex.view.FileExplorer.prototype.openDialog = function(cbk, opt_mimetypes){
	// default is image
	if (!opt_mimetypes) opt_mimetypes = ['image/*', 'text/plain'];

	// pick it up
	this.filePicker.pick(
	{
		mimetypes: opt_mimetypes,
		container: silex.view.FileExplorer.CONTAINER_TYPE,
		services: silex.view.FileExplorer.SERVICES
	},
	function(InkBlob){
		var url = InkBlob.url.replace('https://', 'http://');
		if (cbk) cbk(url);
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * save as dialog
 * @param opt_mimetypes 	optional array of accepted mimetypes, e.g. ['text/html', 'text/plain']
 */
silex.view.FileExplorer.prototype.saveAsDialog = function(cbk, opt_mimetypes){
	// default is html
	if (!opt_mimetypes) opt_mimetypes = ['text/html', 'text/plain'];

	var that = this;
	// export dummy data
	this.filePicker.exportFile( "http://google.com/",
	{
		mimetypes: opt_mimetypes,
		container: silex.view.FileExplorer.CONTAINER_TYPE,
		services: silex.view.FileExplorer.SERVICES
	},
	function(tmpInkBlob){
		var url = tmpInkBlob.url.replace('https://', 'http://');
		if (cbk) cbk(url);
	},
	function(FPError){
		console.error(FPError);
	});
}


