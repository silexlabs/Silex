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
 * also the static files are taken from //{{host}}/static/Y-Z
 */
silex.utils.BackwardCompat.LATEST_VERSION = [2, 2, 7];


/**
 * handle backward compatibility issues
 * Backwardcompatibility process takes place after opening a file
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function(boolean)} cbk
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

  var hasToUpdate = silex.utils.BackwardCompat.hasToUpdate(version, silex.utils.BackwardCompat.LATEST_VERSION);

  // warn the user
  if (silex.utils.BackwardCompat.amIObsolete(version, silex.utils.BackwardCompat.LATEST_VERSION)) {
    silex.utils.Notification.alert('This website has been saved with a newer version of Silex. Continue at your own risks.', function() {});
  }
  else if (hasToUpdate) {
    silex.utils.Notification.alert('This website has been updated with the latest version of Silex.<br><br>Before you save it, please check that everything is fine. Saving it with another name could be a good idea too (menu file > save as).', function() {});
  }

  // convert to the latest version
  silex.utils.BackwardCompat.to2_2_0(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_2(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_3(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_4(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_5(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_6(version, doc, model, function() {
  silex.utils.BackwardCompat.to2_2_7(version, doc, model, function() {
    // update //{{host}}/2.x/... to latest version
    var elements = doc.querySelectorAll('[data-silex-static]');
    goog.array.forEach(elements, function(element) {
      let propName = element.src ? 'src' : 'href';
      let fileName = element[propName].substr(element[propName].lastIndexOf('/') + 1);
      element[propName] = silex.utils.BackwardCompat.getStaticResourceUrl(fileName);
    });
    // store the latest version
    metaNode.setAttribute('content', 'Silex v' + silex.utils.BackwardCompat.LATEST_VERSION.join('.'));
    // continue
    cbk(hasToUpdate);
  });});});});});});});
};


/**
 * get the complete URL for the static file
 * this will result in a URL on the current server, in the `/static/` folder
 * with the current version
 * @param {string} fileName
 * @return {string}
 */
silex.utils.BackwardCompat.getStaticResourceUrl = function(fileName) {
  return '//' +
    silex.utils.Url.getHost() +
    '/static/' +
    silex.utils.BackwardCompat.LATEST_VERSION[1] +
    '.' +
    silex.utils.BackwardCompat.LATEST_VERSION[2] +
    '/' +
    fileName;
};


/**
 * check if the website has been edited with a newer version of Silex
 * @param {Array.<number>} initialVersion the website version
 * @param {Array.<number>} targetVersion  a given Silex version
 * @return {boolean}
 */
silex.utils.BackwardCompat.amIObsolete = function(initialVersion, targetVersion) {
  return !!initialVersion[2] && initialVersion[0] > targetVersion[0] ||
    initialVersion[1] > targetVersion[1] ||
    initialVersion[2] > targetVersion[2];
};


/**
 * check if the website has to be updated for the given version of Silex
 * @param {Array.<number>} initialVersion the website version
 * @param {Array.<number>} targetVersion  a given Silex version
 * @return {boolean}
 */
