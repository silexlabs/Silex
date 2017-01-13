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
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.Style');

goog.require('goog.array');
goog.require('goog.style');
goog.require('silex.model.Body');
goog.require('silex.model.Element');
goog.require('silex.model.Page');
goog.require('silex.model.Head');
goog.require('silex.view.BreadCrumbs');


/**
 * constant for the class names which are of internal use in Silex
 * they do not appear in the "css classes" text field of the style-pane
 * @const
 * @type {Array.<string>}
 */
silex.utils.Style.SILEX_CLASS_NAMES = [
  silex.model.Body.DRAGGING_CLASS_NAME,
  silex.model.Body.DROP_CANDIDATE_CLASS_NAME,
  silex.model.Body.PREVENT_DROPPABLE_CLASS_NAME,
  silex.model.Body.PREVENT_RESIZABLE_CLASS_NAME,
  silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME,
  silex.model.Body.EDITABLE_CLASS_NAME,
  silex.model.Head.ENABLE_MOBILE_CSS_CLASS,
  silex.model.Page.PAGED_CLASS_NAME,
  silex.model.Page.PAGED_HIDDEN_CLASS_NAME,
  silex.model.Page.PAGED_VISIBLE_CLASS_NAME,
  silex.model.Page.PAGEABLE_PLUGIN_READY_CLASS_NAME,
  silex.model.Page.PAGE_LINK_ACTIVE_CLASS_NAME,
  silex.model.Element.SELECTED_CLASS_NAME,
  silex.model.Element.JUST_ADDED_CLASS_NAME,
  silex.model.Element.ELEMENT_CONTENT_CLASS_NAME, // useful to hide it when the content container of a section is selected
  silex.model.Element.TYPE_CONTAINER_CONTENT, // useful to hide it when the content container of a section is selected
  silex.model.Element.WEBSITE_WIDTH_CLASS_NAME,
  silex.model.Element.WEBSITE_MIN_WIDTH_CLASS_NAME,
  silex.model.Element.TYPE_CONTAINER + '-element',
  silex.model.Element.TYPE_SECTION + '-element',
  silex.model.Element.TYPE_IMAGE + '-element',
  silex.model.Element.TYPE_TEXT + '-element',
  silex.model.Element.TYPE_HTML + '-element',
  silex.model.Component.COMPONENT_CLASS_NAME,
  silex.view.BreadCrumbs.EDITABLE_STYLE_HOVER_CLASS,
];


/**
 * constant for the class names which are of internal use in Silex
 * only the classes which are temporary and useless to store
 * @const
 * @type {Array.<string>}
 */
silex.utils.Style.SILEX_TEMP_CLASS_NAMES = [
  silex.model.Page.PAGED_HIDDEN_CLASS_NAME,
  silex.model.Page.PAGED_VISIBLE_CLASS_NAME,
  silex.model.Page.PAGEABLE_PLUGIN_READY_CLASS_NAME,
  silex.model.Element.SELECTED_CLASS_NAME,
  silex.model.Element.JUST_ADDED_CLASS_NAME,
  silex.view.BreadCrumbs.EDITABLE_STYLE_HOVER_CLASS
];


/**
 * remove useless class names of an element created by silex
 * remove all silex internal classes
 * @param  {!Element} element   created by silex, either a text box, image, ...
 * @param  {?boolean=} opt_allClasses   if true, remove all Silex classes, not only the classes which are temporary and useless to store
 * @param  {?boolean=} opt_isRecursive  if true, remove classes from the element and its children
 */
silex.utils.Style.removeInternalClasses = function(element, opt_allClasses, opt_isRecursive) {
  var classes = silex.utils.Style.SILEX_TEMP_CLASS_NAMES;
  if (opt_allClasses) {
    classes = silex.utils.Style.SILEX_CLASS_NAMES;
  }
  for (let idx in classes) {
    var className = classes[idx];
    goog.dom.classlist.remove(element, className);
    if (opt_isRecursive) {
      var elements = goog.dom.getElementsByClass(className, element);
      goog.array.forEach(elements, function(child) {
        goog.dom.classlist.remove(child, className);
      });
    }
  }
};


