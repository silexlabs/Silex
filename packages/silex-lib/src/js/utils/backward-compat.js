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
 * the version of the website is stored in the generator tag as "Silex v-X-Y-Z"
 * used for backward compat
 * also the static files are taken from //static.silex.me/Y-Z
 */
silex.utils.BackwardCompat.LATEST_VERSION = [2, 2, 4];


/**
 * handle backward compatibility issues
 * Backwardcompatibility process takes place after opening a file
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.process = function(doc, model, cbk) {
  // if no generator tag, create one
  var metaNode = doc.querySelector('meta[name="generator"]');
  if (!metaNode) {
    metaNode = doc.createElement('meta');
    metaNode.setAttribute('name', 'generator');
    goog.dom.appendChild(doc.head, metaNode);
  }
  // retrieve the website version from generator tag
  var version = (metaNode.getAttribute('content') || '')
    .replace('Silex v', '')
    .split('.')
    .map(function(str) {
      return parseInt(str, 10) || 0;
    });

  if (silex.utils.BackwardCompat.amIObsolete(version, silex.utils.BackwardCompat.LATEST_VERSION)) {
    silex.utils.Notification.alert('This website has been saved with a newer version of Silex. Continue at your own risks.', function() {});

  }

  // update static.silex.me
  var elements = doc.querySelectorAll('[src]');
  goog.array.forEach(elements, function(element) {
    var src = element.getAttribute('src');
    src = silex.utils.BackwardCompat.updateStaticUrl(version, src);
    element.setAttribute('src', src);
  });
  elements = doc.querySelectorAll('[href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute('href');
    href = silex.utils.BackwardCompat.updateStaticUrl(version, href);
    element.setAttribute('href', href);
  });
  elements = doc.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    href = silex.utils.BackwardCompat.updateStaticUrl(version, href);
    element.setAttribute(silex.model.Element.LINK_ATTR, href);
  });

  // convert to the latest version
  silex.utils.BackwardCompat.to2_2_0(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_2(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_3(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_4(version, doc, model, function() {
    // next update here (to2_2_5)
    cbk();
  });
  });
  });
  });
  // store the latest version
  metaNode.setAttribute('content', 'Silex v' + silex.utils.BackwardCompat.LATEST_VERSION.join('.'));
};

/**
 * update URLs according to the version of Silex static files
 */
silex.utils.BackwardCompat.updateStaticUrl = function(version, url) {
  var newUrl = url;
  var initialFolder = '2.' + version[version.length - 1];
  var finalFolder = '2.' + silex.utils.BackwardCompat.LATEST_VERSION[2];
  newUrl = newUrl.replace('static.silex.io', 'static.silex.me');
  newUrl = newUrl.replace('//static.silex.me/' + initialFolder, '//static.silex.me/' + finalFolder);
  return newUrl;
};


/**
 * check if the website has been edited with a newer version of Silex
 * @param {Array.<number>} initialVersion the website version
 * @param {Array.<number>} targetVersion  a given Silex version
 */
silex.utils.BackwardCompat.amIObsolete = function(initialVersion, targetVersion) {
  return initialVersion[2] && initialVersion[0] > targetVersion[0]
    || initialVersion[1] > targetVersion[1]
    || initialVersion[2] > targetVersion[2];
}


/**
 * check if the website has to be updated for the given version of Silex
 * @param {Array.<number>} initialVersion the website version
 * @param {Array.<number>} targetVersion  a given Silex version
 */
