/**
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */

// FIXME: do not find module only in vim: import { SelectableState } from 'drag-drop-stage-component/src/ts/Types';
import { ElementState } from '../../element-store/types'
import { addToMobileOrDesktopStyle, fixStyleForElement } from '../../utils/styles'
import { getSelectedElements } from '../../element-store/filters'
import { getSite, subscribeSite, updateSite } from '../../site-store/index'
import { getUi } from '../../ui-store/index'
import { subscribeElements, updateElements } from '../../element-store/index'

export interface InputData {
  selector: string
  styleName: string
  eventName: string
  unit: string
}

/**
 * base class for all UI panes of the view.pane package
 *
 */
export class PaneBase {
  protected pageNames: string[]
  // protected currentPageName: string;
  protected change = new Map()

  /**
   * base url for relative/absolute urls
   */
  protected baseUrl = null

  constructor(protected element: HTMLElement) {}

  // /**
  //  * notify the controller that the style changed
  //  * @param styleName   not css style but camel case
  //  */
  // styleChanged(styleName: string, opt_styleValue?: string, opt_elements?: HTMLElement[]) {
  //   // notify the controller
  //   this.controller.propertyToolController.styleChanged(styleName, opt_styleValue, opt_elements);
  // }

  // /**
  //  * notify the controller that a property has changed
  //  * @param propertyName   property name, e.g. 'src'
  //  */
  // propertyChanged(propertyName: string, opt_propertyValue?: string, opt_elements?: HTMLElement[], opt_applyToContent?: boolean) {
  //   // notify the controller
  //   this.controller.propertyToolController.propertyChanged(propertyName, opt_propertyValue, opt_elements, opt_applyToContent);
  // }

  /**
   * get the common property of a group of elements
   * @param getPropertyFunction the callback which returns the value for one
   *     element
   * @return ? {string|number|boolean} the value or null if the value is not the
   *     same for all elements
   * FIXME: we should use Array::reduce
   */
  getCommonProperty<ItemType, PropType>(items: ItemType[], getPropertyFunction: (p1: ItemType) => PropType): PropType {
    let value = null
    let hasCommonValue: boolean = true
    let isFirstValue = true
    items.forEach((state) => {
      const elementValue = getPropertyFunction(state)
      if (isFirstValue) {
        isFirstValue = false

        // init value
        value = elementValue
      } else {
        // check if there is a common type
        if (elementValue !== value) {
          hasCommonValue = false
        }
      }
    })
    if (!hasCommonValue) {
      value = null
    }
    return value
  }

  /**
   * refresh the displayed data
   */
  protected redraw(selectedElements: ElementState[]) {}

  protected onInputPxChanged(selector: string, value: string) {
    if (this.change.has(selector)) {
      this.change.get(selector).onChange(value)
    } else {
      throw new Error('Unknown input ' + selector)
    }
  }
  /**
   * Init a set of input with px unit
   */
  protected createInput(inputs: InputData[]) {
    inputs.forEach((inputData) => {
      // get a reference to the element
      const input = this.element.querySelector(inputData.selector) as HTMLInputElement
      if (!input) { throw new Error('Could not find input ' + inputData.selector) }

      const changeObj = {
        // freez: false,
        onChange: (value: string) => {
          // if (changeObj.freez) { return; }
          if (typeof value !== 'undefined' && value !== null && value !== 'auto') {
            if (value !== input.value) input.value = value
            input.disabled = false
          } else {
            input.value = ''
            input.disabled = true
          }
        },
      }

      // attach event
      input.addEventListener(inputData.eventName, (e: Event) => {
        e.preventDefault()
        // changeObj.freez = true;
        const val = input.value ? input.value + inputData.unit : ''
        this.styleChanged(inputData.styleName, val)
        // changeObj.freez = false;
      })

      // store the onChange callback for use in onInputChanged
      this.change.set(inputData.selector, changeObj)
    })
  }

  protected styleChanged(styleName: string, val: string) {
    if (styleName === 'width') {
      // handle section content which set the site width
      const sectionContent = getSelectedElements()
      .filter((el) => el.isSectionContent && !getUi().mobileEditor).unshift()

      if (sectionContent) {
        updateSite({
          ...getSite(),
          width: parseInt(val),
        })
      }
    }

    updateElements(getSelectedElements()
    .map((el) => {
      const style = {}
      style[styleName] = val
      return {
        ...el,
        style: {
          ...el.style,
          ...addToMobileOrDesktopStyle(getUi().mobileEditor, el.style, fixStyleForElement(el, el.isSectionContent, style)),
        },
      }
    }))
  }

  /**
   * Init a combo box or text input
   * FIXME: use createInput instead as in PropertyPane
   */
  protected initInput(selector: string, onChange: (e: Event) => void, eventName = 'input'): HTMLInputElement {
    return this.initEventTarget(selector, eventName, onChange)
  }

  /**
   * Init a combo box or a checbox
   * FIXME: use createInput instead as in PropertyPane
   */
  protected initComboBox(selector: string, onChange: (e: Event) => void): HTMLSelectElement {
    return this.initEventTarget(selector, 'change', onChange) as any as HTMLSelectElement
  }

  /**
   * Init a combo box or a checbox
   */
  protected initCheckBox(selector: string, onChange: (e: Event) => void): HTMLInputElement {
    return this.initEventTarget(selector, 'change', onChange)
  }

  /**
   * Init a combo box or
   */
  private initEventTarget(selector: string, eventName: string, onChange: (e: Event) => void): HTMLInputElement {
    // get a reference to the element
    const eventTarget = this.element.querySelector(selector) as HTMLInputElement

    // attach event
    eventTarget.addEventListener(eventName, (e: Event) => {
      // let redraw update the value
      e.preventDefault()
      e.stopPropagation()
      // call the provided callback
      onChange(e)
    })

    return eventTarget
  }
}
