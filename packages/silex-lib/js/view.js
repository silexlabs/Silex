var silex = silex || {}; 
silex.view = silex.view || {}; 

goog.provide('silex.view.Menu');
goog.provide('silex.view.Stage');
goog.provide('silex.view.PageTool');

goog.require('goog.ui.menuBar');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuButton');

//////////////////////////////////////////////////////////////////
// Menu class
//////////////////////////////////////////////////////////////////
/**
 * the Silex menu class
 */
silex.view.Menu = function(){
}
/**
 * singleton pattern
 */
silex.view.Menu._instance = null;
/**
 * singleton pattern
 */
silex.view.Menu.getInstance = function(){
	if (silex.view.Menu._instance === null){
		silex.view.Menu._instance = new silex.view.Menu();
	}
	return silex.view.Menu._instance;
}
/**
 * reference to the menu class
 */
silex.view.Menu.prototype.menu;
/**
 * reference to the attached element
 */
silex.view.Menu.prototype.element;
/**
 * callback for menu events, set by the controller
 */
silex.view.Menu.prototype.onMenuEvent;
/**
 * load the template and make it a menu
 */
silex.view.Menu.prototype.attachTo = function(element, cbk){
	this.element = element;
	var that = this;
	silex.TemplateHelper.loadTemplateFile("html/ui/menu.html", element, function(){
//		that.menu = new goog.ui.Menu();
//		that.menu.decorate(element);
		that.buildMenu(element);
		console.log('template loaded ');
		cbk();
	});
}
silex.view.Menu.prototype.buildMenu = function(rootNode) {
	this.menu = goog.ui.menuBar.create();
	var menuNames = ['File', 'Insert', 'View'];
	var menuOptions = [
		[
			{label:'New File', id:'file.new'}, 
			{label: 'Open File', id: 'file.open'},
			{label: 'Save File', id: 'file.save'},
			null,
			{label: 'Close File', id: 'file.close'},
		],
		[
			{label:'New page', id:'insert.page'}, 
		],
		[
			{label:'View in new window', id:'view.file'}, 
			null,
			{label: '#page1', id: 'view.open.#page1'},
			{label: '#page2', id: 'view.open.#page2'},
			{label: '#page3', id: 'view.open.#page3'},
		],
	];

	for (i in menuNames) {
		// Create the drop down menu with a few suboptions.
		var menu = new goog.ui.Menu();
		goog.array.forEach(menuOptions[i],
			function(itemData) {
				var item;
				if (itemData) {
					var label = itemData.label || itemData;
					var id = itemData.id || itemData.label || itemData;
					item = new goog.ui.MenuItem(label + '...');
					item.setId(id);
				} else {
					item = new goog.ui.MenuSeparator();
				}
				item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
				menu.addItem(item);
			}
		);

		// Create a button inside menubar.
		var btn = new goog.ui.MenuButton(menuNames[i], menu);
		btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
		this.menu.addChild(btn, true);
	}
	// render the menu
	this.menu.render(rootNode);
	// event handling
	var that = this;
	goog.events.listen(this.menu, goog.ui.Component.EventType.ACTION, function(e){
		if (that.onMenuEvent) that.onMenuEvent(e);
	});
}
//////////////////////////////////////////////////////////////////
// Stage class
//////////////////////////////////////////////////////////////////
/**
 * the Silex stage class
 */
silex.view.Stage = function(){
}
/**
 * singleton pattern
 */
silex.view.Stage._instance = null;
/**
 * reference to the element to render to
 */
silex.view.Stage.prototype.element;
/**
 * reference to the element in wich we store the head of the edited html file
 */
silex.view.Stage.prototype.headElement;
/**
 * reference to the element in wich we display the body of the edited html file
 */
silex.view.Stage.prototype.bodyElement;
/**
 * singleton pattern
 */
silex.view.Stage.getInstance = function(){
	if (silex.view.Stage._instance === null){
		silex.view.Stage._instance = new silex.view.Stage();
	}
	return silex.view.Stage._instance;
}
/**
 * render to the given html element
 */
silex.view.Stage.prototype.attachTo = function(element, cbk){
	console.log('attachTo '+element);
	this.element = element;
	this.headElement = document.createElement('div');
	that = this;
	silex.TemplateHelper.loadTemplateFile("html/ui/stage.html", element, function(){
		that.bodyElement = goog.dom.getElement('_silex_body', that.element);
		cbk();
	});
}
/**
 * set the html content on the stage and make it editable
 * the parameters are strings containing html
 */
