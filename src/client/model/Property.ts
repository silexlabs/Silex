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
 *   This class is used to access Silex elements properties
 */

import * as objectPath from '../../../node_modules/object-path/index.js';
import { Constants } from '../../constants';
import { DataSources, ElementId, Font } from '../../types.js';
import { getSite, getUi } from '../api';
import { Model, View } from '../ClientTypes';
import { SilexNotification } from '../utils/Notification';
import { Style } from '../utils/Style';
import { ComponentData, CssRule, JsonData, ProdotypeData, ProdotypeTypes, SilexData, StyleData, StyleName } from './Data';

export interface CSSRuleInfo {
  rule: CSSRule;
  parent: CSSRule|StyleSheet;
  index: number;
}

/**
 * @param model  model class which holds the other models
 * @param view  view class which holds the other views
 */
export class Property {
  static EMPTY_PRODOTYPE_DATA: ProdotypeData = {component: {}, style: {}};

  /**
   * constant for the ID of the style tag
   * containing all CSS rules for the elements on stage
   * which are being edited with the wysiwyg
   */
  static INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles';

  /**
   * constant for the ID of the HTML node used
   * to store Silex data as a JSON object of type SilexData
   * containing all CSS rules for the elements on stage
   * which are being edited with the wysiwyg
   */
  static JSON_STYLE_TAG_CLASS_NAME = 'silex-json-styles';

  /**
   * constant for the prefix of the IDs given to Silex editable elements
   */
  static ELEMENT_ID_PREFIX = 'silex-id-';

  /**
   * constant for the value of media query for mobile version
   * @static
   */
  static MOBILE_MEDIA_QUERY = 'only screen and (max-width: 480px)';

  /**
   * the current file's silex style sheet which holds silex elements styles
   * this is stored for performance reasons
   */
  styleSheet: CSSStyleSheet = null;

  /**
   * a number appended to the current timestamp in order to make unique Silex
   * IDs
   */
  nextId: number = 0;
  stylesObj: SilexData = {};
  fonts: Font[] = [];
  dataSources: DataSources = {};
  mobileStylesObj: SilexData = {};

  /**
   * arbitrary data for prodotype components
   */
  prodotypeDataObj: ProdotypeData = Property.EMPTY_PRODOTYPE_DATA;

  constructor(public model: Model, public view: View) {}

  // async setDataSources(data: DataSources) {
  //   this.dataSources = data;
  //   return this.loadDataSources(false);
  // }
  async loadDataSources(dataSources: DataSources, reload): Promise<DataSources> {
    try {
      const dataSourcesClone = { ...dataSources };
      return (await Promise.all(Object.keys(dataSourcesClone).map(async (name) => {
        const dataSource = dataSourcesClone[name];
        if (reload || !dataSource.data || !dataSource.structure) {
          const res = await fetch(dataSource.href);
          const data = await res.json();
          const root = objectPath.get(data, dataSource.root);
          const first = objectPath.get(root, '0');
          dataSource.data = data;
          dataSource.structure = {};
          if (first) {
            Object.keys(first).forEach((key) => dataSource.structure[key] = this.getDataSourceType(first[key]));
          }
          return {name, dataSource};
        }
      }))).reduce((prev, cur) => prev[cur.name] = cur.dataSource, {});
    } catch (err) {
      console.error('could not load data sources', err);
      SilexNotification.alert('Error', `There was an error loading the data sources: ${err}`, () => { throw err; });
    }
  }
  getDataSourceType(value) {
    return Array.isArray(value) ? 'array' : typeof(value);
  }

  /**
   * @return returns a copy of this.dataSources
   */
  getDataSources(): DataSources {
    return {...this.dataSources};
  }

  setFonts(fonts: Font[]) {
    this.fonts = fonts;
  }

  /**
   * @return returns a copy of this.fonts
   */
  getFonts(): Font[] {
    return this.fonts.slice();
  }

