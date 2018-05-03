

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

    // store the params
    this.element = element;
    this.model = model;
    this.controller = controller;
    /** @type {?Array.<Element>} */
    this.selectedElements = null;
    /** @type {string} */
    this.styleComboPrevValue = '';

    // Build the UI
    this.styleCombo = this.element.querySelector('.class-name-style-combo-box');
    this.pseudoClassCombo = this.element.querySelector('.pseudoclass-style-combo-box');
    this.mobileOnlyCheckbox = this.element.querySelector('.visibility-style-checkbox');
    this.pseudoClassCombo.onchange = e => {
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
    };
    this.mobileOnlyCheckbox.onchange = e => {
      // edit selected style
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
      // update pseudo class dropdown
      const styleData = this.model.property.getProdotypeData(this.styleCombo.value, Component.STYLE_TYPE) || {};
      this.populatePseudoClassCombo(styleData);
    };
    this.styleCombo.onchange = e => {
      // select elements which have this style
      // TODO: this is probably bad UX, unless we scroll to the element and open a page where it is visible
      const newSelection = this.getElementsWithStyle(this.styleCombo.value, false);
      this.model.body.setSelection(newSelection);
      // edit this style
      this.updateStyleList();
    };
    this.element.querySelector('.add-style').onclick = e => {
      this.createStyle();
    };
    this.element.querySelector('.remove-style').onclick = e => {
      // remove from elements
      this.model.component.getElementsAsArray('.' + this.styleCombo.value)
      .filter(el => this.model.element.getType(el) === 'text')
      .forEach(el => el.classList.remove(this.styleCombo.value));
      // delete from styles list
      this.deleteStyle(this.styleCombo.value);
    };
    this.element.querySelector('.apply-style').onclick = e => {
      this.selectedElements
      .filter(el => this.model.element.getType(el) === 'text')
      .forEach(element => {
        element.classList.add(this.styleCombo.value);
      });
      // refresh the view
      this.controller.propertyToolController.refreshView();
    };
    // un-apply style
    this.element.querySelector('.unapply-style').onclick = e => {
      this.selectedElements
      .filter(el => this.model.element.getType(el) === 'text')
      .forEach(element => {
        element.classList.remove(this.styleCombo.value);
      });
      // refresh the view
      this.controller.propertyToolController.refreshView();
    };
    // select elements which have this style
    this.selectionCountTotal = this.element.querySelector('.total');
    this.selectionCountTotal.onclick = e => {
      const newSelection = this.getElementsWithStyle(this.styleCombo.value, true);
      console.log('selectionCountTotal', newSelection);
      this.model.body.setSelection(newSelection);
    };
    // select only elements on this page
    this.selectionCountPage = this.element.querySelector('.on-page');
    this.selectionCountPage.onclick = e => {
      const newSelection = this.getElementsWithStyle(this.styleCombo.value, false);
      console.log('selectionCountPage', newSelection);
      this.model.body.setSelection(newSelection);
    };
    // duplicate a style
    this.element.querySelector('.duplicate-style').onclick = e => {
      this.createStyle(this.model.property.getProdotypeData(this.styleCombo.value, Component.STYLE_TYPE));
    };
    // reset style: this.model.component.initStyle(this.styleCombo.options[this.styleCombo.selectedIndex].text, this.styleCombo.value, this.getPseudoClass(), this.getVisibility());
    // rename style
    this.element.querySelector('.edit-style').onclick = e => {
      const oldClassName = this.styleCombo.value;
      const data = this.model.property.getProdotypeData(oldClassName, Component.STYLE_TYPE);
      this.createStyle(data, name => {
        // update the style name
        this.getElementsWithStyle(oldClassName, true)
        .forEach(el => {
          el.classList.add(this.styleCombo.value);
          el.classList.remove(oldClassName);
        });
        // delete the old one
        this.deleteStyle(oldClassName);
      });
    };
  }


  getElementsWithStyle(styleName, includeOffPage) {
    const newSelection = this.model.component.getElementsAsArray('.' + styleName)
    if(includeOffPage) return newSelection;
    else return newSelection
      .filter(el => this.model.page.isInPage(el) || this.model.page.getPagesForElement(el).length === 0);
  }


  getVisibility() {
    return Component.STYLE_VISIBILITY[this.mobileOnlyCheckbox.checked ? 1 : 0];
  }


  /**
   * redraw the properties
   * @param   {Array.<Element>} selectedElements the elements currently selected
   * @param   {Array.<string>} pageNames   the names of the pages which appear in the current HTML file
   * @param   {string}  currentPageName   the name of the current page
   */
  redraw(selectedElements, pageNames, currentPageName) {
    super.redraw(selectedElements, pageNames, currentPageName);

    // reuse selectedElements in combo box on change
    this.selectedElements = selectedElements;

    // FIXME: no need to recreate the whole style list every time the selection changes
    this.updateStyleList();
  }


  /**
   * update the list of styles
   */
  updateStyleList() {
    // keep the current selected style in the combo box
    const currentSelection = this.styleCombo.value;
    let currentSelectionFound = false;
    // reset the combo box
    this.styleCombo.innerHTML = '';
    // add all the existing styles to the dropdown list
    this.model.component.getProdotypeComponents(Component.STYLE_TYPE)
    .map(obj => {

      // create the combo box option
      const option = document.createElement('option');
      option.value = obj.className;
      option.innerHTML = obj.displayName;

      // keep the previous selection
      if(currentSelection === option.value) {
        currentSelectionFound = true;
      }
      return option;
    })
    // append options to the dom
    .forEach(option => this.styleCombo.appendChild(option));
    // set the new selection
    if(currentSelectionFound) {
      this.styleCombo.value = currentSelection;
    }
    if(this.styleCombo.value) {
      // populate combos
      const styleData = this.model.property.getProdotypeData(this.styleCombo.value, Component.STYLE_TYPE) || {};
      this.populatePseudoClassCombo(styleData);
      this.mobileOnlyCheckbox.disabled = false;
      this.pseudoClassCombo.disabled = false;
      // store prev value
      if(this.styleComboPrevValue !== this.styleCombo.value) {
        // reset state
        this.mobileOnlyCheckbox.checked = false;
        this.pseudoClassCombo.selectedIndex = 0;
      }
      this.styleComboPrevValue = this.styleCombo.value;
      // start editing the style with prodotype
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.getVisibility());

      // update selection count
      const total = this.getElementsWithStyle(this.styleCombo.value, true).length;
      const onPage = total === 0 ? 0 : this.getElementsWithStyle(this.styleCombo.value, false).length;
      this.selectionCountPage.innerHTML = `${ onPage } on this page (<span>select</span>),&nbsp;`;
      this.selectionCountTotal.innerHTML = `${ total } total (<span>select</span>)`;
    }
    else {
      this.model.component.resetSelection(Component.STYLE_TYPE);
      this.mobileOnlyCheckbox.checked = false;
      this.mobileOnlyCheckbox.disabled = true;
      this.pseudoClassCombo.innerHTML = '';
      this.pseudoClassCombo.disabled = true;
    }
  }


  /**
   * useful to mark combo elements with "*" when there is data there
   * @param {Object} styleData
   */
  populatePseudoClassCombo(styleData) {
    const visibilityData = styleData[this.getVisibility()];
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
   */
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


  /**
   * utility function to create a style in the style combo box or duplicate one
   * @param {?Object=} opt_data
   * @param {?function(?string=)=} opt_cbk
   */
  createStyle(opt_data, opt_cbk) {
    console.log('createStyle', opt_data)
    silex.utils.Notification.prompt('Enter a name for your style!', 'My Style',
      (accept, name) => {
        if(accept && name && name !== '') {
          const className = name.replace(/ /g, '-').toLowerCase();
          this.model.component.initStyle(name, className, this.getPseudoClass(), this.getVisibility(), opt_data);
          // FIXME: needed to select className but model.Component::initStyle calls refreshView which calls updateStyleList
          this.styleCombo.value = className;
          this.updateStyleList();
          //this.styleComboPrevValue = this.styleCombo.value;
          if(opt_cbk) opt_cbk(name);
        }
        else {
          if(opt_cbk) opt_cbk();
        }
      }
    );
  }


  /**
   * utility function to delete a style in the style
   */
  deleteStyle(name) {
    silex.utils.Notification.confirm(`I am about to delete the style <b>${ name }</b>!<br><br>Are you sure?`,
      (accept) => {
      if(accept) {
        const option = this.styleCombo.querySelector('option[value="' + name + '"]');
        if(option && option.value !== Component.BODY_STYLE_CSS_CLASS) {
          this.model.component.removeStyle(option.value);
          this.styleCombo.removeChild(option);
        }
      }
    });
  }
}
