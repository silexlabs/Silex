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
 * @fileoverview Property pane, displayed in the property tool box.
 * Controls the general params of the selected component
 *
 */
import { Model, Controller } from '../../types';
import {PaneBase} from './pane-base';
import {Style} from '../../utils/style';
import { SelectableState } from 'stage/src/ts/Types';

/**
 * on of Silex Editors class
 * let user edit style of components
 * @param element   container to render the UI
 * @param model  model class which holds
  * the model instances - views use it for read
 * operation only
 * @param controller  structure which holds
 * the controller instances
 */
export class StylePane extends PaneBase {
  /**
   * css class name input
   */
  cssClassesInput: HTMLInputElement;

  /**
   * instance of ace editor
   */
  ace: AceAjax.Editor;

  constructor(element: HTMLElement, model: Model, controller: Controller) {

    super(element, model, controller);

    // init the component
    this.buildUi();
  }

  /**
   * build the UI
   */
  buildUi() {
    this.cssClassesInput = this.initInput('.style-css-classes-input', () => this.onInputChanged());
    this.ace = ace.edit(this.element.querySelector('.element-style-editor') as HTMLElement);
    this.ace.setTheme('ace/theme/idle_fingers');
    this.ace.renderer.setShowGutter(false);

    // for some reason, this.ace.getSession().* is undefined,
    //    closure renames it despite the fact that that it is declared in the
    //    externs.js file
    this.ace.getSession()['setMode']('ace/mode/css');
    this.ace.setOptions({
      'enableBasicAutocompletion': true,
      'enableSnippets': true,
      'enableLiveAutocompletion': true,
    });
    this.ace.setReadOnly(true);
  }

  /**
   * redraw the properties
   * @param selectedElements the elements currently selected
   * @param pageNames   the names of the pages which appear in the current HTML file
   * @param  currentPageName   the name of the current page
   */
  redraw(states: SelectableState[], pageNames: string[], currentPageName: string) {
    super.redraw(states, pageNames, currentPageName);

    // css classes
    let cssClasses = this.getCommonProperty(states, state => this.model.element.getClassName(state.el));

    if (cssClasses) {
      this.cssClassesInput.value = cssClasses;
    } else {
      this.cssClassesInput.value = '';
    }

    // css inline style
    let cssInlineStyle = this.getCommonProperty(states, state => this.model.element.getAllStyles(state.el));

    if (cssInlineStyle) {
      let str = '.element{\n' + cssInlineStyle.replace(/; /gi, ';\n') + '\n}';
      let pos = this.ace.getCursorPosition();
      this.ace.setValue(str, 1);
      this.ace.gotoLine(pos.row + 1, pos.column, false);
    } else {
      this.ace.setValue('.element{\n/' + '* multiple elements selected *' + '/\n}', 1);
    }
  }

  /**
   * User has selected a color
   */
  onInputChanged() {
    this.controller.propertyToolController.setClassName(this.cssClassesInput.value);
  }

  /**
   * the content has changed, notify the controller
   */
  contentChanged() {
    console.warn('this is not allowed anymore');
    this.ace.setValue(this.ace.getValue());
    // let value = this.ace.getValue();
    // if (value) {
    //   value = value.replace('.element{\n', '');
    //   value = value.replace('\n}', '');
    //   value = value.replace(/\n/, ' ');
    // }
    // this.controller.propertyToolController.multipleStylesChanged(
    //     Style.stringToStyle(value || ''));
  }
}

