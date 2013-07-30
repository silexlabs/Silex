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

goog.provide('silex.view.PageTool');

/**
 * the Silex PageTool class
 * @constructor
 */
silex.view.PageTool = function(element, cbk){
	this.element = element;
	this.pages = [];
	
	silex.Helper.loadTemplateFile('templates/pagetool.html', element, function(){
		goog.events.listen(this.element, goog.events.EventType.CLICK, function (e) {
			this.setSelectedIndex(this.getCellIndex(e.target));
		}, false, this);
		if (cbk) cbk();
	}, this);
}
/**
 * reference to the element to render to
 */
silex.view.PageTool.prototype.element;
/**
 * callback for the events, passed by the controller
 */
silex.view.PageTool.prototype.onStatus;
/**
 * pages
 * array of Page instances
 * @see silex.model.Page
 */
silex.view.PageTool.prototype.pages;
/**
 * refresh with new page list
 */
silex.view.PageTool.prototype.setPages = function(pages){

	this.pages = pages;

	//$(this.element).find( '.page-tool-container' ).sortable('destroy');
	//$(this.element).find( '.page-tool-container' ).selectable('destroy');

	var container = goog.dom.getElementByClass('page-tool-container', this.element);
	var templateHtml = goog.dom.getElementByClass('page-tool-template', this.element).innerHTML;
	silex.Helper.resolveTemplate(container, templateHtml, {pages:pages});

	var that = this;
	var idx = 0;
	$(this.element).find( '.page-tool-container .page-container' ).each(
		function () {
			this.setAttribute('data-index', idx++);
		}
	);
/*
	$(this.element).find( '.page-tool-container' ).selectable(
		{
			stop: function( event, ui ) {
				that.selectionChanged();
			}
		}
	);
	$(this.element).find( '.page-tool-container' ).disableSelection();
*/

	$(this.element).find( '.page-tool-container .page-container .page-preview .delete' ).click(
		function(e){
			that.removePageAtIndex(that.getCellIndex(this.parentNode.parentNode));
		}
	);
}
/**
 * ask to remove a page
 */
silex.view.PageTool.prototype.removePageAtIndex = function(idx){
	if (this.onStatus) this.onStatus({
		type:'delete',
		page: this.pages[idx]
	});
}
/**
 * selection has changed
 */
silex.view.PageTool.prototype.selectionChanged = function(){
	var page = null;
	if (this.getSelectedItem().length > 0)
		page = this.getSelectedItem();
	
	if (this.onStatus) this.onStatus({
		type:'changed',
		page: page
	});
}
/**
 * get selection 
 */
silex.view.PageTool.prototype.getSelectedItem = function(){
	var selectedPages = [];
	var that = this;
	var index = 0;
	$( '.page-container', this.element ).each(function() {
		if($(this).hasClass('ui-selected')){
			selectedPages.push(that.pages[index]);
		}
		index++;
    });
    if (selectedPages.length>0)
	    return selectedPages[0];
	else
		return null;
}
silex.view.PageTool.prototype.getCellIndex = function (element) {
	return parseInt(element.getAttribute('data-index'));
}
/**
 * set the selection of pages 
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.view.PageTool.prototype.setSelectedIndex = function(index, notify){
	var that = this;
	var idx = 0;
	$( '.page-container', this.element ).each(function() {
		if(index == idx){
			$(this).addClass('ui-selected');
		}
		else{
			$(this).removeClass('ui-selected');
		}
		idx++;
    });
	if(notify) this.selectionChanged();
}
