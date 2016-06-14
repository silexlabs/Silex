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
goog.require('silex.utils.Url');



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
  '//editor.silex.me',
  silex.utils.Url.getRootUrl()
];


/**
 * remove the javascript and css files which firefox inlines
 * the inlined tags are script type="text/javascript" style="display:none"
 * @param {Document} doc
 */
silex.utils.DomCleaner.cleanupFirefoxInlines = function(doc) {
  // remove inlined scripts
  let elements = doc.querySelectorAll('script[style="display:none"]');
  for (let idx in elements) {
    goog.dom.removeNode(elements[idx]);
  }
  elements = doc.querySelectorAll('style[style="display:none"]');
  for (let idx in elements) {
    goog.dom.removeNode(elements[idx]);
  }
  silex.utils.Dom.addMandatoryTags(doc);
};


/**
 * cleanup html page
 * remove Silex specific data from HTML
 * create an external CSS file
 * generates a list of js scripts and assets to be eported with the file
 * @param {Document} contentDocument
 * @param {string} baseUrl
 * @return {{htmlString: string, cssString: string, jsString: string, files: Array.<Object>}} an object with
 *      html: the cleaned up raw HTML {string} or null if an error occured
 *      css: list of css files
 *      jsString: a script included in the html
 *      files: list of assets files
 */
