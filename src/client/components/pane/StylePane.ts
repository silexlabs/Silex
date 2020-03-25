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
import tagsInput from 'tags-input';
import { ElementData } from '../../element/types';
import { PaneBase } from './PaneBase';
import { setClassName } from '../../element/dispatchers'

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
   * css class tags-input component
   */
  cssClassesTagsInput: any;

  /**
   * prevent loops and stage reset while updating the value from store
   */
  iAmChanging = false;

  constructor(element: HTMLElement) {

    super(element);

    // init the component
    this.buildUi();
  }

  /**
   * build the UI
   */
  buildUi() {
    const cssClassesInput = this.initInput('.style-css-classes-input', () => this.onInputChanged());
    tagsInput(cssClassesInput);
    this.cssClassesTagsInput = cssClassesInput.nextElementSibling;
    this.cssClassesTagsInput.classList.add('silex-input');
    // add a listener for the delete event
    this.initComboBox('.style-css-classes-input', () => this.onInputChanged());
  }

  getClassesTags() {
    return this.cssClassesTagsInput.getValue().split(',').join(' ');
  }

  setClassesTags(cssClasses) {
    if (this.iAmChanging) return
    if (this.getClassesTags() !== cssClasses) {
      this.iAmChanging = true
      this.cssClassesTagsInput.setValue(cssClasses.split(' ').join(','));
      this.iAmChanging = false
    }
  }

  /**
   * User has selected a color
   */
  onInputChanged() {
    if (this.iAmChanging) return
    if (this.cssClassesTagsInput.classList.contains('off')) {
      this.setClassesTags('');
    } else {
      setClassName(this.getClassesTags());
    }
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementData[]) {
    super.redraw(selectedElements);

    // edit classes only if there is 1 element
    if (selectedElements.length === 1) {
      this.cssClassesTagsInput.classList.remove('off');
      this.setClassesTags(selectedElements[0].classList.join(' '));
    } else {
      this.cssClassesTagsInput.classList.add('off');
      this.setClassesTags('');
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
  }
}
