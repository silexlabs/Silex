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
silex.utils.BackwardCompat.process = function(doc, cbk) {
  var bodyElement = doc.body;
  var headElement = doc.head;

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
    var a = doc.createElement('a');
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

  // critical bug fix (2.2)
  // text editor sets the body class to "silex-element-content normal" instead of the text editor's class
  if (goog.dom.classlist.contains(bodyElement, 'silex-element-content')) {
    bodyElement.className = 'pageable-plugin-created editable-plugin-created ui-droppable';
  }

  // remove inline css from .silex-element-content (2.4)
  elements = bodyElement.querySelectorAll('.silex-element-content');
  goog.array.forEach(elements, function(element) {
    element.style.width ='';
    element.style.height ='';
    element.removeAttribute('style');
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
  // static.silex.me
  elements = doc.querySelectorAll('[src]');
  goog.array.forEach(elements, function(element) {
    var src = element.getAttribute('src');
    src = silex.utils.BackwardCompat.updateStaticUrl(src);
    element.setAttribute('src', src);
  });
  elements = doc.querySelectorAll('[href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute('href');
    href = silex.utils.BackwardCompat.updateStaticUrl(href);
    element.setAttribute('href', href);
  });
  elements = doc.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    href = silex.utils.BackwardCompat.updateStaticUrl(href);
    element.setAttribute(silex.model.Element.LINK_ATTR, href);
  });
  // backward compat /silex/ to /
  // publication path from ../api/1.0/dropbox/exec/put/_test_silex/publication-test
  // to /api/1.0/dropbox/exec/put/_test_silex/publication-test
  var metaNode = doc.querySelector('meta[name="publicationPath"]');
  if (metaNode) {
    var value = metaNode.getAttribute('content');
    if (value.indexOf('../api/1.0/') === 0) {
      value = value.replace('../api/1.0/', '/api/1.0/');
      metaNode.setAttribute('content', value);
    }
  }
  // background should not be draggable, fixed in 2.3
  elements = doc.querySelectorAll('.background');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
  });
  /* better version check since 2.4 */
  // if no generator, create one
  metaNode = doc.querySelector('meta[name="generator"]');
  if (!metaNode) {
    metaNode = doc.createElement('meta');
    metaNode.setAttribute('name', 'generator');
    goog.dom.appendChild(doc.head, metaNode);
  }
  // if not the latest version
  var latest = [2, 2, 4];
  var version = (metaNode.getAttribute('content') || '')
    .replace('Silex v', '')
    .split('.')
    .map(function(str) {
      return parseInt(str, 10) || 0;
    });
  // 2.2.4
  if(version[0] < 2 || version[1] < 2 || version[2] < 4) {
    // time for the DOM to update
    setTimeout(() => {
      console.warn('Update site version from', version, 'to ', latest);
      // remove all inline styles
      elements = doc.querySelectorAll('.editable-style[style]');
      goog.array.forEach(elements, function(element) {
        silex.utils.Dom.setStyle(element, element.style, doc);
        element.removeAttribute('style');
      });
    }, 5000);
    cbk();
  }
  else {
    cbk();
  }
  // set to the latest version
  metaNode.setAttribute('content', 'Silex v' + latest.join('.'));
};

/**
 * update URLs according to the version of Silex static files
 */
silex.utils.BackwardCompat.updateStaticUrl = function(url) {
  var newUrl = url;
  newUrl = newUrl.replace('static.silex.io', 'static.silex.me');
  newUrl = newUrl.replace('//static.silex.me/2.0', '//static.silex.me/2.4');
  newUrl = newUrl.replace('//static.silex.me/2.1', '//static.silex.me/2.4');
  newUrl = newUrl.replace('//static.silex.me/2.2', '//static.silex.me/2.4');
  newUrl = newUrl.replace('//static.silex.me/2.3', '//static.silex.me/2.4');
  return newUrl;
};

