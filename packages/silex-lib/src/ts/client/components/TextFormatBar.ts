

import { ElementState, LinkData } from '../element-store/types'
import { FileExplorer } from '../components/dialog/FileExplorer'
import { LINK_ATTRIBUTES, openLinkDialog } from './dialog/LinkDialog'
import { SilexNotification } from './Notification'
import {
  getContentNode,
  getDomElement,
  getInnerHtml
} from '../element-store/dom'
import { getSelectedElements } from '../element-store/filters'
import { getSiteDocument, getSiteIFrame, getSiteWindow } from './SiteFrame'
import { getUiElements } from '../ui-store/UiElements'
import { keyboardAttach, keyboardAddShortcut } from './Menu'
import { resetFocus } from './ModalDialog'
import { setEditMode } from './StageWrapper'
import { updateElements } from '../element-store/index'
import { wysihtml, WysiHtmlEditor } from '../externs'

/**
 * @fileoverview
 *   This class handle a div positioned on top of the selected text in a text
 * box It uses the wysihtml library to change text format
 */

const MENU_WIDTH = 35
const CONTEXT_MENU_HEIGHT = 35

///////////////////
// API for the outside world
let instance: TextFormatBar
function initTextFormatBar() {
  instance = instance || new TextFormatBar(getUiElements().textFormatBar)
  return instance
}
export function openTextFormatBar() {
  initTextFormatBar()
  return instance.startEditing(FileExplorer.getInstance())
}

/**
 * TODO: make this only methods and write tests
 */
export class TextFormatBar {

  // store the params
  currentTextBox: ElementState = null
  wysihtmlEditor: WysiHtmlEditor = null
  toolbar: HTMLElement

  // for event remove events, this is reset on stop edit
  private onStopEditCbks: (() => void)[] = []

  /**
   *
   * @param element   container to render the UI
   * @param model  model class which holds
   * the model instances - views use it for
   * read operation only
   * @param controller  structure which holds
   * the controller instances
   */
  constructor(protected element: HTMLElement) {
    this.toolbar = this.element.querySelector('#wysihtml5-toolbar')
  }

  /**
   * get the link of selected text in text editor
   * this uses a hidden text field in the text format bar, which has a value set
   * by wysihtml
   */
  getLink(): LinkData {
    const isLink = this.element.querySelector('.create-link').classList.contains('wysihtml-command-active')
    if (isLink) {
      return LINK_ATTRIBUTES.reduce((acc, attr) => {
        const el = this.element.querySelector('.get-' + attr) as HTMLInputElement
        if (!el) {
          console.error('could not get data from link editor for attribute', attr)
        } else {
          acc[attr] = el.value
        }
        return acc
      }, {})
    }
    return null
  }

  onScroll(e) {
    this.attachToTextBox(getDomElement(getSiteDocument(), this.currentTextBox), this.element)
  }

  attachToTextBox(textBox, toolbar) {
    const pos = textBox.getBoundingClientRect()
    const stageSize = getSiteIFrame().getBoundingClientRect()
    const theoricalBottom = stageSize.height + stageSize.top - pos.top
    const bottom = Math.max(theoricalBottom - pos.height + CONTEXT_MENU_HEIGHT, Math.min(stageSize.height - 20, theoricalBottom))
    const left = pos.left + MENU_WIDTH
    toolbar.style.bottom = bottom + 'px'
    toolbar.style.left = left + 'px'
  }

