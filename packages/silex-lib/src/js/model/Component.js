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
 * @fileoverview
 *   This class is used to manage Prodotype components
 *   Components are based on Silex elements, use Prodotype to render a templates
 */

goog.provide('silex.model.Component');

/**
 * Manage Prodotype components and styles
 *
 * @class {silex.model.Component}
 */
class Component {

  /**
   * @param  {silex.types.Model} model  model class which holds the other models
   * @param  {silex.types.View} view  view class which holds the other views
   */
  constructor(model, view) {
    Component.COMPONENT_CLASS_NAME = 'silex-component';
    Component.STYLE_CLASS_NAME = 'silex-prodotype-style';


    Component.BODY_STYLE_NAME = 'All style';
    Component.BODY_STYLE_CSS_CLASS = 'all-style';

    Component.EMPTY_STYLE_CLASS_NAME = 'empty-style-class-name';
    Component.EMPTY_STYLE_DISPLAY_NAME = '';

    /**
     * @type {string}
     */
    Component.COMPONENT_TYPE = 'component';

    /**
     * @type {string}
     */
    Component.STYLE_TYPE = 'style';

    /**
     * possible visibility for the styles
     * @type {Array.<silex.model.data.Visibility>}
     */
    Component.STYLE_VISIBILITY = ['desktop', 'mobile'];

    // store the model and the view
    /**
     * @type {silex.types.Model}
     */
    this.model = model;
    /**
     * @type {silex.types.View}
     */
    this.view = view;
    /**
     * @type {Prodotype}
     */
    this.prodotypeComponent = null;
    /**
     * @type {Prodotype}
     */
    this.prodotypeStyle = null;
    /**
     * @type {Element}
     */
    this.componentEditorElement = null;
    /**
     * @type {Element}
     */
    this.styleEditorElement = null;

    /**
     * @type {Array.<function(?Object)>}
     */
    this.readyCbkArr = [];
  }


  /**
   * load the Prodotype library
   */
  init(componentEditorElement, styleEditorElement) {
    this.componentEditorElement = componentEditorElement;
    this.styleEditorElement = styleEditorElement;
    this.prodotypeComponent = new window['Prodotype'](componentEditorElement, './libs/prodotype/components');
    this.prodotypeStyle = new window['Prodotype'](styleEditorElement, './libs/prodotype/styles');
    this.prodotypeComponent.ready(err => {
      this.readyCbkArr.forEach(cbk => cbk(err));
      this.readyCbkArr = [];
    });
  }


  /**
   * notify when Prodotype library is ready
   * @param {function(?Object)} cbk callback to be called when prodotype is ready
   */
  ready(cbk) {
    if(this.prodotypeComponent) this.prodotypeComponent.ready(err => cbk(err));
    else this.readyCbkArr.push(cbk);
  }


  /**
   * check existance and possibly create the body style if it is missing
   * @param {Document} doc docment of the iframe containing the website
   */
  initStyles(doc) {
    const element = doc.body;
    // make sure that the style exists
    const styleData = this.model.property.getStyleData(Component.BODY_STYLE_CSS_CLASS);
    if(!styleData) {
      this.initStyle(Component.BODY_STYLE_NAME, Component.BODY_STYLE_CSS_CLASS, null);
    }
    // make sure that body has the style
    element.classList.add(Component.BODY_STYLE_CSS_CLASS);
  }


  /**
   * not needed? we sometimes use !!this.model.property.getElementData(element, Component.COMPONENT_TYPE)
   * @param {Element} el
   * @return {boolean} true if el is a component (not only an element)
   */
  isComponent(el) {
    return el.classList.contains(Component.COMPONENT_CLASS_NAME);
  }


  /**
   * get Prodotype descriptor of the components
   * @param {string} type
   * @return {ProdotypeCompDef} component descriptors
   */
  getComponentsDef(type) {
    const obj = type === Component.COMPONENT_TYPE ? this.prodotypeComponent : this.prodotypeStyle;
    return obj ? obj.componentsDef : /** @type {ProdotypeCompDef} */ ({});
  }


