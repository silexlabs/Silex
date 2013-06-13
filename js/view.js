var silex = silex || {}; 
silex.view = silex.view || {}; 

goog.provide('silex.view.Workspace');
goog.provide('silex.view.Menu');
goog.provide('silex.view.Stage');
goog.provide('silex.view.PageTool');
goog.provide('silex.view.PropertiesTool');
goog.provide('silex.view.CKEditor');

goog.require('goog.style');

goog.require('goog.ui.menuBar');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.Checkbox');
goog.require('goog.ui.CustomButton');

goog.require('goog.dom.ViewportSizeMonitor');

//////////////////////////////////////////////////////////////////
// Workspace class
//////////////////////////////////////////////////////////////////
/**
 * the Silex workspace class
 * @constructor
 */
silex.view.Workspace = function(element, menu, stage, pageTool, propertiesTool, ckEditor){
	this.element = element;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.ckEditor = ckEditor;
	
	this.viewport = new goog.dom.ViewportSizeMonitor();

	var that = this;
	goog.events.listen(this.viewport, goog.events.EventType.RESIZE, function(e){
		that.redraw();
	});
}
/**
 * closure goog.dom.ViewportSizeMonitor object
 */
silex.view.Workspace.prototype.viewport;
/**
 * reference to the silex.view.Menu class
 */
silex.view.Workspace.prototype.menu;
/**
 * reference to the silex.view.Stage class
 */
silex.view.Workspace.prototype.stage;
/**
 * reference to the silex.view.PageTool class
 */
silex.view.Workspace.prototype.pageTool;
/**
 * reference to the silex.view.PropertiesTool class
 */
silex.view.Workspace.prototype.propertiesTool;
/**
 * reference to the silex.view.CKEditor class
 */
silex.view.Workspace.prototype.ckEditor;
/**
 * reference to the attached element
 */
silex.view.Workspace.prototype.element;
/**
 * redraw the workspace, positions and sizes of the tool boxes
 */
silex.view.Workspace.prototype.redraw = function(){
	var that = this;
	setTimeout(function() { that.doRedraw(); }, 400);
}
silex.view.Workspace.prototype.doRedraw = function(){
	var viewportSize = this.viewport.getSize();
	var pageToolSize = goog.style.getSize(this.pageTool.element);
	var propertiesToolSize = goog.style.getSize(this.propertiesTool.element);
	var menuSize = goog.style.getSize(this.menu.element);

	// stage
	var stageWidth = viewportSize.width - pageToolSize.width - propertiesToolSize.width;
	goog.style.setWidth(this.stage.element, stageWidth);
	console.log('redraw workspace '+stageWidth);

	// menu offset
	var toolsHeight = viewportSize.height - menuSize.height;
	goog.style.setHeight(this.pageTool.element, toolsHeight);
	goog.style.setHeight(this.propertiesTool.element, toolsHeight);
	goog.style.setHeight(this.stage.element, toolsHeight);

	// ckeditor
	var ckEditorContent = goog.dom.getElementByClass('cke_editor_ck-editor', this.ckEditor.element);
	if (ckEditorContent){
		var ckEditorSize = goog.style.getSize(ckEditorContent);
		var posX = (viewportSize.width - ckEditorSize.width)/2;
		var posY = (viewportSize.height - ckEditorSize.height)/2;
		goog.style.setPosition(ckEditorContent, posX);
	}
}

//////////////////////////////////////////////////////////////////
// Menu class
//////////////////////////////////////////////////////////////////
/**
 * the Silex menu class
 * @constructor
 * based on closure menu class
 * load the template and make it a menu
 */
silex.view.Menu = function(element, cbk){
	this.element = element;

	var that = this;
	silex.TemplateHelper.loadTemplateFile('html/ui/menu.html', element, function(){
		console.log('template loaded');
		that.buildMenu(element);
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onMenuEvent) that.onMenuEvent({type:'ready'});
	});
}
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.Menu.prototype.onReady;
/**
 * reference to the menu class of the closure library
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
 * create the menu with closure API
 */
