/**
 * @fileoverview
 * the Silex menu on the left
 * based on closure menu class
 *
 */

import { Direction, ElementState, ElementType } from '../element-store/types'
import { FileExplorer } from './dialog/FileExplorer'
import {
  INITIAL_ELEMENT_SIZE,
  getCreationDropZone,
  getDropStyle
} from '../element-store/utils'
import { Keyboard, Shortcut } from '../utils/Keyboard'
import { Notification } from './Notification'
import { isDialogVisible, getVisibleDialogs } from '../ui-store/utils'
import { openDialog } from '../ui-store/dispatchers'
import {
  addElement,
  position,
  moveDown,
  moveToBottom,
  moveToTop,
  moveUp,
  removeElements,
  selectBody,
  setImageUrl
} from '../element-store/dispatchers'
import { config } from '../ClientConfig'
import { copySelection, duplicateSelection, pasteClipBoard } from '../copy'
import { createPage, editPage, removePage } from '../page-store/dispatchers'
import { getBody } from '../element-store/filters'
import { getDomElement } from '../element-store/dom'
import { getSite, subscribeSite } from '../site-store/index'
import { getSiteIFrame, getSiteDocument } from './SiteFrame'
import { getUi, subscribeUi, updateUi } from '../ui-store/index'
import { getUiElements } from '../ui-store/UiElements'
import { hasRedo, hasUndo, redo, undo } from '../undo'
import { openCssEditor } from './dialog/CssEditor'
import { openDashboardToLoadAWebsite, openFile, publish, save } from '../file'
import { openHtmlHeadEditor } from './dialog/HtmlEditor'
import { openJsEditor } from './dialog/JsEditor'
import { openSettingsDialog } from './dialog/SettingsDialog'
import { preview, previewResponsize } from '../preview'
import { subscribeElements } from '../element-store/index'
import { subscribePages } from '../page-store/index'

///////////////////
// API for the outside world
const element = getUiElements().menu
const keyboard = new Keyboard(document)
let initDone = false

export function initMenu() {
  if(!initDone) buildUi()
  initDone = true
  subscribeSite(() => redraw())
  subscribePages(() => redraw())
  subscribeElements(() => redraw())
  subscribeUi(() => redraw())

}

const SUB_MENU_CLASSES = [
  'page-tool-visible', 'about-menu-visible', 'file-menu-visible',
  'code-menu-visible', 'add-menu-visible',
]

export function closeAllSubMenu() {
  SUB_MENU_CLASSES.forEach((className) => {
    document.body.classList.remove(className)
  })
}

function toggleSubMenu(classNameToToggle) {
  SUB_MENU_CLASSES.forEach((className) => {
    if (classNameToToggle === className) {
      document.body.classList.toggle(className)
    } else {
      document.body.classList.remove(className)
    }
  })
}

/**
 * open the page pannel
 */
export function showPages() {
  toggleSubMenu('page-tool-visible')
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
  const iconClassName = comp.faIconClass || 'prodotype-icon'
  const baseElementType = comp.baseElement || 'html'
  const el = document.createElement('div')
  el.classList.add('sub-menu-item', 'component-item')
  el.title = `${comp.name}`
  el.setAttribute('data-menu-action', 'insert.' + baseElementType)
  el.setAttribute('data-comp-id', id)
  el.innerHTML = `<span class="icon fa-inverse ${iconClassName}"></span>
  ${comp.name}
  `
  return el
}
/**
 * create the menu with closure API
 * called by the app constructor
 */
