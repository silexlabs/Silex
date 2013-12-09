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


goog.provide('silex.view.Menu');
goog.require('silex.model.Config');

goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.menuBar');
goog.require('goog.ui.Tooltip');



//////////////////////////////////////////////////////////////////
// Menu class
//////////////////////////////////////////////////////////////////
/**
 * @constructor
 */
silex.view.Menu = function(element, cbk) {
  this.element = element;

  silex.Helper.loadTemplateFile('templates/menu.html', element, function() {
    this.buildMenu(element);
    if (cbk) cbk();
  }, this);
};


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

  for (i in silex.model.Config.menu.names) {
    // Create the drop down menu with a few suboptions.
    var menu = new goog.ui.Menu();
    goog.array.forEach(silex.model.Config.menu.options[i],
        function(itemData) {
          var item;
          if (itemData) {
            var label = itemData.label;
            var id = itemData.id;
            var className = itemData.className;
            item = new goog.ui.MenuItem(label);
            item.setId(id);
            item.addClassName(className);
            if (itemData.checkable) {
              item.setCheckable(true);
            }
            // add shortcut
            if (itemData.shortcut) {
              Mousetrap.bind(itemData.shortcut, goog.bind(function(e, pattern) {
                console.log('shortcut', itemData, pattern);
                e.preventDefault();
                this.onMenuEvent(itemData.id);
              }, this));
            }
          } else {
            item = new goog.ui.MenuSeparator();
          }
          item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
          menu.addItem(item);
          // add tooltip (has to be after menu.addItem)
          if (itemData && itemData.tooltip) {
            // add tooltip to the label
            var div = goog.dom.createElement('small');
            div.innerHTML = itemData.tooltip;
            div.className = 'shortcut-display';
            item.getElement().appendChild(div);
            // add a real tooltip
            new goog.ui.Tooltip(item.getElement(), itemData.tooltip);
          }
        }, this);

    // Create a button inside menubar.
    var menuItemData = silex.model.Config.menu.names[i];
    var btn = new goog.ui.MenuButton(menuItemData.label, menu);
    btn.addClassName(menuItemData.className);
    btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
    this.menu.addChild(btn, true);
/*
    // add shortcut
    if (menuItemData.shortcut) {
      Mousetrap.bind(menuItemData.shortcut, goog.bind(function(e, pattern) {
        console.log('shortcut for 1st level menu', menuItemData, pattern);
        e.preventDefault();
        this.setOpen(true);
      }, btn));
    }
*/
  }
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
    this.onStatus({
      type: type
    });
  }
};


/**
 * website name
 * called by file when updating the website title
 */
silex.view.Menu.prototype.setWebsiteName = function(name) {
  goog.dom.getElementByClass('website-name').innerHTML = name;
};


/**
 * website name
 */
silex.view.Menu.prototype.getWebsiteName = function() {
  return goog.dom.getElementByClass('website-name').innerHTML;
};
