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

import { Constants } from '../../constants';
import { ComponentData, ElementData, ElementType, PseudoClass, PseudoClassData, StyleData, StyleName, Visibility } from '../../types';
import { getElements, getSite, updateElements } from '../api';
import { Config } from '../ClientConfig';
import { Model, View } from '../ClientTypes';
import { getSiteDocument } from '../components/UiElements';
import { Prodotype, ProdotypeCompDef } from '../externs';
import { addMediaQuery } from '../utils/ElementUtils';

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
  readyCbkArr: Array<(p1: any) => any> = [];

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
    // tslint:disable:no-string-literal
    this.prodotypeComponent = new window['Prodotype'](componentEditorElement, Config.componentFolders);
    this.prodotypeStyle = new window['Prodotype'](styleEditorElement, './prodotype/styles');
    this.prodotypeComponent.ready((err) => {
      this.readyCbkArr.forEach((cbk) => cbk(err));
      this.readyCbkArr = [];
    });
  }

  /**
   * notify when Prodotype library is ready
   * @param cbk callback to be called when prodotype is ready
   */
  ready(cbk: (p1: any) => any) {
    if (this.prodotypeComponent) {
      this.prodotypeComponent.ready((err) => cbk(err));
    } else {
      this.readyCbkArr.push(cbk);
    }
  }

  // /**
  //  * check existance and possibly create the body style if it is missing
  //  * @param doc docment of the iframe containing the website
  //  */
  // initStyles(doc: Document) {
  //   const element = doc.body;

  //   // make sure that the style exists
  //   const styleData = this.model.property.getStyleData(Constants.BODY_STYLE_CSS_CLASS);
  //   if (!styleData) {
  //     this.initStyle(Constants.BODY_STYLE_NAME, Constants.BODY_STYLE_CSS_CLASS, null);
  //   }

  //   // make sure that body has the style
  //   element.classList.add(Constants.BODY_STYLE_CSS_CLASS);
  // }

  // /**
  //  * not needed? we sometimes use !!this.model.property.getElementData(element,
  //  * Constants.COMPONENT_TYPE)
  //  * @return true if el is a component (not only an element)
  //  */
  // isComponent(el: HTMLElement): boolean {
  //   return el.classList.contains(Constants.COMPONENT_CLASS_NAME);
  // }

  /**
   * get Prodotype descriptor of the components
   * @return component descriptors
   */
  getComponentsDef(type: string): ProdotypeCompDef {
    const obj = type === Constants.COMPONENT_TYPE ? this.prodotypeComponent : this.prodotypeStyle;
    return obj ? obj.componentsDef : ({} as ProdotypeCompDef);
  }

  /**
   * @param element component just added
   * @param templateName type of component
   */
  initComponent(element: ElementData, templateName: string) {
    const name = this.prodotypeComponent.createName(templateName, getElements()
      .filter((el) => el.type === ElementType.COMPONENT)
      .map((el) => el.data.component));

    // for selection (select all components)
    // element.classList.add(Constants.COMPONENT_CLASS_NAME);

    // apply the style found in component definition
    // this includes the css class of the component (component-templateName)
    const cssClasses = this.getCssClasses(templateName) || [];

    // first rendering of the component
    this.prodotypeComponent.decorate(templateName, element.data.component, getSite().dataSources).then((html) => {
      updateElements([{
        from: element,
        to: {
          ...element,
          classList: element.classList.concat(cssClasses),
          data: {
            ...element.data,
            component: {
              name,
              templateName,
              data: {},
            },
          },
          innerHtml: html,
        },
      }]);

      // update the dependencies once the component is added
      this.updateDepenedencies(Constants.COMPONENT_TYPE);
    });

    // css styles
    const componentsDef = this.getComponentsDef(Constants.COMPONENT_TYPE);
    const comp = componentsDef[templateName];
    if (comp) {
      // apply the style found in component definition
      if (comp.initialCss) {
        // this.applyStyleTo(element, comp.initialCss);
        console.error('not implemented')
      }

      // same for the container inside the element (content node)
      if (comp.initialCssContentContainer) {
        // this.applyStyleTo(
        //     this.model.element.getContentNode(element),
        //     comp.initialCssContentContainer);
        console.error('not implemented')
      }
    }
  }

  // /**
  //  * render the component
  //  * this is made using prodotype
  //  * the template is expanded with the data we have for this component
  //  * used when the component is created, or duplicated (paste)
  //  * @param element component to render
  //  */
  // render(element: HTMLElement, opt_cbk?: (() => any)) {
  //   this.renderType(element, Constants.COMPONENT_TYPE, () => {
  //     this.renderType(element, Constants.STYLE_TYPE, opt_cbk);
  //   });
  // }

  // getProdotype(type) {
  //   switch (type) {
  //     case Constants.COMPONENT_TYPE:
  //       return this.prodotypeComponent;
  //     case Constants.STYLE_TYPE:
  //       return this.prodotypeStyle;
  //     default:
  //       throw new Error('Unknown component type ' + type);
  //   }
  // }

  // /**
  //  * render a component or style
  //  */
  // renderComponent(element: ElementData, opt_cbk?: (() => any)) {
  //   if (element.data.component) {
  //     const templateName = element.data.component.templateName;
  //     this.prodotypeComponent.decorate(templateName, element.data.component, getSite().dataSources).then((html) => {
  //       updateElements([{
  //         from: element,
  //         to: {
  //           ...element,
  //           innerHtml: html,
  //         },
  //       }]);

  //       // notify the owner
  //       if (opt_cbk) {
  //         opt_cbk();
  //       }
  //     });
  //   } else {
  //     if (opt_cbk) {
  //       opt_cbk();
  //     }
  //   }
  // }

  // /**
  //  * render a component or style
  //  */
  // renderStyle(element: HTMLElement, opt_cbk?: (() => any)) {
  //   const data = this.model.property.getElementStyleData(element);
  //   if (data) {
  //     const templateName = data.templateName;
  //     this.prodotypeStyle.decorate(templateName, data).then((html) => {
  //       this.model.element.setInnerHtml(element, html);

  //       // notify the owner
  //       if (opt_cbk) {
  //         opt_cbk();
  //       }
  //     });
  //   } else {
  //     if (opt_cbk) {
  //       opt_cbk();
  //     }
  //   }
  // }

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
      console.error(`Error: component's definition not found in prodotype templates, with template name "${templateName}".`);
    }
    return cssClasses;
  }

  // NOW IN UTILS
  // /**
  //  * eval the scripts found in an element
  //  * this is useful when we render a template, since the scripts are executed
  //  * only when the page loads
  //  */
  // executeScripts(element: HTMLElement) {
  //   // execute the scripts
  //   const scripts = element.querySelectorAll('script');
  //   for (const el of scripts) {
  //     // tslint:disable:no-string-literal
  //     getSiteWindow()['eval'](el.innerText);
  //   }
  // }

  // /**
  //  * apply a style to an element
  //  */
  // applyStyleTo(element: HTMLElement, styleObj: any) {
  //   const style = this.model.property.getStyle(element, false) || {};
  //   for (const name in styleObj) {
  //     style[name] = styleObj[name];
  //   }
  //   this.model.property.setStyle(element, style, false);
  // }

  // /**
  //  * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
  //  */
  // getStyles(type: string): Array<StyleData> {
  //   const className = type === Constants.COMPONENT_TYPE ? Constants.COMPONENT_CLASS_NAME : Constants.STYLE_CLASS_NAME;
  //   const attrName = type === Constants.COMPONENT_TYPE ? Constants.ELEMENT_ID_ATTR_NAME : 'data-style-id';
  //   return Array.from(getSiteDocument().querySelectorAll('.' + className))
  //   .map((el) => {
  //     const attr = el.getAttribute(attrName);
  //     const data = type === Constants.COMPONENT_TYPE ? this.model.property.getComponentData(attr) : this.model.property.getStyleData(attr);
  //     return data;
  //   })
  //   .filter((data) => !!data);
  // }

  // getProdotypeComponents(type: string): Array<ComponentData|StyleData> {
  //   const className = type === Constants.COMPONENT_TYPE ? Constants.COMPONENT_CLASS_NAME : Constants.STYLE_CLASS_NAME;
  //   const attrName = type === Constants.COMPONENT_TYPE ? Constants.ELEMENT_ID_ATTR_NAME : 'data-style-id';
  //   return Array.from(getSiteDocument().querySelectorAll('.' + className))
  //   .map((el) => {
  //     const attr = el.getAttribute(attrName);
  //     const data = type === Constants.COMPONENT_TYPE ? this.model.property.getComponentData(attr) : this.model.property.getStyleData(attr);
  //     return data;
  //   })
  //   .filter((data) => !!data);
  // }

  /**
   * update the dependencies of Prodotype components
   * FIXME: should have a callback to know if/when scripts are loaded
   * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
   */
  updateDepenedencies(type: string) {
    if (type !==  Constants.COMPONENT_TYPE) {
      // TODO: cleanup since this would need to support several types of components?
      throw new Error('Not supported, all dependencies are for components for now, not styles');
    }
    const head = this.model.head.getHeadElement();
    const components: ComponentData[] = getElements()
      .filter((el) => el.type === ElementType.COMPONENT)
      .map((el) => el.data.component);

    // remove unused dependencies (scripts and style sheets)
    const elements = Array.from(this.model.head.getHeadElement().querySelectorAll('[data-dependency]'));
    const unused = this.prodotypeComponent.getUnusedDependencies(elements, components);
    for (const el of unused) {
      head.removeChild(el);
    }

    // add missing dependencies (scripts and style sheets)
    const missing = this.prodotypeComponent.getMissingDependencies(head, components);
    for (const el of missing) {
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
    Array.from(parentElement.children)
    .forEach((el) => {
      if (el.classList.contains('editable-style')) {
        fragment.appendChild(el.cloneNode(true));
      }
    });
    return fragment;
  }

  removeStyle(className) {
    console.error('not implemented')
    // // remove prodotype data from json object
    // this.model.property.setStyleData(className);

    // // remove style from dom
    // const head = this.model.head.getHeadElement();
    // const elStyle = head.querySelector(`[data-style-id="${className}"]`);
    // if (elStyle) {
    //   head.removeChild(elStyle);
    // }
  }

  /**
   * save an empty style or reset a style
   */
  initStyle(displayName: string, className: StyleName, opt_data?: StyleData) {
    // check that style does not exist
    if (getSite().style[className]) {
      console.error('This style already exists');
      throw new Error('This style already exists');
    } else {
      // render all pseudo classes in all visibility object
      this.getPseudoClassData(opt_data || ({
        className: '',
        displayName: '',
        templateName: '',
        styles: {desktop: {normal: {}}},
      } as StyleData))
      .forEach((pseudoClassData) => {
        this.componentStyleChanged(className, pseudoClassData.pseudoClass, pseudoClassData.visibility, pseudoClassData.data, displayName);
      });
    }
  }

  /**
   * build an array of all the data we provide to Prodotype for the "text"
   * template
   */
  getPseudoClassData(styleData: StyleData): Array<{visibility: Visibility, pseudoClass: PseudoClass, data: PseudoClassData}> {
    // return all pseudo classes in all visibility object
    // flatten
    // build an object for each pseudoClass
    // build an object for each existing visibility
    return Constants.STYLE_VISIBILITY
    .map((visibility) => {
      return {
        visibility,
        data: styleData.styles[visibility],
      };
    })
    .filter((obj) => !!obj.data)
    .map((vData) => {
      const arrayOfPCData = [];
      for (const pcName in vData.data) {
        arrayOfPCData.push({
          visibility: vData.visibility,
          pseudoClass: pcName,
          /* unused, the data is in data */
          data: vData.data[pcName],
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
    // if (className === Constants.EMPTY_STYLE_CLASS_NAME) {
    //   const textBoxes = this.model.body.getSelection().filter((el) => this.model.element.getType(el) === ElementType.TEXT);
    //   if (textBoxes.length > 0) {
    //     // create a new unique name
    //     const allStyles = this.getProdotypeComponents(Constants.STYLE_TYPE) as StyleData[];
    //     const baseDisplayName = textBoxes.length === 1 ? 'Text Style ' : 'Group Style ';
    //     const baseClassName = textBoxes.length === 1 ? 'text-style-' : 'group-style-';
    //     let idx = 1;
    //     while (allStyles.filter((obj) => obj.className === baseClassName + idx.toString()).length > 0) {
    //       idx++;
    //     }
    //     opt_displayName = baseDisplayName + idx;
    //     className = baseClassName + idx;

    //     // apply to the selection
    //     textBoxes.forEach((element) => element.classList.add(className));
    //   }
    // }

    // expose the class name and pseudo class to the prodotype template
    const newData = opt_data || {};
    newData.className = className;
    newData.pseudoClass = pseudoClass;

    // store the component's data for later edition
    const styleData = (getSite().style[className] || {
      className,
      templateName: 'text',
      displayName: opt_displayName,
      styles: {},
    } as StyleData);
    if (!styleData.styles[visibility]) {
      styleData.styles[visibility] = {};
    }
    styleData.styles[visibility][pseudoClass] = newData;
    console.error('not implemented')
    // FIXME: pour this to the new model?
    // this.model.property.setStyleData(className, styleData);

    // update the head style with the new template
    const head = this.model.head.getHeadElement();
    let elStyle = head.querySelector(`[data-style-id="${className}"]`);
    if (!elStyle) {
      const doc = getSiteDocument();
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
            return this.prodotypeStyle.decorate('text', obj.data, getSite().dataSources)
                .then((html) => this.addMediaQuery(html, obj.visibility));
          }) as Array<Promise<string>>)
          .then((htmlStrings) => {
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
    return addMediaQuery(html);
  }
}
