/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */
import tagsInput from 'tags-input'

import { Constants } from '../../../constants'
import { ElementState, Attr } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { getSelectedElements } from '../../element-store/filters'
import { isDialogVisible } from '../../ui-store/utils'
import { setAttributes, setClassName } from '../../element-store/dispatchers'
import { subscribeElements } from '../../element-store/index'
import { subscribeUi } from '../../ui-store/index'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class StylePane extends PaneBase {
  /**
   * css class tags-input component
   */
  cssClassesTagsInput: any
  htmlAttrInput: any

  /**
   * prevent loops and stage reset while updating the value from store
   */
  iAmChanging = false

  constructor(element: HTMLElement) {

    super(element)

    const cssClassesInput = this.initInput('.style-css-classes-input', () => this.onInputChanged(), 'blur')
    tagsInput(cssClassesInput)
    this.cssClassesTagsInput = cssClassesInput.nextElementSibling
    this.cssClassesTagsInput.classList.add('silex-input')
    // add a listener for the delete event
    this.initComboBox('.style-css-classes-input', () => this.onInputChanged())

    // HTML attribute input
    this.htmlAttrInput = this.element.querySelector('.style-css-attr-input')
    this.initInput('.style-css-attr-input', () => this.onInputChanged())

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  getClassesTags() {
    return this.cssClassesTagsInput.getValue().split(',').join(' ')
  }

  setClassesTags(cssClasses: string) {
    if (this.iAmChanging) return
    if (this.getClassesTags() !== cssClasses) {
      this.iAmChanging = true
      this.cssClassesTagsInput.setValue(cssClasses
        .split(' ')
        .filter((className: string) => !Constants.SILEX_CLASS_NAMES.includes(className))
        .join(','))
      this.iAmChanging = false
    }
  }

  /**
   * User has selected a color
   */
  onInputChanged() {
    if (this.iAmChanging) return
    this.iAmChanging = true

    // store the current value as it may be overriden when css classes are updated
    const attr = this.stringToAttr(this.htmlAttrInput.value)

    // CSS classes
    if (this.cssClassesTagsInput.classList.contains('off')) {
      this.setClassesTags('')
    } else {
      const filteredClasses = getSelectedElements()[0].classList
        .filter((className: string) => Constants.SILEX_CLASS_NAMES.includes(className))
      setClassName(this.getClassesTags() + ' ' + filteredClasses)
    }

    // HTML attributes
    setAttributes(attr)

    this.iAmChanging = false
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementState[]) {
    if (this.iAmChanging) return
    super.redraw(selectedElements)

    if (isDialogVisible('design', 'properties')) {
      this.element.style.display = ''

      // edit classes only if there is 1 element
      if (selectedElements.length === 1) {
        this.cssClassesTagsInput.classList.remove('off')
        this.setClassesTags(selectedElements[0].classList.join(' '))
      } else {
        this.cssClassesTagsInput.classList.add('off')
        this.setClassesTags('')
      }

      // HTML attributes
      const attr = this.getCommonProperty<ElementState, string>(selectedElements, (el) => this.attrToString(el.attr))
      if (attr == null || attr !== this.attrToString(this.stringToAttr(this.htmlAttrInput.value))) {
        this.htmlAttrInput.value = attr || ''
      }
    } else {
      this.element.style.display = 'none'
    }
  }
  attrToString(attr: Attr): string {
    if(attr == null) return ''

    return Object.entries(attr)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, val]) => name + (val != null ? `="${val}"` : ''))
    .join(' ')
  }
  stringToAttr(text: string): Attr {
    if(text == null) return {}

    const attributes = text.match(/\b([a-z,A-Z,\-,:]+)(="(.*?)")?/g)
    if (attributes == null) return {}

    const result = {}
    attributes.forEach((a) => {
      const [name, val] = a.split('=')
      if (val == null) result[name] = null
      else {
        const unquoted = val.replace(/^"(.+)"$/,'$1')
        result[name] = unquoted
      }
    })
    return result
  }
}

