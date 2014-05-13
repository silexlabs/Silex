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
silex.utils.BackwardCompat.process = function(document) {
  var bodyElement = document.body;
  var headElement = document.head;

  // handle older style system (2.0)
  if (bodyElement.getAttribute('data-style-normal')){
    bodyElement.setAttribute('data-style-normal', bodyElement.getAttribute('data-style-normal'));
    bodyElement.removeAttribute('data-style-normal');
  }
  var elements = null;
  elements = bodyElement.querySelectorAll('[data-style-normal]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('style', element.getAttribute('data-style-normal'));
    element.removeAttribute('data-style-normal');
  });
  elements = bodyElement.querySelectorAll('[data-style-hover]');
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-hover');
  });
  elements = bodyElement.querySelectorAll('[data-style-pressed]');
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-pressed');
  });
  // retorcompat silex-sub-type (2.0)
  elements = bodyElement.querySelectorAll('[data-silex-sub-type]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-type', element.getAttribute('data-silex-sub-type'));
    element.removeAttribute('data-silex-sub-type');
  });
  // old page system (2.0)
  // <meta name="page" content="page1">
  elements = bodyElement.querySelectorAll('meta[name="page"]');
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
  elements = bodyElement.querySelectorAll('.page-element');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('data-silex-type') !== 'page'){
      goog.dom.classes.remove(element, 'page-element');
      goog.dom.classes.add(element, 'paged-element');
    }
  });
  // silex-page class becomes page-element
  elements = bodyElement.querySelectorAll('.silex-page');
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.remove(element, 'silex-page');
    goog.dom.classes.add(element, 'paged-element');
  });
  // retorcompat silex links with #! (2.0)
  elements = bodyElement.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    if (href.indexOf('#') === 0 && href.indexOf('#!') !== 0){
      element.setAttribute(silex.model.Element.LINK_ATTR, '#!' + href.substr(1));
    }
  });
  // add css class on elements with [type]-element (starting from 2.0)
  elements = bodyElement.querySelectorAll('.text-element *');
  goog.array.forEach(elements, function(element) {
    switch(element.nodeName.toLowerCase()){
      case 'p':
        goog.dom.classes.add(element, 'normal');
        break;
      case 'HEADER':
        goog.dom.classes.add(element, 'title');
        break;
      case 'H1':
        goog.dom.classes.add(element, 'heading1');
        break;
      case 'H2':
        goog.dom.classes.add(element, 'heading2');
        break;
      case 'H3':
        goog.dom.classes.add(element, 'heading3');
        break;
    }
  });
  // css class on text elements P, HEAD, H1, H2, H3 (2.2)
  elements = bodyElement.querySelectorAll('[data-silex-type]');
  goog.array.forEach(elements, function(element) {
    goog.dom.classes.add(element, element.getAttribute('data-silex-type') + '-element');
  });
  // static.silex.me 2.0 -> 2.1
  elements = bodyElement.querySelectorAll('[src]');
  goog.array.forEach(elements, function(element) {
    var src = element.getAttribute('src');
    element.setAttribute('src', src.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute('src', src.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
  elements = bodyElement.querySelectorAll('[href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute('href');
    element.setAttribute('href', href.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute('href', href.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
  elements = bodyElement.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    element.setAttribute(silex.model.Element.LINK_ATTR, href.replace('//static.silex.me/2.0', '//static.silex.me/2.2'));
    element.setAttribute(silex.model.Element.LINK_ATTR, href.replace('//static.silex.me/2.1', '//static.silex.me/2.2'));
  });
};