function buildUi() {
  // Shortcuts
  config.shortcuts.forEach((shortcut) => {
    keyboard.addShortcut(shortcut, (e) => onMenuEvent(shortcut.id, e))
  })

  // components
  subscribeUi((prevState, nextState) => {
    if(prevState.components !== nextState.components) {
      const list = element.querySelector('.add-menu-container')

      // remove previous buttons
      Array.from(list.querySelectorAll('.component-item,.component-category'))
      .forEach((el) => el.remove())

      // get the new components
      const componentsDef = getUi().components

      // build a list of component categories
      const elements = {}
      for (const id in componentsDef) {
        const comp = componentsDef[id]
        if (comp.isPrivate !== true) {
          if (!elements[comp.category]) {
            elements[comp.category] = [elFromCompDef(comp, id)]
          } else {
            elements[comp.category].push(elFromCompDef(comp, id))
          }
        }
      }

      // create the corresponding dom
      for (const id in elements) {
        // create a label for the category
        const label = document.createElement('div')
        label.classList.add('label', 'component-category')
        label.innerHTML = id
        list.appendChild(label)

        // attach each comp's element
        elements[id].forEach((el) => list.appendChild(el))
      }
    }
  })

  // event handling
  element.onclick = (e) => {
    const action = (e.target as HTMLElement).getAttribute('data-menu-action') ||
    (e.target as HTMLElement).parentElement.getAttribute('data-menu-action')
    const componentId = (e.target as HTMLElement).getAttribute('data-comp-id') ||
    (e.target as HTMLElement).parentElement.getAttribute('data-comp-id')
    onMenuEvent(action, e, componentId)
    if ((e.target as HTMLElement).parentElement &&
    !(e.target as HTMLElement).parentElement.classList.contains('menu-container') &&
    !(e.target as HTMLElement).parentElement.classList.contains('silex-menu')) {
      // not a first level menu => close sub menus
      closeAllSubMenu()
    }
  }
}

/**
 * compute the desired state chages to add an element centered in the container which is in the middle of the screen
 */
export async function addElementCentered(type: ElementType, componentName: string): Promise<[ElementState, ElementState]> {
  if (type === ElementType.SECTION) {
    const [el, updatedParentData] = await addElement({
      type,
      parent: getBody(),
      componentName,
      style: {
        mobile: {},
        desktop: {},
      },
    })

    return [el, updatedParentData]
  } else {
    // get useful metrics
    const stageEl = getSiteIFrame()
    const stageSize = stageEl.getBoundingClientRect()
    const parent = getCreationDropZone(false, stageEl)
    const parentEl = getDomElement(getSiteDocument(), parent)
    const parentSize = parentEl.getBoundingClientRect()

    // get the final style for the element to be centered in the viewport
    const {left, top} = getDropStyle({
      stageSize,
      parentSize,
      elementSize: {
        width: INITIAL_ELEMENT_SIZE,
        height: INITIAL_ELEMENT_SIZE,
      }
    })

    // add the element to the site
    const [el, updatedParentData] = await addElement({
      type,
      parent,
      componentName,
      style: {
        mobile: {},
        desktop: {
          top: top + 'px',
          left: left + 'px',
        },
      },
    })

    return [el, updatedParentData]
  }
}

/**
 * open file explorer, choose an image and add it to the stage
 */
export async function browseAndAddImage(componentName: string) {
  try {
    const fileInfo = await FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
    if (fileInfo) {

      // create the element
      const [imgData] = await addElementCentered(ElementType.IMAGE, componentName)
      // load the image
      setImageUrl(imgData, fileInfo.absPath)
    }
  } catch(error) {
    Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''))
  }
}

/**
 * redraw the menu
 */
function redraw() {
  if (hasUndo()) {
    element.querySelector('.undo').classList.remove('off')
  } else {
    element.querySelector('.undo').classList.add('off')
  }
  if (hasRedo()) {
    element.querySelector('.redo').classList.remove('off')
  } else {
    element.querySelector('.redo').classList.add('off')
  }
}

/**
 * handles click events
 * calls onStatus to notify the controller
 * @param type is the "id" key in the ClientConfig object
 * @param event object which needs to have {altKey: boolean, ctrlKey: boolean, shiftKey: boolean}
 * @param componentName the component type if it is a component
 * @see ClientConfig
 */
