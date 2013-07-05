goog.provide('silex.view.PageTool');

var silex = silex || {}; 
silex.view = silex.view || {}; 


//////////////////////////////////////////////////////////////////
// PageTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PageTool class
 * @constructor
 */
silex.view.PageTool = function(element, cbk){
	this.element = element;
	this.dataProvider = [];
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile('js/view/templates/pagetool.html', element, function(){
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onPageToolEvent){
			that.onPageToolEvent({
				type: 'ready',
			});
		}
	});
}
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.PageTool.prototype.onReady;
/**
 * reference to the element to render to
 */
silex.view.PageTool.prototype.element;
/**
 * callback for the events, set by the controller
 */
silex.view.PageTool.prototype.onPageToolEvent;
/**
 * dataProvider 
 */
silex.view.PageTool.prototype.dataProvider;
/**
 * refresh with new data
 */
silex.view.PageTool.prototype.setDataProvider = function(data){

	this.dataProvider = data;

	//$(this.element).find( '.page-tool-container' ).sortable('destroy');
	//$(this.element).find( '.page-tool-container' ).selectable('destroy');

	var container = goog.dom.getElementByClass('page-tool-container', this.element);
	var templateHtml = goog.dom.getElementByClass('page-tool-template', this.element).innerHTML;
	silex.TemplateHelper.resolveTemplate(container, templateHtml, {pages:data});

	var that = this;
	var idx = 0;
	$(this.element).find( '.page-tool-container .page-container' ).each(
		function () {
			this.setAttribute('data-index', idx++);
		}
	);
	$(this.element).find( '.page-tool-container' ).selectable(
		{
			stop: function( event, ui ) {
				that.selectionChanged();
			}
		}
	);
	$(this.element).find( '.page-tool-container' ).disableSelection();

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
	if (this.onPageToolEvent){
		this.onPageToolEvent({
			type: 'removePage',
			name: this.dataProvider[idx]
		});
	}
}
/**
 * selection has changed
 */
silex.view.PageTool.prototype.selectionChanged = function(){
	if (this.onPageToolEvent){
		this.onPageToolEvent({
			type: 'selectionChanged'
		});
	}
}
/**
 * get selection 
 */
silex.view.PageTool.prototype.getSelectedItems = function(){
	var res = [];
	var that = this;
	var index = 0;
	$( '.page-container', this.element ).each(function() {
		if($(this).hasClass('ui-selected')){
			res.push(that.dataProvider[index]);
		}
		index++;
    });
    return res;
}
silex.view.PageTool.prototype.getCellIndex = function (element) {
	return parseInt(element.getAttribute('data-index'));
}
/**
 * set the selection of pages 
 * @param 	notify	if true, then notify by calling the onChanged callback
 */
silex.view.PageTool.prototype.setSelectedIndexes = function(indexes, notify){
	var index = 0;
	var that = this;
	$( '.page-container', this.element ).each(function() {
		var idx;
		for (idx=0; idx<indexes.length; idx++){
			if(index == indexes[idx]){
				$(this).addClass('ui-selected');
			}
		}
		index++;
    });
	if(notify) this.selectionChanged();
}
