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
 * @fileoverview Helper class used to cleanup the DOM when publishing a website
 *
 */


goog.provide('silex.utils.DomCleaner');



/**
 * @constructor
 * @struct
 */
silex.utils.DomCleaner = function() {
  throw ('this is a static class and it canot be instanciated');
};


/**
 * List of URLs from which we are allowed to download the content locally
 * during the process of publishing the file
 * This is made to prevent trying to download locally fonts from google fonts
 * or scripts from an embed code
 */
silex.utils.DomCleaner.DOWNLOAD_LOCALLY_FROM = [
  'http://static.silex.me',
  silex.utils.Url.getRootUrl()
];


/**
 * cleanup html page
 * remove Silex specific data from HTML
 * create an external CSS file
 * generates a list of js scripts and assets to be eported with the file
 * @return an object with
 *      html: the cleaned up raw HTML {string} or null if an error occured
 *      css: list of css files
 *      jsString: a script included in the html
 *      files: list of assets files
 */
silex.utils.DomCleaner.cleanup = function(contentDocument, baseUrl) {
  var headElement = contentDocument.head;
  var bodyElement = contentDocument.body;

  // remove publication path
  var metaNode = contentDocument.querySelector('meta[name="publicationPath"]');
  if (metaNode) {
    goog.dom.removeNode(metaNode);
  }

  // final js script to store in js/script.js
  var jsString = '';
  var scriptTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_SCRIPT_ELEMENT_CSS_CLASS,
      headElement);
  if (scriptTag) {
    jsString = scriptTag.innerHTML;
    goog.dom.removeNode(scriptTag);
  }
  else {
    console.warn('no silex script found');
  }

  // final css to store in css/style.css
  var cssStr = '';

  // list of css and files (assets, scripts...)
  var cssArray = [];
  var files = [];

  // add head css
  var cssTag = goog.dom.getElementByClass(
      silex.model.Head.SILEX_STYLE_ELEMENT_CSS_CLASS,
      headElement);
  if (cssTag) {
    var tmpStr = cssTag.innerHTML;
    goog.dom.removeNode(cssTag);
    // background-image / url(...)
    tmpStr = tmpStr.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
      return silex.utils.DomCleaner.filterBgImage(baseUrl, files, match, group1, group2);
    });
    cssStr += tmpStr;
  }

  // convert to strings
  var bodyStr = bodyElement.innerHTML;
  var headStr = headElement.innerHTML;

  // images to download and put to assets/
  bodyStr = bodyStr.replace(/src="?([^" ]*)"/gi, function(match, group1, group2) {
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = '/' + relative;
    }
    if (silex.utils.DomCleaner.isDownloadable(absolute)) {
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'assets/' + fileName;
      files.push({
        url: absolute,
        destPath: newRelativePath,
        srcPath: relative
      });
      var res = match.replace(group1, newRelativePath);
      return res;
    }
    return match;
  });

  // background-image / url(...)
  bodyStr = bodyStr.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    return silex.utils.DomCleaner.filterBgImage(baseUrl, files, match, group1, group2);
  });

  // handle the body itself
  var oldStyle = bodyElement.getAttribute('style');
  var newStyle = oldStyle.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    return silex.utils.DomCleaner.filterBgImage(baseUrl, files, match, group1, group2);
  });
  bodyElement.setAttribute('style', newStyle);

  // css to download and put to css/
  headStr = headStr.replace(/href="?([^" ]*)"/gi, function(match, group1, group2) {
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      relative = '/' + relative;
    }
    if (silex.utils.DomCleaner.isDownloadable(absolute)) {
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'css/' + fileName;
      files.push({
        url: absolute,
        destPath: newRelativePath,
        srcPath: relative
      });
      var res = match.replace(group1, newRelativePath);
      return res;
    }
    return match;
  });

  // scripts to download and put to js/
  headStr = headStr.replace(/src="?([^"]*)"/gi, function(match, group1, group2) {
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    if (silex.utils.DomCleaner.isDownloadable(absolute)) {
      var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
      // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
      if (!silex.utils.Url.isAbsoluteUrl(relative)) {
        relative = '/' + relative;
      }
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'js/' + fileName;
      files.push({
        url: absolute,
        destPath: newRelativePath,
        srcPath: relative
      });
      var res = match.replace(group1, newRelativePath);
      return res;
    }
    return match;
  });

  // build a clean body clone
  bodyElement.innerHTML = bodyStr;

  // cleanup classes used by Silex during edition
  silex.utils.Style.removeInternalClasses(bodyElement, false, true);

  // **
  // replace internal links <div data-silex-href="..." by <a href="..."
  // do a first pass, in order to avoid replacing the elements in the <a> containers
  var components = goog.dom.getElementsByClass('editable-style', bodyElement);
  goog.array.forEach(components, function(element) {
    var href = element.getAttribute('data-silex-href');
    if (href)
    {
      element.setAttribute('href', href);
      element.removeAttribute('data-silex-href');

      // create a clone with a different tagname
      var outerHtml = goog.dom.getOuterHtml(element);
      var newHtml = '<a ';
      if (href.indexOf('#!') !== 0) {
        newHtml += 'target="_blank" ';
      }
      newHtml += outerHtml.substring(4, outerHtml.length - 6) + '</a>'; // 4 is for <div and 6 for </div>

      // insert the clone at the place of the original and remove the original
      // FIXME: bug when there is a link in the content of an element with an external link set
      // see issue https://github.com/silexlabs/Silex/issues/56
      var fragment = goog.dom.htmlToDocumentFragment(newHtml);
      var parentNode = element.parentNode;
      goog.dom.insertSiblingBefore(fragment, element);
      goog.dom.removeNode(element);
    }
  });

  // extract the elements styles to external .css file
  var elements = goog.dom.getElementsByClass('editable-style', bodyElement);
  var elementIdx = 0;
  var cleanupElement = function(element) {
    // add the element type
    var classNameType = 'silex-' + (element.getAttribute(silex.model.Element.TYPE_ATTR) || 'body');
    goog.dom.classlist.add(element, classNameType);
    // create a class name for this css
    var className = 'element-' + (elementIdx++);
    goog.dom.classlist.add(element, className);
    // add the css for this context
    var cssNormal = element.getAttribute('style');
    cssArray.push({
      classNames: ['.' + className],
      styles: cssNormal
    });
    // cleanup styles used during edition
    //goog.dom.classlist.remove (element, 'editable-style');
    element.removeAttribute('data-silex-type');
    // remove inline css styles
    element.removeAttribute('style');
  };
  // handle body itself
  cleanupElement(bodyElement);
  // handle all other editable elements
  goog.array.forEach(elements, cleanupElement);

  // todo: find patterns to reduce the number of css classes
  goog.array.forEach(cssArray, function(cssData) {
    var elementCssStr = '';
    // compute class names
    goog.array.forEach(cssData.classNames, function(className) {
      if (elementCssStr !== '') elementCssStr += ', ';
      elementCssStr += className;
    });
    // compute styles
    elementCssStr += '{\n\t' + cssData.styles + '\n}';
    cssStr += '\n' + elementCssStr;
  });
  // format css
  cssStr.replace('; ', ';\n\t');

  // put back the scripts
  headStr = headStr.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  jsString = jsString.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  bodyStr = bodyElement.innerHTML.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');

  // handle the body style
  var bodyStyle = bodyElement.getAttribute('style');
  var bodyClass = bodyElement.getAttribute('class');

  // final html page
  var html = '';
  html += '<!DOCTYPE html><html>';
  html += '<head>\
      ' + headStr + '\
      <link href="css/styles.css" rel="stylesheet">\
      <script src="js/script.js" type="text/javascript"></script>\
  </head>';
  html += '<body class="' + bodyClass + ' silex-runtime silex-published">' + bodyStr + '</body>';
  html += '</html>';

  return {
    htmlString: html,
    cssString: cssStr,
    jsString: jsString,
    files: files
  };
};