function onMenuEvent(type: string, event: Event, componentName?: string) {
  const mouseEvent = event as MouseEvent
  switch (type) {
    case 'show.pages':
      toggleSubMenu('page-tool-visible')
      break
    case 'show.about.menu':
      toggleSubMenu('about-menu-visible')
      break
    case 'show.file.menu':
      toggleSubMenu('file-menu-visible')
      break
    case 'show.code.menu':
      toggleSubMenu('code-menu-visible')
      break
    case 'show.add.menu':
      toggleSubMenu('add-menu-visible')
      break
    case 'file.new':
      openDashboardToLoadAWebsite()
      break
    case 'file.saveas':
      save()
      break
    case 'file.publish.settings':
      openSettingsDialog()
      break
    case 'file.fonts':
      openSettingsDialog(null, 'fonts-pane')
      break
    case 'file.publish':
      publish()
      break
    case 'file.save':
      save(getSite().file)
      break
    case 'file.open':
      openFile()
      break
    case 'view.file':
      preview()
      break
    case 'view.file.responsize':
      previewResponsize()
      break
    case 'view.open.fileExplorer':
      FileExplorer.getInstance().openFile()
      break
    case 'view.open.cssEditor':
      openCssEditor()
      break
    case 'view.open.jsEditor':
      openJsEditor()
      break
    case 'view.open.htmlHeadEditor':
      openHtmlHeadEditor()
      break
    case 'tools.mobile.mode': {
      const ui = getUi()
      updateUi({
        ...ui,
        mobileEditor: !ui.mobileEditor,
      })
      break
    }
    case 'tools.mobile.mode.on':
      updateUi({
        ...getUi(),
        mobileEditor: true,
      })
      break
    case 'tools.mobile.mode.off':
      updateUi({
        ...getUi(),
        mobileEditor: false,
      })
      break
    case 'tools.next.property': {
      const dialogs = getUi().dialogs.filter(d => d.type === 'properties')
      const currentIdx = dialogs.findIndex(d => d.visible)
      const next = dialogs[(currentIdx + 1) % dialogs.length]
      openDialog(next)
      break
    }
    case 'tools.prev.property': {
      const dialogs = getUi().dialogs.filter(d => d.type === 'properties')
      const currentIdx = dialogs.findIndex(d => d.visible)
      const prev = dialogs[(currentIdx - 1 + dialogs.length) % dialogs.length]
      openDialog(prev)
      break
    }
    case 'insert.page':
      createPage()
      break
    case 'insert.text': {
      addElementCentered(ElementType.TEXT, componentName)
      break
    }
    case 'insert.section': {
      addElementCentered(ElementType.SECTION, componentName)
      break
    }
    case 'insert.html': {
      addElementCentered(ElementType.HTML, componentName)
      break
    }
    case 'insert.image': {
      browseAndAddImage(componentName)
      break
    }
    case 'insert.container': {
      addElementCentered(ElementType.CONTAINER, componentName)
      break
    }
    case 'edit.delete.selection':
      removeElements()
      break
    case 'edit.empty.selection':
      // select body
      selectBody()
      break
    case 'edit.copy.selection':
      copySelection()
      break
    case 'edit.paste.selection':
      pasteClipBoard()
      break
    case 'edit.duplicate.selection':
      duplicateSelection()
      break
    case 'edit.undo':
      undo()
      break
    case 'edit.redo':
      redo()
      break
    case 'edit.position.left':
      position(Direction.LEFT, mouseEvent)
      break
    case 'edit.position.right':
      position(Direction.RIGHT, mouseEvent)
      break
    case 'edit.position.up':
      position(Direction.UP, mouseEvent)
      break
    case 'edit.position.down':
      position(Direction.DOWN, mouseEvent)
      break
    case 'edit.move.up':
      moveUp()
      break
    case 'edit.move.down':
      moveDown()
      break
    case 'edit.move.to.top':
      moveToTop()
      break
    case 'edit.move.to.bottom':
      moveToBottom()
      break
    case 'edit.delete.page':
      removePage()
      break
    case 'edit.rename.page':
      editPage()
      break
    // Help menu
    case 'help.wiki':
      window.open(config.WIKI_SILEX)
      break
    case 'help.crowdfunding':
      window.open(config.CROWD_FUNDING)
      break
    case 'help.issues':
      window.open(config.ISSUES_SILEX)
      break
    case 'help.downloads.widget':
      window.open(config.DOWNLOADS_WIDGET_SILEX)
      break
    case 'help.downloads.template':
      window.open(config.DOWNLOADS_TEMPLATE_SILEX)
      break
    case 'help.aboutSilexLabs':
      window.open(config.ABOUT_SILEX_LABS)
      break
    case 'help.newsLetter':
      window.open(config.SUBSCRIBE_SILEX_LABS)
      break
    case 'help.diaspora':
      window.open(config.SOCIAL_DIASPORA)
      break
    case 'help.twitter':
      window.open(config.SOCIAL_TWITTER)
      break
    case 'help.facebook':
      window.open(config.SOCIAL_FB)
      break
    case 'help.forkMe':
      window.open(config.FORK_CODE)
      break
    case 'help.contribute':
      window.open(config.CONTRIBUTE)
      break
    default:
      console.warn('menu type not found', type)
  }
}
