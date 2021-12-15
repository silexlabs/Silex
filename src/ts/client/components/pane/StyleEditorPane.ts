/**
 * @fileoverview The style editor pane is displayed in the property panel on the
 * right. It is a prodotype component used to edit the css styles
 *
 */

import { Constants } from '../../../constants'
import { ElementState, ElementType } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { Notification } from '../Notification'
import {
  StyleData,
  StyleDataObject,
  StyleName,
  Visibility,
  PseudoClass,
  VisibilityData,
  PseudoClassData
} from '../../site-store/types'
import { isDialogVisible } from '../../ui-store/utils'
import { browse } from '../../element-store/utils'
import { getBody, getSelectedElements } from '../../element-store/filters'
import { getComponentsDef, openStyleEditor } from '../../element-store/component'
import { getCurrentPage } from '../../page-store/filters'
import {
  getElements,
  subscribeElements,
  updateElements
} from '../../element-store/index'
import { getSite } from '../../site-store/index'
import { getUi, subscribeUi, updateUi } from '../../ui-store/index'
import { initStyle, removeStyle, componentStyleChanged } from '../../site-store/dispatchers'
import { store } from '../../store/index'

/**
 * @param className, the css class to edit the style for
 * @param pseudoClass, e.g. normal, :hover, ::first-letter
 * @param visibility, e.g. mobile only, desktop and mobile...
 */
function editStyle(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility) {
  const styleData: StyleData = getSite().styles[className] || ({styles: {}} as StyleData)
  const visibilityData: VisibilityData = styleData.styles[visibility] || {}
  const pseudoClassData: PseudoClassData = visibilityData[pseudoClass] || {
    templateName: 'text',
    className,
    pseudoClass,
  }
  openStyleEditor({
    data: pseudoClassData,
    dataSources: {
      components: [{displayName: '', name: '', templateName: ''}]
        .concat(getSite().fonts
          .map((font) => ({
              displayName: font.family,
              name: font.family,
              templateName: '',
          }))),
      },
    templateName: 'text',
    events: {
      onChange: (newData, html) => componentStyleChanged(className, pseudoClass, visibility, newData),
      onBrowse: (e, url, cbk) => browse(e, cbk),
    },
  })
}

export class StyleEditorPane extends PaneBase {

  styleComboPrevValue: StyleName = ''

  // Build the UI
  styleCombo: any
  pseudoClassCombo: any
  mobileOnlyCheckbox: any

  // select elements which have this style
  selectionCountTotal: any

  // select only elements on this page
  selectionCountPage: any

  constructor(element: HTMLElement) {
    super(element)
    this.styleCombo = this.element.querySelector('.class-name-style-combo-box')
    this.pseudoClassCombo = this.element.querySelector('.pseudoclass-style-combo-box')
    this.mobileOnlyCheckbox = this.element.querySelector('.visibility-style-checkbox')
    this.pseudoClassCombo.onchange = (e) => {
      editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility())
      const styleData = (getSite().styles[this.styleCombo.value] ||  {} as StyleData)
      this.updateTagButtonBar(styleData)
    }
    this.mobileOnlyCheckbox.onchange = (e) => {
      // switch the mobile editor mode
      updateUi({
        ...getUi(),
        mobileEditor: this.mobileOnlyCheckbox.checked,
      })
    }
    this.styleCombo.onchange = (e) => {
      this.applyStyle(this.styleCombo.value)
    }
    (this.element.querySelector('.add-style') as HTMLElement).onclick = (e) => {
      this.createStyle()
    }
    (this.element.querySelector('.remove-style') as HTMLElement).onclick = (e) => {

      // delete from styles list
      this.deleteStyle(this.styleCombo.value)
    }

    // un-apply style
    (this.element.querySelector('.unapply-style') as HTMLElement).onclick = (e) => {
      updateElements(getSelectedElements()
        .map((el) => ({
        ...el,
        classList: el.classList.filter((c) => c !== this.styleCombo.value),
      })))
    }
    this.selectionCountTotal = this.element.querySelector('.total')
    this.selectionCountTotal.onclick = (e) => {
      updateElements(getElements()
        .filter((el) => el.selected !== !!el.classList.find((c) => c === this.styleCombo.value))
        .map((el) => ({
          ...el,
          selected: !el.selected,
        })))
    }
    this.selectionCountPage = this.element.querySelector('.on-page')
    this.selectionCountPage.onclick = (e) => {
      const currentPage = getCurrentPage()
      updateElements(getElements()
      .filter((el) => el.selected !== !!el.classList.find((c) => c === this.styleCombo.value) && (el.pageNames.length === 0 || !!el.pageNames.find((name) => name === currentPage.id)))
      .map((el) => ({
        ...el,
        selected: !el.selected,
      })))
    }

