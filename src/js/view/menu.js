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
 * the Silex menu on the left
 * TODO: clean up and remove the old google closure menu
 * based on closure menu class
 *
 */


goog.provide('silex.view.Menu');
//goog.require('goog.ui.Tooltip');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyHandler');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.menuBar');
goog.require('silex.Config');
goog.require('silex.utils.Keyboard');
goog.require('silex.utils.MenuShortcut');



/**
 * @constructor
 * @param {Element} element   container to render the UI
 * @param  {!silex.types.Model} model  model class which holds
 *                                  the model instances - views use it for read operation only
 * @param  {!silex.types.Controller} controller  structure which holds
 *                                  the controller instances
 */
silex.view.Menu = function(element, model, controller) {
  // store references
  /**
   * @type {Element}
   */
  this.element = element;
  /**
   * @type {!silex.types.Model}
   */
  this.model = model;
  /**
   * @type {!silex.types.Controller}
   */
  this.controller = controller;
};

/**
 * Get the menu container
 * @static
 * @type {string}
 */
silex.view.Menu.CLASS_NAME='menu-container';

/**
 * reference to the menu class of the closure library
 */
silex.view.Menu.prototype.menu = null;


/**
 * create the menu with closure API
 * called by the app constructor
 */
silex.view.Menu.prototype.buildUi = function() {

  this.menu = goog.ui.menuBar.create();

  // shortcut handler
  const keyboard = new silex.utils.Keyboard(document);

  // create the menu items
  silex.Config.menu.names.forEach((itemData, i) => {
    // Create the drop down menu with a few suboptions.
    var menu = new goog.ui.Menu();
    silex.Config.menu.options[i].forEach(itemOption => {
      this.addToMenu(itemOption, menu);
      if(itemOption && itemOption.key) {
        keyboard.addShortcut(itemOption, e => this.onMenuEvent(itemOption.id));
      }
    });

    // Create a button inside menubar.
    var btn = new goog.ui.MenuButton(itemData.label, menu);
    btn.addClassName(itemData.className);
    btn.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
    this.menu.addChild(btn, true);
  });

  function elFromCompDef(comp, id) {
    // build the dom elements for each comp by category
    const iconClassName = comp.faIconClass || 'prodotype-icon';
    const baseElementType = comp.baseElement || 'html';
    const el = document.createElement('div');
    el.classList.add('sub-menu-item');
    el.title = `${comp.name}`;
    el.setAttribute('data-menu-action', 'insert.' + baseElementType);
    el.setAttribute('data-comp-id', id);
    el.innerHTML = `
      <span class="icon fa-inverse ${iconClassName}"></span>
      ${comp.name}
    `;
    return el;
  }
  // components
  this.model.component.ready(() => {
    // **
    const list = this.element.querySelector('.add-menu-container');
    const componentsDef = this.model.component.getComponentsDef(Component.COMPONENT_TYPE);
    // build a list of component categories
    const elements = {};
    for(let id in componentsDef) {
      const comp = componentsDef[id];
      if(comp.isPrivate !== true) {
        if(!elements[comp.category]) elements[comp.category] = [elFromCompDef(comp, id)];
        else elements[comp.category].push(elFromCompDef(comp, id));
      }
    }
    for(let id in elements) {
      // create a label for the category
      const label = document.createElement('div');
      label.classList.add('label');
      label.innerHTML = id;
      list.appendChild(label);
      // attach each comp's element
      elements[id].forEach(el => list.appendChild(el));
    }
  });
  // event handling
  this.element.onclick = e => {
    const action = e.target.getAttribute('data-menu-action') || e.target.parentNode.getAttribute('data-menu-action');
    const componentId = e.target.getAttribute('data-comp-id') || e.target.parentNode.getAttribute('data-comp-id');
    this.onMenuEvent(action, componentId);
    if(e.target.parentNode && !e.target.parentNode.classList.contains('menu-container')) {
      // not a first level menu => close sub menus
      this.closeAllSubMenu();
    }
  };
};


/**
 * add an item to the menu
 * @param {silex.utils.MenuShortcut} itemData menu item as defined in config.js
 * @param {goog.ui.Menu} menu
 */
silex.view.Menu.prototype.addToMenu = function(itemData, menu) {
  var item;
  if (itemData) {
    // create the menu item
    var label = itemData.label;
    var id = itemData.id;
    item = new goog.ui.MenuItem(label);
    item.setId(id);
    item.addClassName(itemData.className);
  }
};


/**
 * redraw the menu
 * @param   {Array.<Element>} selectedElements the elements currently selected
 * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
 * @param   {string}  currentPageName   the name of the current page
 */
silex.view.Menu.prototype.redraw = function(selectedElements, pageNames, currentPageName) {
};


