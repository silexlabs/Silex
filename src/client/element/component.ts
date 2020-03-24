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

import { Constants } from '../../constants';
import { ComponentData, ElementData, ElementType, PseudoClass, PseudoClassData, StyleData, StyleName, Visibility, TemplateName, StyleDataObject } from '../element/types';
import { Config } from '../ClientConfig';
import { Prodotype, ProdotypeCompDef } from '../externs';
import { getElements, updateElements } from '../element/store';
import { getSite, updateSite } from '../site/store';
import { addMediaQuery } from '../element/dom';
import { getUiElements } from '../ui/UiElements'

/**
 * @fileoverview
 *   This class is used to manage Prodotype components
 *   Components are based on Silex elements, use Prodotype to render a templates
 */

let styleEditorElement
let componentEditorElement
let prodotypeComponent: Prodotype
let prodotypeStyle: Prodotype
let readyCbkArr = []

window.addEventListener('load', () => initProdotype())

function initProdotype() {
  // load the Prodotype library
  styleEditorElement = getUiElements().propertyTool.querySelector('.prodotype-style-editor .prodotype-container');
  componentEditorElement = getUiElements().propertyTool.querySelector('.prodotype-component-editor');

  // tslint:disable:no-string-literal
  prodotypeComponent = new window['Prodotype'](componentEditorElement, Config.componentFolders);
  prodotypeStyle = new window['Prodotype'](styleEditorElement, './prodotype/styles');


  prodotypeComponent.ready((err) => {
    readyCbkArr.forEach((cbk) => cbk(err))
    readyCbkArr = []
  });
}

/**
 * notify when Prodotype library is ready
 * @param cbk callback to be called when prodotype is ready
 */
export function ready(cbk: (p1: any) => any) {
  if (prodotypeComponent) {
    prodotypeComponent.ready((err) => cbk(err));
  } else {
    readyCbkArr.push(cbk);
  }
}

/**
 * get Prodotype descriptor of the components
 * @return component descriptors
 */
export function getComponentsDef(type: string): ProdotypeCompDef {
  const obj = type === Constants.COMPONENT_TYPE ? prodotypeComponent : prodotypeStyle;
  return obj ? obj.componentsDef : ({} as ProdotypeCompDef);
}

/**
 * @param element component just added
 * @param templateName type of component
 */
export function initComponent(element: ElementData, templateName: string) {
  const name = prodotypeComponent.createName(templateName, getElements()
    .filter((el) => el.type === ElementType.COMPONENT)
    .map((el) => el.data.component));

  // for selection (select all components)
  // element.classList.add(Constants.COMPONENT_CLASS_NAME);

  // apply the style found in component definition
  // this includes the css class of the component (component-templateName)
  const cssClasses = getCssClasses(templateName) || [];

  // first rendering of the component
  prodotypeComponent.decorate(templateName, element.data.component, getSite().dataSources).then((html) => {
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
    updateDepenedencies(Constants.COMPONENT_TYPE);
  });

  // css styles
  const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE);
  const comp = componentsDef[templateName];
  if (comp) {
    // apply the style found in component definition
    if (comp.initialCss) {
      // applyStyleTo(element, comp.initialCss);
      console.error('not implemented')
    }

    // same for the container inside the element (content node)
    if (comp.initialCssContentContainer) {
      // applyStyleTo(
      //     model.element.getContentNode(element),
      //     comp.initialCssContentContainer);
      console.error('not implemented')
    }
  }
}

/**
 * get the class names specified in the definition of the prodotype component
 * this is in the className attribute of the component .md file
 */
export function getComponentClassName(element) {
  if (element.type === ElementType.COMPONENT) {
    const templateName = (element.data.component.templateName as TemplateName);
    return getCssClasses(templateName);
  }
  return [];
}

/**
 * get all CSS classes set on this component when it is created
 * this includes the css class of the component (component-templateName)
 * @param templateName the component's template name
 * @return an array of CSS classes
 */
