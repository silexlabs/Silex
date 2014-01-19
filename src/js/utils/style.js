//////////////////////////////////////////////////
// Silex, live web creation
// http://projects.silexlabs.org/?/silex/
//
// Copyright (c) 2012 Silex Labs
// http://www.silexlabs.org/
//
// Silex is available under the GPL license
// http://www.silexlabs.org/silex/silex-licensing/
//////////////////////////////////////////////////

/**
 * @fileoverview Helper class for common tasks
 *
 */


goog.provide('silex.utils.Style');

goog.require('goog.style');
goog.require('goog.array');


/**
 * constant for the class names which are of internal use in Silex
 * @const
 * @type {string}
 */
silex.utils.Style.SILEX_CLASS_NAMES = [
  silex.utils.EditablePlugin.EDITABLE_CLASS_NAME,
  silex.utils.EditablePlugin.UI_RESIZABLE_CLASS_NAME,
  silex.utils.EditablePlugin.UI_DRAGGABLE_CLASS_NAME,
  silex.utils.EditablePlugin.UI_DROPPABLE_CLASS_NAME,
  silex.utils.EditablePlugin.UI_DRAGGABLE_DRAGGING_CLASS_NAME,
  silex.utils.EditablePlugin.UI_DRAGGABLE_RESIZING_CLASS_NAME,
  silex.utils.PageablePlugin.PAGEABLE_ROOT_CLASS_NAME,
  silex.utils.EditablePlugin.EDITABLE_CREATED_CLASS_NAME,
  silex.utils.PageablePlugin.PAGED_CLASS_NAME,
  silex.utils.PageablePlugin.PAGED_VISIBLE_CLASS_NAME,
  silex.view.Stage.STAGE_CLASS_NAME,
  silex.model.Element.SELECTED_CLASS_NAME,
  silex.model.Element.TYPE_CONTAINER + '-element',
  silex.model.Element.TYPE_IMAGE + '-element',
  silex.model.Element.TYPE_TEXT + '-element',
  silex.model.Element.TYPE_HTML + '-element'
];


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {element} element   created by silex, either a text box, image, ...
 * @return  {string}           the value for this styleName
 */
silex.utils.Style.getClassName = function(element) {
  var pages = silex.utils.PageablePlugin.getPages();
  return  goog.array.map(element.className.split(' '), function (name) {
    if(goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name)
      || goog.array.contains(pages, name)){
      return;
    }
    return name;
  }).join(' ').trim();
};


/**
 * get/set class name of the element of a container created by silex
 * remove all silex internal classes
 * @param  {element} element   created by silex, either a text box, image, ...
 * @param  {string} opt_className  the class names, or null to reset
 */
silex.utils.Style.setClassName = function(element, opt_className) {
  // compute class names to keep, no matter what
  // i.e. the one which are in element.className + in Silex internal classes
  var pages = silex.utils.PageablePlugin.getPages();
  var classNamesToKeep = goog.array.map(element.className.split(' '), function (name) {
    if(goog.array.contains(silex.utils.Style.SILEX_CLASS_NAMES, name)
      || goog.array.contains(pages, name)){
      return name;
    }
    return;
  });

  // reset element class name
  element.className = classNamesToKeep.join(' ');
  if (opt_className){
    // apply classes from opt_className
    goog.array.forEach(opt_className.split(' '), function (name) {
      name = name.trim();
      if (name && name !== ''){
        goog.dom.classes.add(element, name);
      }
    });
  }
};


/**
 * convert style object to string
 */
silex.utils.Style.styleToString = function(style) {
  // build a string out of the style object
  var styleStr = '';
  goog.object.forEach(style, function(val, index, obj) {
    if (val)
      styleStr += goog.string.toSelectorCase(index) + ': ' + val + '; ';
  });
  return styleStr;
};


/**
 * convert style string to object
 */
silex.utils.Style.stringToStyle = function(styleStr) {
  return goog.style.parseStyleAttribute(styleStr);
};


/**
 * Compute background color
 * Takes the opacity of the backgrounds into account
 * Recursively compute parents background colors
 * @param {element} element the element which bg color we want
 * @return {!goog.color.Rgb} the element bg color
 */
