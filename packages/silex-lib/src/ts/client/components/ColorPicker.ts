/**
 * @fileoverview This class is a color picker component used in the properties.
 * It let the user choose a color with an opacity, i.e. color is css
 * rgba(r,g,b,a) or no color at all, i.e. value is `transparent` It uses the
 * browser'scolor picker for the color
 */

import { hexToRgba, rgbaToArray, rgbaToHex } from '../utils/styles'

export class ColorPicker {
  // store for later use
  element: HTMLElement
  cbk: () => void
  color = ''
  isDisabled = true
  isIndeterminate = true

  // init button which shows/hides the palete
  colorInput: HTMLInputElement

  // alpha
  opacityInput: HTMLInputElement

  // transparency
  transparentCheckbox: HTMLInputElement

  /**
   * @param element the container of the component, it is supposed to have this
   *     structure:
   *    .color-edit-container
   *      input.color-edit-text-input(type='number', min='0', max='100')
   *      input.color-edit-color-input(type='color')
   *      input.color-edit-transparent-check(type='checkbox',
   * indeterminate='true')
   */
  constructor(element: HTMLElement, cbk: () => void) {
    this.element = element
    this.cbk = cbk
    this.colorInput = this.element.querySelector('.color-button')
    this.colorInput.onchange = (e) => this.onChange(e)
    this.colorInput.oninput = (e) => this.onChange(e)
    this.opacityInput = this.element.querySelector('.color-opacity-input')
    this.opacityInput.onchange = (e) => this.onChange(e)
    this.opacityInput.oninput = (e) => this.onChange(e)
    this.transparentCheckbox = this.element.querySelector('.color-edit-transparent-check')
    this.transparentCheckbox.onchange = (e) => this.onChange(e)
  }

  setDisabled(isDisabled: boolean) {
    this.isDisabled = isDisabled
    this.redraw()
  }

  setIndeterminate(isIndeterminate: boolean) {
    this.isIndeterminate = isIndeterminate
    this.redraw()
  }

  /**
   * store the new color
   * @param color the css color as an rgba string, i.e. rgba(r,g,b,a),
   *                      or "transparent"
   */
  setColor(color: string) {
    this.color = color
    this.redraw()
  }

  getColor(): string {
    return this.color
  }

  /**
   * get current opacity as a number in the [0, 1] interval
   */
  getOpacity(): number {
    const opacityPercent = parseInt(this.opacityInput.value, 10)
    const opacity = isNaN(opacityPercent) ? 1 : opacityPercent / 100
    return opacity
  }

  onChange(e: Event) {
    // let redraw update the value
    e.preventDefault()
    e.stopPropagation()

    if (!this.transparentCheckbox.checked) {
      const opacity = this.getOpacity()
      const hex = Math.round(opacity * 255).toString(16)
      this.color = hexToRgba(this.colorInput.value + (hex.length === 2 ? '' : '0') + hex)
    } else {
      this.color = 'transparent'
    }

    // notify the owner
    this.cbk()
  }

  redraw() {
    if (this.isIndeterminate) {
      this.transparentCheckbox.indeterminate = true
      this.opacityInput.value = ''
    } else {
      this.transparentCheckbox.indeterminate = false
      if (this.color === 'transparent' || this.color == null || this.color === '') {
        this.transparentCheckbox.checked = true
        this.colorInput.disabled = true
        this.colorInput.style.opacity = '.3'
        this.opacityInput.disabled = true
        this.opacityInput.value = ''
      } else {
        this.transparentCheckbox.checked = false
        this.colorInput.disabled = false
        this.colorInput.style.opacity = '1'

        // this will not accept rgba, only rgb:
        const hex = rgbaToHex(this.color)
        this.colorInput.value = hex.substring(0, hex.length - 2)
        this.opacityInput.disabled = false
        try {
          const arr = rgbaToArray(this.color)
          this.opacityInput.value = (Math.round(arr[3] * 100 / 255)).toString()
        } catch (e) {
          // probably not an rgba color
          console.warn('this color is probably not an rgba color', this.color, e)
          this.opacityInput.value = '100'
        }
      }
    }
    if (this.isDisabled) {
      this.transparentCheckbox.disabled = true
      this.colorInput.disabled = true
      this.colorInput.style.opacity = '.3'
      this.opacityInput.disabled = true
    } else {
      this.transparentCheckbox.disabled = false
    }
  }
}