export function getCssClasses(templateName: string): string[] {
  const componentsDef = getComponentsDef(Constants.COMPONENT_TYPE);
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

/**
 * update the dependencies of Prodotype components
 * FIXME: should have a callback to know if/when scripts are loaded
 * @param type, Constants.COMPONENT_TYPE or Constants.STYLE_TYPE
 */
export function updateDepenedencies(type: string) {
  if (type !==  Constants.COMPONENT_TYPE) {
    // TODO: cleanup since this would need to support several types of components?
    throw new Error('Not supported, all dependencies are for components for now, not styles');
  }
  const components: ComponentData[] = getElements()
    .filter((el) => el.type === ElementType.COMPONENT)
    .map((el) => el.data.component);
  const prodotypeDependencies = prodotypeComponent.getDependencies(components)

  const oldDependencies = getSite().prodotypeDependencies
  const isDifferent = (() => {
    for(const compName in oldDependencies)
      if(!prodotypeDependencies[compName]) return false
    for(const compName in prodotypeDependencies)
      if(!oldDependencies[compName]) return false
    return true
  })()

  if(isDifferent) {
    updateSite({
      ...getSite(),
      prodotypeDependencies,
    })
  }
  // const head = model.head.getHeadElement();
  // const components: ComponentData[] = getElements()
  //   .filter((el) => el.type === ElementType.COMPONENT)
  //   .map((el) => el.data.component);

  // // remove unused dependencies (scripts and style sheets)
  // const elements = Array.from(model.head.getHeadElement().querySelectorAll('[data-dependency]'));
  // const unused = prodotypeComponent.getUnusedDependencies(elements, components);
  // for (const el of unused) {
  //   head.removeChild(el);
  // }

  // // add missing dependencies (scripts and style sheets)
  // const missing = prodotypeComponent.getDependencies(components);
  // for (const el of missing) {
  //   el.setAttribute('data-dependency', '');
  //   head.appendChild(el);
  // }
}

/**
 * hide component editors
 */
export function resetComponentEditor() {
  if (prodotypeComponent) {
    componentEditorElement.classList.add('hide-panel')
    prodotypeComponent.edit();
  }
}

/**
 * show component editors and edit the selection
 */
export function openComponentEditor(options: {
  data?: any,
  dataSources?: object,
  templateName?: string,
  events?: any
}) {
  if (prodotypeComponent) {
    prodotypeComponent.edit(options.data, options.dataSources, options.templateName, options.events);
    componentEditorElement.classList.remove('hide-panel')
  }
}

/**
 * edit a style in the style editor
 */
export function openStyleEditor(options: {
  data?: any,
  dataSources?: object,
  templateName?: string,
  events?: any
}) {
  if (prodotypeStyle) {
    prodotypeStyle.edit(options.data, options.dataSources, options.templateName, options.events);
  }
}

/**
 *
 */
export function renderStyle(options: {templateName: string, data: any, dataSources?: object}) {
  return prodotypeStyle.decorate(options.templateName, options.data, options.dataSources)
}

/**
 * remove the editable elements from an HTML element and store them in an HTML
 * fragment
 * @param parentElement, the element whose children we want to save
 * @return an HTML fragment with the editable children in it
 */
export function saveEditableChildren(parentElement: HTMLElement): DocumentFragment {
  const fragment = document.createDocumentFragment();
  Array.from(parentElement.children)
  .forEach((el) => {
    if (el.classList.contains('editable-style')) {
      fragment.appendChild(el.cloneNode(true));
    }
  });
  return fragment;
}

/**
 * save an empty style or reset a style
 */
export function initStyle(displayName: string, className: StyleName, opt_data?: StyleData) {
  // check that style does not exist
  if (getSite().style[className]) {
    console.error('This style already exists');
    throw new Error('This style already exists');
  } else {
    // const style: StyleDataObject = {
    //   ...getSite().style,
    // }
    // style[className] = {
    //   className,
    //   displayName,
    //   templateName: 'text',
    //   styles: {desktop: {normal: {}}},
    // }
    // updateSite({
    //   ...getSite(),
    //   style,
    // })
    // render all pseudo classes in all visibility object
    getPseudoClassData(opt_data || ({
      className: '',
      displayName: '',
      templateName: '',
      styles: {desktop: {normal: {}}},
    } as StyleData))
    .forEach((pseudoClassData) => {
      componentStyleChanged(className, pseudoClassData.pseudoClass, pseudoClassData.visibility, pseudoClassData.data, displayName);
    });
  }
}

/**
 * build an array of all the data we provide to Prodotype for the "text"
 * template
 */
export function getPseudoClassData(styleData: StyleData): {visibility: Visibility, pseudoClass: PseudoClass, data: PseudoClassData}[] {
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
 * update the style in the store
 */
export function componentStyleChanged(className: StyleName, pseudoClass: PseudoClass, visibility: Visibility, opt_data?: PseudoClassData, opt_displayName?: string) {
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

  const style: StyleDataObject = {
    ...getSite().style,
  }
  style[className] = styleData
  updateSite({
    ...getSite(),
    style,
  })

  // console.error('not implemented')
  // // FIXME: pour this to the new model?
  // // model.property.setStyleData(className, styleData);

  // // update the head style with the new template
  // const head = model.head.getHeadElement();
  // let elStyle = head.querySelector(`[data-style-id="${className}"]`);
  // if (!elStyle) {
  //   const doc = getSiteDocument();
  //   elStyle = doc.createElement('style');
  //   elStyle.className = Constants.STYLE_CLASS_NAME;
  //   elStyle.setAttribute('type', 'text/css');
  //   elStyle.setAttribute('data-style-id', className);
  //   head.appendChild(elStyle);
  // }

  // // render all pseudo classes in all visibility object
  // const pseudoClassData = getPseudoClassData(styleData);
  // if (pseudoClassData.length > 0) {
  //   Promise.all(pseudoClassData.map((obj) => {
  //         return prodotypeStyle.decorate('text', obj.data, getSite().dataSources)
  //             .then((html) => addMediaQueryIfMobileOnly(html, obj.visibility));
  //       }) as Promise<string>[])
  //       .then((htmlStrings) => {
  //         elStyle.innerHTML = htmlStrings.join('');
  //       });
  // }
}

/**
 * add a media query around the style string
 * when needed for mobile-only
 */
export function addMediaQueryIfMobileOnly(html: string, visibility: Visibility) {
  if (visibility === Constants.STYLE_VISIBILITY[0]) {
    return html;
  }
  return addMediaQuery(html);
}
