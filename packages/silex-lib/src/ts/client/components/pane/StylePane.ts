/**
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */
import tagsInput from 'tags-input'

import { Constants } from '../../../constants'
import { ElementState } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { Toolboxes } from '../../ui-store/types'
import { getSelectedElements } from '../../element-store/filters'
import { getUi, subscribeUi } from '../../ui-store/index'
import { setClassName } from '../../element-store/dispatchers'
import { subscribeElements } from '../../element-store/index'

/**
 * on of Silex Editors class
 * let user edit style of selected elements
 */
export class StylePane extends PaneBase {
  /**
   * css class tags-input component
   */
  cssClassesTagsInput: any

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
    if (this.cssClassesTagsInput.classList.contains('off')) {
      this.setClassesTags('')
    } else {
      const filteredClasses = getSelectedElements()[0].classList
        .filter((className: string) => Constants.SILEX_CLASS_NAMES.includes(className))
      setClassName(this.getClassesTags() + ' ' + filteredClasses)
    }
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    const { currentToolbox } = getUi()
    if (currentToolbox === Toolboxes.PROPERTIES) {
      this.element.style.display = ''



      // edit classes only if there is 1 element
      if (selectedElements.length === 1) {
        this.cssClassesTagsInput.classList.remove('off')
        this.setClassesTags(selectedElements[0].classList.join(' '))
      } else {
        this.cssClassesTagsInput.classList.add('off')
        this.setClassesTags('')
      }

      // if (selectedElements.length) {
      //   const cssClasses = selectedElements
      //     .map((el) => el.classList)
      //     .reduce((a, b) => a.filter((c) => !!b.find((d) => d === c)));
      //   console.trace('StylePane redraw', cssClasses, this.getClassesTags())

      //   if (this.getClassesTags() !== cssClasses) {
      //     if (cssClasses) {
      //       this.setClassesTags(cssClasses);
      //     } else {
      //       this.setClassesTags('');
      //     }
      //   }
      // }

      // css inline style
      // const cssInlineStyle = this.getCommonProperty(states, (state) => this.model.element.getAllStyles(state.el));

      // if (cssInlineStyle) {
      //   const str = '.element{\n' + cssInlineStyle.replace(/; /gi, ';\n') + '\n}';
      //   const pos = this.ace.getCursorPosition();
      //   this.ace.setValue(str, 1);
      //   this.ace.gotoLine(pos.row + 1, pos.column, false);
      // } else {
      //   this.ace.setValue('.element{\n/' + '* multiple elements selected *' + '/\n}', 1);
      // }
    } else {
      this.element.style.display = 'none'
    }
  }

}
