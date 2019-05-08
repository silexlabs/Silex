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


import { Constants } from '../../Constants';
import { Font, Model, View } from '../types';
import { Style } from '../utils/style';
import { ComponentData, CssRule, JsonData, ProdotypeData, ProdotypeTypes, SilexData, SilexId, StyleData, StyleName } from './Data';


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
  static EMPTY_PRODOTYPE_DATA: ProdotypeData = {'component': {}, 'style': {}};

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
  static MOBILE_MEDIA_QUERY = 'only screen and (max-width: 480px), only screen and (max-device-width: 480px)';

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
  mobileStylesObj: SilexData = {};

  /**
   * arbitrary data for prodotype components
   */
  prodotypeDataObj: ProdotypeData = Property.EMPTY_PRODOTYPE_DATA;

  constructor(public model: Model, public view: View) {}

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
  getSilexId(element: HTMLElement): SilexId {
    return element.getAttribute(Constants.ELEMENT_ID_ATTR_NAME);
  }

  /**
   * get/set Silex ID
   */
  setSilexId(element: HTMLElement, uniqueId: SilexId) {
    let oldId = this.getSilexId(element);
    if (oldId) {
      element.classList.remove(oldId);
    }
    element.setAttribute(Constants.ELEMENT_ID_ATTR_NAME, uniqueId);
    element.classList.add(uniqueId);
  }

  /**
   * @param opt_doc docment of the iframe containing the website
   */
  getElementBySilexId(uniqueId: SilexId, opt_doc?: Document):
      Element {
    opt_doc = opt_doc || this.model.file.getContentDocument();
    return opt_doc.querySelector(
        '[' + Constants.ELEMENT_ID_ATTR_NAME + '="' + uniqueId + '"]');
  }

  /**
   * @param opt_doc docment of the iframe containing the website
   */
  generateSilexId(opt_doc?: Document): SilexId {
    let uniqueId;
    do {
      uniqueId = Date.now().toString() + '-' + this.nextId++;
    } while (this.getElementBySilexId(uniqueId, opt_doc));
    return uniqueId;
  }

  /**
   * @param doc docment of the iframe containing the website
   */
  initSilexId(element: HTMLElement, doc?: Document) {
    // add the selector for this element
    let idAndClass = Property.ELEMENT_ID_PREFIX + this.generateSilexId(doc);
    this.setSilexId(element, idAndClass);
  }

  /**
   * Convert the styles to json and save it in a script tag
   */
  saveProperties(doc) {
    let styleTag = doc.querySelector('.' + Property.JSON_STYLE_TAG_CLASS_NAME);
    if (!styleTag) {
      styleTag = doc.createElement('script');
      styleTag.type = 'text/json';
      styleTag.classList.add(Property.JSON_STYLE_TAG_CLASS_NAME);
      doc.head.appendChild(styleTag);
    }

    // always save as json, it used to be javascript and sometimes it tabs mess
    // up the json
    styleTag.type = 'text/json';
    let obj = ({
      'fonts': this.fonts || [],
      'desktop': this.stylesObj || {},
      'mobile': this.mobileStylesObj || {},
      'prodotypeData': {
        'component': this.prodotypeDataObj['component'] || {},
        'style': this.prodotypeDataObj['style'] || {}
      }
    } as JsonData);

    // TODO: it is useless to store an array, a single object would be better
    styleTag.innerHTML = JSON.stringify([obj]);
  }

  /**
   * Load the styles from the json saved in a script tag
   */
  loadProperties(doc) {
    let styleTag = doc.querySelector('.' + Property.JSON_STYLE_TAG_CLASS_NAME);
    if (styleTag != null) {
      let styles = (JSON.parse(styleTag.innerHTML)[0] as Object);
      this.fonts = styles['fonts'] || [];
      this.stylesObj = styles['desktop'] || {};
      this.mobileStylesObj = styles['mobile'] || {};
      this.prodotypeDataObj = styles['prodotypeData'] &&
              styles['prodotypeData']['component'] &&
              styles['prodotypeData']['style'] ?
          ({
            'component': styles['prodotypeData']['component'],
            'style': styles['prodotypeData']['style'],
          } as ProdotypeData) :
          Property.EMPTY_PRODOTYPE_DATA;

      // FIXME: put this in backward compat
      if (styles['componentData']) {
        this.prodotypeDataObj['component'] = styles['componentData'];
      }
    } else {
      this.fonts = [];
      this.stylesObj = {};
      this.mobileStylesObj = {};
      this.prodotypeDataObj = Property.EMPTY_PRODOTYPE_DATA;
      console.info('Warning: no JSON styles array found in the dom');
    }
  }

  /**
   * check existance and possibly create a style tag holding Silex elements
   * styles
   * @param doc docment of the iframe containing the website
   */
  initStyles(doc: Document): HTMLElement {
    // make sure of the existance of the style tag with Silex definitions
    let styleTag:HTMLElement = doc.querySelector('.' + Property.INLINE_STYLE_TAG_CLASS_NAME);
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.classList.add(Property.INLINE_STYLE_TAG_CLASS_NAME);
      styleTag.setAttribute('type', 'text/css');
      doc.head.appendChild(styleTag);
    }
    this.styleSheet = null;
    for (let idx = 0; idx < doc.styleSheets.length; idx++) {
      if (doc.styleSheets[idx].ownerNode &&
          doc.styleSheets[idx].ownerNode == styleTag) {
        this.styleSheet = doc.styleSheets[idx] as CSSStyleSheet;
      }
    }
    if (this.styleSheet === null) {
      console.error('no stylesheet found');
    }
    return styleTag;
  }

  /**
   * get / set the data associated with an ID
   * if opt_prodotypeData is null this data set will removed
   */
  private setProdotypeData(
      id: SilexId, type: ProdotypeTypes,
      opt_prodotypeData?: ComponentData|StyleData) {
    // store in object
    if (opt_prodotypeData) {
      this.prodotypeDataObj[type][id] = opt_prodotypeData;
    } else {
      delete this.prodotypeDataObj[type][id];
    }
  }

  /**
   * get / set the data associated with an ID
   * if opt_prodotypeData is null this data set will removed
   */
  setComponentData(id: SilexId, opt_prodotypeData?: ComponentData) {
    this.setProdotypeData(
        id, ProdotypeTypes.COMPONENT, opt_prodotypeData);
  }

  /**
   * get / set the data associated with an ID
   * if opt_prodotypeData is null this data set will removed
   */
  setStyleData(id: SilexId, opt_prodotypeData?: StyleData) {
    this.setProdotypeData(
        id, ProdotypeTypes.STYLE, opt_prodotypeData);
  }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  private getProdotypeData(id: SilexId, type: ProdotypeTypes): ComponentData
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

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getComponentData(id: SilexId): ComponentData {
    return (
        this.getProdotypeData(id, ProdotypeTypes.COMPONENT) as
            ComponentData |
        null);
  }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  getStyleData(id: StyleName): StyleData {
    return (
        this.getProdotypeData(id, ProdotypeTypes.STYLE) as
            StyleData |
        null);
  }

  /**
   * get / set the data associated with an element
   * if opt_componentData is null this will remove the rule
   */
  private setElementData(
      element: HTMLElement, type: ProdotypeTypes,
      opt_componentData?: ComponentData|StyleData) {
    // a section's container content can not be a component, but the section
    // itself may be
    if (this.model.element.isSectionContent(element)) {
      element = (element.parentElement as HTMLElement);
    }

    // get the internal ID
    let elementId = (this.getSilexId(element) as SilexId);

    // store in object
    this.setProdotypeData(elementId, type, opt_componentData);
  }

  /**
   * get / set the data associated with an element
   * if opt_componentData is null this will remove the rule
   */
  setElementComponentData(
      element: HTMLElement, opt_componentData?: ComponentData) {
    // call private generic method
    this.setElementData(
        element, ProdotypeTypes.COMPONENT, opt_componentData);
  }

  /**
   * get / set the data associated with an element
   * if opt_componentData is null this will remove the rule
   */
  setElementStyleData(
      element: HTMLElement, opt_componentData?: StyleData) {
    // call private generic method
    this.setElementData(
        element, ProdotypeTypes.STYLE, opt_componentData);
  }

  /**
   * get / set the data associated with an element
   * @return a clone of the data object
   */
  private getElementData(element: HTMLElement, type: ProdotypeTypes):
      ComponentData|StyleData {
    // a section's container content can not be a component, but the section
    // itself may be
    if (this.model.element.isSectionContent(element)) {
      element = (element.parentElement as HTMLElement);
    }

    // get the internal ID
    let elementId = (this.getSilexId(element) as SilexId);

    // returns value of object
    return this.getProdotypeData(elementId, type);
  }

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

  /**
   * get / set the css style of an element
   * this creates or update a rule in the style tag with id
   * INLINE_STYLE_TAG_CLASS_NAME if style is null this will remove the rule
   */
  setStyle(element: HTMLElement, styleObj: Object, opt_isMobile?: boolean) {
    const deleteStyle = !styleObj;
    const style = styleObj || {};
    const elementId = (this.getSilexId(element) as SilexId);
    const isMobile = opt_isMobile != null ? opt_isMobile : this.view.workspace.getMobileEditor();

    if (!deleteStyle) {
      // styles of sections are special
      if (this.model.element.isSection(element)) {
        // do not apply width to sections
        delete style['width'];

        // apply height to section content and not section itself
        const contentElement = (this.model.element.getContentNode(element) as HTMLElement);
        const contentStyle = this.getStyle(contentElement, isMobile) || {};
        if (style['min-height'] && style['min-height'] !== contentStyle['min-height']) {
          contentStyle['min-height'] = style['min-height'];
          this.setStyle(contentElement, contentStyle, isMobile);
        }

        // do not apply min-height to the section itself
        delete style['min-height'];
      }
      else if (style['width']
        && this.model.element.isSectionContent(element)
        && !this.view.workspace.getMobileEditor()) {

        // set website width
        const width = parseInt(style['width']);
        if(!!width && this.model.head.getWebsiteWidth() !== width) {
          this.model.head.setWebsiteWidth(width);
        }
        delete style['width'];
      }
    }

    // store in JSON
    const targetObj = isMobile ? this.mobileStylesObj : this.stylesObj;
    if (deleteStyle) {
      delete targetObj[elementId];
    } else {
      targetObj[elementId] = style as CssRule;
    }

    // find the index of the rule for the given element
    const cssRuleObject = this.findCssRule(elementId, isMobile);

    // update or create the rule
    if (cssRuleObject) {
      this.styleSheet.deleteRule(cssRuleObject.index);
    }
    // convert style to string
    if (!deleteStyle) {
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
  }

  /**
   * get / set the css style of an element
   * @param opt_isMobile defaults to the global setting of silex.view.Workspace
   * @return a clone of the style object
   */
  getStyle(element: HTMLElement, opt_isMobile?: boolean): CssRule {
    let elementId = (this.getSilexId(element) as SilexId);
    const isMobile = opt_isMobile != null ? opt_isMobile :  this.view.workspace.getMobileEditor();
    const targetObj = (isMobile ? this.mobileStylesObj : this.stylesObj as SilexData);
    const style = (targetObj[elementId] as CssRule);
    if (!!style) {
      const clone = (JSON.parse(JSON.stringify(style)) as CssRule);

      // convert to obj (also makes it a copy we can change)
      // styles of sections are special
      // the min-height of the section is stored on its content container
      if (this.model.element.isSection(element)) {
        // min-height of sections is the min-height of section content
        const contentElement =
            (this.model.element.getContentNode(element) as HTMLElement);
        const contentStyle = this.getStyle(contentElement, isMobile);
        if (contentStyle) {
          clone['min-height'] = contentStyle['min-height'];
        }

        // width of section is null
        // style['width'] = undefined;
        delete clone['width'];
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
      const cssRule = this.styleSheet.cssRules[idx] as CSSRule;

      // we use the class name because elements have their ID as a css class too
      if (isMobile === false && cssRule['selectorText'] === '.' + elementId ||
          cssRule['media'] && cssRule['cssRules'] && cssRule['cssRules'][0] &&
              cssRule['cssRules'][0]['selectorText'] === '.' + elementId) {
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
    for (let idx = 0; idx < elements.length; idx++) {
      const element = elements[idx];
      const elementId = (this.getSilexId(element as HTMLElement) as SilexId);

      // desktop
      if (this.stylesObj[elementId]) {
        const styleStr = Style.styleToString(
            this.stylesObj[elementId], '\n    ');
        allStyles += '.' + elementId + ' {' + styleStr + '\n}\n';
      }

      // mobile
      if (this.mobileStylesObj[elementId]) {
        const styleStr = Style.styleToString(
            this.mobileStylesObj[elementId], '\n    ');
        allStyles +=
            this.addMediaQuery('.' + elementId + ' {' + styleStr + '\n}\n');
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

  /**
   * compute the bounding box of the given elements
   * it takes into account only the elements which have top, left, width and
   * height set in px
   * @return the bounding box containing all the elements
   */
  getBoundingBox(elements: HTMLElement[]): {top?: number, left?: number, width?: number, height?: number} {
    // compute the positions and sizes, which may end up to be NaN or a number
    let top = NaN, left = NaN, right = NaN, bottom = NaN;

    // browse all elements and compute the containing rect
    elements.forEach((element) => {
      // retrieve the styles strings (with "px")
      let elementStyle = this.getStyle(element, false);
      if (!elementStyle) {
        elementStyle = {
          'top': '',
          'left': '',
          'width': '',
          'height': '',
          'min-height': ''
        };
      } else {
        if (!elementStyle['top']) {
          elementStyle['top'] = '';
        }
        if (!elementStyle['left']) {
          elementStyle['left'] = '';
        }
        if (!elementStyle['width']) {
          elementStyle['width'] = '';
        }
        if (!elementStyle['height']) {
          elementStyle['height'] = '';
        }
      }

      // in mobile editor, if a mobile style is set use it
      if (this.view.workspace.getMobileEditor()) {
        let mobileStyle = this.getStyle(element, true);
        if (mobileStyle != null) {
          if (!!mobileStyle.top) {
            elementStyle['top'] = mobileStyle.top;
          }
          if (!!mobileStyle.left) {
            elementStyle['left'] = mobileStyle.left;
          }
          if (!!mobileStyle.width) {
            elementStyle['width'] = mobileStyle.width;
          }
          if (!!mobileStyle.height) {
            elementStyle['height'] = mobileStyle.height;
          }
        }
      }

      // compute the styles numerical values, which may end up to be NaN or a
      // number
      let elementMinWidth = elementStyle['min-width'] ?
          parseFloat(elementStyle['min-width'].substr(
              0, elementStyle['min-width'].indexOf('px'))) :
          null;
      let elementWidth = Math.max(
          elementMinWidth || 0,
          parseFloat(elementStyle['width'].substr(
              0, elementStyle['width'].indexOf('px'))));
      let elementMinHeight = elementStyle['min-height'] ?
          parseFloat(elementStyle['min-height'].substr(
              0, elementStyle['min-height'].indexOf('px'))) :
          null;
      let elementHeight = Math.max(
          elementMinHeight || 0,
          parseFloat(elementStyle['height'].substr(
              0, elementStyle['height'].indexOf('px'))) ||
              0);
      let elementTop = parseFloat(
          elementStyle['top'].substr(0, elementStyle['top'].indexOf('px')));
      let elementLeft = parseFloat(
          elementStyle['left'].substr(0, elementStyle['left'].indexOf('px')));
      let elementRight = (elementLeft || 0) + elementWidth;
      let elementBottom = (elementTop || 0) + elementHeight;

      // take the smallest top and left and the bigger bottom and rigth
      top = isNaN(top) ? elementTop :
                         Math.min(top, isNaN(elementTop) ? top : elementTop);
      left = isNaN(left) ?
          elementLeft :
          Math.min(left, isNaN(elementLeft) ? left : elementLeft);
      bottom = isNaN(bottom) ?
          elementBottom :
          Math.max(bottom, isNaN(elementBottom) ? bottom : elementBottom);
      right = isNaN(right) ?
          elementRight :
          Math.max(right, isNaN(elementRight) ? right : elementRight);
    });

    // no value for NaN results
    let res: {top?: number, left?: number, width?: number, height?: number} = {};
    if (!isNaN(top)) {
      res.top = top;
    }
    if (!isNaN(left)) {
      res.left = left;
    }
    if (!isNaN(bottom)) {
      res.height = bottom - (top || 0);
    }
    if (!isNaN(right)) {
      res.width = right - (left || 0);
    }
    return res;
  }
}