silex.view.Stage.prototype.setContent = function(bodyHtml, headHtml){
	console.log('setContent '+bodyHtml);
	this.cleanup();
	this.bodyElement.innerHTML = bodyHtml;
	this.headElement.innerHTML = headHtml;
    $('[data-silex-type="container"]').editable({
      isContainer: true,
    });
    $('[data-silex-type="element"]').editable();
	
	$(this.bodyElement).pageable({useDeeplink:false});
}
/**
 * cleanup editable, reset html content
 */
silex.view.Stage.prototype.cleanup = function(){
	console.log('cleanup ');
	$('[data-silex-type="container"]').editable("destroy")
    $('[data-silex-type="element"]').editable("destroy")
    //$(this.bodyElement).pageable("destroy")
    if (this.bodyElement) this.bodyElement.innerHTML = '';
	if (this.headElement) this.headElement.innerHTML = '';
}
/**
 * return clean html string (no edition-related content)
 */
silex.view.Stage.prototype.getBody = function(){
	console.log('getBody ');

	var cleanContainer = this.bodyElement.cloneNode();

	$(cleanContainer).find('.ui-resizable').removeClass('ui-resizable');
	$(cleanContainer).find('.ui-draggable').removeClass('ui-draggable');
	$(cleanContainer).find('.ui-droppable').removeClass('ui-droppable');

	$(cleanContainer).find('[aria-disabled]').removeAttr('aria-disabled');
	
	$(cleanContainer).find('.ui-resizable-handle').remove();

	return cleanContainer.innerHTML;
}
/**
 * return clean html string (no edition-related content)
 */
silex.view.Stage.prototype.getHead = function(){
	return this.headElement.innerHTML;
}
/**
 * get the publication pages 
 */
silex.view.Stage.prototype.getPages = function(){
	console.log('getPages ');

	var pages = [];

	$('meta[name="page"]', this.headElement).each(function() {
		console.log('found page '+this.getAttribute('content'));
		pages.push(this.getAttribute('content'));
	});
/*
	$('#_silex_body a[href^="#"]').each(function() {
		console.log('found page '+this.getAttribute('href'));
		pages.push(this.getAttribute('href'));
	});
*/
	return pages;
}
silex.view.Stage.prototype.currentPage;
/**
 * open the given page of the site 
 */
silex.view.Stage.prototype.openPage = function(pageName){
	console.log('openPage '+pageName);
    $(this.bodyElement).pageable({currentPage:pageName});
    this.currentPage = pageName;
}
/**
 * create a new page 
 */
silex.view.Stage.prototype.createPage = function(pageName){
	console.log('createPage '+pageName);
	var meta = document.createElement('meta');
	meta.name = 'page';
	meta.content = pageName;
	this.headElement.appendChild(meta);
}
/**
 * delete a page 
 */
silex.view.Stage.prototype.removePage = function(pageName){
	console.log('removePage '+pageName);
	$('meta[name="page"]', this.headElement).each(
		function () {
			console.log('found meta '+this);
			if (this.getAttribute('content')==pageName){

				$(this).remove();
			}
		});

}
//////////////////////////////////////////////////////////////////
// PageTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PageTool class
 */
silex.view.PageTool = function(){
}
/**
 * singleton pattern
 */
silex.view.PageTool._instance = null;
/**
 * reference to the element to render to
 */
silex.view.PageTool.prototype.element;
/**
 * singleton pattern
 */
silex.view.PageTool.getInstance = function(){
	if (silex.view.PageTool._instance === null){
		silex.view.PageTool._instance = new silex.view.PageTool();
	}
	return silex.view.PageTool._instance;
}
/**
 * callback for the events, set by the controller
 */
silex.view.PageTool.prototype.onPageToolEvent;
/**
 * dataProvider 
 */
silex.view.PageTool.prototype.dataProvider;
/**
 * render to the given html element
 */
silex.view.PageTool.prototype.attachTo = function(element, cbk){
	console.log('PageTool attachTo '+element);
	this.element = element;
	this.dataProvider = [];
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile("html/ui/page-tool.html", element, function(){
		cbk();
	});
}
/**
 * refresh with new data
 */
silex.view.PageTool.prototype.setDataProvider = function(data){
	console.log('PageTool setDataProvider '+data.length);

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
			console.log('remove button pressed ');
			that.removePageAtIndex(that.getCellIndex(this.parentNode.parentNode));
		}
	);
}
/**
 * ask to remove a page
 */
silex.view.PageTool.prototype.removePageAtIndex = function(idx){
	console.log('about to remove page '+idx+' - '+this.dataProvider[idx]);
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
	console.log('PageTool selectionChanged ');
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
	console.log('PageTool getSelectedItems ');
	var res = [];
	var that = this;
	var index = 0;
	$( ".page-container", this.element ).each(function() {
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
	console.log('PageTool setSelectedIndexes '+indexes);
	var index = 0;
	var that = this;
	$( ".page-container", this.element ).each(function() {
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
