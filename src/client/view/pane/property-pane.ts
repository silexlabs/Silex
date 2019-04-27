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
 * @fileoverview Property pane, displayed in the property tool box
 *
 */

import { SilexElement } from '../../model/element';
import { Controller, Model } from '../../types';
import { PaneBase } from './pane-base';
import { Constants } from '../../../Constants';
import { SelectableState } from 'stage/src/ts/Types';

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
   * UI for position and size
   */
  leftInput: HTMLInputElement;

  /**
   * UI for position and size
   */
  topInput: HTMLInputElement;

  /**
   * UI for position and size
   */
  widthInput: HTMLInputElement;

  /**
   * UI for position and size
   */
  heightInput: HTMLInputElement;

  /**
   * UI for alt and title
   * only used for images
   */
  altInput: HTMLInputElement;

  /**
   * UI for alt and title
   */
  titleInput: HTMLInputElement;

  constructor(element: HTMLElement, model: Model, controller: Controller) {

    super(element, model, controller);

    // init the component
    this.buildUi();
  }

  /**
   * build the UI
   */
  buildUi() {
    this.leftInput = this.initInput('.left-input', e => this.onPositionChanged(e));
    this.leftInput.setAttribute('data-style-name', 'left');
    this.widthInput = this.initInput('.width-input', e => this.onPositionChanged(e));
    this.widthInput.setAttribute('data-style-name', 'width');
    this.topInput = this.initInput('.top-input', e => this.onPositionChanged(e));
    this.topInput.setAttribute('data-style-name', 'top');
    this.heightInput = this.initInput('.height-input', e => this.onPositionChanged(e));
    this.heightInput.setAttribute('data-style-name', 'min-height');
    this.altInput = this.initInput('.alt-input', e => this.onAltChanged(e));
    this.titleInput = this.initInput('.title-input', e => this.onTitleChanged(e));
  }

  /**
   * position or size changed
   * callback for number inputs
   */
  onPositionChanged(e: Event) {
    // get the selected element
    const input = e.target as HTMLInputElement;

    // the name of the property to change
    const name: string = input.getAttribute('data-style-name');

    // do nothing if the value is not a number (numeric stepers's value set to
    // '')
    if (input.value !== '') {
      // get the value
      let value = parseFloat(input.value);

      // handle minimum size of elements on stage
      switch (name) {
        case 'width':
          value = Math.max(value, SilexElement.MIN_WIDTH);
          break;
        case 'min-height':
          value = Math.max(value, SilexElement.MIN_HEIGHT);
          break;
      }

      // get the old value
      const oldValue = parseFloat(input.getAttribute('data-prev-value') || '0');

      // keep track of the new value for next time
      input.setAttribute('data-prev-value', value.toString());

      // compute the offset
      const offset = value - oldValue;

      // apply the change to all elements
      this.states.forEach(state => {
        if (oldValue != NaN) {
          // compute the new value relatively to the old value,
          // in order to match the group movement
          const elementStyle = this.model.element.getStyle(state.el, name);
          let styleValue = 0;
          if (elementStyle && elementStyle !== '') {
            styleValue = parseFloat(elementStyle);
          }
          const newValue = styleValue + offset;

          // apply the change to the current element
          this.styleChanged(name, newValue + 'px', [state.el]);
        } else {
          this.styleChanged(name, value + 'px');
        }
      });
    }
  }

  /**
   * alt changed
   * callback for inputs
   */
  onAltChanged(e: Event) {
    // get the selected element
    const input = e.target as HTMLInputElement;

    // apply the change to all elements
    if (input.value !== '') {
      this.propertyChanged('alt', input.value, null, true);
    } else {
      this.propertyChanged('alt', null, null, true);
    }
  }

  /**
   * title changed
   * callback for inputs
   */
  onTitleChanged(e: Event) {
    // get the selected element
    const input = e.target as HTMLInputElement;

    // apply the change to all elements
    if (input.value !== '') {
      this.propertyChanged('title', input.value);
    } else {
      this.propertyChanged('title');
    }
  }

  /**
   * redraw the properties
   * @param states the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(states: SelectableState[], pageNames: string[], currentPageName: string) {
    super.redraw(states, pageNames, currentPageName);

    // not available for stage element
    const statesNoBody: SelectableState[] = states.filter(data => data.el !== this.model.body.getBodyElement());
    this.states = statesNoBody;

    if (statesNoBody.length > 0) {
      // not stage element only
      this.leftInput.disabled = false;
      this.topInput.disabled = false;
      this.widthInput.disabled = false;
      this.heightInput.disabled = false;
      this.altInput.disabled = false;
      this.titleInput.disabled = false;

      // TODO: Use stage metrics here
      const bb = this.model.property.getBoundingBox(states.map(state => state.el));

      // display position and size
      this.topInput.value = (bb.top || 0).toString();
      this.leftInput.value = (bb.left || 0).toString();
      this.widthInput.value = (bb.width || 0).toString();
      this.heightInput.value = (bb.height || 0).toString();

      // special case of the background / main container only selected element
      if (statesNoBody.length === 1 && this.model.element.isSection(statesNoBody[0].el)) {
        this.widthInput.value = '';
        this.widthInput.disabled = true;
      }
      else {
        this.widthInput.disabled = false;
      }

      // alt, only for images
      const elementsType = this.getCommonProperty(states, state => this.model.element.getType(state.el));
      if (elementsType === Constants.TYPE_IMAGE) {
        this.altInput.disabled = false;
        const alt = this.getCommonProperty(states, state => {
          const content = this.model.element.getContentNode(state.el);
          if (content) {
            return content.getAttribute('alt');
          }
          return null;
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

      // title
      const title = this.getCommonProperty(states, state => state.el.getAttribute('title'));
      if (title) {
        this.titleInput.value = title;
      } else {
        this.titleInput.value = '';
      }
    } else {
      // stage element only
      this.leftInput.disabled = true;
      this.leftInput.value = '';
      this.topInput.disabled = true;
      this.topInput.value = '';
      this.widthInput.disabled = true;
      this.widthInput.value = '';
      this.heightInput.disabled = true;
      this.heightInput.value = '';
      this.altInput.disabled = true;
      this.altInput.value = '';
      this.titleInput.disabled = true;
      this.titleInput.value = '';
    }

    // keep track of old position and size
    this.topInput.setAttribute('data-prev-value', this.topInput.value);
    this.leftInput.setAttribute('data-prev-value', this.leftInput.value);
    this.widthInput.setAttribute('data-prev-value', this.widthInput.value);
    this.heightInput.setAttribute('data-prev-value', this.heightInput.value);
  }

  /**
   * helper for other views,
   * because views (view.workspace.get/setMobileEditor) is not accessible from
   * other views
   * FIXME: find another way to expose isMobileEditor to views
   */
  isMobileMode() {
    return document.body.classList.contains('mobile-mode');
  }
}
