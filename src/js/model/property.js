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

goog.provide('silex.model.Property');
goog.require('silex.Config');
goog.require('silex.service.SilexTasks');

/**
 * @constructor
 * @param  {silex.types.Model} model  model class which holds the other models
 * @param  {silex.types.View} view  view class which holds the other views
 */
silex.model.Property = function(model, view) {
  // store the model and the view
  /**
   * @type {silex.types.Model}
   */
  this.model = model;
  /**
   * @type {silex.types.View}
   */
  this.view = view;
};


/**
 *
 * @typedef {{rule: CSSRule, parent: (CSSRule|StyleSheet), index: number}}
 */
silex.model.Property.CSSRuleInfo;


/**
 * constant for the ID of the style tag
 * containing all CSS rules for the elements on stage
 * which are being edited with the wysiwyg
 * @const
 */
silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles';

/**
 * constant for the ID of the HTML node used
 * to store Silex data as a JSON object of type silex.model.data.SilexData
 * containing all CSS rules for the elements on stage
 * which are being edited with the wysiwyg
 * @const
 */
silex.model.Property.JSON_STYLE_TAG_CLASS_NAME = 'silex-json-styles';

/**
 * constant for the prefix of the IDs given to Silex editable elements
 * @const
 */
silex.model.Property.ELEMENT_ID_PREFIX = 'silex-id-';


/**
 * constant for the attribute name holding the IDs given to Silex editable elements
 * @const
 */
silex.model.Property.ELEMENT_ID_ATTR_NAME = 'data-silex-id';


/**
 * constant for the value of media query for mobile version
 * @const
 * @static
 */
silex.model.Property.MOBILE_MEDIA_QUERY = 'only screen and (max-width: 480px), only screen and (max-device-width: 480px)';


/**
 * @type {silex.model.data.ProdotypeData}
 */
silex.model.Property.EMPTY_PRODOTYPE_DATA = {
  'component': {},
  'style': {},
}


/**
 * the current file's silex style sheet which holds silex elements styles
 * this is stored for performance reasons
 * @type {?StyleSheet}
 */
silex.model.Property.prototype.styleSheet = null;


/**
 * a number appended to the current timestamp in order to make unique Silex IDs
 * @type {number}
 */
silex.model.Property.prototype.nextId = 0;


/**
 * @type {silex.model.data.SilexData}
 */
silex.model.Property.prototype.stylesObj = {};


/**
 * @type {Array<Font>}
 */
silex.model.Property.prototype.fonts = [];


/**
 * @type {silex.model.data.SilexData}
 */
silex.model.Property.prototype.mobileStylesObj = {};


/**
 * arbitrary data for prodotype components
 * @type {silex.model.data.ProdotypeData}
 */
silex.model.Property.prototype.prodotypeDataObj = silex.model.Property.EMPTY_PRODOTYPE_DATA;


/**
 * @param {Array<Font>} fonts
 */
silex.model.Property.prototype.setFonts = function(fonts) {
  console.log('setFonts aaa', fonts)
  this.fonts = fonts;
};


/**
 * @return {Array<Font>} returns a copy of this.fonts
 */
silex.model.Property.prototype.getFonts = function() {
  return this.fonts.slice();
};


/**
 * get/set Silex ID
 * @param {Element} element
 * @return {?silex.model.data.SilexId} uniqueId
 */
silex.model.Property.prototype.getSilexId = function(element) {
  return element.getAttribute(silex.model.Property.ELEMENT_ID_ATTR_NAME);
};


/**
 * get/set Silex ID
 * @param {Element} element
 * @param {silex.model.data.SilexId} uniqueId
 */
silex.model.Property.prototype.setSilexId = function(element, uniqueId) {
  var oldId = this.getSilexId(element);
  if (oldId) {
    element.classList.remove(oldId);
  }
  element.setAttribute(silex.model.Property.ELEMENT_ID_ATTR_NAME, uniqueId);
  element.classList.add(uniqueId);
};


/**
 * @param {silex.model.data.SilexId} uniqueId
 * @param {?Document=} opt_doc docment of the iframe containing the website
 * @return {Element}
 */
