

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
    this.visibilityCombo = this.element.querySelector('.visibility-style-combo-box');
    this.pseudoClassCombo.onchange = e => {
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
    };
    this.visibilityCombo.onchange = e => {
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
      this.populatePseudoClassCombo();
    };
    this.styleCombo.onchange = e => {
      // named style can be applyed
      // not named style change selection
      const newStyledElement = this.model.property.getElementBySilexId(this.styleCombo.value);
      if(newStyledElement) {
        // TODO: this is probably bad UX, unless we scroll to the element and open a page where it is visible
        this.model.body.setSelection([newStyledElement]);
      }
      else {
        // here the user is trying to apply a named style to the selection
        // remove the old style
        const oldStyledElement = this.model.property.getElementBySilexId(this.styleComboPrevValue);
        if(oldStyledElement) {
          // this was a style for only the selected element
          this.deleteStyle(this.styleComboPrevValue);
        }
        else {
          // this was a named style
          this.selectedElements.forEach(element => {
            element.classList.remove(this.styleComboPrevValue);
          });
        }
        // add the new style
        this.selectedElements.forEach(element => {
          element.classList.add(this.styleCombo.value);
        });
        // store for next change
        this.styleComboPrevValue = this.styleCombo.value;
        // edit the selected style
        this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
        // refresh the view
        this.controller.propertyToolController.refreshView();
      }
    };
    /*
    this.element.querySelector('.add-style').onclick = e => {
      this.createStyle();
    };
    this.element.querySelector('.remove-style').onclick = e => {
      this.deleteStyle(this.styleCombo.value);
    };
    this.element.querySelector('.reset-style').onclick = e => {
      this.model.component.initStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
    };
    this.element.querySelector('.duplicate-style').onclick = e => {
      this.createStyle(this.model.property.getProdotypeData(this.styleCombo.value, Component.STYLE_TYPE));
    };
    this.element.querySelector('.edit-style').onclick = e => {
      const value = this.styleCombo.value;
      // create the new style
      this.createStyle(this.model.property.getProdotypeData(value, Component.STYLE_TYPE), name => {
        // delete the old one
        this.deleteStyle(value);
      });
    };
    */
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

    // make sure we have something to edit
    if(selectedElements.length > 0) {
      const allStyles = this.model.component.getProdotypeComponents(Component.STYLE_TYPE);
      // get the selected elements style, i.e. which style applies to them
      const selectionStyle = (() => {
        // get the class names common to the selection
        var classNames = selectedElements
        // from array of elements to array of array of classNames
        .map(element => element.className.split(' ').filter(className => className != ''))
        // to array of class names in common to all selected elements
        .reduce((prev, classNames, currentIndex) => {
          return prev.filter(prevClassName => classNames.includes(prevClassName));
        }) // no initial value so the first element in the array will be used, it will start with the 2nd element
        // keep only the styles defined in the style editor
        .filter(className => allStyles.find(style => style.name === className));
        // choose the style to edit
        switch(classNames.length) {
          case 0:
            if(selectedElements.length === 1) {
              const styledElement = selectedElements[0];
              const styleName = this.model.property.getSilexId(styledElement);
              return {
                name: styleName,
                displayName: this.getDisplayName(styledElement),
                templateName: 'text',
                exists: false,
              }
            }
            else {
              console.warn('what style should I create => no style editor, should never happen?');
              return null;
            }
            break;
          case 1:
            return {
              name: classNames[0],
              displayName: 'Will be replaced in redraw',
              templateName: 'text',
              exists: true,
            }
            break;
          default:
            console.error('multiple style found, WTF?');
            return null;
        }
      })()
      // keep the current selected style in the combo box
      const currentSelection = this.styleCombo.value;
      let currentSelectionFound = false;
      // reset the combo box
      this.styleCombo.innerHTML = '';
      // add the selection's style to the combo box if it is a new style
      (selectionStyle && !selectionStyle.exists ? [selectionStyle] : [])
      // add all the existing styles
      .concat(allStyles)
      .map(obj => {
        // display of elements styles
        const styledElement = this.model.property.getElementBySilexId(obj.name);
        if(styledElement) {
          obj.displayName = this.getDisplayName(styledElement);
        }

        // create the combo box options
        const option = document.createElement('option');
        option.value = obj.name;
        option.innerHTML = obj.displayName;

        // select the current selection's style
        // or keep the previous selection
        if((selectionStyle && selectionStyle.name === option.value) ||
          currentSelection === option.value)
          currentSelectionFound = true;
        return option;
      })
      // append options to the dom
      .forEach(option => this.styleCombo.appendChild(option));
      // set the new selection
      if(currentSelectionFound) {
        if(selectionStyle)
          this.styleCombo.value = selectionStyle.name;
        else
          this.styleCombo.value = currentSelection;
      }
      if(this.styleComboPrevValue !== this.styleCombo.value) {
        // reset state
        this.visibilityCombo.selectedIndex = 0;
        this.pseudoClassCombo.selectedIndex = 0;
      }
      // populate combos
      this.populatePseudoClassCombo();
      this.populateVisibilityCombo();
      // store prev value
      this.styleComboPrevValue = this.styleCombo.value;
      // start editing the style with prodotype
      this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
    }
  }


  /**
   * useful to mark combo elements with "*" when there is data there
   */
  populateVisibilityCombo() {
    // get selection data
    const className = this.styleCombo.value;
    const styleData = this.model.property.getProdotypeData(className, Component.STYLE_TYPE) || {};
    // populate visibility class combo
    const selectedIndex = this.visibilityCombo.selectedIndex;
    this.visibilityCombo.innerHTML = '';
    Component.STYLE_VISIBILITY
    .map((visibility, idx) => {
      // create the combo box options
      const option = document.createElement('option');
      option.value = visibility;
      option.innerHTML = Component.STYLE_VISIBILITY_LABELS[idx] + (!!styleData && !!styleData[visibility] ? ' *' : '');
      return option;
    })
    // append options to the dom
    .forEach(option => this.visibilityCombo.appendChild(option));
    // keep selection
    this.visibilityCombo.selectedIndex = selectedIndex;
  }


  /**
   * useful to mark combo elements with "*" when there is data there
   */
  populatePseudoClassCombo() {
    // get selection data
    const className = this.styleCombo.value;
    const styleData = this.model.property.getProdotypeData(className, Component.STYLE_TYPE) || {};
    const visibilityData = styleData[this.visibilityCombo.value];
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
    silex.utils.Notification.prompt('Enter a name for your style!', 'My Style',
      (accept, name) => {
        if(accept && name && name !== '') {
          const option = document.createElement('option');
          option.value = name.replace(/ /g, '-').toLowerCase();
          option.innerHTML = name;
          this.styleCombo.appendChild(option);
          this.styleCombo.value = option.value;
          this.styleComboPrevValue = this.styleCombo.value;
          this.model.component.initStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value, opt_data);
          this.model.component.editStyle(this.styleCombo.value, this.getPseudoClass(), this.visibilityCombo.value);
          silex.utils.Notification.alert(`I have created your new style, please add ${ option.value } to <a href="${ silex.Config.WIKI_SILEX_CUSTOM_CSS_CLASS }" target="_blank">your elements' css class name, click here for help</a>.`, () => {
            if(opt_cbk) opt_cbk(name);
          });
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
    const option = this.styleCombo.querySelector('option[value="' + name + '"]');
    if(option && option.value !== silex.view.PropertyTool.GLOBAL_STYLE_CLASS_NAME) {
      this.model.component.removeStyle(option.value);
      this.styleCombo.removeChild(option);
    }
  }
}
