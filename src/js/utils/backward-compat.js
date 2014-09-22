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


goog.provide('silex.utils.BackwardCompat');



/**
 * @constructor
 * @struct
 */
silex.utils.BackwardCompat = function() {
  throw ('this is a static class and it canot be instanciated');
};


/**
 * handle backward compatibility issues
 * Backwardcompatibility process takes place after opening a file
 */
silex.utils.BackwardCompat.process = function(document) {
  var bodyElement = document.body;
  var headElement = document.head;

  // critical bug fix (2.2)
  // text editor sets the body class to "silex-element-content normal" instead of the text editor's class
  if (goog.dom.classlist.contains(bodyElement, 'silex-element-content')) {
    bodyElement.className = 'pageable-plugin-created editable-plugin-created ui-droppable';
  }

  // handle older style system (2.0)
  if (bodyElement.getAttribute('data-style-normal')) {
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
  // backward compat silex-sub-type (2.0)
  elements = bodyElement.querySelectorAll('[data-silex-sub-type]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-type', element.getAttribute('data-silex-sub-type'));
    element.removeAttribute('data-silex-sub-type');
  });
  // old page system (2.0)
  // <meta name="page" content="page1">
  elements = headElement.querySelectorAll('meta[name="page"]');
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
    if (element.getAttribute('data-silex-type') !== 'page') {
      goog.dom.classlist.remove(element, 'page-element');
      goog.dom.classlist.add(element, 'paged-element');
    }
  });
  // silex-page class becomes page-element
  elements = bodyElement.querySelectorAll('.silex-page');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, 'silex-page');
    goog.dom.classlist.add(element, 'paged-element');
  });
  // backward compat silex links with #! (2.0)
  elements = bodyElement.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    if (href.indexOf('#') === 0 && href.indexOf('#!') !== 0) {
      element.setAttribute(silex.model.Element.LINK_ATTR, '#!' + href.substr(1));
    }
  });
  // add css class 'silex-element-content' on 'html-content' elements (starting from 2.1)
  elements = bodyElement.querySelectorAll('.html-element .html-content');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, 'silex-element-content');
  });
  // add css class on elements with [type]-element (starting from 2.0)
  elements = bodyElement.querySelectorAll('.text-element *');
  goog.array.forEach(elements, function(element) {
    switch (element.nodeName.toLowerCase()) {
      case 'p':
        goog.dom.classlist.add(element, 'normal');
        break;
      case 'HEADER':
        goog.dom.classlist.add(element, 'title');
        break;
      case 'H1':
        goog.dom.classlist.add(element, 'heading1');
        break;
      case 'H2':
        goog.dom.classlist.add(element, 'heading2');
        break;
      case 'H3':
        goog.dom.classlist.add(element, 'heading3');
        break;
    }
  });
  // css class on text elements P, HEAD, H1, H2, H3 (2.2)
  elements = bodyElement.querySelectorAll('[data-silex-type]');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, element.getAttribute('data-silex-type') + '-element');
  });
  // static.silex.me 2.0 -> 2.1
  elements = document.querySelectorAll('[src]');
  goog.array.forEach(elements, function(element) {
    var src = element.getAttribute('src');
    src = src.replace('static.silex.io', 'static.silex.me');
    src = src.replace('//static.silex.me/2.0', '//static.silex.me/2.2');
    src = src.replace('//static.silex.me/2.1', '//static.silex.me/2.2');
    element.setAttribute('src', src);
  });
  elements = document.querySelectorAll('[href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute('href');
    href = href.replace('static.silex.io', 'static.silex.me');
    href = href.replace('//static.silex.me/2.0', '//static.silex.me/2.2');
    href = href.replace('//static.silex.me/2.1', '//static.silex.me/2.2');
    element.setAttribute('href', href);
  });
  elements = document.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    href = href.replace('static.silex.io', 'static.silex.me');
    href = href.replace('//static.silex.me/2.0', '//static.silex.me/2.2');
    href = href.replace('//static.silex.me/2.1', '//static.silex.me/2.2');
    element.setAttribute(silex.model.Element.LINK_ATTR, href);
  });
  // backward compat /silex/ to /
  // publication path from ../api/1.0/dropbox/exec/put/_test_silex/publication-test
  // to /api/1.0/dropbox/exec/put/_test_silex/publication-test
  var metaNode = document.querySelector('meta[name="publicationPath"]');
  if (metaNode) {
    var value = metaNode.getAttribute('content');
    if (value.indexOf('../api/1.0/') === 0) {
      value = value.replace('../api/1.0/', '/api/1.0/');
      metaNode.setAttribute('content', value);
    }
  }
};
