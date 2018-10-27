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
 * @fileoverview The style editor pane is displayed in the property panel on the right.
 * It is a prodotype component used to edit the css styles
 *
 */

goog.provide('silex.view.pane.StyleEditorPane');

class StyleEditorPane extends silex.view.pane.PaneBase {

  /**
   *
   * @param {Element} element   container to render the UI
   * @param  {!silex.types.Model} model  model class which holds
   *                                  the model instances - views use it for read operation only
   * @param  {!silex.types.Controller} controller  structure which holds
   *                                  the controller instances
   */
  constructor(element, model, controller) {
    super(element, model, controller);

    // tracker for analytics
    this.tracker = silex.service.Tracker.getInstance();

    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;
    /** @type {?Array.<Element>} */
    this.selectedElements = null;
    /** @type {silex.model.data.StyleName} */
    this.styleComboPrevValue = '';

    // Build the UI
    this.styleCombo = this.element.querySelector('.class-name-style-combo-box');
    this.pseudoClassCombo = this.element.querySelector('.pseudoclass-style-combo-box');
    this.mobileOnlyCheckbox = this.element.querySelector('.visibility-style-checkbox');
    this.pseudoClassCombo.onchange = e => {
      this.tracker.trackAction('style-editor-events', 'select-pseudo-class');
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
      const styleData = /** @type {silex.model.data.StyleData} */ (this.model.property.getStyleData(this.styleCombo.value) || {});
      this.updateTagButtonBar(styleData);
    };
    this.mobileOnlyCheckbox.onchange = e => {
      // switch the mobile editor mode
      this.controller.propertyToolController
        .view.workspace.setMobileEditor(this.mobileOnlyCheckbox.checked);
      // refresh the view
      this.controller.propertyToolController.refreshView();
    };
    this.styleCombo.onchange = e => {
      this.tracker.trackAction('style-editor-events', 'apply-style');
      this.applyStyle(this.selectedElements, this.styleCombo.value);
      // refresh the view
      this.controller.propertyToolController.refreshView();
    };
    this.element.querySelector('.add-style').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'create-style');
      this.createStyle();
    };
    this.element.querySelector('.remove-style').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'remove-style');
      // delete from styles list
      this.deleteStyle(this.styleCombo.value);
    };
    // un-apply style
    this.element.querySelector('.unapply-style').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'unapply-style');
      this.selectedElements
      .filter(el => this.isTextBox(el))
      .forEach(element => {
        element.classList.remove(this.styleCombo.value);
      });
      // refresh the view
      this.controller.propertyToolController.refreshView();
    };
    // select elements which have this style
    this.selectionCountTotal = this.element.querySelector('.total');
    this.selectionCountTotal.onclick = e => {
      this.tracker.trackAction('style-editor-events', 'select-elements-with-style');
      const newSelection = this.getElementsWithStyle(this.styleCombo.value, true);
      this.model.body.setSelection(newSelection);
    };
    // select only elements on this page
    this.selectionCountPage = this.element.querySelector('.on-page');
    this.selectionCountPage.onclick = e => {
      this.tracker.trackAction('style-editor-events', 'select-all-elements-with-style');
      const newSelection = this.getElementsWithStyle(this.styleCombo.value, false);
      this.model.body.setSelection(newSelection);
    };
    // duplicate a style
    this.element.querySelector('.duplicate-style').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'duplicate-style');
      this.createStyle(this.model.property.getStyleData(this.styleCombo.value));
    };
    // reset style: this.model.component.initStyle(this.styleCombo.options[this.styleCombo.selectedIndex].text, this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
    // rename style
    this.element.querySelector('.edit-style').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'edit-style');
      const oldClassName = this.styleCombo.value;
      if(oldClassName === Component.BODY_STYLE_CSS_CLASS) {
        silex.utils.Notification.alert(`The style '${ Component.BODY_STYLE_NAME }' is a special style, you can not rename it.`, () => {});
      }
      else {
        const data = this.model.property.getStyleData(oldClassName);
        this.createStyle(data, name => {
          // update the style name
          this.getElementsWithStyle(oldClassName, true)
            .forEach(el => {
              el.classList.add(this.styleCombo.value);
            });
          // delete the old one
          if(oldClassName != Component.EMPTY_STYLE_CLASS_NAME) {
            // case of rename the empty style (=> only create a new style)
            this.deleteStyle(oldClassName, false);
          }
        });
      }
    };
    // for tracking only
    this.element.querySelector('.style-editor-tag-form .labels').onclick = e => {
      this.tracker.trackAction('style-editor-events', 'select-tag');
    };
  }


  /**
   * Get all the elements which have a given style
   * @param  {silex.model.data.StyleName} styleName
   * @param  {boolean} includeOffPage, if false it excludes the elements which are not visible in the current page
   * @return {Array<Element>}
   */
  getElementsWithStyle(styleName, includeOffPage) {
    const newSelection = silex.utils.Dom.getElementsAsArray(this.model.file.getContentDocument(), '.' + styleName)
    if(includeOffPage) return newSelection;
    else return newSelection
      .filter(el => this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0);
  }


  /**
   * get the visibility (mobile+desktop or desktop) of the style being edited
   * @return {silex.model.data.Visibility}
   */
  getVisibility() {
    return Component.STYLE_VISIBILITY[this.isMobile() ? 1 : 0];
  }


  /**
   * @return {boolean} true if we are in mobile editor
   * because views (view.workspace.get/setMobileEditor) is not accessible from other views
   * FIXME: find another way to expose isMobileEditor to views
   */
  isMobile() {
    return document.body.classList.contains('mobile-mode');
  }


  /**
   * apply a style to a set of elements, remove old styles
   * @param {Array<Element>} elements
   * @param  {silex.model.data.StyleName} newStyle
   */
  applyStyle(elements, newStyle) {
    if(newStyle === Component.BODY_STYLE_CSS_CLASS) {
      silex.utils.Notification.alert(`The style '${ Component.BODY_STYLE_NAME }' is a special style, it is already applyed to all text elements.`, () => {});
    }
    else {
      this.controller.propertyToolController.undoCheckPoint();
      elements
        .filter(el => this.isTextBox(el))
        .forEach(el => {
          // un-apply the old style if there was one
          this.removeAllStyles(el);
          // apply the new style if there is one
          el.classList.add(newStyle);
        });
      this.controller.propertyToolController.refreshView();
    }
  }

  /**
   * @param {Element} el
   */
  isTextBox(el) {
    return this.model.element.getType(el) === 'text';
  }


  /**
   * @param {Element} el
   */
  removeAllStyles(el) {
    this.getStyles([el]).forEach(styleName => el.classList.remove(styleName));
  }


  /**
   * retrieve the styles applyed to the set of elements
   * @param  {Array<Element>} elements
   * @return {Array<silex.model.data.StyleName>}
   */
  getStyles(elements) {
    const allStyles = this.model.component.getProdotypeComponents(Component.STYLE_TYPE);
    return elements
    // from array of elements to array of array of classNames
    .map(element => element.className.split(' ').filter(className => className != ''))
    // to array of class names in common to all selected elements
    .reduce((prev, classNames, currentIndex) => {
      return prev.filter(prevClassName => classNames.includes(prevClassName));
    }) // no initial value so the first element in the array will be used, it will start with the 2nd element
    // keep only the styles defined in the style editor
    .filter(className => allStyles.find(style => style['className'] === className));
  }


  /**
   * redraw the properties
   * @param   {Array.<Element>} selectedElements the elements currently selected
   * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
   * @param   {string}  currentPageName   the name of the current page
   */
  redraw(selectedElements, pageNames, currentPageName) {
    super.redraw(selectedElements, pageNames, currentPageName);

    // mobile mode
    this.mobileOnlyCheckbox.checked = this.isMobile();

    // reuse selectedElements in combo box on change
    this.selectedElements = selectedElements;

    // edit the style of the selection
    if(selectedElements.length > 0) {
      // get the selected elements style, i.e. which style applies to them
      const selectionStyle = (() => {
        // get the class names common to the selection
        var classNames = this.getStyles(selectedElements);
        // choose the style to edit
        if(classNames.length >= 1) {
          return classNames[0];
        }
        return Component.EMPTY_STYLE_CLASS_NAME;
      })()
      this.updateStyleList(selectionStyle);
    }
    else {
      // FIXME: no need to recreate the whole style list every time the selection changes
      this.updateStyleList(null);
    }
  }


  /**
   * update the list of styles
   * @param {?silex.model.data.StyleName} styleName: option to select, or null for hide editor or `Component.EMPTY_STYLE_CLASS_NAME` for add an empty selection and select it
   */
  updateStyleList(styleName) {
    // reset the combo box
    this.styleCombo.innerHTML = '';
    // add all the existing styles to the dropdown list
    (styleName === Component.EMPTY_STYLE_CLASS_NAME ? [{
      'className': Component.EMPTY_STYLE_CLASS_NAME,
      'displayName': Component.EMPTY_STYLE_DISPLAY_NAME,
    }] : [])
    .concat(this.model.component.getProdotypeComponents(Component.STYLE_TYPE))
    .map(obj => {
      // create the combo box option
      const option = document.createElement('option');
      option.value = obj['className'];
      option.innerHTML = obj['displayName'];
      return option;
    })
    // append options to the dom
    .forEach(option => this.styleCombo.appendChild(option));
    if(styleName != null) {
      const styleNameNotNull = /** @type {!silex.model.data.StyleName} */ (styleName);
      // set the new selection
      this.styleCombo.value = /** @type {!string} */ (styleNameNotNull);
      // edit style only if there are only text boxes or elements with a style (the body)
      const onlyTextBoxes = this.selectedElements.length > 0 && this.selectedElements.reduce((prev, element) => {
        const styles = this.getStyles([element]);
        if(styleNameNotNull === Component.EMPTY_STYLE_CLASS_NAME) {
          // edit style only if there are only text boxes without styles
          return prev && this.isTextBox(element) && styles.length === 0;
        }
        else {
          // edit style only if all the elements have the same style
          return prev && !!styles.find(style => style === styleNameNotNull);
        }
      }, true);
      if(onlyTextBoxes) {
        this.element.classList.remove('no-style');
        // populate combos
        const styleData = /** @type {silex.model.data.StyleData} */ (this.model.property.getStyleData(styleNameNotNull) || {});
        this.populatePseudoClassCombo(styleData);
        this.pseudoClassCombo.disabled = false;
        // store prev value
        if(this.styleComboPrevValue !== styleNameNotNull) {
          // reset state
          this.pseudoClassCombo.selectedIndex = 0;
        }
        this.styleComboPrevValue = styleNameNotNull;
        // start editing the style with prodotype
        this.model.component.editStyle(styleNameNotNull, this.getPseudoClass(), this.getVisibility());

        // update selection count
        const total = this.getElementsWithStyle(styleNameNotNull, true).length;
        const onPage = total === 0 ? 0 : this.getElementsWithStyle(styleNameNotNull, false).length;
        this.selectionCountPage.innerHTML = `${ onPage } on this page (<span>select</span>),&nbsp;`;
        this.selectionCountTotal.innerHTML = `${ total } total (<span>select</span>)`;

        // update tags buttons
        this.updateTagButtonBar(styleData);
      }
      else {
        this.element.classList.add('no-style');
      }
    }
    else {
      this.element.classList.add('no-style');
    }
  }

  /**
   * mark tags push buttons to show which tags have styles
   * @param {silex.model.data.StyleData} styleData
   */
  updateTagButtonBar(styleData) {
    const visibilityData = (styleData['styles'] || {})[this.getVisibility()] || {};
    const tagData = visibilityData[this.getPseudoClass()] || {};
    silex.utils.Dom.getElementsAsArray(this.element, '[data-prodotype-name]').forEach(el => {
      const tagName = el.getAttribute('data-prodotype-name');
      const label = el.getAttribute('data-initial-value') + (tagData[tagName] ? ' *' : '');
      if(el.innerHTML != label) el.innerHTML = label;
    });
  }


  /**
   * useful to mark combo elements with "*" when there is data there
   * @param {silex.model.data.StyleData} styleData
   */
  populatePseudoClassCombo(styleData) {
    const visibilityData = (styleData['styles'] || {})[this.getVisibility()];
    // populate pseudo class combo
    const selectedIndex = this.pseudoClassCombo.selectedIndex;
    this.pseudoClassCombo.innerHTML = '';
    // get the list of pseudo classes out of prodotype definition
    // {"name":"Text styles","props":[{"name":"pseudoClass","type":["normal",":hover",":focus-within", ...
    const componentsDef = this.model.component.getComponentsDef(Component.STYLE_TYPE);
    const pseudoClasses = componentsDef['text']['props'].filter(prop => prop.name === 'pseudoClass')[0]['type'];
    pseudoClasses
    .map(pseudoClass => {
      // create the combo box options
      const option = document.createElement('option');
      option.value = pseudoClass;
      option.innerHTML = pseudoClass + (!!visibilityData && !!visibilityData[pseudoClass] ? ' *' : '');
      return option;
    })
    // append options to the dom
    .forEach(option => this.pseudoClassCombo.appendChild(option));
    // keep selection
    this.pseudoClassCombo.selectedIndex = selectedIndex;
  }


  /**
   * @return {string} normal if pseudo class is ''
   */
  getPseudoClass() {
    return this.pseudoClassCombo.value === '' ? 'normal' : this.pseudoClassCombo.value;
  }


  /**
   * @return {string} name to display for the element's style
  getDisplayName(element) {
    const type = this.model.element.getType(element);
    const className = this.model.element.getClassName(element);
    const cssClasses = className === '' ? '' : '(.' + className.split(' ').join('.') + ')';
    // note: ID is null before we open a website
    const id = this.model.property.getSilexId(element) || '';
    const match = id.match(/silex-id-\d*(\d{3}-\d*)/);
    if(match && match.length === 2) {
      // case of a Silex ID with a normal format
      // display only the end of the ID
      return `${ type }${ match[1] } ${ cssClasses }`;
    }
    else {
      // case of the body or another tag with a hand made Silex ID
      return `${ element.tagName } .${ id } ${ cssClasses }`;
    }
  }
   */


  /**
   * utility function to create a style in the style combo box or duplicate one
   * @param {?silex.model.data.StyleData=} opt_data
   * @param {?function(?string=)=} opt_cbk
   */
  createStyle(opt_data, opt_cbk) {
    const textBoxes = this.selectedElements.filter(el => this.isTextBox(el));
    if(textBoxes.length <= 0) {
      silex.utils.Notification.alert('Error: you need to select a TextBox for this action.', () => {});
    }
    else {
      silex.utils.Notification.prompt('Enter a name for your style!', opt_data ? opt_data['displayName'] : 'My Style',
        (accept, name) => {
          if(accept && name && name !== '') {
            this.controller.propertyToolController.undoCheckPoint();
            const className = name.replace(/ /g, '-').toLowerCase();
            this.model.component.initStyle(name, className, opt_data);
            this.applyStyle(textBoxes, className);
            // FIXME: needed to select className but model.Component::initStyle calls refreshView which calls updateStyleList
            this.updateStyleList(className);
            if(opt_cbk) opt_cbk(name);
            this.controller.propertyToolController.refreshView();
          }
        }
      );
    }
  }


  /**
   * utility function to delete a style in the style
   * @param {!string} name
   * @param {?boolean=} opt_confirm, default is true, if false it will skip user confirmation popin
   */
  deleteStyle(name, opt_confirm) {
    if(opt_confirm === false) this.doDeleteStyle(name);
    else if(name === Component.BODY_STYLE_CSS_CLASS) {
      silex.utils.Notification.alert(`The style '${ Component.BODY_STYLE_NAME }' is a special style, you can not delete it.`, () => {});
    }
    else silex.utils.Notification.confirm(`I am about to delete the style <b>${ name }</b>!<br><br>Are you sure?`,
      (accept) => {
      if(accept) {
        this.doDeleteStyle(name);
      }
    });
  }


  /**
   * utility function to delete a style in the style
   * @param {!string} name
   * @private
   */
  doDeleteStyle(name) {
    const option = this.styleCombo.querySelector('option[value="' + name + '"]');
    // undo checkpoint
    this.controller.propertyToolController.undoCheckPoint();
    // remove from elements
    silex.utils.Dom.getElementsAsArray(this.model.file.getContentDocument(), '.' + name)
      .filter(el => this.isTextBox(el))
      .forEach(el => el.classList.remove(name));
    // remove from model
    this.model.component.removeStyle(option.value);
    this.styleCombo.removeChild(option);
    this.controller.propertyToolController.refreshView();
  }
}
