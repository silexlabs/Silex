/**
 * @fileoverview Property pane, displayed in the property tool box
 *
 */

import { ElementState, ElementType } from '../../element-store/types'
import { PaneBase } from './PaneBase'
import { isDialogVisible } from '../../ui-store/utils'
import { getBody, getSelectedElements } from '../../element-store/filters'
import { getBoundingBox, getElementStyle, getElementRect } from '../../element-store/utils'
import { getUi, subscribeUi } from '../../ui-store/index'
import {
  subscribeElements,
  updateElements
} from '../../element-store/index'
import { subscribeSite } from '../../site-store/index'

const FlexWrapSelect = '.flex-wrap-select'
const JustifyContentSelect = '.justify-content-select'
const AlignItemsSelect = '.align-items-select'
const FlexDirectionSelect = '.flex-direction-select'
const DisplaySelect = '.display-select'
const PositionSelect = '.position-select'
const PaddingLeftInput = '.padding-left-input'
const PaddingBottomInput = '.padding-bottom-input'
const PaddingRightInput = '.padding-right-input'
const PaddingTopInput = '.padding-top-input'
const MarginLeftInput = '.margin-left-input'
const MarginBottomInput = '.margin-bottom-input'
const MarginRightInput = '.margin-right-input'
const MarginTopInput = '.margin-top-input'
const HeightInput = '.height-input'
const WidthInput = '.width-input'
const TopInput = '.top-input'
const LeftInput = '.left-input'

function removePxWithDefault(val: string, default_: string): string {
  return val === null || typeof val === 'undefined' ? default_ : parseInt(val).toString()
}

