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