  /**
   * stop edit, destroy wysihtml object and reset everything
   */
  stopEditing() {
    setEditMode(false)

    if (this.wysihtmlEditor) {

      // remove event listeners
      this.onStopEditCbks.forEach((cbk) => cbk())
      this.onStopEditCbks = [];

      // remove and put back the whole UI
      // this is the way to go with wysihtml
      // @see https://github.com/Voog/wysihtml/issues/109#issuecomment-198350743
      (this.element.querySelector('.image-details') as HTMLElement).style.display = 'none'
      this.wysihtmlEditor.focus(true)
      this.wysihtmlEditor.destroy()
      this.wysihtmlEditor = null
      const parent = this.toolbar.parentElement
      const clone = this.toolbar.cloneNode(true) as HTMLElement
      Array.from(clone.querySelectorAll('.wysihtml-command-active'))
      .forEach((el: HTMLElement) => el.classList.remove('wysihtml-command-active'))
      parent.insertBefore(clone, this.toolbar)
      parent.removeChild(this.toolbar)
      this.toolbar = clone

      // reset focus
      resetFocus()

      // use array acces for getSelection as a workaround for google closure
      // warning 'Property getSelection never defined on Document' cleanup
      const currentTextBoxEl = getDomElement(getSiteDocument(), this.currentTextBox)

      const editable = getContentNode(currentTextBoxEl)
      editable.removeAttribute('contenteditable')
      editable.classList.remove('wysihtml-sandbox', 'wysihtml-editor')
      currentTextBoxEl.classList.remove('text-editor-focus')
      currentTextBoxEl.removeAttribute('data-allow-silex-shortcuts')
      currentTextBoxEl.onclick = null
      updateElements([{
        ...this.currentTextBox,
        innerHtml: getInnerHtml(currentTextBoxEl),
      }])
      this.currentTextBox = null
    }
    this.element.classList.remove('text-editor-editing')
  }

  startEditing(fileExplorer: FileExplorer, bookmark = null, cbk = null) {
    const selectedElements = getSelectedElements()
    // edit the style of the selection
    if (selectedElements.length === 1) {
      const newTextBox = selectedElements[0]
      if (newTextBox !== this.currentTextBox) {
        this.stopEditing()
        setEditMode(true)

        this.currentTextBox = newTextBox
        const currentTextBoxEl = getDomElement(getSiteDocument(), this.currentTextBox)

        // currentTextBoxEl.insertBefore(this.element,
        // currentTextBoxEl.firstChild);
        this.attachToTextBox(currentTextBoxEl, this.element)
        const editable = getContentNode(currentTextBoxEl)
        const options = {
          toolbar: this.toolbar,
          handleTables: false,
          useLineBreaks: false,
          classes: {
            'wysiwyg-float-left': 1,
            // this doesnt work for some reason
            'wysiwyg-float-right': 1,
          },
          // this doesnt work for some reason
          parserRules: {
            tags: {
              b: {},
              strong: {rename_tag: 'b'},
              i: {},
              br: {},
              p: {},
              h1: {},
              h2: {},
              h3: {},
              h4: {},
              h5: {},
              h6: {},
              ul: {},
              u: {},
              ol: {},
              li: {},
              a: {
                check_attributes: {
                  href: 'href',
                  download: 'href',
                  target: 'any',
                  title: 'any',
                  type: 'any',
                },
              },
              img: {
                check_attributes: {
                  src: 'src',
                  alt: 'alt',
                  title: 'any',
                  width: 'any',
                  height: 'any',
                  class: 'any',
                },
              },
              // this should not be necessary, workaround
              font: {rename_tag: 'span', add_class: {size: 'size_font'}},
            },
          },
        }
        this.wysihtmlEditor = new wysihtml.Editor(editable, options)

        // CSS classes
        currentTextBoxEl.classList.add('text-editor-focus')
        currentTextBoxEl.setAttribute('data-allow-silex-shortcuts', 'true')
        this.element.classList.add('text-editor-editing')

        // handle the focus
        const doc = getSiteDocument()
        const win = getSiteWindow()
        const onKeyScrollBinded = (e) => this.onScroll(e)
        const onBlurBinded = () => this.onBlur(currentTextBoxEl)

        // events and shortcuts
        this.onStopEditCbks.push(
          keyboardAttach(doc),
          keyboardAddShortcut({
            label: 'Edit link',
            key: 'k',
            ctrlKey: true,
          }, (e) => this.openLinkEditor(e)),
          keyboardAddShortcut({
            label: 'Exit text editor',
            key: 'Escape',
          }, (e) => this.stopEditing()),
          () => win.removeEventListener('scroll', onKeyScrollBinded),
          () => currentTextBoxEl.removeEventListener('blur', onBlurBinded),
          () => this.wysihtmlEditor.off('blur'),
          () => this.wysihtmlEditor.off('load'),
        )
        win.addEventListener('scroll', onKeyScrollBinded)
        currentTextBoxEl.addEventListener('blur', onBlurBinded)
        this.wysihtmlEditor.on('blur', (e) => this.onBlur(currentTextBoxEl))
        this.wysihtmlEditor.on('load', () => {
          (this.element.querySelector('.insert-image') as HTMLElement).onclick = (e) => {
            const bookmarkNew = this.wysihtmlEditor.composer.selection.getBookmark()
            fileExplorer.openFile(FileExplorer.IMAGE_EXTENSIONS)
                .then((fileInfo) => {
                  this.startEditing(fileExplorer, bookmarkNew, () => {
                    if (fileInfo) {
                      this.wysihtmlEditor.composer.commands.exec('insertImage', {src: fileInfo.absPath, alt: ''})
                    }
                  })
                })
                .catch((error) => {
                  SilexNotification.notifyError('Error: I did not manage to load the image. \n' + (error.message || ''))
                  this.startEditing(fileExplorer, bookmarkNew)
                })
          }

          // image details UI
          const imageDetails = this.element.querySelector('.image-details') as HTMLElement
          const autoBtn = imageDetails.querySelector('#auto-submit-image') as HTMLElement

          function autoSubmitImage(e) {
            // give time to the value to be updated and validate wysihtml image
            // dialog
            setTimeout(() => {
              autoBtn.click()
              imageDetails.style.display = '';
              (e.target as HTMLElement).focus()
            }, 100)
          }
          (imageDetails.querySelector('.float') as HTMLElement).onchange = (e) => autoSubmitImage(e)
          ;(imageDetails.querySelector('.float') as HTMLElement).onblur = (e) => this.onBlur(currentTextBoxEl)
          ;(imageDetails.querySelector('.src') as HTMLElement).onkeydown = (e) => autoSubmitImage(e)
          ;(imageDetails.querySelector('.alt') as HTMLElement).onkeydown = (e) => autoSubmitImage(e)
          ;(imageDetails.querySelector('.alt') as HTMLElement).onblur = (e) => this.onBlur(currentTextBoxEl)
          ;(this.element.querySelector('.create-link') as HTMLElement).onclick = (e) => this.openLinkEditor(e)

          // loaded
          this.focus(bookmark)
          if (cbk) {
            cbk()
          }
        })
      } else if (cbk) {
        cbk()
      }
    } else {
      console.error('Error, can not edit selection with format pane', selectedElements)
    }
  }

