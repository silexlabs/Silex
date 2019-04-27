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
* based on closure menu class
*
*/

import { Config } from '../ClientConfig';
import { Constants } from '../../Constants';
import { Controller, Model } from '../types';
import { Keyboard } from '../utils/Keyboard';


/**
* @param element   container to render the UI
* @param model  model class which holds
 * the model instances - views use it for read
* operation only
* @param controller  structure which holds
*                                  the controller instances
*/
export class Menu {
  static SUB_MENU_CLASSES = [
    'page-tool-visible', 'about-menu-visible', 'file-menu-visible',
    'code-menu-visible', 'add-menu-visible'
  ];


  constructor(public element: HTMLElement, public model: Model, public controller: Controller) {}

  elFromCompDef(comp, id) {
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
  /**
  * create the menu with closure API
  * called by the app constructor
  */
  buildUi() {
    const keyboard = new Keyboard(document);
    // Shortcuts
    Config.shortcuts.forEach((shortcut) => {
      keyboard.addShortcut(shortcut, (e) => this.onMenuEvent(shortcut.id));
    });

    // components
    this.model.component.ready(() => {
      // **
      const list = this.element.querySelector('.add-menu-container');
      const componentsDef = this.model.component.getComponentsDef(Constants.COMPONENT_TYPE);

      // build a list of component categories
      const elements = {};
      for (let id in componentsDef) {
        const comp = componentsDef[id];
        if (comp.isPrivate !== true) {
          if (!elements[comp.category]) {
            elements[comp.category] = [this.elFromCompDef(comp, id)];
          } else {
            elements[comp.category].push(this.elFromCompDef(comp, id));
          }
        }
      }
      for (let id in elements) {
        // create a label for the category
        const label = document.createElement('div');
        label.classList.add('label');
        label.innerHTML = id;
        list.appendChild(label);

        // attach each comp's element
        elements[id].forEach((el) => list.appendChild(el));
      }
    });

    // event handling
    this.element.onclick = (e) => {
      const action = (e.target as HTMLElement).getAttribute('data-menu-action') ||
      (e.target as HTMLElement).parentElement.getAttribute('data-menu-action');
      const componentId = (e.target as HTMLElement).getAttribute('data-comp-id') ||
      (e.target as HTMLElement).parentElement.getAttribute('data-comp-id');
      this.onMenuEvent(action, componentId);
      if ((e.target as HTMLElement).parentElement &&
      !(e.target as HTMLElement).parentElement.classList.contains('menu-container') &&
      !(e.target as HTMLElement).parentElement.classList.contains('silex-menu')) {
        // not a first level menu => close sub menus
        this.closeAllSubMenu();
      }
    };
  }

  /**
  * redraw the menu
  * @param selectedElements the elements currently selected
  * @param pageNames   the names of the pages which appear in the current HTML
  *     file
  * @param  currentPageName   the name of the current page
  */
  redraw(selectedElements: HTMLElement[], pageNames: string[], currentPageName: string) {}

  closeAllSubMenu() {
    Menu.SUB_MENU_CLASSES.forEach((className) => {
      document.body.classList.remove(className);
    });
  }

  toggleSubMenu(classNameToToggle) {
    Menu.SUB_MENU_CLASSES.forEach((className) => {
      if (classNameToToggle === className) {
        document.body.classList.toggle(className);
      } else {
        document.body.classList.remove(className);
      }
    });
  }

  /**
  * handles click events
  * calls onStatus to notify the controller
  * @param opt_componentName the component type if it is a component
  * TODO: use redux for this
  */
  onMenuEvent(type: string, opt_componentName?: string) {
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
        this.controller.fileMenuController.view.workspace.redraw(
        this.controller.fileMenuController.view);
        break;
      case 'file.fonts':
        this.controller.fileMenuController.view.settingsDialog.open(
        null, 'fonts-pane');
        this.controller.fileMenuController.view.workspace.redraw(
        this.controller.fileMenuController.view);
        break;
      case 'file.publish':
        this.controller.fileMenuController.publish();
        break;
      case 'file.save':
        this.controller.fileMenuController.save(
        this.controller.fileMenuController.model.file.getFileInfo());
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
        added = this.controller.insertMenuController.addElement(
        Constants.TYPE_TEXT, opt_componentName);
        break;
      case 'insert.section':
        added = this.controller.insertMenuController.addElement(
        Constants.TYPE_SECTION, opt_componentName);
        break;
      case 'insert.html':
        added = this.controller.insertMenuController.addElement(
        Constants.TYPE_HTML, opt_componentName);
        break;
      case 'insert.image':
      // FIXME: add opt_componentName param to browseAndAddImage
        this.controller.insertMenuController.browseAndAddImage();
        break;
      case 'insert.container':
        added = this.controller.insertMenuController.addElement(
        Constants.TYPE_CONTAINER, opt_componentName);
        break;
      case 'edit.delete.selection':
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
        window.open(Config.WIKI_SILEX);
        break;
      case 'help.crowdfunding':
        window.open(Config.CROWD_FUNDING);
        break;
      case 'help.issues':
        window.open(Config.ISSUES_SILEX);
        break;
      case 'help.downloads.widget':
        window.open(Config.DOWNLOADS_WIDGET_SILEX);
        break;
      case 'help.downloads.template':
        window.open(Config.DOWNLOADS_TEMPLATE_SILEX);
        break;
      case 'help.aboutSilexLabs':
        window.open(Config.ABOUT_SILEX_LABS);
        break;
      case 'help.newsLetter':
        window.open(Config.SUBSCRIBE_SILEX_LABS);
        break;
      case 'help.diaspora':
        window.open(Config.SOCIAL_DIASPORA);
        break;
      case 'help.twitter':
        window.open(Config.SOCIAL_TWITTER);
        break;
      case 'help.facebook':
        window.open(Config.SOCIAL_FB);
        break;
      case 'help.forkMe':
        window.open(Config.FORK_CODE);
        break;
      case 'help.contribute':
        window.open(Config.CONTRIBUTE);
        break;
        default:
        console.warn('menu type not found', type);
    }
  }
}
