/**
 * Silex, live web creation
 * http://projects.silexlabs.org/?/silex/
 *
 * Copyright (c) 2012 Silex Labs
 * http://www.silexlabs.org/
 *
 * Silex is available under the GPL license
 * http://www.silexlabs.org/silex/silex-licensing/
 */

import { getDomElement } from '../../element/dom'
import { getBody, getElementByDomElement } from '../../element/filters'
import { getElements, updateElements } from '../../element/store'
import { ElementData, ElementType } from '../../element/types'
import { getSiteDocument, getSiteWindow } from '../SiteFrame'
import { getStage } from '../StageWrapper'
import { PaneBase } from './PaneBase'

/**
 * @fileoverview Property pane, displayed in the property tool box
 *
 */

const FlexWrapSelect = '.flex-wrap-select';
const JustifyContentSelect = '.justify-content-select';
const AlignItemsSelect = '.align-items-select';
const FlexDirectionSelect = '.flex-direction-select';
const DisplaySelect = '.display-select';
const PositionSelect = '.position-select';
const PaddingLeftInput = '.padding-left-input';
const PaddingBottomInput = '.padding-bottom-input';
const PaddingRightInput = '.padding-right-input';
const PaddingTopInput = '.padding-top-input';
const MarginLeftInput = '.margin-left-input';
const MarginBottomInput = '.margin-bottom-input';
const MarginRightInput = '.margin-right-input';
const MarginTopInput = '.margin-top-input';
const HeightInput = '.height-input';
const WidthInput = '.width-input';
const TopInput = '.top-input';
const LeftInput = '.left-input';

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

  /**
   * UI for alt and title
   * only used for images
   */
  altInput: HTMLInputElement;

  /**
   * UI for alt and title
   */
  titleInput: HTMLInputElement;

  constructor(element: HTMLElement) {

    super(element);

    // init the component
    this.buildUi();
  }

  /**
   * build the UI
   */
  buildUi() {
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
    ]);

    this.altInput = this.initInput('.alt-input', (e) => this.onAltChanged(e));
    this.titleInput = this.initInput('.title-input', (e) => this.onTitleChanged(e));
  }

  /**
   * alt changed
   * callback for inputs
   */
  onAltChanged(e: Event) {
    // get the selected element
    const input = e.target as HTMLInputElement;

    // apply the change to all elements
    updateElements(getElements()
      .map((el) => ({
        from: el,
        to: {
          ...el,
          alt: input.value,
        },
      })))

    // this.controller.propertyToolController.undoCheckPoint();
  }

  /**
   * title changed
   * callback for inputs
   */
  onTitleChanged(e: Event) {
    e.preventDefault();
    // get the selected element
    const input = e.target as HTMLInputElement;

    // apply the change to all elements
    updateElements(getElements()
      .filter((el) => el.selected)
      .map((el) => ({
        from: el,
        to: {
          ...el,
          title: input.value,
        },
      })))

    // this.controller.propertyToolController.undoCheckPoint();
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementData[]) {
    super.redraw(selectedElements);
    const body = getBody()

    // useful filters
    const elementsNoBody = selectedElements
      .filter((el) => el !== body)

    const elementsNoBodyNoSection = elementsNoBody
      .filter((el) => el.type !== ElementType.SECTION)

    const statesNoBody = elementsNoBody
      .map((el) => getStage().getState(getDomElement(getSiteDocument(), el)))
      .filter((state) => !!state) // if the selected element is not visible (on the page or mobile/desktop) => it has no state

    const statesNoBodyNoSection = elementsNoBodyNoSection
      .map((el) => getStage().getState(getDomElement(getSiteDocument(), el)))
      .filter((state) => !!state) // if the selected element is not visible (on the page or mobile/desktop) => it has no state

    // useful values
    const elementsDisplay = this.getCommonProperty(statesNoBody, (state) => getSiteWindow().getComputedStyle(state.el).display);
    const elementsPosition = this.getCommonProperty(statesNoBody, (state) => state.metrics.position);
    const bb = getStage().getSelectionBox(); // FIXME: stageWrapper should be accessible in the views

    const computeValue = new Map([
      [LeftInput, () => Math.round(bb.left || 0).toString()],
      [TopInput, () => Math.round(bb.top || 0).toString()],
      [WidthInput, () => Math.round(bb.width || 0).toString()],
      [HeightInput, () => Math.round(bb.height || 0).toString()],
      [MarginTopInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.margin.top)],
      [MarginRightInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.margin.right)],
      [MarginBottomInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.margin.bottom)],
      [MarginLeftInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.margin.left)],
      [PaddingTopInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.padding.top)],
      [PaddingRightInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.padding.right)],
      [PaddingBottomInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.padding.bottom)],
      [PaddingLeftInput, () => this.getCommonProperty(statesNoBody, (state) => state.metrics.padding.left)],
      [PositionSelect, () => elementsPosition],
      [DisplaySelect, () => elementsDisplay],
      [FlexDirectionSelect, () => this.getCommonProperty(statesNoBody, (state) => getSiteWindow().getComputedStyle(state.el)['flex-direction'])],
      [AlignItemsSelect, () => this.getCommonProperty(statesNoBody, (state) => getSiteWindow().getComputedStyle(state.el)['align-items'])],
      [JustifyContentSelect, () => this.getCommonProperty(statesNoBody, (state) => getSiteWindow().getComputedStyle(state.el)['justify-content'])],
      [FlexWrapSelect, () => this.getCommonProperty(statesNoBody, (state) => getSiteWindow().getComputedStyle(state.el)['flex-wrap'])],
    ]);

    // compute visibility
    if (statesNoBody.length > 0) {
      const statesNoBodyNoSectionNoSectionContent = elementsNoBodyNoSection
        .filter((el) => !el.isSectionContent)
        .map((el) => getStage().getState(getDomElement(getSiteDocument(), el)))
        .filter((state) => !!state) // if the selected element is not visible (on the page or mobile/desktop) => it has no state
      this.altInput.disabled = false;
      this.titleInput.disabled = false;
      this.onInputPxChanged(WidthInput, computeValue.get(WidthInput)());
      this.onInputPxChanged(HeightInput, computeValue.get(HeightInput)());
      // body and sections and section content and static content
      if (elementsPosition === 'static' || !statesNoBodyNoSectionNoSectionContent.length) {
        this.onInputPxChanged(TopInput, null);
        this.onInputPxChanged(LeftInput, null);
      } else {
        this.onInputPxChanged(TopInput, computeValue.get(TopInput)());
        this.onInputPxChanged(LeftInput, computeValue.get(LeftInput)());
      }

      // only images
      const elementsType = this.getCommonProperty(statesNoBody, (state) => getElementByDomElement(getSiteDocument(), state.el).type);
      if (elementsType === ElementType.IMAGE) {
        this.altInput.disabled = false;
        const alt = this.getCommonProperty(selectedElements, (el) => {
          return el.alt;
        });
        if (alt) {
          this.altInput.value = alt;
        } else {
          this.altInput.value = '';
        }
      } else {
        this.altInput.value = '';
        this.altInput.disabled = true;
      }

      // not for sections or sections content
      if (!!statesNoBodyNoSectionNoSectionContent.length) {
        this.onInputPxChanged(PositionSelect, computeValue.get(PositionSelect)());
      } else {
        this.onInputPxChanged(PositionSelect, null);
      }

      // containers but no sections
      if (elementsType === ElementType.CONTAINER && statesNoBodyNoSection.length) {
        this.onInputPxChanged(DisplaySelect, computeValue.get(DisplaySelect)());
      } else {
        this.onInputPxChanged(DisplaySelect, null);
      }

      // containers but no sections and flex only
      if (elementsType === ElementType.CONTAINER && statesNoBodyNoSection.length && elementsDisplay === 'flex') {
        this.onInputPxChanged(FlexDirectionSelect, computeValue.get(FlexDirectionSelect)());
        this.onInputPxChanged(AlignItemsSelect, computeValue.get(AlignItemsSelect)());
        this.onInputPxChanged(JustifyContentSelect, computeValue.get(JustifyContentSelect)());
        this.onInputPxChanged(FlexWrapSelect, computeValue.get(FlexWrapSelect)());
      } else {
        this.onInputPxChanged(FlexDirectionSelect, null);
        this.onInputPxChanged(AlignItemsSelect, null);
        this.onInputPxChanged(JustifyContentSelect, null);
        this.onInputPxChanged(FlexWrapSelect, null);
      }

      // title
      const title = this.getCommonProperty(selectedElements, (el) => el.title);
      if (title) {
        this.titleInput.value = title;
      } else {
        this.titleInput.value = '';
      }

    } else {
      // seclection contains only the body
      this.onInputPxChanged(FlexWrapSelect, null);
      this.onInputPxChanged(JustifyContentSelect, null);
      this.onInputPxChanged(AlignItemsSelect, null);
      this.onInputPxChanged(FlexDirectionSelect, null);
      this.onInputPxChanged(DisplaySelect, null);
      this.onInputPxChanged(PositionSelect, null);
      this.onInputPxChanged(PaddingLeftInput, null);
      this.onInputPxChanged(PaddingBottomInput, null);
      this.onInputPxChanged(PaddingRightInput, null);
      this.onInputPxChanged(PaddingTopInput, null);
      this.onInputPxChanged(MarginLeftInput, null);
      this.onInputPxChanged(MarginBottomInput, null);
      this.onInputPxChanged(MarginRightInput, null);
      this.onInputPxChanged(MarginTopInput, null);
      this.onInputPxChanged(HeightInput, null);
      this.onInputPxChanged(WidthInput, null);
      this.onInputPxChanged(TopInput, null);
      this.onInputPxChanged(LeftInput, null);

      this.altInput.disabled = true;
      this.altInput.value = '';
      this.titleInput.disabled = true;
      this.titleInput.value = '';
    }
    this.onInputPxChanged(MarginTopInput, computeValue.get(MarginTopInput)());
    this.onInputPxChanged(MarginLeftInput, computeValue.get(MarginLeftInput)());
    this.onInputPxChanged(MarginRightInput, computeValue.get(MarginRightInput)());
    this.onInputPxChanged(MarginBottomInput, computeValue.get(MarginBottomInput)());
    this.onInputPxChanged(PaddingTopInput, computeValue.get(PaddingTopInput)());
    this.onInputPxChanged(PaddingLeftInput, computeValue.get(PaddingLeftInput)());
    this.onInputPxChanged(PaddingRightInput, computeValue.get(PaddingRightInput)());
    this.onInputPxChanged(PaddingBottomInput, computeValue.get(PaddingBottomInput)());
  }
}
