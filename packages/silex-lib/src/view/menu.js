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

goog.provide('silex.view.Menu');

goog.require('goog.ui.menuBar');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuButton');

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

	silex.Helper.loadTemplateFile('templates/menu.html', element, function(){
		this.buildMenu(element);
		if (cbk) cbk();
	}, this);
}
/**
 * reference to the menu class of the closure library
 */
silex.view.Menu.prototype.menu;
/**
 * element of the dom to which the component is rendered
 */
silex.view.Menu.prototype.element;
/**
 * callback for menu events, set by the controller
 */
silex.view.Menu.prototype.onStatus;
/**
 * create the menu with closure API
 */
silex.view.Menu.prototype.buildMenu = function(rootNode) {
	this.menu = goog.ui.menuBar.create();
	var menuNames = ['File', 'Edit', 'View', 'Insert', 'Tools', 'Help'];
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
			{label:'Rename page', id:'edit.rename.page'},
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
			{label:'HTML box', id:'insert.html'}, 
			null,
			{label:'New page', id:'insert.page'} 
		],
		[
			{label:'Apollo mode', id:'tools.advanced.activate', checkable: true}
		],
		[
			{label:'About Silex', id:'help.about'}, 
			{label:'About Silex Labs', id:'help.aboutSilexLabs'}, 
			{label:'Silex Labs news by email', id:'help.newsLetter'}, 
			null,
			{label:'Questions and answers', id:'help.forums'}, 
			{label:'Talk with us on twitter', id:'help.twitter'}, 
			{label:'Talk with us on Google+', id:'help.googlPlus'}, 
			{label:'Talk with us on Facebook', id:'help.facebook'}, 
			null,
			{label:'Fork me on github!', id:'help.forkMe'} 
		]
	];

	for (i in menuNames) {
		// Create the drop down menu with a few suboptions.
		var menu = new goog.ui.Menu();
		goog.array.forEach(menuOptions[i],
			function(itemData) {
				var item;
				if (itemData) {
					var label = itemData.label;
					var id = itemData.id;
					item = new goog.ui.MenuItem(label);
					item.setId(id);
					if (itemData.checkable) item.setCheckable(true);
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
	goog.events.listen(this.menu, goog.ui.Component.EventType.ACTION, function(e){
		this.onMenuEvent(e);
	}, false, this);
	goog.events.listen(goog.dom.getElementByClass('website-name'), goog.events.EventType.CLICK, function(e){
		this.onMenuEvent(e);
	}, false, this);
}
/**
 * handles menu events
 * calls onStatus to notify the controller
 */
silex.view.Menu.prototype.onMenuEvent = function (e) {
	if (this.onStatus && e && e.target){
		if (goog.dom.classes.has(e.target, 'website-name')){
			// notify the controller
			if (this.onStatus) this.onStatus({
				type:'title.changed'
			});
		}
		else{
			this.onStatus({
				type: e.target.getId()
			});
		}
	}
}
/**
 * website name
 * called by file when updating the website title
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