/**
 * convert style object to object
 * with only the keys which are set
 * @param {CSSStyleDeclaration} styleObj
 * @return {Object}
 */
silex.utils.Style.styleToObject = function(styleObj) {
  var res = {};
  for (let idx = 0; idx < styleObj.length; idx++) {
    var styleName = styleObj[idx];
    res[styleName] = styleObj[styleName];
  }
  return res;
};


/**
 * convert style object to string
 * @param {string|Object|CSSStyleDeclaration} style
 * @param {?string=} opt_tab
 * @return {string}
 */
silex.utils.Style.styleToString = function(style, opt_tab) {
  if (typeof style === 'string') {
    return style;
  }
  if (!opt_tab) {
    opt_tab = '';
  }
  var styleStr = '';
  for (var idx in style) {
    // filter the numerical indexes of a CSSStyleDeclaration object
    // filter initial values and shorthand properties
    if (style[idx] &&
      typeof style[idx] === 'string' &&
      style[idx] !== '' &&
      idx.match(/[^0-9]/)) {
      styleStr += opt_tab + goog.string.toSelectorCase(idx) + ': ' + style[idx] + '; ';
    }
  }
  return styleStr;
};


/**
 * convert style string to object
 * @param {string} styleStr
 * @return {Object}
 */
silex.utils.Style.stringToStyle = function(styleStr) {
  return goog.style.parseStyleAttribute(styleStr);
};


/**
 * Compute background color
 * Takes the opacity of the backgrounds into account
 * Recursively compute parents background colors
 * @param {Element} element the element which bg color we want
 * @param {Window} contentWindow of the iframe containing the website
 * @return {?goog.color.Rgb} the element bg color
 */
silex.utils.Style.computeBgColor = function(element, contentWindow) {
  var parentColorArray;
  // retrieve the parents blended colors
  if (element.parentNode && element.parentNode.nodeType === 1) {
    parentColorArray = silex.utils.Style.computeBgColor(/** @type {Element} */ (element.parentNode), contentWindow);
  }
  else {
    parentColorArray = null;
  }
  // rgba array
  var elementColorArray = null;
  var elementColorStr = contentWindow.getComputedStyle(element)['background-color'];
  if (elementColorStr) {
    // convert bg color from rgba to array
    if (elementColorStr.indexOf('rgba') >= 0) {
      // rgba case
      var alpha = parseFloat(elementColorStr.substring(
          elementColorStr.lastIndexOf(',') + 1,
          elementColorStr.lastIndexOf(')')));
      elementColorStr = elementColorStr.replace('rgba', 'rgb');
      elementColorStr = elementColorStr.substring(0,
          elementColorStr.lastIndexOf(',')) + ')';
      elementColorArray = goog.color.hexToRgb(goog.color.parse(elementColorStr).hex);
      elementColorArray.push(alpha);
    }
    else if (elementColorStr.indexOf('transparent') >= 0) {
      // transparent case
      elementColorArray = null;
    }
    else if (elementColorStr.indexOf('rgb') >= 0) {
      // rgb case
      elementColorArray = goog.color.hexToRgb(
          goog.color.parse(elementColorStr).hex
          );
      elementColorArray.push(1);
    }
    else if (elementColorStr.indexOf('#') >= 0) {
      // hex case
      elementColorArray = goog.color.hexToRgb(elementColorStr);
      elementColorArray.push(1);
    }
    else {
      // handle all colors, including the named colors
      elementColorStr = goog.style.getBackgroundColor(element);
      // named color case
      elementColorArray = goog.color.hexToRgb(
          goog.color.parse(elementColorStr).hex
          );
      elementColorArray.push(1);
    }
  }
  else {
    console.warn('was not able to take the element bg color into account');
    elementColorArray = null;
  }
  var res;
  // handle the case where there is no need to blend
  if (elementColorArray === null && parentColorArray === null) {
    // there is no need to blend
    res = null;
  }
  else if (elementColorArray === null) {
    // there is no need to blend
    res = parentColorArray;
  }
  else if (parentColorArray === null) {
    // there is no need to blend
    res = elementColorArray;
  }
  else {
    // blend the parents and the element's bg colors
    // f = (e*ae + p*(1-ae))
    var complement = 1 - elementColorArray[3];
    res = [
      (elementColorArray[0] * elementColorArray[3] + parentColorArray[0] * complement),
      (elementColorArray[1] * elementColorArray[3] + parentColorArray[1] * complement),
      (elementColorArray[2] * elementColorArray[3] + parentColorArray[2] * complement),
      1
    ];
  }
  return res;
};