silex.utils.Style.computeBgColor = function(element) {
 var parentColorArray;
  // retrieve the parents blended colors
  if(!goog.dom.classes.has(element, silex.view.Stage.STAGE_CLASS_NAME)){
    parentColorArray = silex.utils.Style.computeBgColor(element.parentNode);
  }
  else{
    parentColorArray = null;
  }
   // rgba array
  var elementColorArray;
  if (element && element.style && element.style.backgroundColor && element.style.backgroundColor != ''){
    var elementColorStr = element.style.backgroundColor;
    // convert bg color from rgba to array
    if (elementColorStr.indexOf('rgba') >= 0){
      // rgba case
      alpha = parseFloat(elementColorStr.substring(
        elementColorStr.lastIndexOf(',') + 1,
        elementColorStr.lastIndexOf(')')));
      elementColorStr = elementColorStr.replace('rgba', 'rgb');
      elementColorStr = elementColorStr.substring(0,
        elementColorStr.lastIndexOf(',')) + ')';
      elementColorArray = goog.color.hexToRgb(goog.color.parse(elementColorStr).hex);
      elementColorArray.push(alpha);
    }
    else if (elementColorStr.indexOf('transparent') >= 0){
      // transparent case
      elementColorArray = null;
    }
    else if (elementColorStr.indexOf('rgb') >= 0){
      // rgb case
      elementColorArray = goog.color.hexToRgb(
        goog.color.parse(elementColorStr).hex
      );
      elementColorArray.push(1);
    }
    else{
      // hex case
      elementColorArray = goog.color.hexToRgb(elementColorStr);
      elementColorArray.push(1);
    }
  }
  else{
    console.warn('was not able to take the element bg color into account', element);
    elementColorArray = null;
  }
  var res;
  // handle the case where there is no need to blend
  if (elementColorArray === null && parentColorArray === null){
    // there is no need to blend
    res = null;
  }
  else if (elementColorArray === null){
    // there is no need to blend
    res = parentColorArray;
  }
  else if (parentColorArray === null){
    // there is no need to blend
    res = elementColorArray;
  }
  else{
    // blend the parents and the element's bg colors
    // f = (e*ae + p*(1-ae))
    var complement = 1 - elementColorArray[3];
    res = [
      (elementColorArray[0]*elementColorArray[3] + parentColorArray[0]*complement),
      (elementColorArray[1]*elementColorArray[3] + parentColorArray[1]*complement),
      (elementColorArray[2]*elementColorArray[3] + parentColorArray[2]*complement),
      1
    ];
  }
  return res;
};


/**
 * convert hex color to rgba values
 * @example  #000000FF will return rgba(0, 0, 0, 1)
 */
silex.utils.Style.hexToRgba = function(hex) {
  if (hex.indexOf('#') !== 0) return hex;
  if (hex.length !== 9) {
    console.error('Error in length ' + hex + ' - ' + hex.length);
    return hex;
  }
  hexArr = silex.utils.Style.hexToArray(hex);
  r = hexArr[0];
  g = hexArr[1];
  b = hexArr[2];
  a = hexArr[3];

  var result = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  return result;
};


/**
 * convert rgba to array of values
 * @example     #000000FF will return [0, 0, 0, 1]
 */
silex.utils.Style.hexToArray = function(hex) {
  if (hex.indexOf('#') !== 0) return hex;
  hex = hex.replace('#', '');
  r = parseInt(hex.substring(0, 2), 16);
  g = parseInt(hex.substring(2, 4), 16);
  b = parseInt(hex.substring(4, 6), 16);
  a = parseInt(hex.substring(6, 8), 16) / 255;

  var result = [r, g, b, a];
  return result;
};


/**
 * convert rgba to hex
 * @example     rgba(0, 0, 0, 1) will return #000000FF
 */
silex.utils.Style.rgbaToHex = function(rgba) {
  // has to be rgb or rgba
  if (rgba.indexOf('rgb') !== 0) return rgba;
  // get the array version
  rgbaArr = silex.utils.Style.rgbaToArray(rgba);

  r = rgbaArr[0].toString(16); if (r.length < 2) r = '0' + r;
  g = rgbaArr[1].toString(16); if (g.length < 2) g = '0' + g;
  b = rgbaArr[2].toString(16); if (b.length < 2) b = '0' + b;
  a = (rgbaArr[3]).toString(16); if (a.length < 2) a = '0' + a;

  var result = '#' + (r + g + b + a);
  return result;
};


/**
 * convert rgba to array of values
 * @example     rgba(0, 0, 0, 1) will return [0, 0, 0, 1]
 */
silex.utils.Style.rgbaToArray = function(rgba) {
  // not rgb nor rgba
  if (rgba.indexOf('rgb') !== 0) return rgba;
  if (rgba.indexOf('rgba') !== 0) {
    // rgb
    rgba = rgba.replace('rgb', '');
  }
  else {
    // rgba
    rgba = rgba.replace('rgba', '');
  }
  rgba = rgba.replace(' ', '');
  rgbaArr = rgba.substring(1, rgba.length - 1).split(',');

  // add alpha if needed
  if (rgbaArr.length < 4) rgbaArr.push('1');

  r = parseInt(rgbaArr[0]);
  g = parseInt(rgbaArr[1]);
  b = parseInt(rgbaArr[2]);
  a = parseInt(rgbaArr[3] * 255);

  var result = [r, g, b, a];
  return result;
};
