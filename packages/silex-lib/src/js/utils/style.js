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
