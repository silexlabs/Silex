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


goog.provide('silex.utils.Url');


goog.require('goog.Uri');
goog.require('goog.net.XhrIo');


/**
 * Get base URL corresponding to a file URL
 * @param {string=} opt_url  the URL of the file, or null to get the base URL of silex editor e.g. http://www.silex.me/
 * @return  {string} the base url
 */
silex.utils.Url.getBaseUrl = function(opt_url) {
  // default value is silex editor URL
  if (!opt_url) {
    opt_url = window.location.href;
  }
  else {
    opt_url = silex.utils.Url.getAbsolutePath(opt_url, window.location.href);
  }
  // remove the hash
  if (opt_url.indexOf('#') > 0) {
    opt_url = opt_url.substr(0, opt_url.indexOf('#'));
  }
  // return the URL but the file name
  return opt_url.substr(0, opt_url.lastIndexOf('/') + 1);
};


/**
 * Get root URL of Silex app
 * @return  {string} the base url
 * @example https://duckduckgo.com returns https://duckduckgo.com
 * @example https://duckduckgo.com/ returns https://duckduckgo.com
 * @example https://duckduckgo.com/?q=javascript returns https://duckduckgo.com
 * @example https://duckduckgo.com/abc/ returns https://duckduckgo.com
 */
silex.utils.Url.getRootUrl = function() {
  return window.location.href.substr(0, window.location.href.lastIndexOf(window.location.pathname));
};


/**
 * Check if an URL is relative or absolute
 * @return  true if the url is absolute
 */
silex.utils.Url.isAbsoluteUrl = function(url) {
  return url.indexOf('http') === 0;
};


/**
 * Browse the children and convert all URLs to relative when possible
 * this will not work, because element.style.backgroundImage is reevaluated when set to a relative value
 * @param   {string} htmlString  the html content to set
 * @param   {string} baseUrl      the base URL for relative/absolute conversion
 */
silex.utils.Url.absolute2Relative = function(htmlString, baseUrl) {
  // image source
  htmlString = htmlString.replace(/src="?([^" ]*)"/gi, function(match, group1, group2) {
    var res = match.replace(group1, silex.utils.Url.getRelativePath(group1, baseUrl));
    return res;
  });
  // css url()
  htmlString = htmlString.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    // remove the ''
    if (group2.indexOf("'") === 0) group2 = group2.substr(1);
    if (group2.lastIndexOf("'") === group2.length - 1) group2 = group2.substr(0, group2.length - 1);
    // rebuild url('') with the relative path
    var res = "url('" + silex.utils.Url.getRelativePath(group2, baseUrl) + "')";
    return res;
  });
  return htmlString;
};


/**
 * convert all URLs to absolute
 * @param   {string} htmlString  the html content to set
 * @param   {string} baseUrl      the base URL for relative/absolute conversion
 */
silex.utils.Url.relative2Absolute = function(htmlString, baseUrl) {
  // image source
  htmlString = htmlString.replace(/src="?([^" ]*)"/gi, function(match, group1, group2) {
    var res = match.replace(group1, silex.utils.Url.getAbsolutePath(group1, baseUrl));
    return res;
  });
  // css url()
  htmlString = htmlString.replace(/url\(()(.+?)\1\)/gi, function(match, group1, group2) {
    // remove the ''
    if (group2.indexOf("'") === 0) group2 = group2.substr(1);
    if (group2.lastIndexOf("'") === group2.length - 1) group2 = group2.substr(0, group2.length - 1);
    // rebuild url('') with the absolute path
    var res = "url('" + silex.utils.Url.getAbsolutePath(group2, baseUrl) + "')";
    return res;
  });
  return htmlString;
};


/**
 * Get a relative path from an absolute URL, given a base URL
 * @param url   a URL which has to end with a '/' or with a file name
 * @param base  a URL which has to end with a '/' or with a file name
 * @return      a path from the base to the url
 * @example     silex.utils.Url.getRelativePath("http://abc.com/d/f/g/file.html","http://abc.com/d/e/");
 *              base    http://abc.com/d/e/
 *              url     http://abc.com/d/f/g/file.html
 *              result  ../f/g/file.html
 */
silex.utils.Url.getRelativePath = function(url, base) {
  // check if they are both absolute urls
  if (base.indexOf('http') !== 0 || url.indexOf('http') !== 0) {
    return url;
  }
  // get an array out of the URLs
  var urlArr = url.split('/');
  var baseArr = base.split('/');
  // keep track of the file name if any
  var fileName = urlArr[urlArr.length - 1];
  // remove the filename and the last '/'
  urlArr.pop();
  baseArr.pop();
  // remove the http[s]://
  urlArr.shift();
  urlArr.shift();
  baseArr.shift();
  baseArr.shift();
  // check if they are on the same domain
  if (baseArr[0] !== urlArr[0]) {
    return url;
  }
  // remove the common part
  var baseElement;
  var urlElement;
  while (baseArr.length > 0 && urlArr.length > 0 && baseArr[0] === urlArr[0]) {
    baseArr.shift();
    urlArr.shift();
  }

  // as many '../' as there are folders left in the base url
  var relativePath = '';
  for (var idx = 0; idx < baseArr.length; idx++) {
    relativePath += '../';
  }

  // now append the folders from url and the file name
  if (urlArr.length > 0) {
    relativePath += urlArr.join('/') + '/';
  }
  relativePath += fileName;

  return relativePath;
};


/**
 * convert relative to absolute url
 * use http://docs.closure-library.googlecode.com/git/class_goog_Uri.html
 */
silex.utils.Url.getAbsolutePath = function(url, base) {
  return goog.Uri.resolve(base, url).toString();
};


/**
 * check if the file name has the desired extension
 * @param   {string} fileName  the file name to be checked
 * @param   {Array<string>} extArray  the allowed extensions
 */
silex.utils.Url.checkFileExt = function(fileName, extArray) {
  var ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
  for (var idx in extArray) {
    if (extArray[idx] === ext) {
      return true;
    }
  }
  return false;
};
