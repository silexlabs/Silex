/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

/**
 * @fileoverview
 * the Silex menu
 * based on closure menu class
 *
 */


goog.provide('silex.view.Menu');
//goog.require('goog.ui.Tooltip');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.menuBar');
goog.require('silex.Config');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.Menu = function(element, controller) {
  // store references
  this.element = element;
  this.controller = controller;
};


/**
 * reference to the menu class of the closure library
 */
silex.view.Menu.prototype.menu = null;


/**
 * create the menu with closure API
 * called by the app constructor
 */
silex.view.Menu.prototype.buildUi = function() {

  /* *
        ////////////////////////////////////////////////////////////////////////////////
        // test of surtcuts
        ////////////////////////////////////////////////////////////////////////////////
        var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
        var globalKeys = [];
        var tmp = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

        // create the menu items
        for (i in tmp) {
          shortcutHandler.registerShortcut('meta-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.META]);
          shortcutHandler.registerShortcut('alt-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.ALT]);
          shortcutHandler.registerShortcut('ctrl-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.CTRL]);
          shortcutHandler.registerShortcut('meta-shift-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.META + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]);
          shortcutHandler.registerShortcut('alt-shift-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.ALT + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]);
          shortcutHandler.registerShortcut('ctrl-shift-'+tmp[i], [goog.events.KeyCodes[tmp[i].toUpperCase()], goog.ui.KeyboardShortcutHandler.Modifiers.CTRL + goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT]);
          console.log('added shortcut', tmp[i]);
        }
        shortcutHandler.setAlwaysPreventDefault(false);
        //  shortcutHandler.setAllShortcutsAreGlobal(false);
        shortcutHandler.setModifierShortcutsAreGlobal(false);
        shortcutHandler.setGlobalKeys(globalKeys);
        goog.events.listen(
          shortcutHandler,
          goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
          goog.bind(function(event) {
            console.log('received shortcut', event.identifier);
            event.preventDefault();
            event.stopPropagation();
          }, this)
        );
        return;
        /* */

  this.menu = goog.ui.menuBar.create();

  // shortcut handler
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  var globalKeys = [];

  // create the menu items
  for (let i in silex.Config.menu.names) {
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
              for (let idx in itemData.shortcut) {
                try {
                  shortcutHandler.registerShortcut(itemData.id, itemData.shortcut[idx]);
                }
                catch (e) {
                  console.error('Catched error for shortcut', id, '. Error: ', e);
                }
                if (itemData.globalKey) {
                  globalKeys.push(itemData.globalKey);
                }
              }
            }
          } else {
            item = new goog.ui.MenuSeparator();
          }
          //item.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
          // add the menu item
          menu.addChild(item, true);
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
        if (!silex.utils.Notification.isActive) {
          event.preventDefault();
          this.onMenuEvent(event.identifier);
        }
      }, this)
  );
  // enter and escape shortcuts
  var keyHandler = new goog.events.KeyHandler(document);
  goog.events.listen(keyHandler, 'key', goog.bind(function(event) {
    if (!silex.utils.Notification.isActive) {
      // Allow ENTER to be used as shortcut for silex
      if (event.keyCode === goog.events.KeyCodes.ENTER &&
          event.shiftKey === false &&
          event.altKey === false &&
          event.ctrlKey === false) {
        // but not in text inputs
        if (event.target.tagName.toUpperCase() === 'INPUT' ||
            event.target.tagName.toUpperCase() === 'TEXTAREA') {
          // let browser handle
        }
        else {
          // silex takes an action
          event.preventDefault();
          this.onMenuEvent('view.open.editor');
        }
      }
    }
  }, this));


  // render the menu
  this.menu.render(this.element);
  // event handling
  goog.events.listen(this.menu, goog.ui.Component.EventType.ACTION, function(e) {
    this.onMenuEvent(e.target.getId());
  }, false, this);
};


/**
 * redraw the menu
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Document} document the document to use
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Menu.prototype.redraw = function(selectedElements, document, pageNames, currentPageName) {
};


/**
 * handles click events
 * calls onStatus to notify the controller
 */