silex.utils.BackwardCompat.hasToUpdate = function(initialVersion, targetVersion) {
  return initialVersion[0] < targetVersion[0] ||
    initialVersion[1] < targetVersion[1] ||
    initialVersion[2] < targetVersion[2];
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_7 = function(version, doc, model, cbk) {
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 7])) {
    // rename class names because it changed
    const oldClasses = doc.querySelectorAll('.default-site-width');
    goog.array.forEach(oldClasses, el => el.classList.add('website-width') || el.classList.remove('default-site-width'));
    // add website-min-width class to sections
    const sections = doc.querySelectorAll('.section-element');
    goog.array.forEach(sections, el => el.classList.add('website-min-width'));
    // sections height is now set on sections containers
    const elements = doc.querySelectorAll('.' + silex.model.Element.TYPE_SECTION + '-element');
    goog.array.forEach(elements, element => {
      const sectionId = model.property.getSilexId(element);
      const sectionContentNode = model.element.getContentNode(element);
      const sectionContentNodeId = model.property.getSilexId(sectionContentNode);

      // init model.property object with the styles found in the JSON
      model.property.loadProperties(doc);

      // set min-height on the section content container
      // and remove it from section
      // for desktop styles
      if(model.property.stylesObj[sectionId] && model.property.stylesObj[sectionId]['min-height']) {
        model.property.stylesObj[sectionContentNodeId] = model.property.stylesObj[sectionContentNodeId] || {};
        model.property.stylesObj[sectionContentNodeId]['min-height'] = model.property.stylesObj[sectionId]['min-height'];
        model.property.stylesObj[sectionId]['min-height'] = '';
        delete model.property.stylesObj[sectionId]['min-height'];
      }

      // same for mobile
      if(model.property.mobileStylesObj[sectionId] && model.property.mobileStylesObj[sectionId]['min-height']) {
        model.property.mobileStylesObj[sectionContentNodeId] = model.property.mobileStylesObj[sectionContentNodeId] || {};
        model.property.mobileStylesObj[sectionContentNodeId]['min-height'] = model.property.mobileStylesObj[sectionId]['min-height'];
        model.property.mobileStylesObj[sectionId]['min-height'] = '';
        delete model.property.mobileStylesObj[sectionId]['min-height'];
      }

      // save the styles as JSON
      model.property.saveProperties(doc);
      // apply the new style from JSON to DOM
      model.property.updateStylesInDom(doc);
    });
  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_6 = function(version, doc, model, cbk) {

  // create the JSON array of styles when needed (will check even if not upgrading)
  let jsonStyleTag = doc.querySelector('.' + silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
  if (!jsonStyleTag) {
    let styleTag = doc.querySelector('.' + silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME);
    let styleSheet = null;
    for (var idx in doc.styleSheets) {
      if (doc.styleSheets[idx].ownerNode && doc.styleSheets[idx].ownerNode == styleTag) {
        styleSheet = doc.styleSheets[idx];
      }
    }
    if (styleSheet === null) {
      console.error('BackwardCompat error: no stylesheet found');
    }
    else {
      let stylesObj = {};
      let mobileStylesObj = {};
      for (var idx = 0; idx < styleSheet.cssRules.length; idx++) {
        let cssRule = styleSheet.cssRules[idx];
        let id = cssRule.selectorText.substr(1);
        let style = silex.utils.Style.styleToObject(cssRule.style);
        if (cssRule['media']) {
          mobileStylesObj[id] = style;
        }
        else {
          // handle the case of old sites with position: absolute in the styles, which is now in front-end.css
          if(style.position === 'absolute') style.position = undefined;
          stylesObj[id] = style;
        }
      }
      // create the tag
      jsonStyleTag = doc.createElement('script');
      jsonStyleTag.setAttribute('type', 'text/javascript');
      jsonStyleTag.classList.add(silex.model.Property.JSON_STYLE_TAG_CLASS_NAME);
      goog.dom.appendChild(doc.head, jsonStyleTag);
      // fill the tag with the JSON data
      jsonStyleTag.innerHTML = '[' + JSON.stringify({
        'desktop': stylesObj,
        'mobile': mobileStylesObj
      }) + ']';
    }
  }
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 6])) {
    // pass w3c validation => Error: Using the meta element to specify the document-wide default language is obsolete. Consider specifying the language on the root element instead.
    let metaToRemove = doc.querySelector('meta[http-equiv=content-language]');
    if(metaToRemove) metaToRemove.parentNode.removeChild(metaToRemove);
    // container for page anchors, this will also be the menu when switching to mobile version
    let pagesContainer = doc.querySelector('.' + silex.model.Page.PAGES_CONTAINER_CLASS_NAME);
    if (!pagesContainer) {
      pagesContainer = doc.createElement('div');
      pagesContainer.classList.add(silex.model.Page.PAGES_CONTAINER_CLASS_NAME);
      doc.body.appendChild(pagesContainer);
    }
    let button = doc.querySelector('.menu-button');
    if (!button) {
      let div = doc.createElement('div');
      div.setAttribute('data-silex-type', 'image');
      div.setAttribute('data-silex-id', 'silex-id-hamburger-menu');
      div.className = 'menu-button editable-style silex-id-hamburger-menu image-element page-page-1 paged-element prevent-draggable prevent-resizable';
      let img = doc.createElement('img');
      img.alt = 'open mobile menu';
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAoCAYAAAC8cqlMAAAB5UlEQVR42u2ZPWvCUBSGM+UfFO3e3dLu/QN+oKj4EUXRQREEJYgoiCAu6qCogyDo7iJ21UUaKqEgCC4iiEMGB3UVgsnpTWj/wfVK2nvhGbKEPJyT996TMMzPGg6H5mKx+GgkyuWyeTQasb8OTDwef4tEIp8+n+/LYIjJZJJHQiwzm81M6OLDarWqNpsNjEYgEJCy2ewT0+/3TagighElNFAnQT6ft1ARKkJFqMgfFvF4PFpuEwFtdrcRqVarIIoirFYrIiyXSxiPx+B2u/GJBINBuF6vQHopigK1Wg2fCMdxcLlciIuoqgqNRgOfiN1uB3Qwg91uB8fjkQiHwwEmkwne1qLxS0VuKKJle71eh06nQ4Rmswk8z+MVcTqdsNlsQJZlotF7Pp8hk8ngE4lGo/qN7xG/vV4Pb0Xm8zlxkdPpBGgMx/+yJxIJKBQKRMjlcuBwOGhq/Q+RcDgMsViMCFrAuFwu/CKDwQC22y1IkkSE/X4PgiDo+xc2Ea0S9zjGa/Hb7Xbxifj9fj0K7yFSqVTwtlY6nYbpdKpPiSRYLBbQarX0PYymFhWhIlSEilCRW6GdyUqlkoVZr9dsKpXiOY6TtW+7BkNBz/7ebrcf9L+6Xq+XRYPMMyrTq5EIhUIvaAjTJb4BBNQ2yhnth0wAAAAASUVORK5CYII=';
      img.className = 'silex-element-content';
      // add the button
      div.appendChild(img);
      pagesContainer.appendChild(div);
    }
    // move all page anchors to the new container
    var pages = doc.querySelectorAll('.' + silex.model.Page.PAGE_CLASS_NAME);
    goog.array.forEach(pages, (page) => pagesContainer.appendChild(page));
    // convert all css style `height` to `min-height`
    let arr = /** @type {!Array.<Object.<*>>} */ (JSON.parse(jsonStyleTag.innerHTML));
    for(let modeName in arr[0]) for(let id in arr[0][modeName]) {
      let style = arr[0][modeName][id];
      if(style && style['height']) {
        style['min-height'] = style['height'];
        delete style['height'];
      }
    }
    jsonStyleTag.innerHTML = JSON.stringify(arr);
    model.property.loadProperties(doc);
  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_5 = function(version, doc, model, cbk) {

// FIXME: to be uncommented, due to a fix after release of 2.2.5 this will be run for all templates even > 2.2.5
//  if(silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 5])) {
    // remove jquery.ui.touch-punch.min.js
    let element = doc.querySelector('[src$="jquery.ui.touch-punch.min.js"]');
    if (element) {
      goog.dom.removeNode(element);
    }

    var host = silex.utils.Url.getHost();
    // add the [data-silex-static] attributes
    function handle(attrName) {
      let elements = doc.querySelectorAll('[' + attrName + ']');
      goog.array.forEach(elements, function(element) {
        var attr = element.getAttribute(attrName);
        if (attr.indexOf('//static.silex.') > -1) {
          attr = attr.replace('//static.silex.me', '//' + host + '/static');
          attr = attr.replace('//static.silex.io', '//' + host + '/static');
          element.setAttribute(attrName, attr);
          element.setAttribute('data-silex-static', '');
        }
      });
    }
    // handle the different attributes
    handle('src');
    handle('href');
    handle('data-silex-href');
//  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_4 = function(version, doc, model, cbk) {
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 4])) {
    console.warn('Update site version from', version, 'to 2.4');
    // remove the class editable-plugin-created because it is not used anymore, and it appears in the inline css editor
    elements = doc.body.querySelectorAll('.editable-plugin-created');
    goog.array.forEach(elements, function(element) {
        goog.dom.classlist.remove(element, 'editable-plugin-created');
    });
    // remove inline css from .silex-element-content (2.4)
    var elements = doc.body.querySelectorAll('.silex-element-content');
    goog.array.forEach(elements, function(element) {
      element.style.width = '';
      element.style.height = '';
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
    let nextUpdate = function() {
      if (elementsArr.length > 0) {
        var element = elementsArr.pop();
        // init id
        if (!model.property.getSilexId(element)) {
          model.property.initSilexId(element, doc);
          allStyles += '.' + model.property.getSilexId(element) + '{' + element.getAttribute('style') + '} ';
        }
        element.removeAttribute('style');
        // let time for the DOM to update
        setTimeout(nextUpdate, 0);
      }
      else {
        // create a style tag to hold Silex elements style
        var styleTag = model.property.initStyles(doc);
        // fill with Silex elements styles
        styleTag.innerHTML = allStyles;
        // end of the process
        cbk();
      }
    };
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
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 3])) {
    console.warn('Update site version from', version, 'to 2.3');
    // background should not be draggable, fixed in 2.3
    var elements = doc.querySelectorAll('.background');
    goog.array.forEach(elements, function(element) {
      goog.dom.classlist.add(element, silex.model.Body.PREVENT_DRAGGABLE_CLASS_NAME);
    });
  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 */
silex.utils.BackwardCompat.to2_2_2 = function(version, doc, model, cbk) {
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 2])) {
    // css class on text elements P, HEAD, H1, H2, H3 (2.2)
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
    // add css class on elements with [type]-element (starting from 2.0)
    elements = doc.body.querySelectorAll('[data-silex-type]');
    goog.array.forEach(elements, function(element) {
      // add a class corresponding to the type
      goog.dom.classlist.add(element, element.getAttribute('data-silex-type') + '-element');
    });
    // critical bug fix (2.2)
    // text editor sets the body class to "silex-element-content normal" instead of the text editor's class
    if (goog.dom.classlist.contains(doc.body, 'silex-element-content')) {
      doc.body.className = 'pageable-plugin-created ui-droppable';
    }
    console.warn('Update site version from', version, 'to 2.2');
  }
  cbk();
};


/**
 * @param {Array.<number>} version
 * @param {Document} doc
 * @param  {silex.types.Model} model
 * @param {function()} cbk
 * Not supported anymore since it was executed each time (no version number)
 * and it adds bugs - e.g. transforms # into #!
 */
silex.utils.BackwardCompat.to2_2_0 = function(version, doc, model, cbk) {
  if (silex.utils.BackwardCompat.hasToUpdate(version, [2, 2, 0])) {
    console.warn('Update site version from', version, 'to 2.0');
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
  }
  cbk();
};

