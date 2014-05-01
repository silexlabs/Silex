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


goog.provide('silex.utils.BackwardCompat');

/**
 * @constructor
 * @struct
 * @param {string} name
 * @param {string} displayName
 */
silex.utils.BackwardCompat = function() {
  throw('this is a static class and it canot be instanciated');
}


/**
 * handle backward compatibility issues
 * Backwardcompatibility process takes place after opening a file
 */
silex.utils.BackwardCompat.process = function(bodyElement, headElement) {

  // handle older style system (2.0)
  if (bodyElement.getAttribute('data-style-normal')){
    bodyElement.setAttribute('data-style-normal', bodyElement.getAttribute('data-style-normal'));
    bodyElement.removeAttribute('data-style-normal');
  }
  var elements = null;
  elements = goog.dom.query('[data-style-normal]', bodyElement);
  goog.array.forEach(elements, function(element) {
    element.setAttribute('style', element.getAttribute('data-style-normal'));
    element.removeAttribute('data-style-normal');
  });
  elements = goog.dom.query('[data-style-hover]', bodyElement);
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-hover');
  });
  elements = goog.dom.query('[data-style-pressed]', bodyElement);
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-pressed');
  });
  // retorcompat silex-sub-type (2.0)
  elements = goog.dom.query('[data-silex-sub-type]', bodyElement);
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-type', element.getAttribute('data-silex-sub-type'));
    element.removeAttribute('data-silex-sub-type');
  });
  // old page system (2.0)
  // <meta name="page" content="page1">
  elements = goog.dom.query('meta[name="page"]', headElement);
  goog.array.forEach(elements, function(element) {
    var pageName = element.getAttribute('content');
    var a = document.createElement('a');
    a.id = pageName;
    a.setAttribute('data-silex-type', 'page');
    a.innerHTML = pageName;
    goog.dom.appendChild(bodyElement, a);
    goog.dom.removeNode(element);
  });
  // fixes bug "confusion between pages and paged elements"
  elements = goog.dom.query('.page-element', bodyElement);
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('data-silex-type') !== 'page'){
      goog.dom.classes.remove(element, 'page-element');
      goog.dom.classes.add(element, 'paged-element');
    }
  });
  // silex-page class becomes page-element
  elements = goog.dom.query('.silex-page', bodyElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.remove(element, 'silex-page');
    goog.dom.classes.add(element, 'paged-element');
  });
  // retorcompat silex links with #! (2.0)
  elements = goog.dom.query('[data-silex-href]', bodyElement);
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    if (href.indexOf('#') === 0 && href.indexOf('#!') !== 0){
      element.setAttribute(silex.model.Element.LINK_ATTR, '#!' + href.substr(1));
    }
  });
  // css class on elements with [type]-element (2.0)
  elements = goog.dom.query('[data-silex-type]', bodyElement);
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.add(element, element.getAttribute('data-silex-type') + '-element');
  });
  // static.silex.me 2.0 -> 2.1
  elements = goog.dom.query('[src]', headElement);
  goog.array.forEach(elements, function(element) {
    var src = element.getAttribute('src');
    element.setAttribute('src', src.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute('src', src.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
  elements = goog.dom.query('[href]', headElement);
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute('href');
    element.setAttribute('href', href.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute('href', href.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
  elements = goog.dom.query('[data-silex-href]', headElement);
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    element.setAttribute(silex.model.Element.LINK_ATTR, href.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute(silex.model.Element.LINK_ATTR, href.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
};
