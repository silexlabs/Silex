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
 * @typedef {{rule: CSSRule, parent: (CSSRule|CSSStyleSheet), index: number}}
 */
silex.model.Property.CSSRuleInfo;



/**
 * constant for the ID of the style tag
 * containing all CSS rules for the elements on stage
 * which are being edited with the wysiwyg
 * @const
 */
silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME = 'silex-inline-styles';

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
 * the current file's silex style sheet which holds silex elements styles
 * this is stored for performance reasons
 * @type {?CSSStyleSheet}
 */
silex.model.Property.prototype.styleSheet = null;


/**
 * a number appended to the current timestamp in order to make unique Silex IDs
 * @type {number}
 */
silex.model.Property.prototype.nextId = 0;


/**
 * @type {Object}
 */
silex.model.Property.prototype.stylesObj = {};


/**
 * @type {Object}
 */
silex.model.Property.prototype.mobileStylesObj = {};


/**
 * arbitrary data for elements and components
 * @type {Object}
 */
silex.model.Property.prototype.componentDataObj = {};


/**
 * get/set Silex ID
 * @param {Element} element
 * @return {?string} uniqueId
 */
silex.model.Property.prototype.getSilexId = function(element) {
  return element.getAttribute(silex.model.Property.ELEMENT_ID_ATTR_NAME);
};


/**
 * get/set Silex ID
 * @param {Element} element
 * @param {string} uniqueId
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
 * @param {string} uniqueId
 * @param {?Document=} doc docment of the iframe containing the website
 * @return {Element}
 */
silex.model.Property.prototype.getElementBySilexId = function(uniqueId, doc) {
  doc = doc || this.model.file.getContentDocument();
  return doc.querySelector('[' + silex.model.Property.ELEMENT_ID_ATTR_NAME + '="' + uniqueId + '"]');
};


/**
 * @param {?Document=} doc docment of the iframe containing the website
 * @return {string}
 */
silex.model.Property.prototype.generateSilexId = function(doc) {
  var uniqueId;
  do {
    uniqueId = Date.now().toString() + '-' + (this.nextId++);
  } while (this.getElementBySilexId(uniqueId, doc));
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
    styleTag.classList.add(silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
    goog.dom.appendChild(doc.head, styleTag);
  }
  let obj = {
    'desktop': this.stylesObj,
    'mobile': this.mobileStylesObj,
    'componentData': this.componentDataObj,
  };
  styleTag.innerHTML = '[' + JSON.stringify(obj) + ']';
};


/**
 * Load the styles from the json saved in a script tag
 */
