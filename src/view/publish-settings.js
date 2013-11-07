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

goog.provide('silex.view.PublishSettings');

//////////////////////////////////////////////////////////////////
// PublishSettings class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PublishSettings class
 * @constructor
 * load the template and make it a PublishSettings dialog
 * this is only the UI part, to let user setup publish functionnality
 */
silex.view.PublishSettings = function(element, cbk){
	this.element = element;
	goog.style.setStyle(this.element, 'display', 'none');

	silex.Helper.loadTemplateFile('templates/publishsettings.html', element, function(){
		// close button
		var closeBtn = goog.dom.getElementByClass('close-btn', this.element);
		goog.events.listen(closeBtn, goog.events.EventType.CLICK, function(){
			console.log('close');
			this.closeEditor();
		}, false, this);
		// init and continue loading
		this.init();
		if (cbk) cbk();
	}, this);
}
/**
 * element of the dom to which the component is rendered
 */
silex.view.PublishSettings.prototype.element;
/**
 * init file explorer
 */
silex.view.PublishSettings.prototype.init = function(){
}
/**
 * pick a file
 * @param opt_mimetypes 	optional array of accepted mimetypes, e.g. ['text/html', 'text/plain']
 */
silex.view.PublishSettings.prototype.openDialog = function(cbk){
	// show dialog
	this.openEditor();


//	if (cbk) cbk(blob);
	// hide dialog
//	this.closeEditor();
}
/**
 * open editor
 * this is private method, do not call it
 */
silex.view.PublishSettings.prototype.openEditor = function(){
	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	// show
	goog.style.setStyle(background, 'display', 'inherit');
	goog.style.setStyle(this.element, 'display', '');
	// close
	goog.events.listen(background, goog.events.EventType.CLICK, this.closeEditor, true, this);
}
/**
 * close editor
 * this is private method, do not call it
 */
silex.view.PublishSettings.prototype.closeEditor = function(){
	// background
	var background = goog.dom.getElementByClass('dialogs-background');
	// hide
	goog.style.setStyle(background, 'display', 'none');
	goog.style.setStyle(this.element, 'display', 'none');
	// close
	goog.events.unlisten(background, goog.events.EventType.CLICK, this.closeEditor, true, this);
}