silex.view.Menu.SUB_MENU_CLASSES = ['page-tool-visible', 'about-menu-visible', 'file-menu-visible', 'code-menu-visible', 'add-menu-visible'];
silex.view.Menu.prototype.closeAllSubMenu = function() {
  silex.view.Menu.SUB_MENU_CLASSES.forEach(className => {
    document.body.classList.remove(className);
  });
};


silex.view.Menu.prototype.toggleSubMenu = function(classNameToToggle) {
  silex.view.Menu.SUB_MENU_CLASSES.forEach(className => {
    if(classNameToToggle === className) {
      document.body.classList.toggle(className);
    }
    else {
      document.body.classList.remove(className);
    }
  });
}


/**
 * handles click events
 * calls onStatus to notify the controller
 * @param {string} type
 * @param {?string=} opt_componentName the component type if it is a component
 */
silex.view.Menu.prototype.onMenuEvent = function(type, opt_componentName) {
  let added = null;
  switch (type) {
    case 'show.pages':
      this.toggleSubMenu('page-tool-visible');
      break;
    case 'show.about.menu':
      this.toggleSubMenu('about-menu-visible');
      break;
    case 'show.file.menu':
      this.toggleSubMenu('file-menu-visible');
      break;
    case 'show.code.menu':
      this.toggleSubMenu('code-menu-visible');
      break;
    case 'show.add.menu':
      this.toggleSubMenu('add-menu-visible');
      break;
    case 'file.new':
      this.controller.fileMenuController.newFile();
      break;
    case 'file.saveas':
      this.controller.fileMenuController.save();
      break;
    case 'file.publish.settings':
      this.controller.fileMenuController.view.settingsDialog.open();
      this.controller.fileMenuController.view.workspace.redraw(this.controller.fileMenuController.view);
      break;
    case 'file.publish':
      this.controller.fileMenuController.publish();
      break;
    case 'file.save':
      this.controller.fileMenuController.save(this.controller.fileMenuController.model.file.getFileInfo());
      break;
    case 'file.open':
      this.controller.fileMenuController.openFile();
      break;
    case 'view.file':
      this.controller.viewMenuController.preview();
      break;
    case 'view.file.responsize':
      this.controller.viewMenuController.previewResponsize();
      break;
    case 'view.open.fileExplorer':
      this.controller.viewMenuController.view.fileExplorer.openFile();
      break;
    case 'view.open.cssEditor':
      this.controller.viewMenuController.openCssEditor();
      break;
    case 'view.open.jsEditor':
      this.controller.viewMenuController.openJsEditor();
      break;
    case 'view.open.htmlHeadEditor':
      this.controller.viewMenuController.openHtmlHeadEditor();
      break;
    case 'tools.advanced.activate':
      this.controller.toolMenuController.toggleAdvanced();
      break;
    case 'tools.mobile.mode':
      this.controller.toolMenuController.toggleMobileMode();
      break;
    case 'tools.mobile.mode.on':
      this.controller.toolMenuController.setMobileMode(true);
      break;
    case 'tools.mobile.mode.off':
      this.controller.toolMenuController.setMobileMode(false);
      break;
    case 'insert.page':
      this.controller.insertMenuController.createPage();
      break;
    case 'insert.text':
      added = this.controller.insertMenuController.addElement(silex.model.Element.TYPE_TEXT, opt_componentName);
      break;
    case 'insert.section':
      added = this.controller.insertMenuController.addElement(silex.model.Element.TYPE_SECTION, opt_componentName);
      break;
    case 'insert.html':
      added = this.controller.insertMenuController.addElement(silex.model.Element.TYPE_HTML, opt_componentName);
      break;
    case 'insert.image':
      // FIXME: add opt_componentName param to browseAndAddImage
      this.controller.insertMenuController.browseAndAddImage();
      break;
    case 'insert.container':
      added = this.controller.insertMenuController.addElement(silex.model.Element.TYPE_CONTAINER, opt_componentName);
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
    case 'edit.move.up':
      this.controller.editMenuController.moveUp();
      break;
    case 'edit.move.down':
      this.controller.editMenuController.moveDown();
      break;
    case 'edit.move.to.top':
      this.controller.editMenuController.moveToTop();
      break;
    case 'edit.move.to.bottom':
      this.controller.editMenuController.moveToBottom();
      break;
    case 'edit.delete.page':
      this.controller.pageToolController.removePage();
      break;
    case 'edit.rename.page':
      this.controller.pageToolController.renamePage();
      break;
    // Help menu
    case 'help.wiki':
      window.open(silex.Config.WIKI_SILEX);
      break;
    case 'help.crowdfunding':
      window.open(silex.Config.CROWD_FUNDING);
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
    case 'help.diaspora':
      window.open(silex.Config.SOCIAL_DIASPORA);
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
    // case 'tools.pixlr.express':
    //   this.controller.toolMenuController.pixlrExpress();
    //   break;
    // case 'tools.pixlr.edit':
    //   this.controller.toolMenuController.pixlrEdit();
    //   break;
    default:
      console.warn('menu type not found', type);
  }
};
