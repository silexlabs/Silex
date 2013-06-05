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
// Stage class
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
	silex.TemplateHelper.loadTemplate("html/ui/menu.html", element, function(){
//		that.menu = new goog.ui.Menu();
//		that.menu.decorate(element);
		that.buildMenu(element);
		console.log('template loaded ');
		cbk();
	});
}
silex.view.Menu.prototype.buildMenu = function(rootNode) {
	this.menu = goog.ui.menuBar.create();
	var menuNames = ["File","About"];
	var menuOptions = [
		[
			{label:'New File', id:'file.new'}, 
			{label: 'Open File', id: 'file.open'},
			{label: 'Save File', id: 'file.save'},
			null,
			{label: 'Close File', id: 'file.close'},
		],
		['Silex Labs', 'Getting started', 'Help'],
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
	that = this;
	silex.TemplateHelper.loadTemplate("html/ui/stage.html", element, function(){
		cbk();
	});
}
/**
 * set the html content on the stage and make it editable
 */
silex.view.Stage.prototype.setContent = function(html){
	console.log('setContent '+html);
	this.cleanup();
	var stageContainer = goog.dom.getElement('_silex_body');
	stageContainer.innerHTML = html;
    $('[data-silex-type="container"]').editable({
      isContainer: true,
    });
    $('[data-silex-type="element"]').editable();
}
/**
 * cleanup editable, reset html content
 */
silex.view.Stage.prototype.cleanup = function(){
	console.log('cleanup ');
	$('[data-silex-type="container"]').editable("destroy")
    $('[data-silex-type="element"]').editable("destroy")
	var stageContainer = goog.dom.getElement('_silex_body');
	stageContainer.innerHTML = '';
}
/**
 * return clean (non-editable) html content
 */
silex.view.Stage.prototype.getCleanContent = function(){
	console.log('cleanup ');

	var stageContainer = goog.dom.getElement('_silex_body');
	var cleanContainer = stageContainer.cloneNode();

	$(cleanContainer).find('.ui-resizable').removeClass('ui-resizable');
	$(cleanContainer).find('.ui-draggable').removeClass('ui-draggable');
	$(cleanContainer).find('.ui-droppable').removeClass('ui-droppable');

	$(cleanContainer).find('[aria-disabled]').removeAttr('aria-disabled');
	
	$(cleanContainer).find('.ui-resizable-handle').remove();

	return cleanContainer.innerHTML;
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
 * render to the given html element
 */
silex.view.PageTool.prototype.attachTo = function(element, cbk){
	console.log('attachTo '+element);
	this.element = element;
	that = this;
	silex.TemplateHelper.loadTemplate("html/ui/page-tool.html", element, function(){
		cbk();
	});
}



