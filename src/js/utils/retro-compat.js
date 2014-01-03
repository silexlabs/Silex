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


goog.provide('silex.utils.RetroCompat');

/**
 * @constructor
 * @struct
 * @param {string} name
 * @param {string} displayName
 */
silex.utils.RetroCompat = function() {
  throw('this is a static class and it canot be instanciated');
}


/**
 * handle retrocompatibility issues
 * retrocompatibility process takes place after opening a file
 */
silex.utils.RetroCompat.process = function(bodyElement, headElement) {
  // handle older style system
  $('[data-style-normal]', bodyElement).each(function() {
    this.setAttribute('style', this.getAttribute('data-style-normal'));
    this.removeAttribute('data-style-normal');
  });
  $('[data-style-hover]', bodyElement).each(function() {
    this.removeAttribute('data-style-hover');
  });
  $('[data-style-pressed]', bodyElement).each(function() {
    this.removeAttribute('data-style-pressed');
  });
  // retorcompat silex-sub-type
  $('[data-silex-sub-type]', bodyElement).each(function() {
    this.setAttribute('data-silex-type', this.getAttribute('data-silex-sub-type'));
    this.removeAttribute('data-silex-sub-type');
  });
  // retorcompat silex links with #!
  $('[href]', bodyElement).each(function() {
    var href = this.getAttribute('href');
    if (href.indexof('#') === 0 && href.indexof('#!') !== 0){
      this.setAttribute('href', href.substr(2));
    }
  });
  // css class on elements with [type]-element
  $('[data-silex-type]', bodyElement).each(function() {
    $(this).addClass(this.getAttribute('data-silex-type') + '-element');
  });
  // static.silex.me 2.0 -> 2.1
  $('[src]', headElement).each(function() {
    var src = this.getAttribute('src');
    this.setAttribute('src', src.replace('http://static.silex.me/2.0', 'http://static.silex.me/2.1'));
  });
  $('[href]', headElement).each(function() {
    var href = this.getAttribute('href');
    this.setAttribute('href', href.replace('http://static.silex.me/2.0', 'http://static.silex.me/2.1'));
  });
};