silex.view.Menu.prototype.buildMenu = function(rootNode) {
	this.menu = goog.ui.menuBar.create();
	var menuNames = ['File', 'Edit', 'View', 'Insert'];
	var menuOptions = [
		[
			{label:'New File', id:'file.new'}, 
			{label: 'Open File...', id: 'file.open'},
			{label: 'Save File', id: 'file.save'},
			null,
			{label: 'Close File', id: 'file.close'},
		],
		[
			{label:'Delete selection', id:'edit.delete.selection'}, 
			null,
			{label:'Delete page', id:'edit.delete.page'}, 
		],
		[
			{label:'View in new window', id:'view.file'}, 
			null,
			{label:'Open text editor', id:'view.open.textEditor'}, 
		],
		[
			{label:'Text box', id:'insert.text'}, 
			{label:'Image...', id:'insert.image'}, 
			{label:'Container', id:'insert.container'}, 
			null,
			{label:'New page', id:'insert.page'}, 
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
					item = new goog.ui.MenuItem(label);
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
 * @constructor
 * load the template and render to the given html element
 */
silex.view.Stage = function(element, cbk){
	console.log(typeof(this.setContent));
	this.element = element;
	this.headElement = document.createElement('div');
	var that = this;
	silex.TemplateHelper.loadTemplateFile('html/ui/stage.html', element, function(){
		console.log('template loaded');
		that.bodyElement = goog.dom.getElementByClass('silex-stage-body', that.element);
		if (cbk && typeof(cbk)=='function') cbk();
		if(that.onReady) that.onReady();
		if (that.onStageEvent) that.onStageEvent({type:'ready'});
	});
	$(this.element).on('mousedown', function(e){
		console.log('mousedown '+e.target.className);
		if (that.onStageEvent) that.onStageEvent({
			type:'select',
			element:that.findEditableParent(e.target),
		});
	});
}
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_TYPE_CONTAINER = 'container';
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_TYPE_ELEMENT = 'element';
/**
 * constant for silex element type
 */
silex.view.Stage.ELEMENT_SUBTYPE_TEXT = 'text';
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.Stage.prototype.onReady;
/**
 * callback for stage events, set by the controller
 */
silex.view.Stage.prototype.onStageEvent;
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
 * find the first editable parent
 */
silex.view.Stage.prototype.findEditableParent = function(child){
	while (child && child.getAttribute && !child.getAttribute('data-silex-type')){
		child = child.parentNode;
	}
	if (child && child.getAttribute && child.getAttribute('data-silex-type'))
		return child;
	else
		return null;
}
/**
 * set the html content on the stage and make it editable
 * the parameters are strings containing html
 */
silex.view.Stage.prototype.setContent = function(bodyHtml, headHtml){
	console.log('setContent ');
	this.makeEditable(false);
	this.bodyElement.innerHTML = bodyHtml;
	this.headElement.innerHTML = headHtml;
	this.makeEditable(true);
}
/**
 * reset html content
 */
silex.view.Stage.prototype.removeContent = function(){
	console.log('removeContent ');
    if (this.bodyElement) this.bodyElement.innerHTML = '';
	if (this.headElement) this.headElement.innerHTML = '';
}
/**
 * init or remove editable
 */
silex.view.Stage.prototype.makeEditable = function(isEditable){
	if (isEditable){
		$('[data-silex-type="container"]').editable({
		  isContainer: true,
		});
		$('[data-silex-type="element"]').editable();

		$(this.bodyElement).pageable({useDeeplink:false});
	}
	else{
		$('[data-silex-type="container"]').editable('destroy')
	    $('[data-silex-type="element"]').editable('destroy')
	    //$(this.bodyElement).pageable('destroy')
	}
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
/**
 * add elements
 */
silex.view.Stage.prototype.addElement = function(elementType){
	console.log('addElement '+elementType);
	var newHtml;
	switch(elementType){
		case silex.view.Stage.ELEMENT_TYPE_CONTAINER:
			newHtml = '<div class="editable-style" data-silex-type="container" style="position: absolute; width: 100px; height: 100px; left: 50%; top: 50%;" />';
			break;
		case silex.view.Stage.ELEMENT_SUBTYPE_TEXT:
			newHtml = '<div class="editable-style" data-silex-type="element" data-silex-sub-type="text" style="position: absolute; width: 200px; height: 30px; left: 50%; top: 50%;"><p>New text box</p></div>';
			break;
	}
	var element = $('.background', this.bodyElement).append(newHtml);
	this.makeEditable(true);
	return element;
}
/**
 * remove elements
 */
silex.view.Stage.prototype.removeElement = function(element){
	console.log('removeElement '+element);
	$(element).remove();
	return element;
}
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
	silex.TemplateHelper.loadTemplateFile('html/ui/pagetool.html', element, function(){
		console.log('template loaded');
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
	console.log('PageTool setSelectedIndexes '+indexes);
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
//////////////////////////////////////////////////////////////////
// PropertiesTool class
//////////////////////////////////////////////////////////////////
/**
 * the Silex PropertiesTool class
 * @constructor
 */
silex.view.PropertiesTool = function(element, cbk){
	this.element = element;
	this.pages = [];
	this.pageCheckboxes = [];
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile('html/ui/propertiestool.html', element, function(){
		console.log('template loaded');
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onPropertiesToolEvent){
			that.onPropertiesToolEvent({
				type: 'ready',
			});
		}
		that.redraw();
	});
}
/**
 * on ready callback
 * used by the controller to be notified when the component is ready
 * called 1 time after template loading and rendering
 */
silex.view.PropertiesTool.prototype.onReady;
/**
 * callback for the events, set by the controller
 */
silex.view.PageTool.prototype.onPropertiesToolEvent;
/**
 * pages 
 */
silex.view.PropertiesTool.prototype.pages;
/**
 * selected elements on the stage
 */
silex.view.PropertiesTool.prototype.elements;
/**
 * checkboxes instanciated for each page
 */
silex.view.PropertiesTool.prototype.pageCheckboxes;
/**
 * refresh with new data
 */
silex.view.PropertiesTool.prototype.setPages = function(data){
	console.log('setPages '+data);
	// store data
	this.pages = data;
	// reset selection
	this.setElements([]);
	// reset page checkboxes
	goog.array.forEach(this.pageCheckboxes, function(item) {
		item.checkbox.dispose();
	});
	// init page template
	var pagesContainer = goog.dom.getElementByClass('pages-container', this.element);
	var templateHtml = goog.dom.getElementByClass('pages-selector-template', this.element).innerHTML;
	silex.TemplateHelper.resolveTemplate(pagesContainer, templateHtml, {pages:this.pages});
	// create page checkboxes
	this.pageCheckboxes = [];
	var that = this;
	var mainContainer = goog.dom.getElementByClass('pages-container', this.element);
	var items = goog.dom.getElementsByClass('page-container', mainContainer);
	var idx = 0;
	goog.array.forEach(items, function(item) {
		console.log('found one container '+item.className);
		var checkboxElement = goog.dom.getElementByClass('page-check', item);
		var labelElement = goog.dom.getElementByClass('page-label', item);
		var checkbox = new goog.ui.Checkbox();
		var pageName = that.pages[idx++];
		checkbox.render(checkboxElement);
		checkbox.setLabel (labelElement);
		that.pageCheckboxes.push({
			checkbox: checkbox,
			page: pageName,
		});
		goog.events.listen(checkbox, goog.ui.Component.EventType.CHANGE, function(e){
			that.selectPage(pageName, checkbox);
		});
	});
	// refresh display
	this.redraw();
}
/**
 * the selection has changed
 */
silex.view.PropertiesTool.prototype.setElements = function(elements){
	this.elements = elements;
	this.redraw();
}
/**
 * redraw the toolbox 
 */
silex.view.PropertiesTool.prototype.redraw = function(){
	console.log('redraw '+this.pages);

	// refresh page checkboxes
	var idx = 0;
	var that = this;
	goog.array.forEach(this.pageCheckboxes, function(item) {
		if (that.elements!=null && that.elements.length>0){
			// there is a selection
			var element = that.elements[0];
			var pageName = that.pages[idx];
			item.checkbox.setEnabled(true);
			item.checkbox.setChecked(goog.dom.classes.has(element, pageName));
			idx++;
		}
		else{
			// no selected element
			item.checkbox.setChecked(false);
			item.checkbox.setEnabled(false);
		}
		console.log('checkbox found '+item.checkbox.isEnabled()+' - '+item.checkbox.isChecked());
	});

	// refresh properties
	var editionContainer = goog.dom.getElementByClass('edition-container', this.element);
	if (this.elements && this.elements.length>0 && this.elements[0].getAttribute){
		var templateHtml = goog.dom.getElementByClass('edition-template', this.element).innerHTML;
		silex.TemplateHelper.resolveTemplate(editionContainer, templateHtml, {
			textEditor: (this.elements[0].getAttribute('data-silex-sub-type')==silex.view.Stage.ELEMENT_SUBTYPE_TEXT),
		});

		// text editor
		var buttonElement = goog.dom.getElementByClass('text-editor-button', editionContainer);
		if (buttonElement){
			var button = new goog.ui.CustomButton();
			button.decorate(buttonElement);
			goog.events.listen(buttonElement, goog.events.EventType.CLICK, function(e) { 
				if (that.onPropertiesToolEvent){
					that.onPropertiesToolEvent({
						type: 'openTextEditor',
					});
				}
			});
		}
	}
	else{
		if (editionContainer){
			editionContainer.innerHTML = '';
		}
	}

}
/**
 * callback for checkboxes click event
 */
silex.view.PropertiesTool.prototype.selectPage = function(pageName, checkbox){
	var isChecked = checkbox.isChecked();
	console.log(pageName+' - '+isChecked);
	if (this.elements && this.elements.length>0){
		var element = this.elements[0];
		if (isChecked){
			goog.dom.classes.add(element, pageName)
			goog.dom.classes.add(element, 'silex-page')
		}
		else{
			goog.dom.classes.remove(element, pageName)
			if (this.getNumberOfPages(element)==0){
				goog.dom.classes.remove(element, 'silex-page')
			}
		}
	}
	this.redraw();
}
/**
 * count the number of pages in which the element is visible
 */
silex.view.PropertiesTool.prototype.getNumberOfPages = function(element){
	var res = 0;
	goog.array.forEach(this.pages, function(page) {
		if(goog.dom.classes.has(element, page)){
			res++;
		}
	});
	return res;
}
//////////////////////////////////////////////////////////////////
// CKEditor class
//////////////////////////////////////////////////////////////////
/**
 * the Silex CKEditor class
 * @constructor
 */
silex.view.CKEditor = function(element, cbk){
	this.element = element;
	
	var that = this;
	silex.TemplateHelper.loadTemplateFile('html/ui/ckeditor.html', element, function(){
		console.log('template loaded');
		if (cbk) cbk();
		if(that.onReady) that.onReady();
		if (that.onPropertiesToolEvent){
			that.onPropertiesToolEvent({
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
silex.view.CKEditor.prototype.onReady;
/**
 * callback for the events, set by the controller
 */
silex.view.CKEditor.prototype.onCKEditorEvent;
/**
 * selected elements on the stage
 */
silex.view.CKEditor.prototype.elements;
/**
 * instance of the ckeditor
 */
silex.view.CKEditor.prototype.editorInstance;
silex.view.CKEditor.prototype.timer;
/**
 * the selection has changed
 */
silex.view.CKEditor.prototype.setElements = function(elements){
	console.log('setElements '+elements);
	this.elements = elements;
}
silex.view.CKEditor.prototype.getElement = function(){
	return goog.dom.getElementsByTagNameAndClass('p', null, this.elements[0])[0];
}
/**
 * Open the editor
 */
silex.view.CKEditor.prototype.openEditor = function(){
	console.log('openEditor ');
	var element = this.getElement();
	console.log(element);
	if (element){
		var that = this;
		var textArea = goog.dom.getElementByClass('ck-editor');
		textArea.innerHTML = element.innerHTML;

		that.editorInstance = CKEDITOR.replace( 'ck-editor', {
			contentsCss: 'libs/ckeditor/outputxhtml.css',
	        height: 500,
	        width: "100%",
			stylesSet: [
				{ name: 'Strong Emphasis', element: 'strong' },
				{ name: 'Emphasis', element: 'em' },

				{ name: 'Computer Code', element: 'code' },
				{ name: 'Keyboard Phrase', element: 'kbd' },
				{ name: 'Sample Text', element: 'samp' },
				{ name: 'Variable', element: 'var' },

				{ name: 'Deleted Text', element: 'del' },
				{ name: 'Inserted Text', element: 'ins' },

				{ name: 'Cited Work', element: 'cite' },
				{ name: 'Inline Quotation', element: 'q' }
			]
		});
		that.editorInstance.on("instanceReady", function(){

			// listen the keyboard events to call the callback when the user enters text
			that.editorInstance.document.on("keyup", function(){that.onUserInput();});
			// for the combo boxes to be taken into account
			that.timer = setInterval(function(){
				that.onUserInput();
			},1000);

			that.editorInstance.setData(element.innerHTML);
		});

		// background
		var background = goog.dom.getElementByClass('ckeditor-background');
		// show
		goog.style.setStyle(background, 'display', 'inherit');
		// close
		goog.events.listen(background, goog.events.EventType.CLICK, function(e){
			that.closeEditor();
		});
	}
}
/**
 * close ckeditor 
 */
silex.view.CKEditor.prototype.closeEditor = function(){
	this.editorInstance.destroy();
	clearTimeout(this.timer);
	// background
	var background = goog.dom.getElementByClass('ckeditor-background');
	goog.style.setStyle(background, 'display', 'none');
}
/**
 * text changed in ckeditor 
 */
silex.view.CKEditor.prototype.onUserInput = function(){
	console.log("onUserInput "+this.editorInstance.getData());
	console.log("onUserInput "+this.elements);
	var element = this.getElement();
	if (element){
		element.innerHTML = this.editorInstance.getData();
	}
}
