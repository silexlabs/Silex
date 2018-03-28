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
 *   Components are based on Silex elements, but Prodotype renders a template in it
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
     * @type {Array.<string>}
     */
    Component.STYLE_VISIBILITY = ['desktop-mobile', 'mobile'];
    Component.STYLE_VISIBILITY_LABELS = ['Desktop+Mobile', 'Mobile'];

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
    this.model.property.setElementData(element, Component.COMPONENT_TYPE, {
      'name': name,
      'templateName': templateName,
    });
    // first rendering of the component
    this.render(element, () => {
      // update the dependencies once the component is added
      this.updateDepenedencies()
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

  renderType(element, type, opt_cbk) {
    const data = this.model.property.getElementData(element, type);
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
   * retrieve all dom elements containing the components or styles
   * @param {string} selector, CSS selector of the elements containing the components or styles
   * @return {Array.<Element>}
   */
  getElementsAsArray(selector) {
    // get all elements which are components
    const components = this.model.file.getContentDocument().querySelectorAll(selector);
    // make an array out of it
    var arr = [];
    for (let idx=0; idx < components.length; idx++) arr.push(components[idx]);
    return arr;
  }


  /**
   * @param {string} type, Component.COMPONENT_TYPE or Component.STYLE_TYPE
   * @return {Array.<{name:string, templateName:string, displayName:string}>}
   */
  getProdotypeComponents(type) {
    const className = type === Component.COMPONENT_TYPE ? Component.COMPONENT_CLASS_NAME : Component.STYLE_CLASS_NAME;
    return this.getElementsAsArray('.' + className).map(el => {
      const data = this.model.property.getProdotypeData(el.getAttribute('data-style-id'), type);
      const name = data['name'] || data['className'];
      const templateName = data['templateName'];
      return {
        'name': name,
        'templateName': templateName,
        'displayName': `${ name }`,
      };
    });
  }


  /**
   * update the dependencies of Prodotype components
   * FIXME: should have a callback to know if/when scripts are loaded
   */
  updateDepenedencies() {
    const head = this.model.head.getHeadElement();
    const components = this.getProdotypeComponents(Component.COMPONENT_TYPE).concat(this.getProdotypeComponents(Component.STYLE_TYPE));
    // remove unused dependencies (scripts and style sheets)
    const nodeList = this.model.head.getHeadElement().querySelectorAll('[data-dependency]');
    const elements = [];
    for(let idx=0; idx<nodeList.length; idx++) elements.push(nodeList[idx]);
    const unused = this.prodotypeComponent.getUnusedDependencies(
      elements,
      components
    );
    for(let idx=0; idx < unused.length; idx++) {
      const el = unused[idx];
      head.removeChild(el);
    };
    // add missing dependencies (scripts and style sheets)
    let missing = this.prodotypeComponent.getMissingDependencies(head, components);
    for(let idx=0; idx < missing.length; idx++) {
      const el = missing[idx];
      el.setAttribute('data-dependency', '');
      head.appendChild(el);
    };
  }


  /**
   * hide component editors
   */
  resetSelection() {
    if(this.prodotypeComponent) {
      this.prodotypeComponent.edit();
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
      const componentData = this.model.property.getElementData(element, Component.COMPONENT_TYPE);
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
              this.model.property.setElementData(element, Component.COMPONENT_TYPE, newData);
              // update the element with the new template
              this.model.element.setInnerHtml(element, html);
              // execute the scripts
              this.executeScripts(element);
              // put back the editable elements
              element.appendChild(tempElements);
            },
            'onBrowse': (e, cbk) => {
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
          });
      }
      this.componentEditorElement.classList.remove('hide-panel');
    }
    else {
      this.componentEditorElement.classList.add('hide-panel');
      this.resetSelection();
    }
  }

  removeStyle(className) {
    // undo checkpoint
    this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();

    // remove prodotype data from json object
    this.model.property.setProdotypeData(className, Component.STYLE_TYPE);

    // remove style from dom
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`)
    if(elStyle) {
      head.removeChild(elStyle);
    }
  }

  /**
   * @param {string} className, the css class to edit the style for
   * @param {string} pseudoClass, e.g. normal, :hover, ::first-letter
   * @param {string} visibility, e.g. mobile only, desktop and mobile...
   */
  editStyle(className, pseudoClass, visibility) {
    const styleData = this.model.property.getProdotypeData(className, Component.STYLE_TYPE) || {};
    const visibilityData = styleData[visibility] || {};
    const pseudoClassData = visibilityData[pseudoClass] || {
      'templateName': 'text',
      'className': className,
      'pseudoClass': pseudoClass,
    };
    this.prodotypeStyle.edit(
      pseudoClassData,
      [], // no need to have references to other styles
      'text',
      {
        'onChange': (newData, html) => this.styleChanged(className, pseudoClass, visibility, newData),
      }
    );
  }

  /**
   * save an empty style or reset a style
   * @param {string} className
   * @param {string} pseudoClass
   * @param {string} visibility
   * @param {?Object=} opt_data
   */
  initStyle(className, pseudoClass, visibility, opt_data) {
    this.styleChanged(className, pseudoClass, visibility, opt_data);
  }


  /**
   * apply the style to the dom and save it to the JSON object
   * @param {string} className
   * @param {string} pseudoClass
   * @param {string} visibility
   * @param {?Object=} opt_data
   */
  styleChanged(className, pseudoClass, visibility, opt_data) {
    // expose the class name and pseudo class to the prodotype template
    const newData = opt_data || {};
    newData['className'] = className;
    newData['pseudoClass'] = pseudoClass;

    // undo checkpoint
    this.view.settingsDialog.controller.settingsDialogController.undoCheckPoint();

    // store the component's data for later edition
    const data = this.model.property.getProdotypeData(className, Component.STYLE_TYPE) || {
      'className': className,
    };
    data[visibility] = data[visibility] || {};
    data[visibility][pseudoClass] = newData;
    this.model.property.setProdotypeData(className, Component.STYLE_TYPE, data);
    // update the head style with the new template
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`)
    if(!elStyle) {
      const doc = this.model.file.getContentDocument();
      elStyle = doc.createElement('style');
      elStyle.className = `${Component.STYLE_CLASS_NAME}`;
      elStyle.setAttribute('type', 'text/css');
      elStyle.setAttribute('data-style-id', className);
      head.appendChild(elStyle);
    }

    // render all pseudo classes in all visibility object
    const pseudoClassData = Component.STYLE_VISIBILITY
    // build an object for each existing visibility
    .map(visibility => { return {
      visibility: visibility,
      data: data[visibility],
    }})
    .filter(obj => !!obj.data)
    // build an object for each pseudoClass
    .map(vData => {
      const arrayOfPCData = [];
      for(let pcName in vData.data) {
        arrayOfPCData.push({
          visibility: vData.visibility,
          pseudoClass: pcName, /* unused, the data is in data */
          data: vData.data[pcName],
        });
      }
      return arrayOfPCData;
    })
    // flatten
    .reduce((acc, val) => acc.concat(val), []);

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
   * @param {string} visibility
   */
  addMediaQuery(html, visibility) {
    if(visibility === Component.STYLE_VISIBILITY[0]) {
      return html;
    }
    return this.model.property.addMediaQuery(html);
  }
}
