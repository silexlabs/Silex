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
silex.view.FileExplorer.prototype.filepicker;
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
	filepicker.setKey("Au2K2SaKHSGiaXXrGExQUz");
}
/**
 * pick an html file
 */
silex.view.FileExplorer.prototype.browseHtml = function(file, cbk){
	this.browse(
	function (InkBlob) {
		file.filepickerBlob = InkBlob;
		if (cbk) cbk(InkBlob);
	}, 
	{
		mimetypes: ['text/html', 'text/plain'],
		container: silex.view.FileExplorer.CONTAINER_TYPE,
		services: silex.view.FileExplorer.SERVICES
	});
}
/**
 * pick a file
 */
silex.view.FileExplorer.prototype.browse = function(cbk, opt){
	// default is image
	if (!opt) opt = {
		mimetypes: ['image/*', 'text/plain'],
		container: silex.view.FileExplorer.CONTAINER_TYPE,
		services: silex.view.FileExplorer.SERVICES
	};
	// pick it up
	filepicker.pick(
	opt,
	function(InkBlob){
		InkBlob.url = InkBlob.url.replace('https://', 'http://');
		if (cbk) cbk(InkBlob);
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * save a previously opened file
 */
silex.view.FileExplorer.prototype.saveHtml = function(file, cbk){
	// save the actual data
	filepicker.write(
	file.filepickerBlob, 
	file.getHtml(), 
	{}, 
	function(InkBlob){
		console.log(JSON.stringify(InkBlob));
		file.filepickerBlob = InkBlob;
		if (cbk) cbk();
	},
	function(FPError){
		console.error(FPError);
	});
}
/**
 * save as dialog
 */
silex.view.FileExplorer.prototype.saveHtmlAs = function(file, cbkAfterChooseFile, cbk){
	var that = this;
	// export dummy data
	filepicker.exportFile( "http://google.com/",
	{
		mimetypes: ['text/html', 'text/plain'],
		container: silex.view.FileExplorer.CONTAINER_TYPE,
		services: silex.view.FileExplorer.SERVICES
	},
	function(tmpInkBlob){
		file.url = tmpInkBlob.url.replace('https://', 'http://');
		file.filepickerBlob = tmpInkBlob;
		if (cbkAfterChooseFile) cbkAfterChooseFile();
		that.saveHtml(file, cbk)
	},
	function(FPError){
		console.error(FPError);
	});
}