/**
 * takes a matching pattern "url(...)"" and convert the absolute URLs to relative once,
 * take into account that these will be referenced in css/style.css,
 * so they must be relative to "css/"
 */
silex.utils.DomCleaner.filterBgImage = function(baseUrl, files, match, group1, group2) {
  // remove the ''
  if (group2.indexOf("'") === 0) group2 = group2.substr(1);
  if (group2.lastIndexOf("'") === group2.length - 1) group2 = group2.substr(0, group2.length - 1);
  // only if we are supposed to download this url locally
  var absolute = silex.utils.Url.getAbsolutePath(group2, baseUrl);
  var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.utils.Url.isAbsoluteUrl(relative)) {
    relative = '/' + relative;
  }
  if (silex.utils.DomCleaner.isDownloadable(absolute)) {
    var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
    var newRelativePath = 'assets/' + fileName;
    var res = "url('../" + newRelativePath + "')";
    files.push({
      url: absolute,
      destPath: newRelativePath,
      srcPath: relative
    });
    return res;
  }
  return match;
};


/**
 * det if a given URL is supposed to be downloaded locally
 * @return true if the url is relative or it is a known domain (sttic.silex.me)
 */
silex.utils.DomCleaner.isDownloadable = function(url) {
  // do not download files with ? or & since it is probably dynamic
  if (url.indexOf('?') >= 0 || url.indexOf('&') >= 0) {
    return false;
  }
  // download relative paths
  if (!silex.utils.Url.isAbsoluteUrl(url)) {
    return true;
  }
  // download files from a known domain (sttic.silex.me)
  var found = false;
  goog.array.forEach(silex.utils.DomCleaner.DOWNLOAD_LOCALLY_FROM, function(baseUrl) {
    if (url.indexOf(baseUrl) === 0) {
      // url starts by the base url, so it is downloadable
      found = true;
    }
  });
  return found;
};
