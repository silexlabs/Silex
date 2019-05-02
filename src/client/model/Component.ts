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

import { Prodotype, ProdotypeCompDef } from '../externs';
import { Model, View } from '../types';
import { ComponentData, PseudoClass, PseudoClassData, SilexId, StyleData, StyleName, Visibility } from './Data';
import { Constants } from '../../Constants';

/**
 * Manage Prodotype components and styles
 *
 * @class {silex.model.Component}
 */
export class Component {
  prodotypeComponent: Prodotype = null;
  prodotypeStyle: Prodotype = null;
  componentEditorElement: HTMLElement = null;
  styleEditorElement: HTMLElement = null;
  readyCbkArr: ((p1: Object) => any)[] = [];

  /**
   * @param model  model class which holds the other models
   * @param view  view class which holds the other views
   */
  constructor(public model: Model, public view: View) {}

  /**
   * load the Prodotype library
   */
  init(componentEditorElement, styleEditorElement) {
    this.componentEditorElement = componentEditorElement;
    this.styleEditorElement = styleEditorElement;
    this.prodotypeComponent = new window['Prodotype'](
        componentEditorElement, './prodotype/components');
    this.prodotypeStyle =
        new window['Prodotype'](styleEditorElement, './prodotype/styles');
    this.prodotypeComponent.ready((err) => {
      this.readyCbkArr.forEach((cbk) => cbk(err));
      this.readyCbkArr = [];
    });
  }

  /**
   * notify when Prodotype library is ready
   * @param cbk callback to be called when prodotype is ready
   */
  ready(cbk: (p1: Object) => any) {
    if (this.prodotypeComponent) {
      this.prodotypeComponent.ready((err) => cbk(err));
    } else {
      this.readyCbkArr.push(cbk);
    }
  }

  /**
   * check existance and possibly create the body style if it is missing
   * @param doc docment of the iframe containing the website
   */
  initStyles(doc: Document) {
    const element = doc.body;

    // make sure that the style exists
    const styleData =
        this.model.property.getStyleData(Constants.BODY_STYLE_CSS_CLASS);
    if (!styleData) {
      this.initStyle(Constants.BODY_STYLE_NAME, Constants.BODY_STYLE_CSS_CLASS, null);
    }

    // make sure that body has the style
    element.classList.add(Constants.BODY_STYLE_CSS_CLASS);
  }

  /**
   * not needed? we sometimes use !!this.model.property.getElementData(element,
   * Constants.COMPONENT_TYPE)
   * @return true if el is a component (not only an element)
   */
  isComponent(el: HTMLElement): boolean {
    return el.classList.contains(Constants.COMPONENT_CLASS_NAME);
  }

  /**
   * get Prodotype descriptor of the components
   * @return component descriptors
   */
  getComponentsDef(type: string): ProdotypeCompDef {
    const obj = type === Constants.COMPONENT_TYPE ? this.prodotypeComponent :
                                                    this.prodotypeStyle;
    return obj ? obj.componentsDef : ({} as ProdotypeCompDef);
  }

