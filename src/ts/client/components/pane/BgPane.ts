/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the background params
 *
 */
import { ColorPicker } from '../ColorPicker'
import { ElementState } from '../../element-store/types'
import { FileExplorer } from '../dialog/FileExplorer'
import { PaneBase } from './PaneBase'
import { Notification } from '../Notification'
import { Url } from '../../utils/Url'
import { addToMobileOrDesktopStyle } from '../../utils/styles'
import { getBody, getSelectedElements } from '../../element-store/filters'
import { subscribeUi } from '../../ui-store/index'
import {
  getElements,
  subscribeElements,
  updateElements
} from '../../element-store/index'
import { getUi } from '../../ui-store/index'
import { isDialogVisible } from '../../ui-store/utils'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class BgPane extends PaneBase {
  colorPicker: ColorPicker

  // bg image buttons
  bgSelectBgImage: HTMLElement
  bgClearBgImage: HTMLElement

  // bg image properties
  attachmentComboBox: HTMLSelectElement
  vPositionComboBox: HTMLSelectElement
  hPositionComboBox: HTMLSelectElement
  repeatComboBox: HTMLSelectElement
  sizeComboBox: HTMLSelectElement

  constructor(element: HTMLElement) {
    super(element)

    // init BG color
    this.buildBgColor()

    // init bg image
    this.buildBgImage()

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  /**
   * build the UI
   */
  buildBgColor() {
    this.colorPicker = new ColorPicker(this.element.querySelector('.color-edit-container'), () => this.onColorChanged())
  }

  /**
   * build the UI
   */
  buildBgImage() {
    this.bgSelectBgImage = this.element.querySelector('.bg-image-button')
    this.bgClearBgImage = this.element.querySelector('.clear-bg-image-button')

    // event user wants to update the bg image
    this.bgSelectBgImage.addEventListener('click', () => this.onSelectImageButton(), false)

    // event user wants to remove the bg image
    this.bgClearBgImage.addEventListener('click', () => this.onClearImageButton(), false)

    // bg image properties
    this.attachmentComboBox = this.initComboBox('.bg-attachment-combo-box', (event: Event) => {
      this.styleChanged('background-attachment', (event.target as HTMLInputElement).value)
    })

    this.vPositionComboBox = this.initComboBox('.bg-position-v-combo-box', (event: Event) => {
      const hPosition = this.hPositionComboBox.value
      const vPosition = this.vPositionComboBox.value
      this.styleChanged('background-position', vPosition + ' ' + hPosition)
    })

    this.hPositionComboBox = this.initComboBox('.bg-position-h-combo-box', (event: Event) => {
      const hPosition = this.hPositionComboBox.value
      const vPosition = this.vPositionComboBox.value
      this.styleChanged('background-position', vPosition + ' ' + hPosition)
    })

    this.repeatComboBox = this.initComboBox('.bg-repeat-combo-box', (event: Event) => {
      this.styleChanged('background-repeat', (event.target as HTMLInputElement).value)
    })

    this.sizeComboBox = this.initComboBox('.bg-size-combo-box', (event: Event) => {
      this.styleChanged('background-size', (event.target as HTMLInputElement).value)
    })
  }

  /**
   * redraw the properties
   * @param states the elements currently selected
   */
  redraw(selectElements: ElementState[]) {
    super.redraw(selectElements)

    if (isDialogVisible('design', 'properties')) {
      this.element.style.display = ''

      const mobileOrDesktop = getUi().mobileEditor ? 'mobile' : 'desktop'

      // BG color
      if (selectElements.length > 0) {
        this.colorPicker.setDisabled(false)

        const color = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-color'] || '')

        // indeterminate state
        this.colorPicker.setIndeterminate(color === null)

        // display color
        if (color != null ) {
          this.colorPicker.setColor(color)
        }
      } else {
        this.colorPicker.setDisabled(true)
      }

      // BG image
      const enableBgComponents = (enable) => {
        if (enable) {
          this.bgClearBgImage.classList.remove('disabled')
        } else {
          this.bgClearBgImage.classList.add('disabled')
        }
        this.attachmentComboBox.disabled = !enable
        this.vPositionComboBox.disabled = !enable
        this.hPositionComboBox.disabled = !enable
        this.repeatComboBox.disabled = !enable
        this.sizeComboBox.disabled = !enable
      }

      // bg image
      const bgImage = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-image'])

      if (bgImage != null  && bgImage !== 'none' && bgImage !== '') {
        enableBgComponents(true)
      } else {
        enableBgComponents(false)
      }

      // bg image attachment
      const bgImageAttachment = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-attachment'])
      if (bgImageAttachment) {
        this.attachmentComboBox.value = bgImageAttachment
      } else {
        this.attachmentComboBox.selectedIndex = 0
      }

      // bg image position
      const bgImagePosition: string = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-position'])
      if (bgImagePosition && bgImagePosition !== '') {
        const hPosition = bgImagePosition.includes('left') ? 'left' : bgImagePosition.includes('right') ? 'right' : bgImagePosition.includes('center') ? 'center' : ''
        const vPosition = bgImagePosition.includes('top') ? 'top' : bgImagePosition.includes('bottom') ? 'bottom' : bgImagePosition.includes('center') ? 'center' : ''

        // update the drop down lists to display the bg image position
        this.vPositionComboBox.value = vPosition
        this.hPositionComboBox.value = hPosition
      } else {
        this.vPositionComboBox.selectedIndex = 0
        this.hPositionComboBox.selectedIndex = 0
      }

      // bg image repeat
      const bgImageRepeat = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-repeat'])

      if (bgImageRepeat) {
        this.repeatComboBox.value = bgImageRepeat
      } else {
        this.repeatComboBox.selectedIndex = 0
      }

      // bg image size
      const bgImageSize = this.getCommonProperty(selectElements, (el) => el.style[mobileOrDesktop]['background-size'])

      if (bgImageSize) {
        this.sizeComboBox.value = bgImageSize
      } else {
        this.sizeComboBox.selectedIndex = 0
      }
    } else {
      this.element.style.display = 'none'
    }
  }

  /**
   * User has selected a color
   */
  onColorChanged() {
    if ((this.colorPicker.getColor() === 'transparent' || this.colorPicker.getOpacity() !== 1) &&
        getSelectedElements().includes(getBody())) {
      // prevent a transparent body
      this.redraw(getSelectedElements())
    } else {
      this.styleChanged('background-color', this.colorPicker.getColor())
    }
  }

  /**
   * User has clicked the select image button
   */
  async onSelectImageButton() {
    try {
      // open the file browser
      const fileInfo = await FileExplorer.getInstance().openFile(FileExplorer.IMAGE_EXTENSIONS)
      if (fileInfo) {
        // update the model
        const element = getElements().find((el) => el.selected)

        // load the image
        updateElements([{
          ...element,
          style: addToMobileOrDesktopStyle(getUi().mobileEditor, element.style, { 'background-image': Url.addUrlKeyword(fileInfo.absPath) }),
        }])
      }
    } catch (error) {
      Notification.notifyError(`Error: I could not load the image. \n${error.message || ''}`)
    }
  }

  /**
   * User has clicked the clear image button
   */
  onClearImageButton() {
    this.styleChanged('background-image', '')
  }
}
