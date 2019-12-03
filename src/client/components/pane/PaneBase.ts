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

// FIXME: do not find module only in vim: import { SelectableState } from 'drag-drop-stage-component/src/ts/Types';
import { SelectableState } from '../../../../node_modules/drag-drop-stage-component/src/ts/Types';
import { ElementData } from '../../../types';
import { getElements, subscribeElements, updateElements } from '../../api';
import { Controller, Model } from '../../ClientTypes';

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
  protected change = new Map();

  /**
   * base url for relative/absolute urls
   */
  protected baseUrl = null;

  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {
    subscribeElements(() => this.redraw(getElements().filter((el) => el.selected)))
  }

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
  getCommonProperty<T>(items: T[], getPropertyFunction: (p1: T) => string | number | boolean | null): any {
    let value = null;
    let hasCommonValue: boolean = true;
    let isFirstValue = true;
    items.forEach((state) => {
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

  /**
   * refresh the displayed data
   */
  protected redraw(selectedElements: ElementData[]) {}

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
        updateElements(getElements()
          .filter((el) => el.selected)
          .map((el) => {
            const style = { ...el.style };
            style[inputData.styleName] = val;
            return {
              from: el,
              to: {
                ...el,
                style,
              },
            };
          }))
        changeObj.freez = false;
      });

      // store the onChange callback for use in onInputChanged
      this.change.set(inputData.selector, changeObj);
    });
  }

  protected styleChanged(styleName, val) {
    updateElements(getElements()
    .filter((el) => el.selected)
    .map((el) => {
      const style = { ...el.style };
      style[styleName] = val;
      return {
        from: el,
        to: {
          ...el,
          style,
        },
      };
    }))
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