silex.model.Property.prototype.getElementBySilexId = function(uniqueId, opt_doc) {
  opt_doc = opt_doc || this.model.file.getContentDocument();
  return opt_doc.querySelector('[' + silex.model.Property.ELEMENT_ID_ATTR_NAME + '="' + uniqueId + '"]');
};


/**
 * @param {?Document=} opt_doc docment of the iframe containing the website
 * @return {silex.model.data.SilexId}
 */
silex.model.Property.prototype.generateSilexId = function(opt_doc) {
  var uniqueId;
  do {
    uniqueId = Date.now().toString() + '-' + (this.nextId++);
  } while (this.getElementBySilexId(uniqueId, opt_doc));
  return uniqueId;
};


/**
 * @param {Element} element
 * @param {?Document=} doc docment of the iframe containing the website
 */
silex.model.Property.prototype.initSilexId = function(element, doc) {
  // add the selector for this element
  var idAndClass = silex.model.Property.ELEMENT_ID_PREFIX + this.generateSilexId(doc);
  this.setSilexId(element, idAndClass);
};



/**
 * Convert the styles to json and save it in a script tag
 */
silex.model.Property.prototype.saveProperties = function(doc) {
  var styleTag = doc.querySelector('.' + silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
  if (!styleTag) {
    styleTag = doc.createElement('script');
    styleTag.type = 'text/json';
    styleTag.classList.add(silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
    goog.dom.appendChild(doc.head, styleTag);
  }
  // always save as json, it used to be javascript and sometimes it tabs mess up the json
  styleTag.type = 'text/json';

  let obj = /** @type {silex.model.data.JsonData} */({
    'fonts': this.fonts || [],
    'desktop': this.stylesObj || {},
    'mobile': this.mobileStylesObj || {},
    'prodotypeData': {
      'component': this.prodotypeDataObj['component'] || {},
      'style': this.prodotypeDataObj['style'] || {},
    },
  });
  // TODO: it is useless to store an array, a single object would be better
  styleTag.innerHTML = JSON.stringify([obj]);
};


/**
 * Load the styles from the json saved in a script tag
 */
silex.model.Property.prototype.loadProperties = function(doc) {
  var styleTag = doc.querySelector('.' + silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
  if (styleTag != null) {
    let styles = /** @type {Object} */ (JSON.parse(styleTag.innerHTML)[0]);
    this.fonts = styles['fonts'] || [];
    this.stylesObj = styles['desktop'] || {};
    this.mobileStylesObj = styles['mobile'] || {};
    this.prodotypeDataObj = styles['prodotypeData'] && styles['prodotypeData']['component'] && styles['prodotypeData']['style'] ? /** @type {silex.model.data.ProdotypeData} */ ({
      'component': /** @type {Object<silex.model.data.SilexId, silex.model.data.ComponentData>} */ (styles['prodotypeData']['component']),
      'style': /** @type {Object<silex.model.data.StyleName, silex.model.data.StyleData>} */ (styles['prodotypeData']['style']),
    }) : silex.model.Property.EMPTY_PRODOTYPE_DATA;
    // FIXME: put this in backward compat
    if(styles['componentData']) this.prodotypeDataObj['component'] = styles['componentData'];
  }
  else {
    this.fonts = [];
    this.stylesObj = {};
    this.mobileStylesObj = {};
    this.prodotypeDataObj = silex.model.Property.EMPTY_PRODOTYPE_DATA;
    console.info('Warning: no JSON styles array found in the dom');
  }

  // make it easy to inspect the properties in debug mode
  if(goog.DEBUG) {
    window['silexFonts'] = this.fonts;
    window['silexStylesObj'] = this.stylesObj;
    window['silexMobileStylesObj'] = this.mobileStylesObj;
    window['silexProdotypeDataObj'] = this.prodotypeDataObj;
  }
};

/**
 * check existance and possibly create a style tag holding Silex elements styles
 * @param {Document} doc docment of the iframe containing the website
 * @return {Element}
 */
silex.model.Property.prototype.initStyles = function(doc) {
  // make sure of the existance of the style tag with Silex definitions
  var styleTag = doc.querySelector('.' + silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME);
  if (!styleTag) {
    styleTag = doc.createElement('style');
    styleTag.classList.add(silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME);
    styleTag.setAttribute('type', 'text/css');
    doc.head.appendChild(styleTag);
  }
  //retrieve the style sheet with Silex definitions
  this.styleSheet = null;
  for (let idx = 0; idx < doc.styleSheets.length; idx++) {
    if (doc.styleSheets[idx].ownerNode && doc.styleSheets[idx].ownerNode == styleTag) {
      this.styleSheet = doc.styleSheets[idx];
    }
  }
  if (this.styleSheet === null) {
    console.error('no stylesheet found');
  }
  return styleTag;
};


/**
 * get / set the data associated with an ID
 * if opt_prodotypeData is null this data set will removed
 * @param {silex.model.data.SilexId} id
 * @param {silex.model.data.ProdotypeTypes} type
 * @param {?silex.model.data.ComponentData|?silex.model.data.StyleData=} opt_prodotypeData
 * @private
 */
silex.model.Property.prototype.setProdotypeData = function(id, type, opt_prodotypeData) {
  // store in object
  if(opt_prodotypeData) this.prodotypeDataObj[type][id] = opt_prodotypeData;
  else delete this.prodotypeDataObj[type][id];
};


/**
 * get / set the data associated with an ID
 * if opt_prodotypeData is null this data set will removed
 * @param {silex.model.data.SilexId} id
 * @param {?silex.model.data.ComponentData=} opt_prodotypeData
 */
silex.model.Property.prototype.setComponentData = function(id, opt_prodotypeData) {
  this.setProdotypeData(id, silex.model.data.ProdotypeTypes.COMPONENT, opt_prodotypeData);
};


/**
 * get / set the data associated with an ID
 * if opt_prodotypeData is null this data set will removed
 * @param {silex.model.data.SilexId} id
 * @param {?silex.model.data.StyleData=} opt_prodotypeData
 */
silex.model.Property.prototype.setStyleData = function(id, opt_prodotypeData) {
  this.setProdotypeData(id, silex.model.data.ProdotypeTypes.STYLE, opt_prodotypeData);
};


/**
 * get / set the data associated with an element
 * @param {silex.model.data.SilexId} id
 * @param {silex.model.data.ProdotypeTypes} type
 * @return {?silex.model.data.ComponentData|?silex.model.data.StyleData} a clone of the data object
 * @private
 */
silex.model.Property.prototype.getProdotypeData = function(id, type) {
  const res = this.prodotypeDataObj[type][id];
  if(res) {
    const clone = /** @type {silex.model.data.ComponentData|silex.model.data.StyleData} */ (JSON.parse(JSON.stringify(res)));
    // clone the object
    return clone;
  }
  return null;
};


/**
 * get / set the data associated with an element
 * @param {silex.model.data.SilexId} id
 * @return {?silex.model.data.ComponentData} a clone of the data object
 */
silex.model.Property.prototype.getComponentData = function(id) {
  return /** @type {?silex.model.data.ComponentData} */ (this.getProdotypeData(id, silex.model.data.ProdotypeTypes.COMPONENT));
};


/**
 * get / set the data associated with an element
 * @param {silex.model.data.StyleName} id
 * @return {?silex.model.data.StyleData} a clone of the data object
 */
silex.model.Property.prototype.getStyleData = function(id) {
  return /** @type {?silex.model.data.StyleData} */ (this.getProdotypeData(id, silex.model.data.ProdotypeTypes.STYLE));
};


/**
 * get / set the data associated with an element
 * if opt_componentData is null this will remove the rule
 * @param {Element} element
 * @param {silex.model.data.ProdotypeTypes} type
 * @param {?silex.model.data.ComponentData|?silex.model.data.StyleData=} opt_componentData
 * @private
 */
silex.model.Property.prototype.setElementData = function(element, type, opt_componentData) {
  // a section's container content can not be a component, but the section itself may be
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  // get the internal ID
  var elementId =  /** @type {silex.model.data.SilexId} */ (this.getSilexId(element));
  // store in object
  this.setProdotypeData(elementId, type, opt_componentData)
};


/**
 * get / set the data associated with an element
 * if opt_componentData is null this will remove the rule
 * @param {Element} element
 * @param {?silex.model.data.ComponentData=} opt_componentData
 */
silex.model.Property.prototype.setElementComponentData = function(element, opt_componentData) {
  // call private generic method
  this.setElementData(element, silex.model.data.ProdotypeTypes.COMPONENT, opt_componentData)
};


/**
 * get / set the data associated with an element
 * if opt_componentData is null this will remove the rule
 * @param {Element} element
 * @param {?silex.model.data.StyleData=} opt_componentData
 */
silex.model.Property.prototype.setElementStyleData = function(element, opt_componentData) {
  // call private generic method
  this.setElementData(element, silex.model.data.ProdotypeTypes.STYLE, opt_componentData)
};


/**
 * get / set the data associated with an element
 * @param {Element} element
 * @param {silex.model.data.ProdotypeTypes} type
 * @return {?silex.model.data.ComponentData|?silex.model.data.StyleData} a clone of the data object
 * @private
 */
silex.model.Property.prototype.getElementData = function(element, type) {
  // a section's container content can not be a component, but the section itself may be
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  // get the internal ID
  var elementId =  /** @type {silex.model.data.SilexId} */ (this.getSilexId(element));
  // returns value of object
  return this.getProdotypeData(elementId, type);
};


/**
 * get / set the data associated with an element
 * @param {Element} element
 * @return {?silex.model.data.ComponentData} a clone of the data object
 */
silex.model.Property.prototype.getElementComponentData = function(element) {
  // call private generic method
  return /** @type {?silex.model.data.ComponentData} */ (this.getElementData(element, silex.model.data.ProdotypeTypes.COMPONENT));
};


/**
 * get / set the data associated with an element
 * @param {Element} element
 * @return {?silex.model.data.StyleData} a clone of the data object
 */
silex.model.Property.prototype.getElementStyleData = function(element) {
  // call private generic method
  return /** @type {?silex.model.data.StyleData} */ (this.getElementData(element, silex.model.data.ProdotypeTypes.STYLE));
};


/**
 * get / set the css style of an element
 * this creates or update a rule in the style tag with id INLINE_STYLE_TAG_CLASS_NAME
 * if style is null this will remove the rule
 * @param {Element} element
 * @param {?Object} styleObj
 * @param {?boolean=} opt_isMobile
 */
silex.model.Property.prototype.setStyle = function(element, styleObj, opt_isMobile) {
  const deleteStyle = !styleObj;
  const style = styleObj || {};

  const elementId = /** @type {silex.model.data.SilexId} */ (this.getSilexId(element));
  const isMobile = opt_isMobile != null ? opt_isMobile : this.view.workspace.getMobileEditor()

  if(!deleteStyle) {
    // styles of sections are special
    if(this.model.element.isSection(element)) {
      // do not apply width to sections
      delete style['width'];

      // apply height to section content and not section itself
      const contentElement = /** @type {Element} */ (this.model.element.getContentNode(element));
      const contentStyle = this.getStyle(contentElement, isMobile) || {};
      if(style['min-height'] && style['min-height'] !== contentStyle['min-height']) {
        contentStyle['min-height'] = style['min-height'];
        this.setStyle(contentElement, contentStyle, isMobile);
      }
      // do not apply min-height to the section itself
      delete style['min-height'];
    }
    if(this.model.element.isSectionContent(element) && !this.view.workspace.getMobileEditor()) {
      // set a min-width style to sections so that they are always larger than their content container
      const parentElement = /** @type {Element} */ (element.parentNode);
      const parentStyle = this.getStyle(parentElement, isMobile) || {};
      if(style['width'] && style['width'] !== parentStyle['min-width']) {
        parentStyle['min-width'] = style['width'];
        this.setStyle(parentElement, parentStyle, isMobile);
      }
    }
    // to selector case
    for(let key in style) {
      const value = style[key];
      let cssName = goog.string.toSelectorCase(key);
      if(cssName !== key && value !== null && value !== '') {
        delete style[key];
        style[cssName] = value;
      }
    }
  }
  // store in JSON
  const targetObj = isMobile ? this.mobileStylesObj : this.stylesObj;
  if(deleteStyle) {
    delete targetObj[elementId];
  }
  else {
    targetObj[elementId] = style;
  }
  // find the index of the rule for the given element
  const cssRuleObject = this.findCssRule(elementId, isMobile);
  // update or create the rule
  if (cssRuleObject) {
    this.styleSheet.deleteRule(cssRuleObject.index);
  }
  // convert style to string
  if(!deleteStyle) {
    // we use the class name because elements have their ID as a css class too
    const styleStr = '.' + elementId + '{' + silex.utils.Style.styleToString(style) + '} ';
    if (isMobile) {
      // add the rule to the dom to see the changes, mobile rules after desktop ones
      this.styleSheet.insertRule(this.addMediaQuery(styleStr), this.styleSheet.cssRules.length);
    }
    else {
      this.styleSheet.insertRule(styleStr, 0);
    }
  }
};


/**
 * get / set the css style of an element
 * @param {Element} element
 * @param {?boolean=} opt_isMobile defaults to the global setting of silex.view.Workspace
 * @return {?silex.model.data.CssRule} a clone of the style object
 */
silex.model.Property.prototype.getStyle = function(element, opt_isMobile) {
  var elementId =  /** @type {silex.model.data.SilexId} */ (this.getSilexId(element));
  const isMobile = opt_isMobile != null ? opt_isMobile : this.view.workspace.getMobileEditor()
  const targetObj = /** @type {silex.model.data.SilexData} */ (isMobile ? this.mobileStylesObj : this.stylesObj);
  const style = /** @type {silex.model.data.CssRule} */ (targetObj[elementId]);
  if(!!style) {
    const clone = /** @type {silex.model.data.CssRule} */ (JSON.parse(JSON.stringify(style)));
    // convert to obj (also makes it a copy we can change)
    // styles of sections are special
    // the min-height of the section is stored on its content container
    if(this.model.element.isSection(element)) {
      // min-height of sections is the min-height of section content
      const contentElement = /** @type {Element} */ (this.model.element.getContentNode(element));
      const contentStyle = this.getStyle(contentElement, isMobile);
      if(contentStyle) {
        clone['min-height'] = contentStyle['min-height'];
      }
      // width of section is null
      // style['width'] = undefined;
      delete clone['width'];
    }
    return clone;
  }
  return null;
};


/**
 * @param {string} elementId
 * @param {boolean} isMobile
 * @return {?silex.model.Property.CSSRuleInfo} null if not found
 */
silex.model.Property.prototype.findCssRule = function(elementId, isMobile) {
  // find the rule for the given element
  for (let idx = 0; idx < this.styleSheet.cssRules.length; idx++) {
    let cssRule = this.styleSheet.cssRules[idx];
    // we use the class name because elements have their ID as a css class too
    if ((isMobile === false && cssRule.selectorText === '.' + elementId) ||
      (cssRule.media
        && cssRule.cssRules
        && cssRule.cssRules[0]
        && cssRule.cssRules[0].selectorText === '.' + elementId)) {
      return {
        rule: cssRule,
        parent: this.styleSheet,
        index: parseInt(idx, 10)
      };
    }
  }
  return null;
 };


/**
 * @param {Document} doc docment of the iframe containing the website
 * @return {string} the string defining all elements styles
 */
silex.model.Property.prototype.getAllStyles = function(doc) {
  const elements = doc.querySelectorAll('body, .' + silex.model.Body.EDITABLE_CLASS_NAME);
  let allStyles = '';
  for(let idx=0; idx<elements.length; idx++) {
    const element = elements[idx];
    const elementId =  /** @type {silex.model.data.SilexId} */ (this.getSilexId(element));
    // desktop
    if(this.stylesObj[elementId]) {
      const styleStr = silex.utils.Style.styleToString(this.stylesObj[elementId], '\n    ');
      allStyles += '.' + elementId + ' {' + styleStr + '\n}\n';
    }
    // mobile
    if(this.mobileStylesObj[elementId]) {
      const styleStr = silex.utils.Style.styleToString(this.mobileStylesObj[elementId], '\n    ');
      allStyles += this.addMediaQuery('.' + elementId + ' {' + styleStr + '\n}\n');
    }
  }
  return allStyles;
};


/**
 * add a media query around the style string
 * will make the style mobile-only
 * @param {string} styleStr
 */
silex.model.Property.prototype.addMediaQuery = function(styleStr) {
  return '@media ' + silex.model.Property.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
};


/**
 * compute the bounding box of the given elements
 * it takes into account only the elements which have top, left, width and height set in px
 * @param {Array.<Element>|{length:number}} elements
 * @return {{top:?number, left:?number, width:?number, height:?number}} the bounding box containing all the elements
 */
silex.model.Property.prototype.getBoundingBox = function(elements) {
  // compute the positions and sizes, which may end up to be NaN or a number
  var top = NaN,
      left = NaN,
      right = NaN,
      bottom = NaN;
  // browse all elements and compute the containing rect
  goog.array.forEach(elements, function(element) {
    // retrieve the styles strings (with "px")
    var elementStyle = this.getStyle(element, false);
    if (!elementStyle) {
      elementStyle = {
        'top': '',
        'left': '',
        'width': '',
        'height': '',
        'min-height': ''
      };
    }
    else {
      if (!elementStyle['top']) elementStyle['top'] = '';
      if (!elementStyle['left']) elementStyle['left'] = '';
      if (!elementStyle['width']) elementStyle['width'] = '';
      if (!elementStyle['height']) elementStyle['height'] = '';
    }
    // in mobile editor, if a mobile style is set use it
    if (this.view.workspace.getMobileEditor()) {
      var mobileStyle = this.getStyle(element, true);
      if(mobileStyle != null) {
        if (!!mobileStyle.top) elementStyle['top'] = mobileStyle.top;
        if (!!mobileStyle.left) elementStyle['left'] = mobileStyle.left;
        if (!!mobileStyle.width) elementStyle['width'] = mobileStyle.width;
        if (!!mobileStyle.height) elementStyle['height'] = mobileStyle.height;
      }
    }
    // compute the styles numerical values, which may end up to be NaN or a number
    var elementMinWidth = elementStyle['min-width'] ? parseFloat(elementStyle['min-width'].substr(0, elementStyle['min-width'].indexOf('px'))) : null;
    var elementWidth = Math.max(elementMinWidth || 0, parseFloat(elementStyle['width'].substr(0, elementStyle['width'].indexOf('px'))));
    var elementMinHeight = elementStyle['min-height'] ? parseFloat(elementStyle['min-height'].substr(0, elementStyle['min-height'].indexOf('px'))) : null;
    var elementHeight = Math.max(elementMinHeight || 0, parseFloat(elementStyle['height'].substr(0, elementStyle['height'].indexOf('px'))) || 0);
    var elementTop = parseFloat(elementStyle['top'].substr(0, elementStyle['top'].indexOf('px')));
    var elementLeft = parseFloat(elementStyle['left'].substr(0, elementStyle['left'].indexOf('px')));
    var elementRight = (elementLeft || 0) + elementWidth;
    var elementBottom = (elementTop || 0) + elementHeight;
    // take the smallest top and left and the bigger bottom and rigth
    top = isNaN(top) ? elementTop : Math.min(top, isNaN(elementTop) ? top : elementTop);
    left = isNaN(left) ? elementLeft : Math.min(left, isNaN(elementLeft) ? left : elementLeft);
    bottom = isNaN(bottom) ? elementBottom : Math.max(bottom, isNaN(elementBottom) ? bottom : elementBottom);
    right = isNaN(right) ? elementRight : Math.max(right, isNaN(elementRight) ? right : elementRight);
  }, this);
  // no value for NaN results
  var res = {};
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
};