/**
 * convert hex color to rgba values
 * example: #000000FF will return rgba(0, 0, 0, 1)
 * @param {string} hex
 * @return {string}
 */
silex.utils.Style.hexToRgba = function(hex) {
  if (hex.indexOf('#') !== 0) {
    return hex;
  }
  if (hex.length !== 9) {
    console.error('Error in length ' + hex + ' - ' + hex.length);
    return hex;
  }
  var hexArr = silex.utils.Style.hexToArray(hex);
  var r = hexArr[0];
  var g = hexArr[1];
  var b = hexArr[2];
  var a = hexArr[3];

  var result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  return result;
};


/**
 * convert rgba to array of values
 * example:    #000000FF will return [0, 0, 0, 1]
 * @param {string} hex
 * @return {Array.<number>|null}
 */
silex.utils.Style.hexToArray = function(hex) {
  if (hex.indexOf('#') !== 0) {
    return null;
  }
  hex = hex.replace('#', '');
  var r = parseInt(hex.substring(0, 2), 16);
  var g = parseInt(hex.substring(2, 4), 16);
  var b = parseInt(hex.substring(4, 6), 16);
  var a = parseInt(hex.substring(6, 8), 16) / 255;

  var result = [r, g, b, a];
  return result;
};


/**
 * convert rgba to hex
 * example:    rgba(0, 0, 0, 1) will return #000000FF
 * @param {string} rgba
 * @return {string}
 */
silex.utils.Style.rgbaToHex = function(rgba) {
  // has to be rgb or rgba
  if (rgba.indexOf('rgb') !== 0) {
    return rgba;
  }
  // get the array version
  var rgbaArr = silex.utils.Style.rgbaToArray(rgba);

  var r = rgbaArr[0].toString(16);
  if (r.length < 2) {
    r = '0' + r;
  }
  var g = rgbaArr[1].toString(16);
  if (g.length < 2) {
    g = '0' + g;
  }
  var b = rgbaArr[2].toString(16);
  if (b.length < 2) {
    b = '0' + b;
  }
  var a = (rgbaArr[3]).toString(16);
  if (a.length < 2) {
    a = '0' + a;
  }

  var result = '#' + (r + g + b + a);
  return result;
};


/**
 * convert rgba to array of values
 * example:    rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
 * @param {string} rgba
 * @return {Array.<number>|null}
 */
silex.utils.Style.rgbaToArray = function(rgba) {
  // not rgb nor rgba
  if (rgba.indexOf('rgb') !== 0) {
    return null;
  }
  if (rgba.indexOf('rgba') !== 0) {
    // rgb
    rgba = rgba.replace('rgb', '');
  }
  else {
    // rgba
    rgba = rgba.replace('rgba', '');
  }
  rgba = rgba.replace(' ', '');
  var rgbaArr = rgba.substring(1, rgba.length - 1).split(',');

  // add alpha if needed
  if (rgbaArr.length < 4) {
    rgbaArr.push('1');
  }

  var r = parseInt(rgbaArr[0], 10);
  var g = parseInt(rgbaArr[1], 10);
  var b = parseInt(rgbaArr[2], 10);
  var a = parseInt(rgbaArr[3] * 255, 10);

  var result = [r, g, b, a];
  return result;
};