silex.model.Property.prototype.loadProperties = function(doc) {
  var styleTag = doc.querySelector('.' + silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
  if (styleTag != null) {
    let styles = /** @type {Object} */ (JSON.parse(styleTag.innerHTML)[0]);
    if (styles && styles['desktop'] && styles['mobile']) {
      this.stylesObj = styles['desktop'] || {};
      this.mobileStylesObj = styles['mobile'] || {};
      this.componentDataObj = styles['componentData'] || {};
    }
    else {
      console.error('Error: could not retrieve desktop and mobile styles from the dom (.' + silex.model.Property.JSON_STYLE_TAG_CLASS_NAME + ')');
    }
  }
  else {
    this.stylesObj = {};
    this.mobileStylesObj = {};
    this.componentDataObj = {};
    console.info('Warning: no JSON styles array found in the dom');
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
    goog.dom.appendChild(doc.head, styleTag);
  }
  //retrieve the style sheet with Silex definitions
  this.styleSheet = null;
  for (var idx in doc.styleSheets) {
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
 * get / set the data associated with an element
 * if opt_componentData is null this will remove the rule
 * @param {Element} element
 * @param {?Object=} opt_componentData
 */
silex.model.Property.prototype.setComponentData = function(element, opt_componentData) {
  // a section's container content can not be a component, but the section itself may be
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  // get the internal ID
  var elementId =  /** @type {string} */ (this.getSilexId(element));
  // store in object
  if(opt_componentData) {
    this.componentDataObj[elementId] = opt_componentData;
  }
  else {
    delete this.componentDataObj[elementId];
  }
};


/**
 * get / set the data associated with an element
 * @param {Element} element
 * @return {?Object} a clone of the data object
 */
silex.model.Property.prototype.getComponentData = function(element) {
  // a section's container content can not be a component, but the section itself may be
  if(this.model.element.isSectionContent(element)) {
    element = /** @type {Element} */ (element.parentNode);
  }
  // get the internal ID
  var elementId =  /** @type {string} */ (this.getSilexId(element));
  // returns value of object
  return this.componentDataObj[elementId];
};


/**
 * get / set the css style of an element
 * this creates or update a rule in the style tag with id INLINE_STYLE_TAG_CLASS_NAME
 * if style is null this will remove the rule
 * @param {Element} element
 * @param {?Object} style
 * @param {?boolean=} opt_isMobile
 */
silex.model.Property.prototype.setStyle = function(element, style, opt_isMobile) {
  // styles of sections are special
  if(style && this.model.element.isSection(element)) {
    if(style['width']) {
      // do not apply width to sections
      delete style['width'];
    }
    // apply height to section content and not section itself
    const contentElement = /** @type {Element} */ (this.model.element.getContentNode(element));
    const contentStyle = this.getStyle(contentElement, opt_isMobile) || {};
    if(style['min-height'] && style['min-height'] !== contentStyle['min-height']) {
      contentStyle['min-height'] = style['min-height'];
      this.setStyle(contentElement, contentStyle, opt_isMobile);
    }
    // do not apply min-height to the section itself
    style['min-height'] = null;
    delete style['min-height'];
  }
  if(style && this.model.element.isSectionContent(element) && !this.view.workspace.getMobileEditor()) {
    // set a min-width style to sections so that they are always larger than their content container
    const parentElement = /** @type {Element} */ (element.parentNode);
    const parentStyle = this.getStyle(parentElement, opt_isMobile) || {};
    if(style['width'] && style['width'] !== parentStyle['min-width']) {
      parentStyle['min-width'] = style['width'];
      this.setStyle(parentElement, parentStyle, opt_isMobile);
    }
  }
  var elementId =  /** @type {string} */ (this.getSilexId(element));
  var isMobile = opt_isMobile != null ? opt_isMobile : this.view.workspace.getMobileEditor()
  // to selector case
  if(style) {
    for(let key in style) {
      let cssName = goog.string.toSelectorCase(key);
      if(cssName !== key && style[key] !== null && style[key] !== '') {
        let val = style[key];
        delete style[key];
        style[cssName] = val;
      }
    }
  }
  // store in JSON
  if (isMobile) {
    if(style) {
      this.mobileStylesObj[elementId] = style;
    }
    else {
      delete this.mobileStylesObj[elementId];
    }
  }
  else {
    if(style) {
      this.stylesObj[elementId] = style;
    }
    else {
      delete this.stylesObj[elementId];
    }
  }
  // find the index of the rule for the given element
  const cssRuleObject = this.findCssRule(elementId, isMobile);
  // update or create the rule
  if (cssRuleObject) {
    this.styleSheet.deleteRule(cssRuleObject.index);
  }
  // convert style to string
  if(style) {
    let styleStr = silex.utils.Style.styleToString(style);
    // we use the class name because elements have their ID as a css class too
    styleStr = '.' + elementId + '{' + styleStr + '} ';
    if (isMobile) {
      styleStr = '@media ' + silex.model.Property.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
    }
    // add the rule to the dom to see the changes, mobile rules after desktop ones
    if(isMobile) {
      this.styleSheet.insertRule(styleStr, this.styleSheet.cssRules.length);
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
 * @param {?boolean=} opt_computed computed syle or stored value? defaults to false
 * @return {?Object} a clone of the style object
 */
silex.model.Property.prototype.getStyle = function(element, opt_isMobile, opt_computed) {
  let res = null;
  if (opt_computed === true) {
    let stylesObj = this.model.file.getContentWindow().getComputedStyle(element);
    res = silex.utils.Style.styleToObject(stylesObj);
  }
  else {
    var elementId =  /** @type {string} */ (this.getSilexId(element));
    var isMobile = opt_isMobile;
    if (typeof(opt_isMobile) === 'undefined') isMobile = this.view.workspace.getMobileEditor();
    if (isMobile === true) {
      res = this.mobileStylesObj[elementId];
    }
    else {
      res = this.stylesObj[elementId];
    }
    if(res) {
      // clone the style object
      res = /** @type {Object} */ (JSON.parse(JSON.stringify(res)));
    }
  }
  // styles of sections are special
  // the min-height of the section is stored on its content container
  if(this.model.element.isSection(element) && res) {
    // min-height of sections is the min-height of section content
    const contentElement = /** @type {Element} */ (this.model.element.getContentNode(element));
    const contentStyle = this.getStyle(contentElement, opt_isMobile, opt_computed);
    if(contentStyle) {
      res['min-height'] = contentStyle['min-height'];
    }
    // width of section is null
    res['width'] = undefined;
    delete res['width'];
  }
  return res;
};


/**
 * @param {string} elementId
 * @param {boolean} isMobile
 * @return {?silex.model.Property.CSSRuleInfo} null if not found
 */
silex.model.Property.prototype.findCssRule = function(elementId, isMobile) {
  // find the rule for the given element
  for (var idx = 0; idx < this.styleSheet.cssRules.length; idx++) {
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
 * update Silex style tag with the styles of all elements
 * because the dom do not update automatically when we change document.styleSheets
 * @param {Document} doc docment of the iframe containing the website
 */
silex.model.Property.prototype.updateStylesInDom = function(doc) {
  var styleTag = doc.querySelector('.' + silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME);
  styleTag.innerHTML = this.getAllStyles(doc);
};


/**
 * @param {Document} doc docment of the iframe containing the website
 * @return {string} the string defining all elements styles
 */
silex.model.Property.prototype.getAllStyles = function(doc) {
  var elements = doc.querySelectorAll('body, .' + silex.model.Body.EDITABLE_CLASS_NAME);
  var allStyles = '';
  goog.array.forEach(elements, function(element) {
    var elementId =  /** @type {string} */ (this.getSilexId(element));
    // desktop
    let styleStr = silex.utils.Style.styleToString(this.stylesObj[elementId], '\n    ');
    if (styleStr != '') {
      styleStr = '.' + elementId + ' {' + styleStr + '\n}\n';
      allStyles += styleStr;
    }
    // mobile
    styleStr = silex.utils.Style.styleToString(this.mobileStylesObj[elementId], '\n    ');
    if (styleStr != '') {
      styleStr = '.' + elementId + ' {' + styleStr + '\n}\n';
      styleStr = '@media ' + silex.model.Property.MOBILE_MEDIA_QUERY + '{' + styleStr + '}';
      allStyles += styleStr;
    }
  }, this);
  return allStyles;
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