    // duplicate a style
    ;(this.element.querySelector('.duplicate-style') as HTMLElement).onclick = () => this.duplicateStyle(this.styleCombo.value)

    // reset style:
    // this.model.component.initStyle(this.styleCombo.options[this.styleCombo.selectedIndex].text,
    // this.styleCombo.value, this.getPseudoClass(), this.getVisibility())
    // rename style
    ;(this.element.querySelector('.edit-style') as HTMLElement).onclick = (e) => this.renameStyle(this.styleCombo.value)

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })
  }

  duplicateStyle(styleName) {
    this.createStyle(getSite().styles[styleName])
  }

  renameStyle(oldClassName: string) {
    if (oldClassName === Constants.BODY_STYLE_CSS_CLASS) {
      Notification.alert(
        'Rename a style',
        `The style '${Constants.BODY_STYLE_NAME}' is a special style, you can not rename it.`,
        () => {})
    } else {
      const data = getSite().styles[oldClassName]
      this.createStyle(data, (name) => this.doRenameStyle(oldClassName, name))
    }
  }

  /**
   * a new style has been created, now update all elements and delete the old one
   */
  doRenameStyle(oldClassName: string, name: string, styles: StyleDataObject = getSite().styles, elements = getElements(), dispatch = store.dispatch) {
    const className = this.getClassNameFromClassName(name)

    // update the style name in all elements
    this.doApplyStyle(this.getElementsWithStyle(oldClassName, null, elements), className, styles, dispatch)

    // delete the old one from model
    removeStyle(oldClassName)
  }

  /**
   * Get all the elements which have a given style
   * @currentPageId if null it excludes the elements which are not
   *     visible in the current page
   */
  getElementsWithStyle(styleName: StyleName, currentPageId, elements = getElements()): ElementState[] {
    if (currentPageId) {
      return elements
        .filter((el) => el.classList.includes(styleName)
          && el.pageNames.length === 0
          || el.pageNames.includes(currentPageId))
    } else {
      return elements
        .filter((el) => el.classList.includes(styleName))
    }
  }

  /**
   * get the visibility (mobile+desktop or desktop) of the style being edited
   */
  getVisibility(): Visibility {
    return Constants.STYLE_VISIBILITY[getUi().mobileEditor ? 1 : 0]
  }

  /**
   * apply a style to a set of elements, remove old styles
   */
  applyStyle(newStyle: StyleName, styles: StyleDataObject = getSite().styles, elements = getElements(), dispatch = store.dispatch) {
    const body = getBody(elements)
    const noBody = getSelectedElements(elements)
      .filter((el) => el !== body) // remove body
    if (newStyle === Constants.BODY_STYLE_CSS_CLASS) {
      Notification.alert('Apply a style', `
        The style '${Constants.BODY_STYLE_NAME}' is a special style, it is already applyed to all elements.
      `,
      () => {})
    } else if (noBody.length) {
      this.doApplyStyle(noBody, newStyle, styles, dispatch)
    } else {
      Notification.alert('Apply a style', 'Error: you need to select at least 1 element for this action.', () => {})
    }
  }

  doApplyStyle(selection: ElementState[], styleName: string, styles: StyleDataObject = getSite().styles, dispatch = store.dispatch) {
    const allStylesNames = Object.keys(styles)
      .filter((s) => s !== Constants.BODY_STYLE_CSS_CLASS)
    updateElements(selection
      .map((el) => el.classList.includes(styleName) ? el : {
        ...el,
        classList: el
          .classList
            // remove all styles
            .filter((c) => !allStylesNames.includes(c))
            // add the new style
            .concat([styleName]),
      }), dispatch)
  }

  /**
   * retrieve the styles applyed to the set of elements
   */
  getStyles(elements: ElementState[]): StyleName[] {
    const allStyles = getSite().styles
    return elements
      .map((el) => el.classList)
      // About this reduce:
      // from array of elements to array of classNames
      // no initial value so the first element in the array will be used, it
      // will start with the 2nd element keep only the styles defined in the
      // style editor to array of class names in common to all selected elements
      .reduce((prev, classNames) => {
        return prev.filter((prevClassName) => classNames.indexOf(prevClassName) > -1)
      })
      .filter((className) => Object.keys(allStyles).find((styleName: string) => styleName === className))
  }

  /**
   * update the list of styles
   * @param styleName: option to select, or null for hide editor or
   *     `Component.EMPTY_STYLE_CLASS_NAME` for add an empty selection and
   *     select it
   */
  updateStyleList(styleName: StyleName) {
    // reset the combo box
    this.styleCombo.innerHTML = ''

    // get all styles for this website
    const allStyleData = getSite().styles

    // add all the existing styles to the dropdown list
    ;(styleName === Constants.EMPTY_STYLE_CLASS_NAME ? [{
      className: Constants.EMPTY_STYLE_CLASS_NAME,
      displayName: Constants.EMPTY_STYLE_DISPLAY_NAME,
    }] : [])
    .concat(Object.keys(allStyleData).map((className) => allStyleData[className]))
    // append options to the dom
    .map((obj) => {
      // create the combo box option
      const option = document.createElement('option')
      option.value = obj.className
      option.innerHTML = obj.displayName
      return option
    })
    .forEach((option) => this.styleCombo.appendChild(option))
    if (styleName != null ) {
      const styleNameNotNull = (styleName as StyleName)

      // set the new selection
      this.styleCombo.value = (styleNameNotNull as string)

      this.element.classList.remove('no-style')

      // populate combos
      const styleData = (getSite().styles[styleNameNotNull] || {} as StyleData)
      this.populatePseudoClassCombo(styleData)
      this.pseudoClassCombo.disabled = false

      // store prev value
      if (this.styleComboPrevValue !== styleNameNotNull) {
        // reset state
        this.pseudoClassCombo.selectedIndex = 0
      }
      this.styleComboPrevValue = styleNameNotNull

      // start editing the style with prodotype
      editStyle(styleNameNotNull, this.getPseudoClass(), this.getVisibility())

      // update selection count
      const total = this.getElementsWithStyle(styleNameNotNull, getCurrentPage()?.id).length
      const onPage = total === 0 ? 0 : this.getElementsWithStyle(styleNameNotNull, null).length
      this.selectionCountPage.innerHTML = `${onPage} on this page (<span>select</span>),&nbsp;`
      this.selectionCountTotal.innerHTML = `${total} total (<span>select</span>)`

      // update tags buttons
      this.updateTagButtonBar(styleData)
    } else {
      this.element.classList.add('no-style')
    }
  }

  /**
   * mark tags push buttons to show which tags have styles
   */
  updateTagButtonBar(styleData: StyleData) {
    const visibilityData = (styleData.styles || {})[this.getVisibility()] || {}
    const tagData = visibilityData[this.getPseudoClass()] || {}
    Array.from(this.element.querySelectorAll('[data-prodotype-name]'))
    .forEach((el: HTMLElement) => {
      const tagName = el.getAttribute('data-prodotype-name')
      const label = el.getAttribute('data-initial-value') + (tagData[tagName] ? ' *' : '')
      if (el.innerHTML !== label) {
        el.innerHTML = label
      }
    })
  }

  /**
   * useful to mark combo elements with "*" when there is data there
   */
  populatePseudoClassCombo(styleData: StyleData) {
    const visibilityData = (styleData.styles || {})[this.getVisibility()]

    // populate pseudo class combo
    const selectedIndex = this.pseudoClassCombo.selectedIndex
    this.pseudoClassCombo.innerHTML = ''

    // get the list of pseudo classes out of prodotype definition
    // {"name":"Text
    // styles","props":[{"name":"pseudoClass","type":["normal",":hover",":focus-within",
    // ...
    const componentsDef = getComponentsDef(Constants.STYLE_TYPE)
    const pseudoClasses = componentsDef.text.props.find((prop) => prop.name === 'pseudoClass').type

    // append options to the dom
    pseudoClasses
        .map((pseudoClass) => {
          // create the combo box options
          const option = document.createElement('option')
          option.value = pseudoClass
          option.innerHTML = pseudoClass +
              (!!visibilityData && !!visibilityData[pseudoClass] ? ' *' : '')
          return option
        })
        .forEach((option) => this.pseudoClassCombo.appendChild(option))

    // keep selection
    this.pseudoClassCombo.selectedIndex = selectedIndex
  }

  /**
   * @return normal if pseudo class is ''
   */
  getPseudoClass(): string {
    return this.pseudoClassCombo.value === '' ? 'normal' : this.pseudoClassCombo.value
  }

  /**
   * utility function to create a style in the style combo box or duplicate one
   */
  createStyle(opt_data?: StyleData, opt_cbk?: ((p1?: string) => any)) {
    const body = getBody()
    const noBody = getElements().filter((el) => el !== body)
    if (noBody.length <= 0) {
      Notification.alert('Create a style', 'Error: you need to select at least 1 element for this action.', () => {})
    } else {
      Notification.prompt('Create a style', 'Enter a name for your style!', opt_data ? opt_data.displayName : '', 'Your Style', (accept, name) => {
        if (accept && name && name !== '') {
          this.doCreateStyle({name, opt_data})
          if (opt_cbk) {
            opt_cbk(name)
          }
        }
      })
    }
  }

  /**
   * build a new css class name for the style
   */
  getClassNameFromClassName(name) {
    return 'style-' + name.replace(/ /g, '-').toLowerCase()
  }

  /**
   * called after prompts and alerts
   * to create a style
   */
  doCreateStyle({name, opt_data}: {name: string, opt_data?: StyleData}, styles: StyleDataObject = getSite().styles, elements = getElements(), dispatch = store.dispatch) {
    const className = this.getClassNameFromClassName(name)

    // create the new style
    initStyle(name, className, opt_data)

    // apply it to the selection
    this.applyStyle(className, styles, elements, dispatch)

    // update styles list
    this.updateStyleList(className)
  }

  /**
   * utility function to delete a style in the style
   * @param opt_confirm, default is true, if false it will skip user
   *     confirmation popin
   */
  deleteStyle(name: string, opt_confirm?: boolean) {
    if (opt_confirm === false) {
      this.doDeleteStyle(name)
    } else {
      if (name === Constants.BODY_STYLE_CSS_CLASS) {
        Notification.alert('Delete a style', `
          The style '${Constants.BODY_STYLE_NAME}' is a special style, you can not delete it.
        `, () => {})
      } else {
        Notification.confirm('Delete a style', `
          I am about to delete the style <b>${name}</b>!<br><br>Are you sure?
        `, (accept) => {
          if (accept) {
            this.doDeleteStyle(name)
          }
        })
      }
    }
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    if (isDialogVisible('style', 'properties')) {
      this.element.style.display = ''


      // mobile mode
      this.mobileOnlyCheckbox.checked = getUi().mobileEditor

      // edit the style of the selection
      if (selectedElements.length > 0) {
        // get the selected elements style, i.e. which style applies to them
        const selectionStyle = (() => {
          // get the class names common to the selection
          const classNames = this.getStyles(selectedElements)

          // choose the style to edit
          if (classNames.length >= 1) {
            return classNames[0]
          }
          return Constants.BODY_STYLE_CSS_CLASS
        })()
        this.updateStyleList(selectionStyle)

        // show text styles only when a text box is selected
        const onlyTexts = selectedElements.length > 0
        && selectedElements.filter((el) => el.type !== ElementType.TEXT).length === 0
        if (onlyTexts) {
          this.element.classList.remove('style-editor-notext')
        } else {
          this.element.classList.add('style-editor-notext')
        }
      } else {
        // FIXME: no need to recreate the whole style list every time the
        // selection changes
        this.updateStyleList(Constants.BODY_STYLE_CSS_CLASS)
        // show the text styles in the case of "all style" so that the user can edit text styles, even when no text box is selected
        this.element.classList.remove('style-editor-notext')
      }
    } else {
      this.element.style.display = 'none'
    }
  }

  /**
   * utility function to delete a style in the style
   */
  private doDeleteStyle(name: string) {
    const option = this.styleCombo.querySelector('option[value="' + name + '"]')

    // remove from model
    removeStyle(option.value)

    // update styles list
    this.styleCombo.removeChild(option)
  }
}
