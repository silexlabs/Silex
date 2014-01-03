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

/**
 * @fileoverview
 * the Silex menu
 * based on closure menu class
 *
 */


goog.require('silex.view.ViewBase');
goog.provide('silex.view.Menu');
goog.require('silex.Config');

goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.menuBar');
//goog.require('goog.ui.Tooltip');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.events.KeyHandler');


/**
 * @constructor
 * @param {element} element   container to render the UI
 */
silex.view.Menu = function(element, bodyElement, headElement) {
  // call super
  goog.base(this, element, bodyElement, headElement);
  this.buildMenu(element);
};

// inherit from silex.view.ViewBase
goog.inherits(silex.view.Menu, silex.view.ViewBase);


/**
 * reference to the menu class of the closure library
 */
silex.view.Menu.prototype.menu;


/**
 * refresh the displayed data
 */
silex.view.Menu.prototype.redraw = function() {
  var title = null;
  $('title', this.headElement).each(
    function() {
      title = this.innerHTML;
    });

  this.setWebsiteName(title);
}


/**
 * create the menu with closure API
 */
silex.view.Menu.prototype.buildMenu = function(rootNode) {
  this.menu = goog.ui.menuBar.create();

  // shortcut handler
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  var globalKeys = [];

  // create the menu items
  for (i in silex.Config.menu.names) {
    // Create the drop down menu with a few suboptions.
    var menu = new goog.ui.Menu();
    goog.array.forEach(silex.Config.menu.options[i],
        function(itemData) {
          var item;
          if (itemData) {
            // create the menu item
            var label = itemData.label;
            var id = itemData.id;
            item = new goog.ui.MenuItem(label);
            item.setId(id);
            item.addClassName(itemData.className);
            // checkable
            if (itemData.checkable) {
              item.setCheckable(true);
            }
            // mnemonic (access to an item with keyboard when the menu is open)
            if (itemData.mnemonic) {
              item.setMnemonic(itemData.mnemonic);
            }
            // shortcut
            if (itemData.shortcut) {
              for (var idx in itemData.shortcut) {
                shortcutHandler.registerShortcut(itemData.id, itemData.shortcut[idx]);
                if (itemData.globalKey){
                  globalKeys.push(itemData.globalKey);
                }
              }
            }
          } else {
            item = new goog.ui.MenuSeparator();
          }
          //item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
          // add the menu item
          menu.addItem(item);
          // add tooltip (has to be after menu.addItem)
          // TODO: add accelerator (only display shortcut here, could not get it to work automatically with closure's accelerator concept)
          if (itemData && itemData.tooltip) {
            // add label
            var div = goog.dom.createElement('span');
            div.innerHTML = itemData.tooltip;
            div.className = 'goog-menuitem-accel';
            item.getElement().appendChild(div);
            // add a real tooltip
            //new goog.ui.Tooltip(item.getElement(), itemData.tooltip);
          }
        }, this);

    // Create a button inside menubar.
    var menuItemData = silex.Config.menu.names[i];
    var btn = new goog.ui.MenuButton(menuItemData.label, menu);
    btn.addClassName(menuItemData.className);
    btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
    this.menu.addChild(btn, true);
  }

  shortcutHandler.setAlwaysPreventDefault(false);
//  shortcutHandler.setAllShortcutsAreGlobal(false);
  shortcutHandler.setModifierShortcutsAreGlobal(false);

  // shortcuts
  shortcutHandler.setGlobalKeys(globalKeys);
  goog.events.listen(
    shortcutHandler,
    goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
    goog.bind(function(event) {
      event.preventDefault();
      this.onMenuEvent(event.identifier);
    }, this)
  );
  // enter and escape shortcuts
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, 'key', goog.bind(function(event) {
    // Allow ENTER to be used as shortcut for silex
    if (event.keyCode === goog.events.KeyCodes.ENTER){
      // but not in text inputs
      if(event.target.tagName.toUpperCase() === 'INPUT'
        || event.target.tagName.toUpperCase() === 'TEXTAREA'
        || event.target.tagName === shortcutHandler.textInputs_[event.target.type]) {
        // let browser handle
      }
      else{
        // silex takes an action
        event.preventDefault();
        this.onMenuEvent('view.open.editor');
      }
    }
  }, this));


  // render the menu
  this.menu.render(rootNode);
  // event handling
  goog.events.listen(this.menu, goog.ui.Component.EventType.ACTION, function(e) {
    this.onClick(e);
  }, false, this);
  goog.events.listen(goog.dom.getElementByClass('website-name'), goog.events.EventType.CLICK, function(e) {
    this.onClick(e);
  }, false, this);
};


/**
 * handles click events
 * calls onStatus to notify the controller
 */
silex.view.Menu.prototype.onClick = function(e) {
  if (this.onStatus && e && e.target) {
    if (goog.dom.classes.has(e.target, 'website-name')) {
      this.onMenuEvent('title.changed');
    }
    else {
      this.onMenuEvent(e.target.getId());
    }
  }
};


/**
 * handles menu events
 * calls onStatus to notify the controller
 */
silex.view.Menu.prototype.onMenuEvent = function(type) {
  if (this.onStatus) {
    this.onStatus(type);
  }
};


/**
 * website name
 * called by file when updating the website title
 */
silex.view.Menu.prototype.setWebsiteName = function(name) {
  if (!name || name === '') name = 'Untitled website';
  goog.dom.getElementByClass('website-name').innerHTML = name;
};


/**
 * website name
 * for internal use only, you should use silex.model.Head
 */
silex.view.Menu.prototype.getWebsiteName = function() {
  return goog.dom.getElementByClass(headElement, 'website-name').innerHTML;
};