  /**
   * get/set Silex ID
   * @return uniqueId
   */
  getElementId(element: HTMLElement): ElementId {
    return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME);
  }

  /**
   * get/set Silex ID
   */
  setElementId(element: HTMLElement, uniqueId: ElementId) {
    const oldId = this.getElementId(element);
    if (oldId) {
      element.classList.remove(oldId);
    }
    element.setAttribute(Constants.ELEMENT_ID_ATTR_NAME, uniqueId);
    element.classList.add(uniqueId);
  }

  /**
   * @param opt_doc docment of the iframe containing the website
   */
  getElementByElementId(uniqueId: ElementId, opt_doc?: Document):
      Element {
    opt_doc = opt_doc || this.model.file.getContentDocument();
    return opt_doc.querySelector(
        '[' + Constants.ELEMENT_ID_ATTR_NAME + '="' + uniqueId + '"]');
  }

  /**
   * @param opt_doc docment of the iframe containing the website
   * Used in copy element
   */
  generateElementId(opt_doc?: Document): ElementId {
    let uniqueId;
    do {
      uniqueId = Date.now().toString() + '-' + this.nextId++;
    } while (this.getElementByElementId(uniqueId, opt_doc));
    return uniqueId;
  }

  // Used in copy element
  getNewId(doc: Document) {
    return Property.ELEMENT_ID_PREFIX + this.generateElementId(doc);
  }

  // /**
  //  * @param doc docment of the iframe containing the website
  //  */
  // initElementId(element: HTMLElement, doc?: Document) {
  //   // add the selector for this element
  //   this.setElementId(element, this.getNewId(doc));
  // }

  // /**
  //  * Convert the styles to json and save it in a script tag
  //  */
  // saveProperties(doc) {
  //   let styleTag = doc.querySelector('.' + Property.JSON_STYLE_TAG_CLASS_NAME);
  //   if (!styleTag) {
  //     styleTag = doc.createElement('script');
  //     styleTag.type = 'text/json';
  //     styleTag.classList.add(Property.JSON_STYLE_TAG_CLASS_NAME);
  //     doc.head.appendChild(styleTag);
  //   }

  //   // always save as json, it used to be javascript and sometimes it tabs mess
  //   // up the json
  //   styleTag.type = 'text/json';
  //   const obj = ({
  //     fonts: this.fonts || [],
  //     dataSources: this.dataSources || {},
  //     desktop: this.stylesObj || {},
  //     mobile: this.mobileStylesObj || {},
  //     prodotypeData: {
  //       component: this.prodotypeDataObj.component || {},
  //       style: this.prodotypeDataObj.style || {},
  //     },
  //   } as JsonData);

  //   // TODO: it is useless to store an array, a single object would be better
  //   styleTag.innerHTML = JSON.stringify([obj]);
  // }

  /**
   * FIXME: for retro compat in element-dom
   * Load the styles from the json saved in a script tag
   */
  loadProperties(doc) {
    const styleTag = doc.querySelector('.' + Property.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null ) {
      const styles = (JSON.parse(styleTag.innerHTML)[0] as any);
      this.fonts = styles.fonts || [];
      this.dataSources = styles.dataSources || {}; // TODO: why store this in the styles object?
      this.stylesObj = styles.desktop || {};
      this.mobileStylesObj = styles.mobile || {};
      this.prodotypeDataObj = styles.prodotypeData &&
              styles.prodotypeData.component &&
              styles.prodotypeData.style ?
          ({
            component: styles.prodotypeData.component,
            style: styles.prodotypeData.style,
          } as ProdotypeData) :
          Property.EMPTY_PRODOTYPE_DATA;

      // FIXME: put this in backward compat
      if (styles.componentData) {
        this.prodotypeDataObj.component = styles.componentData;
      }
    } else {
      this.fonts = [];
      this.dataSources = {};
      this.stylesObj = {};
      this.mobileStylesObj = {};
      this.prodotypeDataObj = Property.EMPTY_PRODOTYPE_DATA;
      console.info('Warning: no JSON styles array found in the dom');
    }
  }

  // /**
  //  * check existance and possibly create a style tag holding Silex elements
  //  * styles
  //  * @param doc docment of the iframe containing the website
  //  */
  // initStyles(doc: Document): HTMLElement {
  //   // make sure of the existance of the style tag with Silex definitions
  //   let styleTag: HTMLElement = doc.querySelector('.' + Property.INLINE_STYLE_TAG_CLASS_NAME);
  //   if (!styleTag) {
  //     styleTag = doc.createElement('style');
  //     styleTag.classList.add(Property.INLINE_STYLE_TAG_CLASS_NAME);
  //     styleTag.setAttribute('type', 'text/css');
  //     doc.head.appendChild(styleTag);
  //   }
  //   this.styleSheet = null;
  //   for (const s of doc.styleSheets) {
  //     if (s.ownerNode &&
  //         s.ownerNode === styleTag) {
  //       this.styleSheet = s as CSSStyleSheet;
  //     }
  //   }
  //   if (this.styleSheet === null) {
  //     console.error('no stylesheet found');
  //   }
  //   return styleTag;
  // }

  // /**
  //  * get / set the data associated with an ID
  //  * if opt_prodotypeData is null this data set will removed
  //  */
  // setComponentData(id: ElementId, opt_prodotypeData?: ComponentData) {
  //   this.setProdotypeData(id, ProdotypeTypes.COMPONENT, opt_prodotypeData);
  // }

  // /**
  //  * get / set the data associated with an ID
  //  * if opt_prodotypeData is null this data set will removed
  //  */
  // setStyleData(id: ElementId, opt_prodotypeData?: StyleData) {
  //   this.setProdotypeData(id, ProdotypeTypes.STYLE, opt_prodotypeData);
  // }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getComponentData(id: ElementId): ComponentData {
    return (this.getProdotypeData(id, ProdotypeTypes.COMPONENT) as ComponentData |null);
  }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getStyleData(id: StyleName): StyleData {
    return (this.getProdotypeData(id, ProdotypeTypes.STYLE) as StyleData |null);
  }

  // /**
  //  * get / set the data associated with an element
  //  * if opt_componentData is null this will remove the rule
  //  */
  // setElementComponentData(element: HTMLElement, opt_componentData?: ComponentData) {
  //   // call private generic method
  //   this.setElementData(  element, ProdotypeTypes.COMPONENT, opt_componentData);
  // }

  // /**
  //  * get / set the data associated with an element
  //  * if opt_componentData is null this will remove the rule
  //  */
  // setElementStyleData(element: HTMLElement, opt_componentData?: StyleData) {
  //   // call private generic method
  //   this.setElementData(
  //       element, ProdotypeTypes.STYLE, opt_componentData);
  // }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getElementComponentData(element: HTMLElement): ComponentData {
    // call private generic method
    return (
        this.getElementData(
            element, ProdotypeTypes.COMPONENT) as
            ComponentData |
        null);
  }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getElementStyleData(element: HTMLElement): StyleData {
    // call private generic method
    return (
        this.getElementData(element, ProdotypeTypes.STYLE) as
            StyleData |
        null);
  }

  // /**
  //  * get / set the css style of an element
  //  * this creates or update a rule in the style tag with id
  //  * INLINE_STYLE_TAG_CLASS_NAME if style is null this will remove the rule
  //  */
  // setStyle(element: HTMLElement, styleObj: any, isMobile = getUi().mobileEditor) {
  //   const deleteStyle = !styleObj;
  //   const style = styleObj || {};
  //   const elementId = (this.getElementId(element) as ElementId);

  //   if (!deleteStyle) {
  //     // styles of sections are special
  //     if (this.model.element.isSection(element)) {
  //       // do not apply width to sections
  //       delete style.width;

  //       // apply height to section content and not section itself
  //       const contentElement = (this.model.element.getContentNode(element) as HTMLElement);
  //       const contentStyle = this.getStyle(contentElement, isMobile) || {};
  //       if (style['min-height'] && style['min-height'] !== contentStyle['min-height']) {
  //         contentStyle['min-height'] = style['min-height'];
  //         this.setStyle(contentElement, contentStyle, isMobile);
  //       }

  //       // do not apply min-height to the section itself
  //       delete style['min-height'];
  //     } else if (style.width
  //         && this.model.element.isSectionContent(element)
  //         && !getUi().mobileEditor) {
  //       // set website width
  //       const width = parseInt(style.width);
  //       const site = getSite();
  //       if (!!width && site.width !== width) {
  //         updateSite({
  //           ...site,
  //           width,
  //         });
  //       }
  //     }
  //     const elementData = getElementData(element);
  //     if (elementData.type === ElementType.SECTION) {
  //       delete style.top;
  //       delete style.left;
  //     }
  //   } else {
  //     // FIXME: useless??
  //     throw new Error('not implemented');
  //   }

  //   // // store in JSON
  //   // const targetObj = isMobile ? this.mobileStylesObj : this.stylesObj;
  //   // if (deleteStyle) {
  //   //   delete targetObj[elementId];
  //   // } else {
  //   //   targetObj[elementId] = style as CssRule;
  //   // }
  // }
  writeStyleToDom(elementId, style, isMobile) {
    // find the index of the rule for the given element
    const cssRuleObject = this.findCssRule(elementId, isMobile);

    // update or create the rule
    if (cssRuleObject) {
      this.styleSheet.deleteRule(cssRuleObject.index);
    }
    // convert style to string
    // we use the class name because elements have their ID as a css class too
    const styleStr = '.' + elementId + '{' + Style.styleToString(style) + '} ';
    if (isMobile) {
      // add the rule to the dom to see the changes, mobile rules after
      // desktop ones
      this.styleSheet.insertRule(this.addMediaQuery(styleStr), this.styleSheet.cssRules.length);
    } else {
      this.styleSheet.insertRule(styleStr, 0);
    }
  }

  /**
   * FIXME: for retro compat in element-dom, used in Element:getAllStyles
   * get / set the css style of an element
   * @param opt_isMobile defaults to the global setting of silex.view.Workspace
   * @return a clone of the style object
   */
  getStyle(element: HTMLElement, opt_isMobile?: boolean): CssRule {
    const elementId = (this.getElementId(element) as ElementId);
    const isMobile = opt_isMobile != null  ? opt_isMobile :  getUi().mobileEditor;
    const targetObj = (isMobile ? this.mobileStylesObj : this.stylesObj as SilexData);
    const style = (targetObj[elementId] as CssRule);
    if (!!style) {
      // convert to obj (also makes it a copy we can change)
      const clone = (JSON.parse(JSON.stringify(style)) as CssRule);

      // styles of sections are special
      // the min-height of the section is stored on its content container
      if (this.model.element.isSection(element)) {
        // min-height of sections is the min-height of section content
        const contentElement = (this.model.element.getContentNode(element) as HTMLElement);
        if (contentElement === element) {
          console.warn('This section has no content, how is this possible?', element);
        } else {
          const contentStyle = this.getStyle(contentElement, isMobile);
          if (contentStyle) {
            clone['min-height'] = contentStyle['min-height'];
          }
        }
      }
      if (this.model.element.isSection(element) || this.model.element.isSectionContent(element)) {
        clone.width = getSite().width + 'px';
      }
      return clone;
    }
    return null;
  }

  /**
   * @return null if not found
   */
  findCssRule(elementId: string, isMobile: boolean): CSSRuleInfo {
    // find the rule for the given element
    for (let idx = 0; idx < this.styleSheet.cssRules.length; idx++) {
      const cssRule = this.styleSheet.cssRules[idx] as any; // FIXME: should be CSSRule ?
      // we use the class name because elements have their ID as a css class too
      if ((isMobile === false && cssRule.selectorText === '.' + elementId) ||
          (cssRule.media && cssRule.cssRules && cssRule.cssRules[0] &&
              cssRule.cssRules[0].selectorText === '.' + elementId)) {
        return {
          rule: cssRule,
          parent: this.styleSheet,
          index: idx,
        };
      }
    }
    return null;
  }

  /**
   * @param doc docment of the iframe containing the website
   * @return the string defining all elements styles
   */
  getAllStyles(doc: Document): string {
    const elements = doc.querySelectorAll('body, .' + Constants.EDITABLE_CLASS_NAME);
    let allStyles = '';
    for (const element of elements) {
      const elementId = (this.getElementId(element as HTMLElement) as ElementId);

      // desktop
      if (this.stylesObj[elementId]) {
        const styleStr = Style.styleToString(this.stylesObj[elementId], '\n    ');
        allStyles += '.' + elementId + ' {' + styleStr + '\n}\n';
      }

      // mobile
      if (this.mobileStylesObj[elementId]) {
        const styleStr = Style.styleToString(this.mobileStylesObj[elementId], '\n    ');
        allStyles += this.addMediaQuery('.' + elementId + ' {' + styleStr + '\n}\n');
      }
    }
    return allStyles;
  }

  /**
   * add a media query around the style string
   * will make the style mobile-only
   */
  addMediaQuery(styleStr: string) {
    return '@media ' + Property.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
  }

  // /**
  //  * compute the bounding box of the given elements
  //  * height set in px
  //  * @return the bounding box containing all the elements
  //  */
  // getBoundingBox(elements: ElementData[]): {top?: number, left?: number, width?: number, height?: number} {
  //   // compute the positions and sizes, which may end up to be NaN or a number
  //   let top = NaN; let left = NaN; let right = NaN; let bottom = NaN;

  //   // browse all elements and compute the containing rect
  //   elements.forEach((element) => {
  //     const style = {
  //       ...element.style,
  //       mobile: {
  //         ...element.style.mobile ? element.style.mobile || {},
  //       },
  //     };
  //     // retrieve the styles strings (with "px")
  //     // init position and size if needed
  //     if (!style.top) {
  //       style.top = '';
  //     }
  //     if (!style.left) {
  //       style.left = '';
  //     }
  //     if (!style.width) {
  //       style.width = '';
  //     }
  //     if (!style.height) {
  //       style.height = '';
  //     }

  //     // in mobile editor, if a mobile style is set use it
  //     if (getUi().mobileEditor) {
  //       if (!!style.mobile.top) {
  //         style.top = style.mobile.top;
  //       }
  //       if (!!style.mobile.left) {
  //         style.left = style.mobile.left;
  //       }
  //       if (!!style.mobile.width) {
  //         style.width = style.mobile.width;
  //       }
  //       if (!!style.mobile.height) {
  //         style.height = style.mobile.height;
  //       }
  //     }

  //     // compute the styles numerical values, which may end up to be NaN or a number
  //     const elementWidth = parseFloat(style.width);
  //     const elementWidth = Math.max(
  //         elementMinWidth || 0,
  //         parseFloat(elementStyle.width.substr(
  //             0, elementStyle.width.indexOf('px'))));
  //     const elementMinHeight = elementStyle['min-height'] ?
  //         parseFloat(elementStyle['min-height'].substr(
  //             0, elementStyle['min-height'].indexOf('px'))) :
  //         null;
  //     const elementHeight = Math.max(
  //         elementMinHeight || 0,
  //         parseFloat(elementStyle.height.substr(
  //             0, elementStyle.height.indexOf('px'))) ||
  //             0);
  //     const elementTop = parseFloat(
  //         elementStyle.top.substr(0, elementStyle.top.indexOf('px')));
  //     const elementLeft = parseFloat(
  //         elementStyle.left.substr(0, elementStyle.left.indexOf('px')));
  //     const elementRight = (elementLeft || 0) + elementWidth;
  //     const elementBottom = (elementTop || 0) + elementHeight;

  //     // take the smallest top and left and the bigger bottom and rigth
  //     top = isNaN(top) ? elementTop :
  //                        Math.min(top, isNaN(elementTop) ? top : elementTop);
  //     left = isNaN(left) ?
  //         elementLeft :
  //         Math.min(left, isNaN(elementLeft) ? left : elementLeft);
  //     bottom = isNaN(bottom) ?
  //         elementBottom :
  //         Math.max(bottom, isNaN(elementBottom) ? bottom : elementBottom);
  //     right = isNaN(right) ?
  //         elementRight :
  //         Math.max(right, isNaN(elementRight) ? right : elementRight);
  //   });

  //   // no value for NaN results
  //   const res: {top?: number, left?: number, width?: number, height?: number} = {};
  //   if (!isNaN(top)) {
  //     res.top = top;
  //   }
  //   if (!isNaN(left)) {
  //     res.left = left;
  //   }
  //   if (!isNaN(bottom)) {
  //     res.height = bottom - (top || 0);
  //   }
  //   if (!isNaN(right)) {
  //     res.width = right - (left || 0);
  //   }
  //   return res;
  // }

  /**
   * get / set the data associated with an ID
   * if opt_prodotypeData is null this data set will removed
   */
  private setProdotypeData(
      id: ElementId, type: ProdotypeTypes,
      opt_prodotypeData?: ComponentData|StyleData) {
    // store in object
    if (opt_prodotypeData) {
      this.prodotypeDataObj[type][id] = opt_prodotypeData;
    } else {
      delete this.prodotypeDataObj[type][id];
    }
  }

  /**
   * FIXME: for retro compat in element-dom
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  private getProdotypeData(id: ElementId, type: ProdotypeTypes): ComponentData
      |StyleData {
    const res = this.prodotypeDataObj[type][id];
    if (res) {
      const clone =
          (JSON.parse(JSON.stringify(res)) as ComponentData | StyleData);

      // clone the object
      return clone;
    }
    return null;
  }

  // /**
  //  * get / set the data associated with an element
  //  * if opt_componentData is null this will remove the rule
  //  */
  // private setElementData(
  //     element: HTMLElement, type: ProdotypeTypes,
  //     opt_componentData?: ComponentData|StyleData) {
  //   // a section's container content can not be a component, but the section
  //   // itself may be
  //   element = this.model.element.noSectionContent(element);

  //   // get the internal ID
  //   const elementId = (this.getElementId(element) as ElementId);

  //   // store in object
  //   this.setProdotypeData(elementId, type, opt_componentData);
  // }

  /**
   * FIXME: for retro compat in element-dom
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  private getElementData(element: HTMLElement, type: ProdotypeTypes):
      ComponentData|StyleData {
    // a section's container content can not be a component, but the section
    // itself may be
    element = this.model.element.noSectionContent(element);

    // get the internal ID
    const elementId = (this.getElementId(element) as ElementId);

    // returns value of object
    return this.getProdotypeData(elementId, type);
  }
}
