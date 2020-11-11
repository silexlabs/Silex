/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the borders params
 *
 */

import { ColorPicker } from '../ColorPicker'
import { ElementState } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { addToMobileOrDesktopStyle } from '../../utils/styles'
import { getSelectedElements } from '../../element-store/filters'
import { getUi } from '../../ui-store/index'
import { subscribeElements, updateElements } from '../../element-store/index'
import { subscribeUi } from '../../ui-store/index'
import { isDialogVisible } from '../../ui-store/utils'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class BorderPane extends PaneBase {
  /**
   * input element
   */
  borderWidthInput: HTMLInputElement

  /**
   * input element
   */
  borderStyleComboBox: HTMLSelectElement

  /**
   * input element
   */
  borderRadiusInput: HTMLInputElement

  /**
   * color picker for border color
   */
  colorPicker: ColorPicker

  /**
   * input element
   */
  borderPlacementCheckBoxes: HTMLInputElement[] = null

  /**
   * input element
   */
  cornerPlacementCheckBoxes: HTMLInputElement[] = null

  constructor(element: HTMLElement) {

    super(element)

    this.colorPicker = new ColorPicker(this.element.querySelector('.color-edit-container'), () => this.onBorderColorChanged())
    this.borderPlacementCheckBoxes = [
      '.border-placement-container .top',
      '.border-placement-container .right',
      '.border-placement-container .bottom',
      '.border-placement-container .left',
    ].map((selector) => this.initCheckBox(selector, (e) => this.onBorderWidthChanged()))

    this.cornerPlacementCheckBoxes = [
      '.border-radius-container .top-left',
      '.border-radius-container .top-right',
      '.border-radius-container .bottom-right',
      '.border-radius-container .bottom-left',
    ].map((selector) => this.initCheckBox(selector, () => this.onBorderCornerChanged()))

    this.borderWidthInput = this.initInput('.border-width-input', (e) => this.onBorderWidthChanged())
    this.borderStyleComboBox = this.initComboBox('.border-type-combo-box', (e) => this.onBorderStyleChanged())
    this.borderRadiusInput = this.initInput('.corner-radius-input', (e) => this.onBorderCornerChanged())

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  /**
   * redraw the properties
   */
  redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    if (isDialogVisible('design', 'properties')) {
      this.element.style.display = ''

      const isMobile = getUi().mobileEditor ? 'mobile' : 'desktop'

      // border width, this builds a string like "0px 1px 2px 3px"
      // FIXME: should not build a string which is then split in redrawBorderWidth
      const borderWidth = this.getCommonProperty<ElementState, string>(selectedElements, (el) => {
        const w = el.style[isMobile]['border-width']
        if (w && w !== '') {
          return w
        } else {
          return null
        }
      })

      // display width or reset borders if width is null
      if (borderWidth) {
        this.redrawBorderWidth(borderWidth)
        this.redrawBorderColor(selectedElements)
      } else {
        this.resetBorder()
      }

      // border style
      const borderStyle = this.getCommonProperty(selectedElements, (el) => el.style[isMobile]['border-style'])

      if (borderStyle) {
        this.borderStyleComboBox.value = borderStyle
      } else {
        this.borderStyleComboBox.selectedIndex = 0
      }

      // border radius
      const borderRadiusStr = this.getCommonProperty(selectedElements, (el) => el.style[isMobile]['border-radius'])

      if (borderRadiusStr) {
        this.redrawBorderRadius(borderRadiusStr)
      } else {
        this.resetBorderRadius()
      }
    } else {
      this.element.style.display = 'none'
    }
  }

  /**
   * redraw border color UI
   */
  redrawBorderColor(selectedElements: ElementState[]) {
    const isMobile = getUi().mobileEditor ? 'mobile' : 'desktop'

    if (selectedElements.length > 0) {
      this.colorPicker.setDisabled(false)
      const color = this.getCommonProperty(selectedElements, (el) => el.style[isMobile]['border-color'] || 'rgba(0,0,0,1)')

      // indeterminate state
      this.colorPicker.setIndeterminate(color == null)

      // display color
      if (color != null ) {
        this.colorPicker.setColor(color)
      }
    } else {
      this.colorPicker.setDisabled(true)
    }
  }

  /**
   * redraw border radius UI
   */
  redrawBorderRadius(borderWidth) {
    const values = borderWidth.split(' ')

    // get corner radius value, get the first non-zero value
    let val = values[0]
    if (values[1] != null  && val === '0' || val === '0px') {
      val = values[1]
    }
    if (values[2] != null  && val === '0' || val === '0px') {
      val = values[2]
    }
    if (values[3] != null  && val === '0' || val === '0px') {
      val = values[3]
    }

    // remove unit when needed
    if (val != null  && val !== '0' && val !== '0px') {
      this.borderRadiusInput.value = val.substr(0, val.indexOf('px'))

      // corner placement
      let idx
      const len = this.cornerPlacementCheckBoxes.length
      for (idx = 0; idx < len; idx++) {
        const checkBox = this.cornerPlacementCheckBoxes[idx]
        if (values[idx] !== '0' && values[idx] !== '0px') {
          checkBox.checked = true
        } else {
          checkBox.checked = false
        }
      }
    } else {
      this.resetBorderRadius()
    }
  }

  /**
   * redraw border width UI
   */
  redrawBorderWidth(borderWidth) {
    // top, right, bottom, left
    const values = borderWidth.split(' ')

    // get the first non-zero value
    let val = values[0]
    if (values[1] != null  && val === '0' || val === '0px') {
      val = values[1]
    }
    if (values[2] != null  && val === '0' || val === '0px') {
      val = values[2]
    }
    if (values[3] != null  && val === '0' || val === '0px') {
      val = values[3]
    }

    // if there is a non-zero value
    if (val !== '0' && val !== '0px') {
      this.borderWidthInput.value = val.substr(0, val.indexOf('px'))

      // border placement
      const len = this.borderPlacementCheckBoxes.length
      for (let idx = 0; idx < len; idx++) {
        const checkBox = this.borderPlacementCheckBoxes[idx]
        if (values.length > idx && values[idx] !== '0' &&
            values[idx] !== '0px') {
          checkBox.checked = true
        } else {
          checkBox.checked = false
        }
      }
    } else {
      this.resetBorder()
    }
  }

  /**
   * reset UI
   */
  resetBorderRadius() {
    this.borderRadiusInput.value = ''

    // corner placement
    let idx
    const len = this.cornerPlacementCheckBoxes.length
    for (idx = 0; idx < len; idx++) {
      const checkBox = this.cornerPlacementCheckBoxes[idx]
      checkBox.checked = true
    }
  }

  /**
   * reset UI
   */
  resetBorder() {
    this.borderWidthInput.value = ''

    // border placement
    let idx
    const len = this.borderPlacementCheckBoxes.length
    for (idx = 0; idx < len; idx++) {
      const checkBox = this.borderPlacementCheckBoxes[idx]
      checkBox.checked = true
    }

    // border color
    this.colorPicker.setColor('')
    this.colorPicker.setDisabled(true)
  }

  /**
   * property changed
   * callback for number inputs
   */
  onBorderWidthChanged() {
    if (this.borderWidthInput.value && this.borderWidthInput.value !== '' && this.borderWidthInput.value !== '0') {
      // border color
      this.colorPicker.setDisabled(false)
      if (this.colorPicker.getColor() == null || this.colorPicker.getColor() === '') {
        this.colorPicker.setColor('rgba(0,0,0,1)')
      }

      // border placement
      let borderWidthStr = ''
      let idx
      const len = this.borderPlacementCheckBoxes.length
      for (idx = 0; idx < len; idx++) {
        const checkBox = this.borderPlacementCheckBoxes[idx]
        if (checkBox.checked) {
          borderWidthStr += this.borderWidthInput.value + 'px '
        } else {
          borderWidthStr += '0 '
        }
      }

      // reset indeterminate state (because all selected elements will be
      // changed the same value)
      this.colorPicker.setIndeterminate(false)

      const borderStyleStr = this.borderStyleComboBox.value

      updateElements(getSelectedElements()
      .map((el) => {
          return {
            ...el,
            style: addToMobileOrDesktopStyle(getUi().mobileEditor, el.style, {
              'border-width': borderWidthStr,
              'border-style': borderStyleStr,
            }),
          }
        }))
    } else {
      updateElements(getSelectedElements()
      .map((el) => {
        return {
          ...el,
          style: addToMobileOrDesktopStyle(getUi().mobileEditor, el.style, {
            'border-width': '',
            'border-style': '',
          }),
        }
      }))
      this.colorPicker.setDisabled(true)
    }
  }

  /**
   * property changed
   * callback for number inputs
   * border style
   */
  onBorderStyleChanged() {
    this.styleChanged('border-style', this.borderStyleComboBox.value)
  }

  /**
   * property changed
   * callback for number inputs
   */
  onBorderColorChanged() {
    this.styleChanged('border-color', this.colorPicker.getColor())
  }

  /**
   * property changed
   * callback for number inputs
   */
  onBorderCornerChanged() {
    // corner radius
    if (this.borderRadiusInput.value != null  &&
        this.borderRadiusInput.value !== '') {
      // corner placement
      let borderWidthStr = ''
      let idx
      const len = this.cornerPlacementCheckBoxes.length
      for (idx = 0; idx < len; idx++) {
        const checkBox = this.cornerPlacementCheckBoxes[idx]
        if (checkBox.checked) {
          borderWidthStr += this.borderRadiusInput.value + 'px '
        } else {
          borderWidthStr += '0 '
        }
      }
      this.styleChanged('border-radius', borderWidthStr)
    } else {
      this.styleChanged('border-radius', null)
    }
  }
}
