/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */

import { ElementState } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { Toolboxes } from '../../ui-store/types';
import { getBody, getSelectedElements } from '../../element-store/filters'
import { getUi } from '../../ui-store/index'
import { subscribeElements } from '../../element-store/index'
import { subscribeUi } from '../../ui-store/index';

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class GeneralStylePane extends PaneBase {
  /**
   * opacity input
   */
  opacityInput: HTMLInputElement

  constructor(element: HTMLElement) {

    super(element)

    this.opacityInput = this.initInput('.opacity-input', (e) => this.onInputChanged(e))

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  /**
   * User has selected a color
   */
  onInputChanged(event) {
    const val = !!this.opacityInput.value && this.opacityInput.value !== '' ?
      Math.max(0, (Math.min(1, parseFloat(this.opacityInput.value) / 100.0)))
      : null
    this.styleChanged('opacity', val ? val.toString() : null)
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    const { currentToolbox } = getUi()
    if (currentToolbox === Toolboxes.PROPERTIES) {
      this.element.style.display = ''


      const body = getBody()
      const elementsNoBody = selectedElements.filter((el) => el !== body)
      if (elementsNoBody.length > 0) {
        // not stage element only
        this.opacityInput.removeAttribute('disabled')

        // get the opacity
        const opacity = this.getCommonProperty<ElementState, string>(elementsNoBody, (el) => el.style[getUi().mobileEditor ? 'mobile' : 'desktop'].opacity)

        if (opacity === null) {
          this.opacityInput.value = ''
        } else {
          if (opacity === '') {
            this.opacityInput.value = '100'
          } else {
            this.opacityInput.value = Math.round(parseFloat(opacity) * 100).toString()
          }
        }
      } else {
        // stage element only
        this.opacityInput.value = ''
        this.opacityInput.setAttribute('disabled', 'true')
      }
    } else {
      this.element.style.display = 'none'
    }
  }
}
