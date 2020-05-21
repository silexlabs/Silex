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

import { Constants } from '../../../constants';
import { ElementState, ElementType } from '../../element-store/types';
import { PaneBase } from './PaneBase';
import { SilexNotification } from '../../utils/Notification';
import { StyleName, StyleData, Visibility } from '../../site-store/types'
import { Tracker } from '../../io/Tracker';
import { editStyle } from '../../api/element'
import { getBody, getSelectedElements } from '../../element-store/filters'
import { getComponentsDef } from '../../element-store/component'
import { getCurrentPage } from '../../page-store/filters';
import { getDomElement } from '../../element-store/dom';
import { getElements, updateElements  } from '../../element-store/index';
import { getPages } from '../../page-store/index'
import { getSite } from '../../site-store/index'
import { getSiteDocument } from '../../components/SiteFrame';
import { initStyle, removeStyle } from '../../site-store/dispatchers'
import { updateUi, getUi } from '../../ui-store/index'

/**
 * @fileoverview The style editor pane is displayed in the property panel on the
 * right. It is a prodotype component used to edit the css styles
 *
 */
export class StyleEditorPane extends PaneBase {
  // tracker for analytics
  tracker: any;

  styleComboPrevValue: StyleName = '';

  // Build the UI
  styleCombo: any;
  pseudoClassCombo: any;
  mobileOnlyCheckbox: any;

  // select elements which have this style
  selectionCountTotal: any;

  // select only elements on this page
  selectionCountPage: any;

