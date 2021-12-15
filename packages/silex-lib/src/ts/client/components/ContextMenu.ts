/**
 * @fileoverview
 * the Silex context menu
 *
 */
import { ElementState, ElementType } from '../element-store/types'
import { FileExplorer } from './dialog/FileExplorer'
import { Notification } from './Notification'
import { copySelection, pasteClipBoard, duplicateSelection, hasElementsToPaste } from '../copy'
import { getCurrentPage } from '../page-store/filters'
import { getElements, subscribeElements } from '../element-store/index'
import { getEnableSticky, toggleSticky } from './StageWrapper'
import { getParent } from '../element-store/filters'
import { getSite } from '../site-store/index'
import { getUiElements } from '../ui-store/UiElements'
import { isComponent } from '../element-store/component'
import { isDirty } from '../dirty'
import {
  moveDown,
  moveToBottom,
  moveToTop,
  moveUp,
  removeElements,
  setImageUrl
} from '../element-store/dispatchers'
import { openHtmlEditor } from './dialog/HtmlEditor'
import { openTextFormatBar } from './TextFormatBar'
import { showPages } from './Menu'
import { subscribePages } from '../page-store/index'
import { openDialog } from '../ui-store/dispatchers'
import { getUi, subscribeUi } from '../ui-store/index'

///////////////////
// API for the outside world
export function initContextMenu() {
  return new ContextMenu(getUiElements().contextMenu)
}

/**
 * edit the elements in the selection
 * take its type into account and open the corresponding editor
 */
export function editElement() {
  const element: ElementState = getElements().find((el) => el.selected && el.enableEdit)

  if (element) {
    if (isComponent(element)) {
      const params = getUi().dialogs.find(d => d.id === 'params')
      openDialog(params)
    } else {
      // open the params tab for the components
      // or the editor for the elements
      switch (element.type) {
        case ElementType.TEXT:
          // open the text editor
          openTextFormatBar()
        break
        case ElementType.HTML:
          openHtmlEditor()
          // view.htmlEditor.setSelection([element])
        break
        case ElementType.IMAGE:
          FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
        .then((blob) => {
          if (blob) {
            setImageUrl(element, blob.absPath)
          }
        })
        .catch((error) => {
          Notification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''))
        })
        break
      }
    }
  }
}

class ContextMenu {
  /**
   * hold the element in the context menu which has the current page name
   */
  currentPageElement: HTMLElement

  constructor(public element: HTMLElement) {

    this.currentPageElement = element.querySelector('.current-page')
    this.currentPageElement.onclick = (e) => showPages()

    subscribeElements((oldElements, elements) => this.redraw())
    subscribePages(() => this.redraw())
    subscribeUi(() => this.redraw())

    this.element.querySelector('.delete').addEventListener('click', () => removeElements())
    this.element.querySelector('.edit').addEventListener('click', () => editElement())
    this.element.querySelector('.copy').addEventListener('click', () => copySelection())
    this.element.querySelector('.paste').addEventListener('click', () => pasteClipBoard())
    this.element.querySelector('.duplicate').addEventListener('click', () => duplicateSelection())
    this.element.querySelector('.top').addEventListener('click', () => moveToTop())
    this.element.querySelector('.up').addEventListener('click', () => moveUp())
    this.element.querySelector('.down').addEventListener('click', () => moveDown())
    this.element.querySelector('.bottom').addEventListener('click', () => moveToBottom())
    this.element.querySelector('.sticky-elements').addEventListener('click', (e) => toggleSticky())
  }

  /**
   * the selection has changed
   * called by silex.model.Body
   * @param opt_selectedElements the selected elements
   */
  private redraw() {
    const page = getCurrentPage()
    // update page name
    if (page) {
      const fileInfo = getSite().file
      const changedChar = isDirty() ? '*' : ''
      const fileName = fileInfo && fileInfo.path ? fileInfo.path + changedChar + ' - ' : ''
      this.currentPageElement.innerHTML = `
        ${fileName}
        ${page.displayName}
      `
    }

    // get the selection without the body
    const selectedElements = getElements()
      .filter((el) => el.selected && getParent(el))

    // update menu items according to selection
    if (selectedElements.length === 0) {
      // only body is selected
      this.element.querySelector('.delete').classList.add('off')
      this.element.querySelector('.edit').classList.add('off')
      this.element.querySelector('.copy').classList.add('off')
      this.element.querySelector('.top').classList.add('off')
      this.element.querySelector('.up').classList.add('off')
      this.element.querySelector('.down').classList.add('off')
      this.element.querySelector('.bottom').classList.add('off')
      this.element.querySelector('.duplicate').classList.add('off')
    } else {
      this.element.querySelector('.delete').classList.remove('off')
      this.element.querySelector('.edit').classList.remove('off')
      this.element.querySelector('.copy').classList.remove('off')
      this.element.querySelector('.top').classList.remove('off')
      this.element.querySelector('.up').classList.remove('off')
      this.element.querySelector('.down').classList.remove('off')
      this.element.querySelector('.bottom').classList.remove('off')
      this.element.querySelector('.duplicate').classList.remove('off')
    }
    if (hasElementsToPaste()) {
      this.element.querySelector('.paste').classList.remove('off')
    } else {
      this.element.querySelector('.paste').classList.add('off')
    }
    if (getEnableSticky()) {
      this.element.querySelector('.sticky-elements').classList.remove('off')
    } else {
      this.element.querySelector('.sticky-elements').classList.add('off')
    }
  }
}