silex.utils.BackwardCompat.hasToUpdate = function(initialVersion, targetVersion) {
  return initialVersion[0] < targetVersion[0]
    || initialVersion[1] < targetVersion[1]
    || initialVersion[2] < targetVersion[2];
}


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_4 = function(version, doc, model, cbk) {
  if(silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 4])) {
    console.warn('Update site version from', version, 'to ', silex.utils.BackwardCompat.LATEST_VERSION);
    // remove inline css from .silex-element-content (2.4)
    var elements = doc.body.querySelectorAll('.silex-element-content');
    goog.array.forEach(elements, function(element) {
      element.style.width ='';
      element.style.height ='';
      element.removeAttribute('style');
    });
    // remove all inline styles
    elements = doc.querySelectorAll('body, .editable-style[style]');
    // make a real array with the result
    var elementsArr = [];
    goog.array.forEach(elements, function(element) {
      elementsArr.push(element);
    });
    // store the style sheet string with all elements styles
    var allStyles = '';
    // then update each element
    function nextUpdate() {
      if(elementsArr.length > 0) {
        var element = elementsArr.pop();
        // init id
        if (!model.property.getSilexId(element)) {
          model.property.initSilexId(element, doc);
          allStyles += '.' + model.property.getSilexId(element) + '{' + element.getAttribute('style') + '} ';
        }
        element.removeAttribute('style');
        // let time for the DOM to update
        setTimeout(nextUpdate, 100);
      }
      else {
        // create a style tag to hold Silex elements style
        var styleTag = model.property.initSilexStyleTag(doc);
        // fill with Silex elements styles
        styleTag.innerHTML = allStyles;
        // end of the process
        cbk();
      }
    }
    nextUpdate();
  }
  else {
    cbk();
  }
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_3 = function(version, doc, model, cbk) {
  // background should not be draggable, fixed in 2.3
  var elements = doc.querySelectorAll('.background');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
  });
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_2 = function(version, doc, model, cbk) {
  // add css class on elements with [type]-element (starting from 2.0)
  var elements = doc.body.querySelectorAll('.text-element *');
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
  elements = doc.body.querySelectorAll('[data-silex-type]');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, element.getAttribute('data-silex-type') + '-element');
  });
  // critical bug fix (2.2)
  // text editor sets the body class to "silex-element-content normal" instead of the text editor's class
  if (goog.dom.classlist.contains(doc.body, 'silex-element-content')) {
    doc.body.className = 'pageable-plugin-created editable-plugin-created ui-droppable';
  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_0 = function(version, doc, model, cbk) {
  // handle older style system (2.0)
  if (doc.body.getAttribute('data-style-normal')) {
    doc.body.setAttribute('data-style-normal', doc.body.getAttribute('data-style-normal'));
    doc.body.removeAttribute('data-style-normal');
  }
  var elements = null;
  elements = doc.body.querySelectorAll('[data-style-normal]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('style', element.getAttribute('data-style-normal'));
    element.removeAttribute('data-style-normal');
  });
  elements = doc.body.querySelectorAll('[data-style-hover]');
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-hover');
  });
  elements = doc.body.querySelectorAll('[data-style-pressed]');
  goog.array.forEach(elements, function(element) {
    element.removeAttribute('data-style-pressed');
  });
  // backward compat silex-sub-type (2.0)
  elements = doc.body.querySelectorAll('[data-silex-sub-type]');
  goog.array.forEach(elements, function(element) {
    element.setAttribute('data-silex-type', element.getAttribute('data-silex-sub-type'));
    element.removeAttribute('data-silex-sub-type');
  });

  // old page system (2.0)
  // <meta name="page" content="page1">
  elements = doc.head.querySelectorAll('meta[name="page"]');
  goog.array.forEach(elements, function(element) {
    var pageName = element.getAttribute('content');
    var a = doc.createElement('a');
    a.id = pageName;
    a.setAttribute('data-silex-type', 'page');
    a.innerHTML = pageName;
    goog.dom.appendChild(doc.body, a);
    goog.dom.removeNode(element);
  });
  // fixes bug "confusion between pages and paged elements"
  elements = doc.body.querySelectorAll('.page-element');
  goog.array.forEach(elements, function(element) {
    if (element.getAttribute('data-silex-type') !== 'page') {
      goog.dom.classlist.remove(element, 'page-element');
      goog.dom.classlist.add(element, 'paged-element');
    }
  });
  // silex-page class becomes page-element
  elements = doc.body.querySelectorAll('.silex-page');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.remove(element, 'silex-page');
    goog.dom.classlist.add(element, 'paged-element');
  });
  // backward compat silex links with #! (2.0)
  elements = doc.body.querySelectorAll('[data-silex-href]');
  goog.array.forEach(elements, function(element) {
    var href = element.getAttribute(silex.model.Element.LINK_ATTR);
    if (href.indexOf('#') === 0 && href.indexOf('#!') !== 0) {
      element.setAttribute(silex.model.Element.LINK_ATTR, '#!' + href.substr(1));
    }
  });
  // add css class 'silex-element-content' on 'html-content' elements (starting from 2.1)
  elements = doc.body.querySelectorAll('.html-element .html-content');
  goog.array.forEach(elements, function(element) {
    goog.dom.classlist.add(element, 'silex-element-content');
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
  cbk();
};


