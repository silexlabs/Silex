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

import { Constants } from '../../constants'
import { Config } from '../ClientConfig'
import { DomDirection } from '../ClientTypes'
import { addElement, moveElements, selectBody } from '../element/dispatchers'
import { getSelectedElements } from '../element/filters'
import { updateElements } from '../element/store'
import { ElementType } from '../element/types'
import { getCreationDropZone } from '../element/utils'
import { getUi, updateUi } from '../ui/store'
import { Keyboard, Shortcut } from '../utils/Keyboard'
import { getUiElements } from '../ui/UiElements'
import { prodotypeReady, getComponentsDef } from '../element/component'
import { toggleSubMenu, preview, previewResponsize, openCssEditor, openJsEditor, openHtmlHeadEditor, closeAllSubMenu } from '../api/view'
import { newFile, save, publish, openFile } from '../api/file'
import { openSettingsDialog } from './dialog/SettingsDialog'
import { getSite } from '../site/store'
import { FileExplorer } from './dialog/FileExplorer'
import { browseAndAddImage } from '../api/propoerties'
import { removeElements, moveToBottom, moveUp, moveDown, moveToTop } from '../api/element'
import { copySelection, pasteClipBoard, duplicateSelection } from '../api/copy'
import { removePage, editPage, createPage } from '../api/page'

///////////////////
// API for the outside world
const element = getUiElements().menu
const keyboard = new Keyboard(document);
let initDone = false

export function initMenu() {
  if(!initDone) buildUi()
  initDone = true
}

export function keyboardAttach(doc: HTMLDocument) {
  initMenu()
  return keyboard.attach(doc)
}

export function keyboardAddShortcut(s: Shortcut, cbk: (p1: Event) => void) {
  initMenu()
  return keyboard.addShortcut(s, cbk)
}

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
/**
 * create the menu with closure API
 * called by the app constructor
 */
