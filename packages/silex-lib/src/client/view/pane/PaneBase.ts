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

/**
 * @fileoverview This is the pane's base class
 * Property panes displayed in the property tool box.
 * Controls the params of the selected component.
 *
 */

import { SelectableState } from '../../../../node_modules/drag-drop-stage-component/src/ts/Types';
// FIXME: do not find module only in vim: import { SelectableState } from 'drag-drop-stage-component/src/ts/Types';
import { Controller, Model } from '../../types';
import { pageStore } from '../../model-new/page-model';

export interface InputData {
  selector: string;
  styleName: string;
  eventName: string;
  unit: string;
}

/**
 * base class for all UI panes of the view.pane package
 *
 * @param element   container to render the UI
 * @param model  model class which holds
 * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class PaneBase {
  protected pageNames: string[];
  protected currentPageName: string;
  /**
   * store the last selection
   */
  protected states: SelectableState[] = null;
  protected change = new Map();

  /**
   * base url for relative/absolute urls
   */
  protected baseUrl = null;

  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {}

  /**
   * notify the controller that the style changed
   * @param styleName   not css style but camel case
   */
  styleChanged(styleName: string, opt_styleValue?: string, opt_elements?: HTMLElement[]) {
    // notify the controller
    this.controller.propertyToolController.styleChanged(styleName, opt_styleValue, opt_elements);
  }

  /**
   * notify the controller that a property has changed
   * @param propertyName   property name, e.g. 'src'
   */
  propertyChanged(propertyName: string, opt_propertyValue?: string, opt_elements?: HTMLElement[], opt_applyToContent?: boolean) {
    // notify the controller
    this.controller.propertyToolController.propertyChanged(propertyName, opt_propertyValue, opt_elements, opt_applyToContent);
  }

  /**
   * refresh the displayed data
   * @param selectedElements the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(states: SelectableState[]) {
    this.states = states;
    this.pageNames = pageStore.getState().map(p => p.name);
    const currentPage = pageStore.getState().find(p => p.isOpen);
    this.currentPageName = currentPage ? currentPage.name : null;
  }

  /**
   * get the common property of a group of elements
   * @param getPropertyFunction the callback which returns the value for one
   *     element
   * @return ? {string|number|boolean} the value or null if the value is not the
   *     same for all elements
   * FIXME: we should use Array::reduce
   */
  getCommonProperty(states: SelectableState[], getPropertyFunction: (p1: SelectableState) => string | number | boolean | null): any {
    let value = null;
    let hasCommonValue: boolean = true;
    let isFirstValue = true;
    states.forEach((state) => {
      const elementValue = getPropertyFunction(state);
      if (isFirstValue) {
        isFirstValue = false;

        // init value
        value = elementValue;
      } else {
        // check if there is a common type
        if (elementValue !== value) {
          hasCommonValue = false;
        }
      }
    });
    if (!hasCommonValue) {
      value = null;
    }
    return value;
  }
  protected onInputPxChanged(selector: string, value: string) {
    if (this.change.has(selector)) {
      this.change.get(selector).onChange(value);
    } else {
      throw new Error('Unknown input ' + selector);
    }
  }
  /**
   * Init a set of input with px unit
   */
  protected createInput(inputs: InputData[]) {
    inputs.forEach((inputData) => {
      // get a reference to the element
      const input = this.element.querySelector(inputData.selector) as HTMLInputElement;
      if (!input) { throw new Error('Could not find input ' + inputData.selector); }

      const changeObj = {
        freez: false,
        onChange: (value: string) => {
          if (changeObj.freez) { return; }
          if (value !== null) {
            input.value = value;
            input.disabled = false;
          } else {
            input.value = '';
            input.disabled = true;
          }
        },
      };

      // attach event
      input.addEventListener(inputData.eventName, (e: Event) => {
        changeObj.freez = true;
        const val = input.value ? input.value + inputData.unit : '';
        this.styleChanged(inputData.styleName, val, this.states.map((s) => s.el));
        changeObj.freez = false;
      });

      // store the onChange callback for use in onInputChanged
      this.change.set(inputData.selector, changeObj);
    });
  }

  /**
   * Init a combo box or text input
   * FIXME: use createInput instead as in PropertyPane
   */
  protected initInput(selector: string, onChange: (e: Event) => void): HTMLInputElement {
    return this.initEventTarget(selector, 'input', onChange);
  }

  /**
   * Init a combo box or a checbox
   * FIXME: use createInput instead as in PropertyPane
   */
  protected initComboBox(selector: string, onChange: (e: Event) => void): HTMLSelectElement {
    return this.initEventTarget(selector, 'change', onChange) as any as HTMLSelectElement;
  }

  /**
   * Init a combo box or a checbox
   */
  protected initCheckBox(selector: string, onChange: (e: Event) => void): HTMLInputElement {
    return this.initEventTarget(selector, 'change', onChange);
  }

  /**
   * Init a combo box or
   */
  private initEventTarget(selector: string, eventName: string, onChange: (e: Event) => void): HTMLInputElement {
    // get a reference to the element
    const eventTarget = this.element.querySelector(selector) as HTMLInputElement;

    // attach event
    eventTarget.addEventListener(eventName, (e: Event) => {
      // let redraw update the value
      e.preventDefault();
      e.stopPropagation();
      // call the provided callback
      onChange(e);
    });

    return eventTarget;
  }
}