  onBlur(currentTextBoxEl: HTMLElement) {
    // leave time for the onclick events to fire
    // note: events in the toolbar always come after blur + huge dekay
    setTimeout(() => {
      if (!SilexNotification.isActive
        && document.activeElement !== currentTextBoxEl
        && !document.activeElement.classList.contains('keep-text-format-bar-open')) {
        this.stopEditing()
      }
    }, 0)
  }

  // give focus to the editor if it still exists
  focus(bookmark) {
    if (this.wysihtmlEditor) {
      this.wysihtmlEditor.focus(false)
      // move the cursor where it was before
      if (bookmark) {
        this.wysihtmlEditor.composer.selection.setBookmark(bookmark)
      }
    }
  }

  /**
   * open the link editor, which uses SilexNotification
   */
  openLinkEditor(e: Event) {
    const oldLink = this.getLink()
    openLinkDialog({
      data: oldLink,
      cbk: (_options) => {
      // _options is the same as oldLink when the user canceled the link editor
      // therfore it is undefined when the selection is not a link
      // and it will be undefined when the user clicks "remove link"
        if (_options) {
          this.wysihtmlEditor.composer.commands.exec('createLink', _options)
        } else {
          this.wysihtmlEditor.composer.commands.exec('removeLink')
        }
        // give back the focus to the editor
        this.wysihtmlEditor.focus(false) // seems to be needed only when _options is undefined
      },
    })
    // prevent click on the button
    e.preventDefault()
  }
}