silex.view.Menu.prototype.onMenuEvent = function(type) {
  switch (type) {
    case 'title.changed':
      this.controller.fileMenuController.promptTitle();
      break;
    case 'file.close':
    case 'file.new':
      this.controller.fileMenuController.newFile();
      break;
    case 'file.saveas':
      this.controller.fileMenuController.save();
      break;
    case 'file.rename':
      this.controller.fileMenuController.promptTitle();
      break;
    case 'file.publish.settings':
      this.controller.fileMenuController.view.settingsDialog.openDialog();
      this.controller.fileMenuController.view.workspace.invalidate(this.controller.fileMenuController.view);
      break;
    case 'file.publish':
      this.controller.fileMenuController.publish();
      break;
    case 'file.save':
      this.controller.fileMenuController.save(this.controller.fileMenuController.model.file.getUrl());
      break;
    case 'file.open':
      this.controller.fileMenuController.openFile();
      break;
    case 'view.file':
      this.controller.viewMenuController.preview();
      break;
    case 'view.open.fileExplorer':
      this.controller.viewMenuController.view.fileExplorer.openDialog(function(url) {}, function(error) {});
      break;
    case 'view.open.cssEditor':
      this.controller.viewMenuController.openCssEditor();
      break;
    case 'view.open.jsEditor':
      this.controller.viewMenuController.openJsEditor();
      break;
    case 'view.open.editor':
      this.controller.editMenuController.editElement();
      break;
    case 'tools.advanced.activate':
      this.controller.toolMenuController.toggleAdvanced();
      break;
    case 'insert.page':
      this.controller.insertMenuController.createPage();
      break;
    case 'insert.text':
      this.controller.insertMenuController.addElement(silex.model.Element.TYPE_TEXT);
      break;
    case 'insert.html':
      this.controller.insertMenuController.addElement(silex.model.Element.TYPE_HTML);
      break;
    case 'insert.image':
      this.controller.insertMenuController.browseAndAddImage();
      break;
    case 'insert.container':
      this.controller.insertMenuController.addElement(silex.model.Element.TYPE_CONTAINER);
      break;
    case 'edit.delete.selection':
      // delete component
      this.controller.editMenuController.removeSelectedElements();
      break;
    case 'edit.copy.selection':
      this.controller.editMenuController.copySelection();
      break;
    case 'edit.paste.selection':
      this.controller.editMenuController.pasteSelection();
      break;
    case 'edit.undo':
      this.controller.editMenuController.undo();
      break;
    case 'edit.redo':
      this.controller.editMenuController.redo();
      break;
    case 'edit.delete.page':
      this.controller.pageToolController.removePage();
      break;
    case 'edit.rename.page':
      this.controller.pageToolController.renamePage();
      break;
    // Help menu
    case 'help.about':
      window.open(silex.Config.ABOUT_SILEX);
      break;
    case 'help.issues':
      window.open(silex.Config.ISSUES_SILEX);
      break;
    case 'help.downloads.widget':
      window.open(silex.Config.DOWNLOADS_WIDGET_SILEX);
      break;
    case 'help.downloads.template':
      window.open(silex.Config.DOWNLOADS_TEMPLATE_SILEX);
      break;
    case 'help.aboutSilexLabs':
      window.open(silex.Config.ABOUT_SILEX_LABS);
      break;
    case 'help.newsLetter':
      window.open(silex.Config.SUBSCRIBE_SILEX_LABS);
      break;
    case 'help.googlPlus':
      window.open(silex.Config.SOCIAL_GPLUS);
      break;
    case 'help.twitter':
      window.open(silex.Config.SOCIAL_TWITTER);
      break;
    case 'help.facebook':
      window.open(silex.Config.SOCIAL_FB);
      break;
    case 'help.forkMe':
      window.open(silex.Config.FORK_CODE);
      break;
    case 'help.contribute':
      window.open(silex.Config.CONTRIBUTE);
      break;
    case 'help.contributors':
      window.open(silex.Config.CONTRIBUTORS);
      break;
    case 'tools.pixlr.express':
      this.controller.toolMenuController.pixlrExpress();
      break;
    case 'tools.pixlr.edit':
      this.controller.toolMenuController.pixlrEdit();
      break;
    default:
      console.warn('menu type not found', type);
  }
};
