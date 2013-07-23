goog.provide('silex.view.Menu');

goog.require('goog.ui.menuBar');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuButton');

var silex = silex || {}; 
silex.view = silex.view || {}; 

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
	silex.Helper.loadTemplateFile('templates/menu.html', element, function(){
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
			{label: 'Save As...', id: 'file.saveas'},
			null,
			{label: 'Close File', id: 'file.close'}
		],
		[
			{label:'Delete selection', id:'edit.delete.selection'}, 
			null,
			{label:'Delete page', id:'edit.delete.page'} 
		],
		[
			{label:'View in new window', id:'view.file'}, 
			null,
			{label:'Open text editor', id:'view.open.textEditor'},
			{label:'Open file browser', id:'view.open.fileExplorer'} 
		],
		[
			{label:'Text box', id:'insert.text'}, 
			{label:'Image...', id:'insert.image'}, 
			{label:'Container', id:'insert.container'}, 
			null,
			{label:'New page', id:'insert.page'} 
		]
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
	goog.events.listen(goog.dom.getElementByClass('website-name'), goog.events.EventType.CLICK, function(e){
		if (that.onMenuEvent) that.onMenuEvent(e);
	});
}
/**
 * website name
 */
silex.view.Menu.prototype.setWebsiteName = function(name){
	goog.dom.getElementByClass('website-name').innerHTML = name;
	
}
/**
 * website name
 */
silex.view.Menu.prototype.getWebsiteName = function(){
	return goog.dom.getElementByClass('website-name').innerHTML;
}