function buildUi() {
  // Shortcuts
  Config.shortcuts.forEach((shortcut) => {
    keyboard.addShortcut(shortcut, (e) => onMenuEvent(shortcut.id));
  });
  // special case of the section content (move the section/parent with arrow keys)
  keyboard.addShortcut({
    label: 'Move section up',
    key: 'ArrowDown',
  }, (e) => handleSectionContent(DomDirection.UP));
  keyboard.addShortcut({
    label: 'Move section down',
    key: 'ArrowUp',
  }, (e) => handleSectionContent(DomDirection.DOWN));

  // components
  prodotypeReady(() => {
    // **
    const list = element.querySelector('.add-menu-container');
    const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE);

    // build a list of component categories
    const elements = {};
    for (const id in componentsDef) {
      const comp = componentsDef[id];
      if (comp.isPrivate !== true) {
        if (!elements[comp.category]) {
          elements[comp.category] = [elFromCompDef(comp, id)];
        } else {
          elements[comp.category].push(elFromCompDef(comp, id));
        }
      }
    }
    for (const id in elements) {
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
  element.onclick = (e) => {
    const action = (e.target as HTMLElement).getAttribute('data-menu-action') ||
    (e.target as HTMLElement).parentElement.getAttribute('data-menu-action');
    const componentId = (e.target as HTMLElement).getAttribute('data-comp-id') ||
    (e.target as HTMLElement).parentElement.getAttribute('data-comp-id');
    onMenuEvent(action, componentId);
    if ((e.target as HTMLElement).parentElement &&
    !(e.target as HTMLElement).parentElement.classList.contains('menu-container') &&
    !(e.target as HTMLElement).parentElement.classList.contains('silex-menu')) {
      // not a first level menu => close sub menus
      closeAllSubMenu();
    }
  };
}

// /**
//  * redraw the menu
//  * @param selectedElements the elements currently selected
//  * @param pageNames   the names of the pages which appear in the current HTML
//  *     file
//  * @param  currentPageName   the name of the current page
//  */
// function redraw() {
//   if (hasUndo()) {
//     element.querySelector('.undo').classList.remove('off');
//   } else {
//     element.querySelector('.undo').classList.add('off');
//   }
//   if (hasRedo()) {
//     element.querySelector('.redo').classList.remove('off');
//   } else {
//     element.querySelector('.redo').classList.add('off');
//   }
// }

/**
 * move section content's parent with arrow keys
 */
function handleSectionContent(direction: DomDirection) {
  moveElements(getSelectedElements()
    .filter((el) => el.type === ElementType.SECTION), direction)
}

/**
 * handles click events
 * calls onStatus to notify the controller
 * @param opt_componentName the component type if it is a component
 */
function onMenuEvent(type: string, opt_componentName?: string) {
  switch (type) {
    case 'show.pages':
      toggleSubMenu('page-tool-visible');
      break;
    case 'show.about.menu':
      toggleSubMenu('about-menu-visible');
      break;
    case 'show.file.menu':
      toggleSubMenu('file-menu-visible');
      break;
    case 'show.code.menu':
      toggleSubMenu('code-menu-visible');
      break;
    case 'show.add.menu':
      toggleSubMenu('add-menu-visible');
      break;
    case 'file.new':
      newFile();
      break;
    case 'file.saveas':
      save();
      break;
    case 'file.publish.settings':
      openSettingsDialog();
      break;
    case 'file.fonts':
      openSettingsDialog(null, 'fonts-pane');
      break;
    case 'file.publish':
      publish();
      break;
    case 'file.save':
      save(getSite().file);
      break;
    case 'file.open':
      openFile();
      break;
    case 'view.file':
      preview();
      break;
    case 'view.file.responsize':
      previewResponsize();
      break;
    case 'view.open.fileExplorer':
      FileExplorer.getInstance().openFile();
      break;
    case 'view.open.cssEditor':
      openCssEditor();
      break;
    case 'view.open.jsEditor':
      openJsEditor();
      break;
    case 'view.open.htmlHeadEditor':
      openHtmlHeadEditor();
      break;
    case 'tools.mobile.mode':
      const ui = getUi();
      updateUi({
        ...ui,
        mobileEditor: !ui.mobileEditor,
      });
      break;
    case 'tools.mobile.mode.on':
      updateUi({
        ...getUi(),
        mobileEditor: true,
      });
      break;
    case 'tools.mobile.mode.off':
      updateUi({
        ...getUi(),
        mobileEditor: false,
      });
      break;
    case 'insert.page':
      createPage();
      break;
    case 'insert.text': {
      const parent = getCreationDropZone(false, getUiElements().stage);
      addElement(ElementType.TEXT, parent, opt_componentName);
      break;
    }
    case 'insert.section': {
      const parent = getCreationDropZone(true, getUiElements().stage);
      addElement(ElementType.SECTION, parent, opt_componentName);
      break;
    }
    case 'insert.html': {
      const parent = getCreationDropZone(false, getUiElements().stage);
      addElement(ElementType.HTML, parent, opt_componentName);
      break;
    }
    case 'insert.image': {
      const parent = getCreationDropZone(false, getUiElements().stage);
      browseAndAddImage(parent);
      break;
    }
    case 'insert.container': {
      const parent = getCreationDropZone(false, getUiElements().stage);
      addElement(ElementType.CONTAINER, parent, opt_componentName);
      break;
    }
    case 'edit.delete.selection':
      removeElements();
      break;
    case 'edit.empty.selection':
      // empty selection
      updateElements(getSelectedElements().map((el) => ({ from: el, to: { ...el, selected: false }})))
      // select body
      selectBody()
      break;
    case 'edit.copy.selection':
      copySelection();
      break;
    case 'edit.paste.selection':
      pasteClipBoard();
      break;
    case 'edit.duplicate.selection':
      duplicateSelection();
      break;
    // case 'edit.undo':
    //   undo();
    //   break;
    // case 'edit.redo':
    //   redo();
    //   break;
    case 'edit.move.up':
      moveUp();
      break;
    case 'edit.move.down':
      moveDown();
      break;
    case 'edit.move.to.top':
      moveToTop();
      break;
    case 'edit.move.to.bottom':
      moveToBottom();
      break;
    case 'edit.delete.page':
      removePage();
      break;
    case 'edit.rename.page':
      editPage();
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