  constructor(element: HTMLElement) {
    super(element);
    this.tracker = Tracker.getInstance();
    this.styleCombo = this.element.querySelector('.class-name-style-combo-box');
    this.pseudoClassCombo = this.element.querySelector('.pseudoclass-style-combo-box');
    this.mobileOnlyCheckbox = this.element.querySelector('.visibility-style-checkbox');
    this.pseudoClassCombo.onchange = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'select-pseudo-class');
      editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
      const styleData = (getSite().styles[this.styleCombo.value] ||  {} as StyleData);
      this.updateTagButtonBar(styleData);
    };
    this.mobileOnlyCheckbox.onchange = (e) => {
      // switch the mobile editor mode
      updateUi({
        ...getUi(),
        mobileEditor: this.mobileOnlyCheckbox.checked,
      })
    };
    this.styleCombo.onchange = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'apply-style');
      this.applyStyle(this.styleCombo.value);
    };
    (this.element.querySelector('.add-style') as HTMLElement).onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'create-style');
      this.createStyle();
    };
    (this.element.querySelector('.remove-style') as HTMLElement).onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'remove-style');

      // delete from styles list
      this.deleteStyle(this.styleCombo.value);
    };

    // un-apply style
    (this.element.querySelector('.unapply-style') as HTMLElement).onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'unapply-style');
      updateElements(getSelectedElements()
        .map((el) => ({
        ...el,
        classList: el.classList.filter((c) => c !== this.styleCombo.value),
      })))
    };
    this.selectionCountTotal = this.element.querySelector('.total');
    this.selectionCountTotal.onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'select-elements-with-style');
      updateElements(getElements()
        .filter((el) => el.selected !== !!el.classList.find((c) => c === this.styleCombo.value))
        .map((el) => ({
          ...el,
          selected: !el.selected,
        })))
    };
    this.selectionCountPage = this.element.querySelector('.on-page');
    this.selectionCountPage.onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'select-all-elements-with-style');
      const currentPage = getCurrentPage();
      updateElements(getElements()
      .filter((el) => el.selected !== !!el.classList.find((c) => c === this.styleCombo.value) && (el.pageNames.length === 0 || !!el.pageNames.find((name) => name === currentPage.id)))
      .map((el) => ({
        ...el,
        selected: !el.selected,
      })))
    };

    // duplicate a style
    (this.element.querySelector('.duplicate-style') as HTMLElement).onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'duplicate-style');
      this.createStyle(getSite().styles[this.styleCombo.value]);
    };

    // reset style:
    // this.model.component.initStyle(this.styleCombo.options[this.styleCombo.selectedIndex].text,
    // this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
    // rename style
    (this.element.querySelector('.edit-style') as HTMLElement).onclick = (e) => {
      //    this.tracker.trackAction('style-editor-events', 'edit-style');
      const oldClassName = this.styleCombo.value;
      if (oldClassName === Constants.BODY_STYLE_CSS_CLASS) {
        SilexNotification.alert('Rename a style', `
          The style '${Constants.BODY_STYLE_NAME}' is a special style, you can not rename it.
        `,
        () => {});
      } else {
        const data = getSite().styles[oldClassName];
        this.createStyle(data, (name) => {
          try {
            // update the style name
            this.getElementsWithStyle(oldClassName, true).forEach((el) => {
              el.classList.add(this.styleCombo.value);
            });

            // delete the old one
            if (oldClassName !== Constants.EMPTY_STYLE_CLASS_NAME) {
              // case of rename the empty style (=> only create a new style)
              this.deleteStyle(oldClassName, false);
            }
          } catch (e) {
            // the style already exists
          }
        });
      }
    };

    // for tracking only
    (this.element.querySelector('.style-editor-tag-form .labels') as HTMLElement).onclick =
        (e) => {
          //    this.tracker.trackAction('style-editor-events', 'select-tag');
        };
  }

  /**
   * Get all the elements which have a given style
   * @param includeOffPage, if false it excludes the elements which are not
   *     visible in the current page
   */
  getElementsWithStyle(styleName: StyleName, includeOffPage: boolean): HTMLElement[] {
    const doc = getSiteDocument();
    const newSelection: HTMLElement[] = Array.from(doc.querySelectorAll('.' + styleName));
    if (includeOffPage) {
      return newSelection;
    } else {
      const currentPage = getCurrentPage();
      return newSelection
        .map((el: HTMLElement) => getElements().find((e) => getDomElement(doc, e) === el))
        .filter((el: ElementState) => el.pageNames.length === 0 || !!el.pageNames.find((id) => id === currentPage.id))
        .map((el: ElementState) => getDomElement(doc, el));
    }
  }

  /**
   * get the visibility (mobile+desktop or desktop) of the style being edited
   */
  getVisibility(): Visibility {
    return Constants.STYLE_VISIBILITY[this.isMobile() ? 1 : 0];
  }

  /**
   * @return true if we are in mobile editor
   * because views (view.workspace.get/setMobileEditor) is not accessible from
   * other views
   * FIXME: find another way to expose isMobileEditor to views
   */
  isMobile(): boolean {
    return document.body.classList.contains('mobile-mode');
  }

  /**
   * apply a style to a set of elements, remove old styles
   */
  applyStyle(newStyle: StyleName) {
    const body = getBody()
    const noBody = getElements()
      .filter((el) => el.selected && el !== body) // remove body
    if (newStyle === Constants.BODY_STYLE_CSS_CLASS) {
      SilexNotification.alert('Apply a style', `
        The style '${Constants.BODY_STYLE_NAME}' is a special style, it is already applyed to all elements.
      `,
      () => {});
    } else if (noBody.length) {
      // this.controller.propertyToolController.undoCheckPoint();
      updateElements(noBody
        .map((el) => ({
          ...el,
          classList: !!el.classList.find((c) => c === newStyle) ? el.classList : el.classList.concat([newStyle]),
        })))
    } else {
      SilexNotification.alert('Apply a style', 'Error: you need to select at least 1 element for this action.', () => {});
    }
  }

  // removeAllStyles(el: HTMLElement) {
  //   this.getStyles([el]).forEach((styleName) => el.classList.remove(styleName));
  // }

  /**
   * retrieve the styles applyed to the set of elements
   */
  getStyles(elements: ElementState[]): StyleName[] {
    const allStyles = getSite().styles;
    return elements
      .map((el) => el.classList)
      // About this reduce:
      // from array of elements to array of classNames
      // no initial value so the first element in the array will be used, it
      // will start with the 2nd element keep only the styles defined in the
      // style editor to array of class names in common to all selected elements
      .reduce((prev, classNames) => {
        return prev.filter((prevClassName) => classNames.indexOf(prevClassName) > -1);
      })
      .filter((className) => Object.keys(allStyles).find((styleName: string) => styleName === className));
  }

  /**
   * update the list of styles
   * @param styleName: option to select, or null for hide editor or
   *     `Component.EMPTY_STYLE_CLASS_NAME` for add an empty selection and
   *     select it
   */
  updateStyleList(styleName: StyleName) {
    // reset the combo box
    this.styleCombo.innerHTML = '';

    // add all the existing styles to the dropdown list

    // append options to the dom
    const allStyleData = getSite().styles;
    (styleName === Constants.EMPTY_STYLE_CLASS_NAME ? [{
      className: Constants.EMPTY_STYLE_CLASS_NAME,
      displayName: Constants.EMPTY_STYLE_DISPLAY_NAME,
    }] : [])
    .concat(Object.keys(allStyleData).map((className) => allStyleData[className]))
    .map((obj) => {
      // create the combo box option
      const option = document.createElement('option');
      option.value = obj.className;
      option.innerHTML = obj.displayName;
      return option;
    })
    .forEach((option) => this.styleCombo.appendChild(option));
    if (styleName != null ) {
      const styleNameNotNull = (styleName as StyleName);

      // set the new selection
      this.styleCombo.value = (styleNameNotNull as string);

      this.element.classList.remove('no-style');

      // populate combos
      const styleData = (getSite().styles[styleNameNotNull] || {} as StyleData);
      this.populatePseudoClassCombo(styleData);
      this.pseudoClassCombo.disabled = false;

      // store prev value
      if (this.styleComboPrevValue !== styleNameNotNull) {
        // reset state
        this.pseudoClassCombo.selectedIndex = 0;
      }
      this.styleComboPrevValue = styleNameNotNull;

      // start editing the style with prodotype
      editStyle(styleNameNotNull, this.getPseudoClass(), this.getVisibility());

      // update selection count
      const total = this.getElementsWithStyle(styleNameNotNull, true).length;
      const onPage = total === 0 ?
          0 :
          this.getElementsWithStyle(styleNameNotNull, false).length;
      this.selectionCountPage.innerHTML =
          `${onPage} on this page (<span>select</span>),&nbsp;`;
      this.selectionCountTotal.innerHTML =
          `${total} total (<span>select</span>)`;

      // update tags buttons
      this.updateTagButtonBar(styleData);
    } else {
      this.element.classList.add('no-style');
    }
  }

  /**
   * mark tags push buttons to show which tags have styles
   */
  updateTagButtonBar(styleData: StyleData) {
    const visibilityData = (styleData.styles || {})[this.getVisibility()] || {};
    const tagData = visibilityData[this.getPseudoClass()] || {};
    Array.from(this.element.querySelectorAll('[data-prodotype-name]'))
    .forEach((el: HTMLElement) => {
      const tagName = el.getAttribute('data-prodotype-name');
      const label = el.getAttribute('data-initial-value') + (tagData[tagName] ? ' *' : '');
      if (el.innerHTML !== label) {
        el.innerHTML = label;
      }
    });
  }

  /**
   * useful to mark combo elements with "*" when there is data there
   */
  populatePseudoClassCombo(styleData: StyleData) {
    const visibilityData = (styleData.styles || {})[this.getVisibility()];

    // populate pseudo class combo
    const selectedIndex = this.pseudoClassCombo.selectedIndex;
    this.pseudoClassCombo.innerHTML = '';

    // get the list of pseudo classes out of prodotype definition
    // {"name":"Text
    // styles","props":[{"name":"pseudoClass","type":["normal",":hover",":focus-within",
    // ...
    const componentsDef = getComponentsDef(Constants.STYLE_TYPE);
    const pseudoClasses = componentsDef.text.props.find((prop) => prop.name === 'pseudoClass').type;

    // append options to the dom
    pseudoClasses
        .map((pseudoClass) => {
          // create the combo box options
          const option = document.createElement('option');
          option.value = pseudoClass;
          option.innerHTML = pseudoClass +
              (!!visibilityData && !!visibilityData[pseudoClass] ? ' *' : '');
          return option;
        })
        .forEach((option) => this.pseudoClassCombo.appendChild(option));

    // keep selection
    this.pseudoClassCombo.selectedIndex = selectedIndex;
  }

  /**
   * @return normal if pseudo class is ''
   */
  getPseudoClass(): string {
    return this.pseudoClassCombo.value === '' ? 'normal' : this.pseudoClassCombo.value;
  }

  /**
   * utility function to create a style in the style combo box or duplicate one
   */
  createStyle(opt_data?: StyleData, opt_cbk?: ((p1?: string) => any)) {
    const body = getBody()
    const noBody = getElements().filter((el) => el !== body);
    if (noBody.length <= 0) {
      SilexNotification.alert('Create a style', 'Error: you need to select at least 1 element for this action.', () => {});
    } else {
      SilexNotification.prompt('Create a style', 'Enter a name for your style!', opt_data ? opt_data.displayName : '', 'Your Style', (accept, name) => {
        if (accept && name && name !== '') {
          // this.controller.propertyToolController.undoCheckPoint();
          const className = 'style-' + name.replace(/ /g, '-').toLowerCase();
          initStyle(name, className, opt_data);
          this.applyStyle(className);

          // FIXME: needed to select className but
          // model.Component::initStyle calls refreshView which calls
          // updateStyleList
          this.updateStyleList(className);
          if (opt_cbk) {
            opt_cbk(name);
          }
        }
      });
    }
  }

  /**
   * utility function to delete a style in the style
   * @param opt_confirm, default is true, if false it will skip user
   *     confirmation popin
   */
  deleteStyle(name: string, opt_confirm?: boolean) {
    if (opt_confirm === false) {
      this.doDeleteStyle(name);
    } else {
      if (name === Constants.BODY_STYLE_CSS_CLASS) {
        SilexNotification.alert('Delete a style', `
          The style '${Constants.BODY_STYLE_NAME}' is a special style, you can not delete it.
        `, () => {});
      } else {
        SilexNotification.confirm('Delete a style', `
          I am about to delete the style <b>${name}</b>!<br><br>Are you sure?
        `, (accept) => {
          if (accept) {
            this.doDeleteStyle(name);
          }
        });
      }
    }
  }

  /**
   * redraw the properties
   */
  protected redraw(selectedElements: ElementState[]) {
    super.redraw(selectedElements);

    // mobile mode
    this.mobileOnlyCheckbox.checked = this.isMobile();

    // edit the style of the selection
    if (selectedElements.length > 0) {
      // get the selected elements style, i.e. which style applies to them
      const selectionStyle = (() => {
        // get the class names common to the selection
        const classNames = this.getStyles(selectedElements);

        // choose the style to edit
        if (classNames.length >= 1) {
          return classNames[0];
        }
        return Constants.BODY_STYLE_CSS_CLASS;
      })();
      this.updateStyleList(selectionStyle);

      // show text styles only when a text box is selected
      const onlyTexts = selectedElements.length > 0
        && selectedElements.filter((el) => el.type !== ElementType.TEXT).length === 0;
      if (onlyTexts) {
        this.element.classList.remove('style-editor-notext');
      } else {
        this.element.classList.add('style-editor-notext');
      }
    } else {
      // FIXME: no need to recreate the whole style list every time the
      // selection changes
      this.updateStyleList(Constants.BODY_STYLE_CSS_CLASS);
      // show the text styles in the case of "all style" so that the user can edit text styles, even when no text box is selected
      this.element.classList.remove('style-editor-notext');
    }
  }

  /**
   * utility function to delete a style in the style
   */
  private doDeleteStyle(name: string) {
    const option =
        this.styleCombo.querySelector('option[value="' + name + '"]');

    // undo checkpoint
    // this.controller.propertyToolController.undoCheckPoint();

    // remove from elements
    Array.from(getSiteDocument().querySelectorAll('.' + name))
    .filter((el) => el !== getSiteDocument().body)
    .forEach((el: HTMLElement) => el.classList.remove(name));

    // undo checkpoint
    // this.controller.settingsDialogController.undoCheckPoint();

    // remove from model
    removeStyle(option.value);
    this.styleCombo.removeChild(option);
  }
}