  /**
   * @param {Element} element component just added
   * @param {string} templateName type of component
   */
  initComponent(element, templateName) {
    const name = this.prodotypeComponent.createName(templateName, this.getProdotypeComponents(Component.COMPONENT_TYPE));
    // for selection (select all components)
    element.classList.add(Component.COMPONENT_CLASS_NAME);
    // for styles (select buttons and apply a style)
    this.model.property.setElementComponentData(element, {
      'name': name,
      'templateName': templateName,
    });
    // first rendering of the component
    this.render(element, () => {
      // update the dependencies once the component is added
      this.updateDepenedencies(Component.COMPONENT_TYPE);
    });
    // css styles
    const componentsDef = this.getComponentsDef(Component.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    if(comp) {
      // apply the style found in component definition
      if(comp.initialCss) {
        this.applyStyleTo(element, comp.initialCss);
      }
      // same for the container inside the element (content node)
      if(comp.initialCssContentContainer) {
        this.applyStyleTo(this.model.element.getContentNode(element), comp.initialCssContentContainer);
      }
      // same for CSS classes to apply
      // apply the style found in component definition
      // this includes the css class of the component (component-templateName)
      const cssClasses = this.getCssClasses(templateName)
      if(cssClasses) {
        const oldClassName = this.model.element.getClassName(element);
        this.model.element.setClassName(element, oldClassName + ' ' + cssClasses.join(' '));
      }
    }

  }


  /**
   * render the component
   * this is made using prodotype
   * the template is expanded with the data we have for this component
   * used when the component is created, or duplicated (paste)
   * @param {Element} element component to render
   * @param {?function()=} opt_cbk
   */
  render (element, opt_cbk) {
    this.renderType(element, Component.COMPONENT_TYPE, () => {
      this.renderType(element, Component.STYLE_TYPE, opt_cbk);
    });
  }

  getProdotype(type) {
    switch(type) {
      case Component.COMPONENT_TYPE: return this.prodotypeComponent;
      case Component.STYLE_TYPE: return this.prodotypeStyle;
      default: throw('Unknown type in renderType');
    }
  }


  /**
   * render a component or style
   * @param  {Element} element
   * @param  {silex.model.data.SilexId|silex.model.data.StyleName} type
   * @param {?function()=} opt_cbk
   */
  renderType(element, type, opt_cbk) {
    const data = (type === Component.COMPONENT_TYPE ? this.model.property.getElementComponentData(element) : this.model.property.getElementStyleData(element));
    if(data) {
      const templateName = data['templateName'];
      const prodotype = this.getProdotype(type);

      prodotype.decorate(templateName, data)
      .then(html => {
        this.model.element.setInnerHtml(element, html);
        // notify the owner
        if(opt_cbk) opt_cbk();
        // execute the scripts
        // FIXME: should exec scripts only after dependencies are loaded
        this.executeScripts(element);
      });
    }
    else if(opt_cbk) opt_cbk();
  }

  /**
   * get all CSS classes set on this component when it is created
   * this includes the css class of the component (component-templateName)
   * @param  {string} templateName the component's template name
   * @return {Array.<string>} an array of CSS classes
   */
  getCssClasses (templateName) {
    const componentsDef = this.getComponentsDef(Component.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    let cssClasses = [Component.COMPONENT_CLASS_NAME + '-'  + templateName];
    if(comp) {
      // class name is either an array
      // or a string or null
      switch(typeof comp.initialCssClass) {
        case 'undefined':
        break;
        case 'string': cssClasses = cssClasses.concat(comp.initialCssClass.split(' '));
        break;
        default: cssClasses = cssClasses.concat(comp.initialCssClass);
      }
    } else {
      console.error(`Error: component's definition not found in prodotype templates, with template name "${ templateName }".`);
    }
    return cssClasses;
  }


  /**
   * eval the scripts found in an element
   * this is useful when we render a template, since the scripts are executed only when the page loads
   * @param  {Element} element
   */
  executeScripts (element) {
    // execute the scripts
    const scripts = element.querySelectorAll('script');
    for(let idx=0; idx<scripts.length; idx++) {
      this.model.file.getContentWindow().eval(scripts[idx].innerText);
    }
  }


  /**
   * apply a style to an element
   * @param  {Element} element
   * @param  {!Object} styleObj
   */
  applyStyleTo (element, styleObj) {
    const style = this.model.property.getStyle(element, false) || {};
    for(let name in styleObj) {
      style[name] = styleObj[name];
    }
    this.model.property.setStyle(element, style, false);
  }


  /**
   * @param {string} type, Component.COMPONENT_TYPE or Component.STYLE_TYPE
   * @return {Array<silex.model.data.ComponentData|silex.model.data.StyleData>}
   */
  getProdotypeComponents(type) {
    const className = type === Component.COMPONENT_TYPE ? Component.COMPONENT_CLASS_NAME : Component.STYLE_CLASS_NAME;
    const attrName = type === Component.COMPONENT_TYPE ? silex.model.Property.ELEMENT_ID_ATTR_NAME : 'data-style-id';
    return silex.utils.Dom.getElementsAsArray(this.model.file.getContentDocument(), '.' + className).map(el => {
      const attr = el.getAttribute(attrName);
      const data = (type === Component.COMPONENT_TYPE ? this.model.property.getComponentData(attr) : this.model.property.getStyleData(attr));
      return data;
    }).filter(data => !!data);
  }


  /**
   * update the dependencies of Prodotype components
   * FIXME: should have a callback to know if/when scripts are loaded
   * @param {string} type, Component.COMPONENT_TYPE or Component.STYLE_TYPE
   */
  updateDepenedencies(type) {
    const head = this.model.head.getHeadElement();
    const components = this.getProdotypeComponents(type);
    const prodotype = this.getProdotype(type);


    // remove unused dependencies (scripts and style sheets)
    const nodeList = this.model.head.getHeadElement().querySelectorAll('[data-dependency]');
    const elements = [];
    for(let idx=0; idx<nodeList.length; idx++) elements.push(nodeList[idx]);
    const unused = prodotype.getUnusedDependencies(
      elements,
      components
    );
    for(let idx=0; idx < unused.length; idx++) {
      const el = unused[idx];
      head.removeChild(el);
    };
    // add missing dependencies (scripts and style sheets)
    let missing = prodotype.getMissingDependencies(head, components);
    for(let idx=0; idx < missing.length; idx++) {
      const el = missing[idx];
      el.setAttribute('data-dependency', '');
      head.appendChild(el);
    };
  }


  /**
   * hide component editors
   * @param {string} type
   */
  resetSelection(type) {
    if(type === Component.COMPONENT_TYPE) {
      if(this.prodotypeComponent) {
        this.prodotypeComponent.edit();
      }
    }
    else {
      if(this.prodotypeStyle) {
        this.prodotypeStyle.edit();
      }
    }
  }


  /**
   * remove the editable elements from an HTML element and store them in an HTML fragment
   * @param {Element} parentElement, the element whose children we want to save
   * @return {DocumentFragment} an HTML fragment with the editable children in it
   */
  saveEditableChildren(parentElement) {
    const fragment = document.createDocumentFragment();
    for(let i = 0, el; el = parentElement.children[i]; i++) {
      if(el.classList.contains('editable-style')) {
        fragment.appendChild(el.cloneNode(true));
      }
    }
    return fragment;
  }


  /**
   * @param {Element} element, the component to edit
   */
  editComponent(element) {
    if(this.isComponent(element)) {
      const componentData = this.model.property.getElementComponentData(element);
      if(element && this.prodotypeComponent && componentData) {
        this.prodotypeComponent.edit(
          componentData,
          this.getProdotypeComponents(Component.COMPONENT_TYPE),
          componentData['templateName'],
          {
            'onChange': (newData, html) => {
              // undo checkpoint
              this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();
              // remove the editable elements temporarily
              const tempElements = this.saveEditableChildren(element);
              // store the component's data for later edition
              this.model.property.setElementComponentData(element, newData);
              // update the element with the new template
              this.model.element.setInnerHtml(element, html);
              // execute the scripts
              this.executeScripts(element);
              // put back the editable elements
              element.appendChild(tempElements);
            },
            'onBrowse': (e, cbk) => this.onBrowse(e, cbk),
          });
      }
      this.componentEditorElement.classList.remove('hide-panel');
    }
    else {
      this.componentEditorElement.classList.add('hide-panel');
      this.resetSelection(Component.COMPONENT_TYPE);
    }
  }

  /**
   * @param {Event} e
   * @param {function(Array.<FileInfo>)} cbk
   */
  onBrowse(e, cbk) {
    e.preventDefault();
    // browse with CE
    const promise = this.view.fileExplorer.openFile();
    // add tracking and undo/redo checkpoint
    this.view.settingsDialog.controller.settingsDialogController.track(promise, 'prodotype.browse');
    this.view.settingsDialog.controller.settingsDialogController.undoredo(promise);
    // handle the result
    promise.then(fileInfo => {
      if(fileInfo) {
        cbk([{
          'url': fileInfo.absPath,
          'lastModified': fileInfo.lastModified,
          'lastModifiedDate': new Date(fileInfo.lastModified),
          'name': fileInfo.name,
          'size': fileInfo.size,
          'type': fileInfo.type,
        }]);
      }
    })
    .catch(error => {
      silex.utils.Notification.notifyError(
        'Error: I could not select the file. <br /><br />' +
        (error.message || ''));
    });
  }

  removeStyle(className) {
    // undo checkpoint
    this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();

    // remove prodotype data from json object
    this.model.property.setStyleData(className);

    // remove style from dom
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`)
    if(elStyle) {
      head.removeChild(elStyle);
    }

    // update dependencies
    this.updateDepenedencies(Component.STYLE_TYPE);
  }

  /**
   * @param {silex.model.data.StyleName} className, the css class to edit the style for
   * @param {silex.model.data.PseudoClass} pseudoClass, e.g. normal, :hover, ::first-letter
   * @param {silex.model.data.Visibility} visibility, e.g. mobile only, desktop and mobile...
   */
  editStyle(className, pseudoClass, visibility) {
    const styleData = this.model.property.getStyleData(className) || { 'styles': {} };
    const visibilityData = styleData['styles'][visibility] || {};
    const pseudoClassData = visibilityData[pseudoClass] || {
      'templateName': 'text',
      'className': className,
      'pseudoClass': pseudoClass,
    };
    this.prodotypeStyle.edit(
      pseudoClassData,
      [{
        displayName: '',
        name: '',
        templateName: '',
      }].concat(this.model.property.getFonts()).map(font => {
        return {
          displayName: font.family,
          name: font.family,
          templateName: '',
        };
      }),
      'text',
      {
        'onChange': (newData, html) => this.styleChanged(className, pseudoClass, visibility, newData),
        'onBrowse': (e, cbk) => this.onBrowse(e, cbk),
      }
    );
  }

  /**
   * save an empty style or reset a style
   * @param {string} displayName
   * @param {silex.model.data.StyleName} className
   * @param {?silex.model.data.StyleData=} opt_data
   */
  initStyle(displayName, className, opt_data) {
    // render all pseudo classes in all visibility object
    this.getPseudoClassData(opt_data || /** @type {silex.model.data.StyleData} */ ({'styles': { 'desktop': {'normal': {}}}}))
    .forEach(pseudoClassData => {
      this.styleChanged(className, pseudoClassData['pseudoClass'], pseudoClassData['visibility'], pseudoClassData['data'], displayName);
    });
    this.updateDepenedencies(Component.STYLE_TYPE);
  }


  /**
   * build an array of all the data we provide to Prodotype for the "text" template
   * @param  {silex.model.data.StyleData} styleData
   * @return {Array<{visibility: silex.model.data.Visibility, pseudoClass: silex.model.data.PseudoClass, data: silex.model.data.PseudoClassData}>}
   */
  getPseudoClassData(styleData) {
    // return all pseudo classes in all visibility object
    return Component.STYLE_VISIBILITY
    // build an object for each existing visibility
    .map(visibility => { return {
      'visibility': visibility,
      'data': styleData['styles'][visibility],
    }})
    .filter(obj => !!obj['data'])
    // build an object for each pseudoClass
    .map(vData => {
      const arrayOfPCData = [];
      for(let pcName in vData.data) {
        arrayOfPCData.push({
          'visibility': vData['visibility'],
          'pseudoClass': pcName, /* unused, the data is in data */
          'data': vData.data[pcName],
        });
      }
      return arrayOfPCData;
    })
    // flatten
    .reduce((acc, val) => acc.concat(val), []);
  }


  /**
   * apply the style to the dom and save it to the JSON object
   * @param {silex.model.data.StyleName} className
   * @param {silex.model.data.PseudoClass} pseudoClass
   * @param {silex.model.data.Visibility} visibility
   * @param {?silex.model.data.PseudoClassData=} opt_data
   * @param {?string=} opt_displayName
   */
  styleChanged(className, pseudoClass, visibility, opt_data, opt_displayName) {
    // create a new style if needed
    if(className === Component.EMPTY_STYLE_CLASS_NAME) {
      const textBoxes = this.model.body.getSelection().filter(el => this.model.element.getType(el) === 'text');
      if(textBoxes.length > 0) {
        // create a new unique name
        const allStyles = this.getProdotypeComponents(Component.STYLE_TYPE);
        const baseDisplayName = textBoxes.length === 1 ? 'Text Style ' : 'Group Style ';
        const baseClassName = textBoxes.length === 1 ? 'text-style-' : 'group-style-';
        let idx = 1;
        while(allStyles.find(obj => obj['className'] === baseClassName + idx.toString())) idx++;
        opt_displayName = baseDisplayName + idx;
        className = baseClassName + idx;
        // apply to the selection
        textBoxes.forEach(element => element.classList.add(className));
      }
    }

    // expose the class name and pseudo class to the prodotype template
    const newData = opt_data || {};
    newData['className'] = className;
    newData['pseudoClass'] = pseudoClass;

    // undo checkpoint
    this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();

    // store the component's data for later edition
    const styleData = /** @type {silex.model.data.StyleData} */ (this.model.property.getStyleData(className) || {
      'className': className,
      'templateName': 'text',
      'displayName': opt_displayName,
      'styles': {},
    });
    if(!styleData['styles'][visibility]) styleData['styles'][visibility] = {};
    styleData['styles'][visibility][pseudoClass] = newData;
    this.model.property.setStyleData(className, styleData);
    // update the head style with the new template
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`)
    if(!elStyle) {
      const doc = this.model.file.getContentDocument();
      elStyle = doc.createElement('style');
      elStyle.className = Component.STYLE_CLASS_NAME;
      elStyle.setAttribute('type', 'text/css');
      elStyle.setAttribute('data-style-id', className);
      head.appendChild(elStyle);
    }

    // render all pseudo classes in all visibility object
    const pseudoClassData = this.getPseudoClassData(styleData);

    if(pseudoClassData.length > 0) {
      Promise.all(
        pseudoClassData
        .map(obj => {
          return this.prodotypeStyle.decorate('text', obj.data)
          .then(html => this.addMediaQuery(html, obj.visibility))
        })
      )
      .then(htmlStrings => {
        elStyle.innerHTML = htmlStrings.join('');
      });
    }
    // refresh the view
    this.view.settingsDialog.controller.propertyToolController.refreshView();
  }

  /**
   * add a media query around the style string
   * when needed for mobile-only
   * @param {string} html
   * @param {silex.model.data.Visibility} visibility
   */
  addMediaQuery(html, visibility) {
    if(visibility === Component.STYLE_VISIBILITY[0]) {
      return html;
    }
    return this.model.property.addMediaQuery(html);
  }
}