  /**
   * @param element component just added
   * @param templateName type of component
   */
  initComponent(element: HTMLElement, templateName: string) {
    const name = this.prodotypeComponent.createName(
        templateName, this.getProdotypeComponents(Constants.COMPONENT_TYPE));

    // for selection (select all components)
    element.classList.add(Constants.COMPONENT_CLASS_NAME);

    // for styles (select buttons and apply a style)
    this.model.property.setElementComponentData(element, {'name': name, 'templateName': templateName});

    // first rendering of the component
    this.render(element, () => {
      // update the dependencies once the component is added
      this.updateDepenedencies(Constants.COMPONENT_TYPE);
    });

    // css styles
    const componentsDef = this.getComponentsDef(Constants.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    if (comp) {
      // apply the style found in component definition
      if (comp.initialCss) {
        this.applyStyleTo(element, comp.initialCss);
      }

      // same for the container inside the element (content node)
      if (comp.initialCssContentContainer) {
        this.applyStyleTo(
            this.model.element.getContentNode(element),
            comp.initialCssContentContainer);
      }

      // same for CSS classes to apply
      // apply the style found in component definition
      // this includes the css class of the component (component-templateName)
      const cssClasses = this.getCssClasses(templateName);
      if (cssClasses) {
        const oldClassName = this.model.element.getClassName(element);
        this.model.element.setClassName(
            element, oldClassName + ' ' + cssClasses.join(' '));
      }
    }
  }

  /**
   * render the component
   * this is made using prodotype
   * the template is expanded with the data we have for this component
   * used when the component is created, or duplicated (paste)
   * @param element component to render
   */
  render(element: HTMLElement, opt_cbk?: (() => any)) {
    this.renderType(element, Constants.COMPONENT_TYPE, () => {
      this.renderType(element, Constants.STYLE_TYPE, opt_cbk);
    });
  }

  getProdotype(type) {
    switch (type) {
      case Constants.COMPONENT_TYPE:
        return this.prodotypeComponent;
      case Constants.STYLE_TYPE:
        return this.prodotypeStyle;
      default:
        throw 'Unknown type in renderType';
    }
  }

  /**
   * render a component or style
   */
  renderType(
      element: HTMLElement, type: SilexId|StyleName,
      opt_cbk?: (() => any)) {
    const data = type === Constants.COMPONENT_TYPE ?
        this.model.property.getElementComponentData(element) :
        this.model.property.getElementStyleData(element);
    if (data) {
      const templateName = data['templateName'];
      const prodotype = this.getProdotype(type);
      prodotype.decorate(templateName, data).then((html) => {
        this.model.element.setInnerHtml(element, html);

        // notify the owner
        if (opt_cbk) {
          opt_cbk();
        }

        // execute the scripts
        // FIXME: should exec scripts only after dependencies are loaded
        this.executeScripts(element);
      });
    } else {
      if (opt_cbk) {
        opt_cbk();
      }
    }
  }

  /**
   * get all CSS classes set on this component when it is created
   * this includes the css class of the component (component-templateName)
   * @param templateName the component's template name
   * @return an array of CSS classes
   */
  getCssClasses(templateName: string): string[] {
    const componentsDef = this.getComponentsDef(Constants.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    let cssClasses = [Constants.COMPONENT_CLASS_NAME + '-' + templateName];
    if (comp) {
      // class name is either an array
      // or a string or null
      switch (typeof comp.initialCssClass) {
        case 'undefined':
          break;
        case 'string':
          cssClasses = cssClasses.concat(comp.initialCssClass.split(' '));
          break;
        default:
          cssClasses = cssClasses.concat(comp.initialCssClass);
      }
    } else {
      console.error(
          `Error: component's definition not found in prodotype templates, with template name "${
              templateName}".`);
    }
    return cssClasses;
  }

  /**
   * eval the scripts found in an element
   * this is useful when we render a template, since the scripts are executed
   * only when the page loads
   */
  executeScripts(element: HTMLElement) {
    // execute the scripts
    const scripts = element.querySelectorAll('script');
    for (let idx = 0; idx < scripts.length; idx++) {
      this.model.file.getContentWindow()['eval'](scripts[idx].innerText);
    }
  }

  /**
   * apply a style to an element
   */
  applyStyleTo(element: HTMLElement, styleObj: Object) {
    const style = this.model.property.getStyle(element, false) || {};
    for (let name in styleObj) {
      style[name] = styleObj[name];
    }
    this.model.property.setStyle(element, style, false);
  }

  /**
   * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
   */
  getProdotypeComponents(type: string): Array<ComponentData|StyleData> {
    const className = type === Constants.COMPONENT_TYPE ? Constants.COMPONENT_CLASS_NAME : Constants.STYLE_CLASS_NAME;
    const attrName = type === Constants.COMPONENT_TYPE ? Constants.ELEMENT_ID_ATTR_NAME : 'data-style-id';
    return Array.from(this.model.file.getContentDocument().querySelectorAll('.' + className))
    .map((el) => {
      const attr = el.getAttribute(attrName);
      const data = type === Constants.COMPONENT_TYPE ? this.model.property.getComponentData(attr) : this.model.property.getStyleData(attr);
      return data;
    })
    .filter((data) => !!data);
  }

  /**
   * update the dependencies of Prodotype components
   * FIXME: should have a callback to know if/when scripts are loaded
   * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
   */
  updateDepenedencies(type: string) {
    const head = this.model.head.getHeadElement();
    const components = this.getProdotypeComponents(type);
    const prodotype = this.getProdotype(type);

    // remove unused dependencies (scripts and style sheets)
    const nodeList =
        this.model.head.getHeadElement().querySelectorAll('[data-dependency]');
    const elements = [];
    for (let idx = 0; idx < nodeList.length; idx++) {
      elements.push(nodeList[idx]);
    }
    const unused = prodotype.getUnusedDependencies(elements, components);
    for (let idx = 0; idx < unused.length; idx++) {
      const el = unused[idx];
      head.removeChild(el);
    }

    // add missing dependencies (scripts and style sheets)
    let missing = prodotype.getMissingDependencies(head, components);
    for (let idx = 0; idx < missing.length; idx++) {
      const el = missing[idx];
      el.setAttribute('data-dependency', '');
      head.appendChild(el);
    }
  }

  /**
   * hide component editors
   */
  resetSelection(type: string) {
    if (type === Constants.COMPONENT_TYPE) {
      if (this.prodotypeComponent) {
        this.prodotypeComponent.edit();
      }
    } else {
      if (this.prodotypeStyle) {
        this.prodotypeStyle.edit();
      }
    }
  }

  /**
   * remove the editable elements from an HTML element and store them in an HTML
   * fragment
   * @param parentElement, the element whose children we want to save
   * @return an HTML fragment with the editable children in it
   */
  saveEditableChildren(parentElement: HTMLElement): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (let i = 0, el; el = parentElement.children[i]; i++) {
      if (el.classList.contains('editable-style')) {
        fragment.appendChild(el.cloneNode(true));
      }
    }
    return fragment;
  }


  removeStyle(className) {
    // remove prodotype data from json object
    this.model.property.setStyleData(className);

    // remove style from dom
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`);
    if (elStyle) {
      head.removeChild(elStyle);
    }

    // update dependencies
    this.updateDepenedencies(Constants.STYLE_TYPE);
  }

  /**
   * save an empty style or reset a style
   */
  initStyle(displayName: string, className: StyleName, opt_data?: StyleData) {
    // render all pseudo classes in all visibility object
    this.getPseudoClassData(opt_data || ({
      className: '',
      displayName: '',
      templateName: '',
      styles: {'desktop': {'normal': {}}},
    } as StyleData))
    .forEach((pseudoClassData) => {
      this.componentStyleChanged(className, pseudoClassData['pseudoClass'], pseudoClassData['visibility'], pseudoClassData['data'], displayName);
    });
    this.updateDepenedencies(Constants.STYLE_TYPE);
  }

  /**
   * build an array of all the data we provide to Prodotype for the "text"
   * template
   */
  getPseudoClassData(styleData: StyleData): {visibility: Visibility, pseudoClass: PseudoClass, data: PseudoClassData}[] {
    // return all pseudo classes in all visibility object
    // flatten
    // build an object for each pseudoClass
    // build an object for each existing visibility
    return Constants.STYLE_VISIBILITY
    .map((visibility) => {
      return {
        'visibility': visibility,
        'data': styleData['styles'][visibility]
      };
    })
    .filter((obj) => !!obj['data'])
    .map((vData) => {
      const arrayOfPCData = [];
      for (let pcName in vData.data) {
        arrayOfPCData.push({
          'visibility': vData['visibility'],
          'pseudoClass': pcName,
          /* unused, the data is in data */
          'data': vData.data[pcName]
        });
      }
      return arrayOfPCData;
    })
    .reduce((acc, val) => acc.concat(val), []);
  }

  /**
   * apply the style to the dom and save it to the JSON object
   */
  componentStyleChanged(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility, opt_data?: PseudoClassData, opt_displayName?: string) {
    // create a new style if needed
    if (className === Constants.EMPTY_STYLE_CLASS_NAME) {
      const textBoxes = this.model.body.getSelection().filter(
          (el) => this.model.element.getType(el) === 'text');
      if (textBoxes.length > 0) {
        // create a new unique name
        const allStyles = this.getProdotypeComponents(Constants.STYLE_TYPE);
        const baseDisplayName =
            textBoxes.length === 1 ? 'Text Style ' : 'Group Style ';
        const baseClassName =
            textBoxes.length === 1 ? 'text-style-' : 'group-style-';
        let idx = 1;
        while (allStyles.filter(obj => obj['className'] === baseClassName + idx.toString()).length > 0) {
          idx++;
        }
        opt_displayName = baseDisplayName + idx;
        className = baseClassName + idx;

        // apply to the selection
        textBoxes.forEach((element) => element.classList.add(className));
      }
    }

    // expose the class name and pseudo class to the prodotype template
    const newData = opt_data || {};
    newData['className'] = className;
    newData['pseudoClass'] = pseudoClass;

    // store the component's data for later edition
    const styleData = (this.model.property.getStyleData(className) || {
      'className': className,
      'templateName': 'text',
      'displayName': opt_displayName,
      'styles': {}
    } as StyleData);
    if (!styleData['styles'][visibility]) {
      styleData['styles'][visibility] = {};
    }
    styleData['styles'][visibility][pseudoClass] = newData;
    this.model.property.setStyleData(className, styleData);

    // update the head style with the new template
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`);
    if (!elStyle) {
      const doc = this.model.file.getContentDocument();
      elStyle = doc.createElement('style');
      elStyle.className = Constants.STYLE_CLASS_NAME;
      elStyle.setAttribute('type', 'text/css');
      elStyle.setAttribute('data-style-id', className);
      head.appendChild(elStyle);
    }

    // render all pseudo classes in all visibility object
    const pseudoClassData = this.getPseudoClassData(styleData);
    if (pseudoClassData.length > 0) {
      Promise.all(pseudoClassData.map((obj) => {
            return this.prodotypeStyle.decorate('text', obj.data)
                .then((html) => this.addMediaQuery(html, obj.visibility));
          }) as Array<Promise<string>>)
          .then(htmlStrings => {
            elStyle.innerHTML = htmlStrings.join('');
          });
    }
  }

  /**
   * add a media query around the style string
   * when needed for mobile-only
   */
  addMediaQuery(html: string, visibility: Visibility) {
    if (visibility === Constants.STYLE_VISIBILITY[0]) {
      return html;
    }
    return this.model.property.addMediaQuery(html);
  }
}