silex.utils.DomCleaner.cleanup = function(contentDocument, baseUrl) {
  var headElement = contentDocument.head;
  var bodyElement = contentDocument.body;
  // baseUrl must end with a '/' because filterBgImage and silex.utils.Url.getAbsolutePath needs it to
  if (!goog.string.endsWith(baseUrl, '/')) {
    baseUrl += '/';
  }

  // remove publication path
  var metaNode = contentDocument.querySelector('meta[name="publicationPath"]');
  if (metaNode) {
    goog.dom.removeNode(metaNode);
  }

  // remove JSON styles
  let jsonStyleContainer = contentDocument.querySelector(`.${silex.model.Property.JSON_STYLE_TAG_CLASS_NAME}`);
  if (jsonStyleContainer) {
    goog.dom.removeNode(jsonStyleContainer);
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
  // extract the elements styles to external .css file
  var userCssTag = goog.dom.getElementByClass(
      silex.model.Property.INLINE_STYLE_TAG_CLASS_NAME,
      headElement);
  if (userCssTag) {
    goog.dom.removeNode(userCssTag);
    // background-image / url(...)
    cssStr += userCssTag.innerHTML.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
      return silex.utils.DomCleaner.filterBgImage(baseUrl, files, match, group1, group2);
    });
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
        'url': absolute,
        'destPath': newRelativePath,
        'srcPath': relative
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

  // css to download and put to css/
  headStr = headStr.replace(/href="?([^" ]*)"/gi, function(match, group1, group2) {
    var absolute = silex.utils.Url.getAbsolutePath(group1, baseUrl);
    var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
    // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
    if (!silex.utils.Url.isAbsoluteUrl(relative)) {
      // case of the static scripts (all the other cases are /api/...)
      if (relative.indexOf('static/') === 0) {
        // from static/2.5/jquery.js to http://editor.silex.me/static/2.5/jquery.js
        relative = silex.utils.Url.getBaseUrl() + relative;
      }
      else {
        // add '/', e.g. api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
        relative = '/' + relative;
      }
    }
    if (silex.utils.DomCleaner.isDownloadable(absolute)) {
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'css/' + fileName;
      files.push({
        'url': absolute,
        'destPath': newRelativePath,
        'srcPath': relative
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
      if (!silex.utils.Url.isAbsoluteUrl(relative)) {
        // case of the static scripts (all the other cases are /api/...)
        if (relative.indexOf('static/') === 0) {
          // from static/2.5/jquery.js to http://editor.silex.me/static/2.5/jquery.js
          relative = silex.utils.Url.getBaseUrl() + relative;
        }
        else {
          // add '/', e.g. api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
          relative = '/' + relative;
        }
      }
      var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
      var newRelativePath = 'js/' + fileName;
      files.push({
        'url': absolute,
        'destPath': newRelativePath,
        'srcPath': relative
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
  var components = goog.dom.getElementsByClass(silex.model.Body.EDITABLE_CLASS_NAME, bodyElement);
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
      goog.dom.insertSiblingBefore(fragment, element);
      goog.dom.removeNode(element);
    }
  });

  // put back the scripts
  headStr = headStr.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  jsString = jsString.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');
  bodyStr = bodyElement.innerHTML.replace(/type=\"text\/notjavascript\"/gi, 'type="text/javascript"');

  // keep the body css classes
  var bodyClass = bodyElement.getAttribute('class');

  // final html page
  var html = '';
  html += '<!DOCTYPE html><html>';
  html += '<head>';
  html += '    ' + headStr + '';
  html += '    <link href="css/styles.css" rel="stylesheet">';
  html += '    <script src="js/script.js" type="text/javascript"></script>';
  html += '</head>';
  html += '<body class="' + bodyClass + ' silex-published">' + bodyStr + '</body>';
  html += '</html>';

  return {
    'htmlString': html,
    'cssString': cssStr,
    'jsString': jsString,
    'files': files
  };
};


/**
 * takes a matching pattern "url(...)"" and convert the absolute URLs to relative once,
 * take into account that these will be referenced in css/style.css,
 * so they must be relative to "css/"
 * FIXME: also changes the input param files, and this is dirty
 * @param {string} baseUrl
 * @param {Array.<{url:string, destPath:string, srcPath:string}>} files
 * @param {string} match
 * @param {string} group1
 * @param {string} group2
 * @return {string}
 */
silex.utils.DomCleaner.filterBgImage = function(baseUrl, files, match, group1, group2) {
  // get the url
  var url = silex.utils.Url.removeUrlKeyword(group2);
  // only if we are supposed to download this url locally
  var absolute = silex.utils.Url.getAbsolutePath(url, baseUrl);
  var relative = silex.utils.Url.getRelativePath(absolute, silex.utils.Url.getBaseUrl());
  // replace the '../' by '/', e.g. ../api/v1.0/www/exec/get/silex.png becomes /api/v1.0/www/exec/get/silex.png
  if (!silex.utils.Url.isAbsoluteUrl(relative)) {
    relative = '/' + relative;
  }
  if (silex.utils.DomCleaner.isDownloadable(absolute)) {
    var fileName = absolute.substr(absolute.lastIndexOf('/') + 1);
    var newRelativePath = 'assets/' + fileName;
    files.push({
      'url': absolute,
      'destPath': newRelativePath,
      'srcPath': relative
    });
    return silex.utils.Url.addUrlKeyword('../' + newRelativePath);
  }
  return match;
};


/**
 * det if a given URL is supposed to be downloaded locally
 * @param {string} url
 * @return {boolean} true if the url is relative or it is a known domain (sttic.silex.me)
 */
silex.utils.DomCleaner.isDownloadable = function(url) {
  // do not download files with ? or & since it is probably dynamic
  if (url.indexOf('?') >= 0 || url.indexOf('&') >= 0) {
    return false;
  }
  // do not download data:* images
  if (url.indexOf('data:') === 0) {
    return false;
  }
  // download relative paths
  if (!silex.utils.Url.isAbsoluteUrl(url)) {
    return true;
  }
  // make protocol agnostic
  let agnosticUrl = url.substr(url.indexOf('//'));
  // download files from a known domain (sttic.silex.me)
  var found = false;
  goog.array.forEach(silex.utils.DomCleaner.DOWNLOAD_LOCALLY_FROM, function(baseUrl) {
    // make protocol agnostic
    baseUrl = baseUrl.substr(baseUrl.indexOf('//'));
    // check if we can download it
    if (agnosticUrl.indexOf(baseUrl) >= 0) {
      // url starts by the base url, so it is downloadable
      found = true;
    }
  });
  return found;
};
