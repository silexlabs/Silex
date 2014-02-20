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


goog.provide('silex.utils.Dom');

/**
 * @constructor
 * @struct
 */
silex.utils.Dom = function() {
  throw('this is a static class and it canot be instanciated');
}

/**
 * render a template by duplicating the itemTemplateString and inserting the data in it
 * @param {string} itemTemplateString   the template containing \{\{markers\}\}
 * @param {array}  data                 the array of strings conaining the data
 * @return {string} the template string with the data in it
 */
silex.utils.Dom.renderList = function (itemTemplateString, data) {
  var res = '';
  // for each item in data, e.g. each page in the list
  for (itemIdx in data){
    // build an item
    var item = itemTemplateString;
    // replace each key by its value
    for (key in data[itemIdx]){
      var value = data[itemIdx][key];
      item = item.replace(new RegExp('{{'+key+'}}', 'g'), value);
    }
    // add the item to the rendered template
    res += item;
  }
  return res;
}

/**
 * compute the bounding box of the given elements
 * use only element.style.* to compute this, not the real positions and sizes
 * so it takes into account only the elements which have top, left, width and height set in px
 * @return the bounding box containing all the elements
 */
silex.utils.Dom.getBoundingBox = function (elements) {
  // compute the positions and sizes
  var top = NaN,
      left = NaN,
      right = NaN,
      bottom = NaN;

  goog.array.forEach(elements, function (element) {
    // commpute the values, which may end up to be NaN or a number
    var elementTop = parseFloat(element.style.top.substr(0, element.style.top.indexOf('px')));
    var elementLeft = parseFloat(element.style.left.substr(0, element.style.left.indexOf('px')));
    var elementRight = elementLeft + parseFloat(element.style.width.substr(0, element.style.width.indexOf('px')));
    var elementBottom = elementTop + parseFloat(element.style.height.substr(0, element.style.height.indexOf('px')));
    // take the smallest top and left
    top = isNaN(top) ? elementTop : Math.min(top, elementTop);
    left = isNaN(left) ? elementLeft : Math.min(left, elementLeft);
    // take the bigger bottom and rigth
    bottom = isNaN(bottom) ? elementBottom : Math.max(bottom, elementBottom);
    right = isNaN(right) ? elementRight : Math.max(right, elementRight);
  }, this);

  var res = {};
  if (!isNaN(top)) res.top = top;
  if (!isNaN(left)) res.left = left;
  if (!isNaN(top) && !isNaN(bottom)) res.height = bottom - top;
  if (!isNaN(left) && !isNaN(right)) res.width = right - left;
  return res;
}