/**
 * on of Silex Editors class
 * const user edit style of components
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class PropertyPane extends PaneBase {

  tagNameInput: HTMLSelectElement
  /**
   * UI for alt and title
   * only used for images
   */
  altInput: HTMLInputElement

  /**
   * UI for alt and title
   */
  titleInput: HTMLInputElement

  constructor(element: HTMLElement) {

    super(element)

    subscribeSite(() => {
      this.redraw(getSelectedElements())
    })

    subscribeUi(() => {
      this.redraw(getSelectedElements())
    })

    subscribeElements(() => {
      this.redraw(getSelectedElements())
    })

    this.createInput([
      { selector: LeftInput, styleName: 'left', eventName: 'input', unit: 'px' },
      { selector: TopInput, styleName: 'top', eventName: 'input', unit: 'px' },
      { selector: WidthInput, styleName: 'width', eventName: 'input', unit: 'px' },
      { selector: HeightInput, styleName: 'height', eventName: 'input', unit: 'px' },
      { selector: MarginTopInput, styleName: 'margin-top', eventName: 'input', unit: 'px' },
      { selector: MarginRightInput, styleName: 'margin-right', eventName: 'input', unit: 'px' },
      { selector: MarginBottomInput, styleName: 'margin-bottom', eventName: 'input', unit: 'px' },
      { selector: MarginLeftInput, styleName: 'margin-left', eventName: 'input', unit: 'px' },
      { selector: PaddingTopInput, styleName: 'padding-top', eventName: 'input', unit: 'px' },
      { selector: PaddingRightInput, styleName: 'padding-right', eventName: 'input', unit: 'px' },
      { selector: PaddingBottomInput, styleName: 'padding-bottom', eventName: 'input', unit: 'px' },
      { selector: PaddingLeftInput, styleName: 'padding-left', eventName: 'input', unit: 'px' },
      { selector: PositionSelect, styleName: 'position', eventName: 'change', unit: '' },
      { selector: DisplaySelect, styleName: 'display', eventName: 'change', unit: '' },
      { selector: FlexDirectionSelect, styleName: 'flex-direction', eventName: 'change', unit: '' },
      { selector: AlignItemsSelect, styleName: 'align-items', eventName: 'change', unit: '' },
      { selector: JustifyContentSelect, styleName: 'justify-content', eventName: 'change', unit: '' },
      { selector: FlexWrapSelect, styleName: 'flex-wrap', eventName: 'change', unit: '' },
    ])

    this.tagNameInput = this.initComboBox('#tag-name-input', (e) => this.onTagNameChanged(e))
    this.altInput = this.initInput('#alt-input', (e) => this.onAltChanged(e))
    this.titleInput = this.initInput('#title-input', (e) => this.onTitleChanged(e))
  }

  onTagNameChanged(e: Event) {
    const input = e.target as HTMLSelectElement
    updateElements(getSelectedElements()
      .map((el) => ({
        ...el,
        tagName: input.value,
      })))
  }
  /**
   * alt changed
   * callback for inputs
   */
  onAltChanged(e: Event) {
    // get the selected element
    const input = e.target as HTMLInputElement

    // apply the change to all elements
    updateElements(getSelectedElements()
      .map((el) => ({
        ...el,
        alt: input.value,
      })))

    // this.controller.propertyToolController.undoCheckPoint()
  }

  /**
   * title changed
   * callback for inputs
   */
  onTitleChanged(e: Event) {
    e.preventDefault()
    // get the selected element
    const input = e.target as HTMLInputElement

    // apply the change to all elements
    updateElements(getSelectedElements()
      .map((el) => ({
        ...el,
        title: input.value,
      })))

    // this.controller.propertyToolController.undoCheckPoint()
  }

  /**
   * redraw the properties
   */
  redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements)

    if (isDialogVisible('design', 'properties')) {
      (this.element.querySelector('.position-editor') as HTMLElement).style.display = ''
      ;(this.element.querySelector('.seo-editor') as HTMLElement).style.display = ''

      const body = getBody()
      const mobile = getUi().mobileEditor

      // useful filters
      const elementsNoBody = selectedElements
        .filter((el) => el !== body)

      const elementsNoBodyNoSection = elementsNoBody
        .filter((el) => el.type !== ElementType.SECTION)

      // useful values
      const elementsDisplay = this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'display', mobile))
      const elementsPosition = this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'position', mobile))

      // bounding box
      const bb = getBoundingBox(elementsNoBodyNoSection.map((el) => getElementRect(el, mobile)))

      const computeValue = new Map([
        [LeftInput, () => Math.round(bb.left || 0).toString()],
        [TopInput, () => Math.round(bb.top || 0).toString()],
        [WidthInput, () => Math.round(bb.width || 0).toString()],
        [HeightInput, () => Math.round(bb.height || 0).toString()],
        [MarginTopInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'margin-top', mobile)), '')],
        [MarginRightInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'margin-right', mobile)), '')],
        [MarginBottomInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'margin-bottom', mobile)), '')],
        [MarginLeftInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'margin-left', mobile)), '')],
        [PaddingTopInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'padding-top', mobile)), '')],
        [PaddingRightInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'padding-right', mobile)), '')],
        [PaddingBottomInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'padding-bottom', mobile)), '')],
        [PaddingLeftInput, () => removePxWithDefault(this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'padding-left', mobile)), '')],
        [PositionSelect, () => elementsPosition],
        [DisplaySelect, () => elementsDisplay],
        [FlexDirectionSelect, () => this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'flex-direction', mobile))],
        [AlignItemsSelect, () => this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'align-items', mobile))],
        [JustifyContentSelect, () => this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'justify-content', mobile))],
        [FlexWrapSelect, () => this.getCommonProperty(elementsNoBody, (element) => getElementStyle(element, 'flex-wrap', mobile))],
      ])

      const tagName = this.getCommonProperty(elementsNoBody, (element) => element.tagName)
      if (tagName) {
        this.tagNameInput.value = tagName
      } else {
        this.tagNameInput.value = ''
      }

      // compute visibility
      if (elementsNoBodyNoSection.length > 0) {
        const elementsNoBodyNoSectionNoSectionContent = elementsNoBodyNoSection
          .filter((el) => !el.isSectionContent)

          this.titleInput.disabled = false
        if (!elementsNoBodyNoSection.length) {
          // only sections and body
          this.onInputPxChanged(WidthInput, null)
          this.onInputPxChanged(HeightInput, null)
        } else {
          // other than sections
          this.onInputPxChanged(WidthInput, computeValue.get(WidthInput)())
          this.onInputPxChanged(HeightInput, computeValue.get(HeightInput)())
        }
        // body and sections and section content and static content
        if (elementsPosition === 'static' || !elementsNoBodyNoSectionNoSectionContent.length) {
          this.onInputPxChanged(TopInput, null)
          this.onInputPxChanged(LeftInput, null)
        } else {
          this.onInputPxChanged(TopInput, computeValue.get(TopInput)())
          this.onInputPxChanged(LeftInput, computeValue.get(LeftInput)())
        }

        // only images
        const elementsType = this.getCommonProperty(elementsNoBodyNoSection, (element) => element.type)
        if (elementsType === ElementType.IMAGE) {
          this.altInput.disabled = false
          const alt = this.getCommonProperty(elementsNoBodyNoSection, (el) => {
            return el.alt
          })
          if (alt) {
            this.altInput.value = alt
          } else {
            this.altInput.value = ''
          }
        } else {
          this.altInput.value = ''
          this.altInput.disabled = true
        }

        // not for sections or sections content
        const allowPosition = !!elementsNoBodyNoSectionNoSectionContent.length
        if (allowPosition) {
          this.onInputPxChanged(PositionSelect, elementsPosition || '')
        } else {
          this.onInputPxChanged(PositionSelect, null)
        }

        // containers but no sections
        // TODO: let sections handle other displays (requires section containers to be flex items)
        if (elementsType === ElementType.CONTAINER && elementsNoBodyNoSection.length) {
          this.onInputPxChanged(DisplaySelect, elementsDisplay || '')
        } else {
          this.onInputPxChanged(DisplaySelect, null)
        }

        // containers but no sections and flex only
        if (elementsNoBodyNoSection.length && elementsDisplay === 'flex') {
          this.onInputPxChanged(FlexDirectionSelect, computeValue.get(FlexDirectionSelect)() || '')
          this.onInputPxChanged(AlignItemsSelect, computeValue.get(AlignItemsSelect)() || '')
          this.onInputPxChanged(JustifyContentSelect, computeValue.get(JustifyContentSelect)() || '')
          this.onInputPxChanged(FlexWrapSelect, computeValue.get(FlexWrapSelect)() || '')
        } else {
          this.onInputPxChanged(FlexDirectionSelect, null)
          this.onInputPxChanged(AlignItemsSelect, null)
          this.onInputPxChanged(JustifyContentSelect, null)
          this.onInputPxChanged(FlexWrapSelect, null)
        }

        // title
        const title = this.getCommonProperty(elementsNoBodyNoSection, (el) => el.title)
        if (title) {
          this.titleInput.value = title
        } else {
          this.titleInput.value = ''
        }

        this.onInputPxChanged(MarginTopInput, computeValue.get(MarginTopInput)())
        this.onInputPxChanged(MarginLeftInput, computeValue.get(MarginLeftInput)())
        this.onInputPxChanged(MarginRightInput, computeValue.get(MarginRightInput)())
        this.onInputPxChanged(MarginBottomInput, computeValue.get(MarginBottomInput)())
        this.onInputPxChanged(PaddingTopInput, computeValue.get(PaddingTopInput)())
        this.onInputPxChanged(PaddingLeftInput, computeValue.get(PaddingLeftInput)())
        this.onInputPxChanged(PaddingRightInput, computeValue.get(PaddingRightInput)())
        this.onInputPxChanged(PaddingBottomInput, computeValue.get(PaddingBottomInput)())
      } else {
        // could not find a bounding box or seclection contains only the body
        this.disableDimensions()
      }
    } else {
      (this.element.querySelector('.position-editor') as HTMLElement).style.display = 'none'
      ;(this.element.querySelector('.seo-editor') as HTMLElement).style.display = 'none'

    }
  }
  disableDimensions() {
    this.onInputPxChanged(FlexWrapSelect, null)
    this.onInputPxChanged(JustifyContentSelect, null)
    this.onInputPxChanged(AlignItemsSelect, null)
    this.onInputPxChanged(FlexDirectionSelect, null)
    this.onInputPxChanged(DisplaySelect, null)
    this.onInputPxChanged(PositionSelect, null)
    this.onInputPxChanged(PaddingLeftInput, null)
    this.onInputPxChanged(PaddingBottomInput, null)
    this.onInputPxChanged(PaddingRightInput, null)
    this.onInputPxChanged(PaddingTopInput, null)
    this.onInputPxChanged(MarginLeftInput, null)
    this.onInputPxChanged(MarginBottomInput, null)
    this.onInputPxChanged(MarginRightInput, null)
    this.onInputPxChanged(MarginTopInput, null)
    this.onInputPxChanged(HeightInput, null)
    this.onInputPxChanged(WidthInput, null)
    this.onInputPxChanged(TopInput, null)
    this.onInputPxChanged(LeftInput, null)

    this.altInput.disabled = true
    this.altInput.value = ''
    this.titleInput.disabled = true
    this.titleInput.value = ''
  }
}
