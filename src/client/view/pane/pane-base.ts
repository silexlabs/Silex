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

import { Controller, Model } from '../../types';
import { SelectableState } from 'stage/src/ts/Types';


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

  /**
   * base url for relative/absolute urls
   */
  protected baseUrl = null;

  constructor(protected element: HTMLElement, protected model: Model, protected controller: Controller) {}

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

  /**
   * Init a combo box or
   */
  protected initInput(selector: string, onChange: (e: Event) => void): HTMLInputElement {
    return this.initEventTarget(selector, 'input', onChange);
  }

  /**
   * Init a combo box or a checbox
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
  redraw(states: SelectableState[], pageNames: string[], currentPageName: string) {
    this.states = states;
    this.pageNames = pageNames;
    this.currentPageName = currentPageName;
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
    states.forEach(state => {
      let elementValue = getPropertyFunction(state);
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
}
